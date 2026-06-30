# Efficiency, Token, and Adapter Design

`pow-portfolio` should not be a general codebase-understanding engine. It should be a token-efficient project showcase compiler.

## North Star metric

```txt
minimum tokens per verified project-showcase claim
```

This is more important than maximum repo comprehension. A showcase page only needs the evidence required to support a small number of strong claims.

## Correct pipeline

```txt
Local project
  ├─ git log / diff / commits
  ├─ README / docs / worklog
  ├─ tests / coverage / eval logs
  ├─ screenshots / demo transcript
  ├─ optional code graph output
  ↓
pow-portfolio CLI
  ├─ deterministic collectors
  ├─ redaction scanner
  ├─ evidence normalizer
  ├─ claim candidate generator
  ├─ brief pack generator
  ↓
Agent / LLM
  ├─ verify claims
  ├─ rewrite public-safe
  ├─ generate narrative
  ↓
Outputs
  ├─ case study
  ├─ CV bullets
  ├─ interview notes
  ├─ static HTML technical proof page
  ├─ optional slide deck / PPTX later
```

## Anti-pattern to avoid

Do not do this:

```txt
agent reads whole repo
→ agent summarizes whole repo
→ agent writes portfolio
```

This is expensive, privacy-risky, and likely to create generic or unverifiable claims.

## Preferred pattern

Do this:

```txt
CLI reads repo cheaply
→ CLI creates normalized evidence map
→ CLI proposes 5–20 candidate claims
→ agent reads compact briefs
→ agent verifies only candidate claims
→ outputs are generated from verified claims only
```

## Evidence Adapter Contract

Every collector or external tool adapter must output the same normalized shape. This is how `pow-portfolio` can stand on top of code graph tools instead of competing with them.

```json
{
  "id": "ev_001",
  "source_type": "code_graph | git | test_log | screenshot | worklog | doc | file_tree | deploy_config | manual_note",
  "source_tool": "understand-anything | codebase-memory-mcp | axon | git | manual | pow-portfolio",
  "artifact_id": "commit:abc123:file:src/retrieval.py:symbol:HybridRetriever",
  "title": "Hybrid retrieval implementation",
  "summary": "Implements hybrid BM25 + dense ranking fusion",
  "public_safe_excerpt": "Introduced hybrid retrieval and ranking fusion for search quality.",
  "private_risk": ["api_key", "client_name", "internal_endpoint"],
  "confidence": 0.86,
  "paths": ["src/retrieval.py"],
  "commit": "abc123",
  "date": "2026-06-18",
  "claim_hints": ["retrieval_architecture", "ranking_fusion"],
  "public_safe": true,
  "weight": 4
}
```

## MVP adapters

Build these first:

| Adapter | Source type | Purpose |
|---|---|---|
| `git_adapter` | `git` | commits, changed files, dates, tags, authors |
| `readme_docs_adapter` | `doc` | README/docs headings, architecture notes, release notes |
| `worklog_adapter` | `worklog` | journals, task logs, decision records |
| `test_log_adapter` | `test_log` | test/eval/coverage/benchmark evidence |
| `manual_screenshot_adapter` | `screenshot` / `manual_note` | screenshot metadata, captions, demo notes |
| `understand_anything_json_adapter` | `code_graph` | optional imported code graph summaries |

## Later adapters

Add only after the MVP proves the core workflow:

| Adapter | Why later |
|---|---|
| `codebase_memory_mcp_adapter` | useful for persistent graph evidence, but requires MCP workflow design |
| `axon_adapter` | useful for symbol/code graph evidence, but not necessary for first local repo demo |
| `github_pr_adapter` | useful for public/private GitHub PR summaries, but requires API/token handling |
| `linear_jira_adapter` | useful for work management evidence, but requires auth and workspace-specific mapping |

## Claim-first retrieval

A claim should drive evidence retrieval, not the other way around.

Example claim brief:

```md
## Candidate claim: Built hybrid retrieval pipeline

Evidence:
- ev_012: commit abc123 added BM25 + dense retrieval fusion
- ev_033: file tree indicates retrieval module and tests
- ev_041: test log includes retrieval ranking tests
- ev_057: eval notes mention citation hit-rate improvement

Risks:
- dataset name may be private
- internal project name should be redacted

Confidence: 0.87
Needs user confirmation: false
```

The agent should not read `src/retrieval/hybrid.py` unless the claim cannot be verified from these evidence items.

## Deterministic-first, LLM-second

Use deterministic code for:

- `git log --stat`
- `git diff --name-only`
- file tree summaries
- README/docs headings
- test/eval/coverage log detection
- package metadata
- screenshot metadata
- secret scan
- evidence IDs
- quality-gate fields

Use AI/agent only for:

- classifying work type when rules are not enough
- inferring technical decisions/tradeoffs from compact evidence
- rewriting public-safe claims
- checking claim-evidence alignment
- generating recruiter narrative

Rule:

```txt
If it can be done with regex, git commands, file metadata, or schema validation, do not use an LLM.
```

## Redaction-first pipeline

Redaction must happen before case-study generation.

```txt
collect evidence
→ classify sensitivity
→ redact or abstract
→ verify public-safe
→ generate output
```

Risk categories:

- secrets/API keys/tokens
- customer/client names
- internal URLs
- private repo names
- proprietary algorithm details
- database schema-sensitive fields
- exact prompts/system instructions
- NDA project labels
- personally identifiable information
- teammate-owned work incorrectly claimed as personal contribution

## Claim quality gate

Each public claim must pass:

- [ ] has at least one evidence source
- [ ] evidence is not only a self-written claim
- [ ] source type is explicit: git/test/doc/screenshot/worklog/manual/code_graph
- [ ] no secret/private data is included
- [ ] confidence score exists
- [ ] public-safe rewrite exists
- [ ] recruiter-facing value is clear
- [ ] contribution boundary is respected

If it fails, output:

```txt
Unverified / needs user confirmation
```

## Token Budget Manifest

The package should create or document token budgets in `.pow/config.json` and `skill/SKILL.md`.

```json
{
  "tokenBudget": {
    "claimBriefMaxTokens": 4000,
    "evidenceVerificationMaxTokensPerClaim": 1500,
    "finalPortfolioMaxTokens": 8000,
    "neverDo": [
      "paste entire source files unless requested",
      "summarize the whole repo before claim selection",
      "include raw secrets or internal identifiers",
      "generate generic personal portfolio copy"
    ]
  }
}
```

## Agent integration rule

Task 01 and the MVP core do not require MCP. The local CLI and `.pow/` artifacts are the contract.

If an agent integration layer is added later, it should stay compact and return evidence records or briefs, not raw source code.

## Package command direction

The current MVP supports:

```bash
npx pow-portfolio init
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio prompt codex
npx pow-portfolio export
```

Future package namespace can be considered later:

```bash
npx @proofwork/portfolio init
```

Do not rename the package during MVP unless there is a clear distribution reason. Naming churn is less important than proving the workflow.

## Platform strategy

MVP should be output-first, platform-optional.

Generate:

```txt
.pow/dist/SHOWCASE_PAGE.html
.pow/dist/CASE_STUDY.md
.pow/dist/SHOWCASE_BRIEF.md
.pow/dist/PAGE_CONTENT.md
.pow/dist/EVIDENCE_MAP.public.json
```

`SHOWCASE_PAGE.html` is the public, CV-link-ready static artifact. The Markdown files remain editable supporting artifacts for the same project showcase.

Then let users choose:

- GitHub Pages
- Vercel
- Netlify
- Notion paste
- Canva/Gamma paste
- personal website

Do not add platform OAuth or hosted deployment until the core local compiler is proven.
