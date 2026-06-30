# Architecture

## Product boundary

`pow-portfolio` compiles **one-project showcase packages**.

It is not:

- a generic resume builder
- a full personal portfolio CMS
- a SaaS app
- a legal/NDA compliance product
- a full codebase understanding engine

Correct framing:

```txt
local repo evidence → normalized evidence map → verified claims → project case study/showcase artifacts
```

Avoid this framing:

```txt
agent reads whole repo → generic summary → generic portfolio page
```

## High-level architecture

```txt
Local project
  ├─ git log / diff / commits
  ├─ README / docs / worklog
  ├─ tests / coverage / eval logs
  ├─ screenshots / demo transcript
  ├─ deploy configs
  ├─ manual contribution notes
  ├─ optional code graph output
  ↓
pow-portfolio CLI
  ├─ deterministic collectors
  ├─ Evidence Adapter Contract normalizer
  ├─ redaction scanner
  ├─ claim candidate generator
  ├─ claim quality gate
  ├─ brief pack generator
  ↓
Agent / LLM optional layer
  ├─ verify candidate claims
  ├─ rewrite public-safe claims
  ├─ generate recruiter-readable narrative
  ↓
Outputs
  ├─ CASE_STUDY.md
  ├─ SHOWCASE_BRIEF.md
  ├─ PAGE_CONTENT.md
  ├─ CV_BULLETS.md
  ├─ INTERVIEW_NOTES.md
  ├─ SHOWCASE_PAGE.html  ← CV-link-ready static HTML artifact
  ├─ optional slide/deck export later
  ├─ optional EVIDENCE_MAP.public.json
```

## Architecture principles

1. Deterministic collectors first.
2. LLM optional.
3. No raw source to LLM by default.
4. Compact evidence briefs.
5. Claim-first retrieval.
6. Redaction before generation.
7. `EVIDENCE_MAP.json` as source of truth.
8. Markdown/HTML/deck outputs are views, not the source of truth.
9. No MCP required for MVP.
10. Adapter-based integration with code graph tools later.

## Module map

```txt
src/
  cli.ts
  commands/
    init.ts
    collect.ts
    brief.ts
    prompt.ts
    draft.ts            # optional later: template-only or agent-pack draft
    export.ts
    doctor.ts
    deploy.ts           # optional later helper only
  collectors/
    gitCollector.ts
    docsCollector.ts
    testCollector.ts
    fileTreeCollector.ts
    worklogCollector.ts
    screenshotCollector.ts
    deployCollector.ts
  adapters/
    understandAnythingJsonAdapter.ts
    codebaseMemoryAdapter.ts    # later
    axonAdapter.ts              # later
    githubPrAdapter.ts          # later
    linearJiraAdapter.ts        # later
  core/
    types.ts
    evidenceMap.ts
    claimScorer.ts
    redactionScanner.ts
    qualityGate.ts
    briefBuilder.ts
    portfolioCompiler.ts
    fsUtils.ts
  exporters/
    markdownExporter.ts
    htmlExporter.ts
    jsonExporter.ts
    marpExporter.ts             # optional later
```

## Command flow

Current MVP command contract:

```bash
npx pow-portfolio init
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio prompt codex
npx pow-portfolio export
```

Future optional commands:

```bash
npx pow-portfolio draft --offline
npx pow-portfolio draft --agent
npx pow-portfolio export --markdown --site --slides --json
npx pow-portfolio deploy --target github-pages
npx pow-portfolio deploy --target vercel
```

Keep `deploy` optional. The MVP should be output-first, platform-optional.

## Data flow

```txt
collectors/adapters
→ EvidenceItem[]
→ redaction scanner
→ candidate claims
→ quality gate
→ EVIDENCE_MAP.json
→ PROJECT_BRIEF.md / CLAIM_BRIEF.md / REDACTION_BRIEF.md
→ agent prompt / SKILL.md
→ generated project-showcase views
```

## Evidence Adapter Contract

Every collector and external adapter should normalize into the same contract. This lets the project integrate with code graph tools without competing with them.

```ts
type EvidenceItem = {
  id: string;
  source_type: "code_graph" | "git" | "test_log" | "screenshot" | "worklog" | "doc" | "file_tree" | "deploy_config" | "manual_note";
  source_tool: string;
  artifact_id: string;
  title: string;
  summary: string;
  public_safe_excerpt: string;
  private_risk: string[];
  confidence: number;
  paths: string[];
  commit?: string;
  date?: string;
  claim_hints: string[];
  public_safe: boolean;
  weight: number;
};
```

## Adapter strategy

MVP adapters:

- `git_adapter`
- `readme_docs_adapter`
- `worklog_adapter`
- `test_log_adapter`
- `manual_screenshot_adapter`
- `file_tree_adapter`
- `deploy_config_adapter`
- `understand_anything_json_adapter`

Later adapters:

- `codebase_memory_mcp_adapter`
- `axon_adapter`
- `github_pr_adapter`
- `linear_jira_adapter`

## Why adapters matter

`pow-portfolio` should stand on the shoulders of specialized codebase tools. If a user already has output from a code graph tool, this project should convert that output into evidence items instead of rebuilding the graph system.

The adapter boundary keeps the MVP small:

```txt
external tool output → adapter → EvidenceItem → claim pipeline → showcase output
```

## Token-cost strategy

Do not do:

```txt
scan whole repo → summarize whole repo → generate portfolio
```

Do:

```txt
collect cheap signals
→ build normalized evidence map
→ propose candidate claims
→ retrieve minimal evidence per claim
→ verify claim
→ generate narrative only from verified claims
```

See [`EFFICIENCY_DESIGN.md`](EFFICIENCY_DESIGN.md) for the detailed token budget and claim-first design.

## Artifact model

`EVIDENCE_MAP.json` is the canonical artifact.

Generated views:

- `CASE_STUDY.md` — long-form technical story
- `SHOWCASE_BRIEF.md` — compact brief for LLM/Canva/Gamma/Notion/portfolio platforms
- `PAGE_CONTENT.md` — sectioned project page copy
- `CV_BULLETS.md` — resume bullets
- `INTERVIEW_NOTES.md` — interview walkthroughs
- `SHOWCASE_PAGE.html` — static one-project technical proof page; this is the CV-link-ready artifact
- slide/deck export — optional later
- `EVIDENCE_MAP.public.json` — optional redacted public evidence appendix later

## Why no database in MVP

The source of truth is `EVIDENCE_MAP.json`. Markdown/HTML/CV bullets/showcase page are views and can be regenerated.

This keeps the package:

- easy to inspect
- easy to version-control
- easy to run in any repo
- zero-cost
- compatible with agent workflows

## Repository separation

Keep the repo split by responsibility:

- `docs/` is product and delivery guidance.
- `templates/` is reusable export presentation structure.
- `skill/` is the bundled agent instruction source.
- `.pow/` is generated, per-project working output.
