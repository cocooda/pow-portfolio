# Product Specification

For product intent, ICP, non-goals, and success metrics, see [`PRD.md`](PRD.md). This spec focuses on schemas, inputs, pipeline behavior, and generated artifacts.

## Product thesis

`pow-portfolio` is a local-first npm/npx **project showcase compiler**. It turns local project evidence into public-safe, evidence-backed project case studies, showcase briefs, CV bullets, interview notes, and a static one-project showcase page.

The package name can remain `pow-portfolio`, but the product should not be framed as a full personal portfolio builder. Its narrow job is:

> Generate a recruiter-ready project case study you can link from your CV.

It is not:

- a generic resume builder
- a full personal portfolio website/CMS
- a full codebase understanding engine
- a SaaS portfolio platform
- a legal/NDA compliance guarantee

## North Star

> Minimum tokens per verified project-showcase claim.

## Core flow

```txt
User runs `init` and `collect` on a local repo
→ deterministic collectors extract compact evidence
→ redaction scanner classifies sensitivity
→ candidate claims are proposed
→ evidence is mapped to each claim
→ agent/LLM works from briefs, not full repo
→ user reviews/edits/redacts
→ Markdown/HTML showcase artifacts are exported
```

## Target output shape

The final human-facing output is a **single-project technical showcase**:

```txt
Hero
→ Problem
→ Solution
→ My Role / Contribution Boundaries
→ Demo
→ Architecture
→ Key Technical Decisions
→ Evidence
→ Result
→ Reflection
```

`SHOWCASE_PAGE.html` is the default CV-link-ready artifact. The same content can also be pasted into Canva, Gamma, Notion, Framer, Webflow, GitHub Pages, Vercel, a personal website, or another portfolio platform.

## Input

Required:

```txt
A local repository folder
```

Optional:

- screenshots folder
- demo transcript
- worklog file
- eval/benchmark report
- existing code graph export
- manual role/contribution notes
- public aliases for private names

## Raw evidence categories

| Category | Examples |
|---|---|
| Git evidence | commits, authors, dates, changed files, tags |
| File tree evidence | folders, app layers, test folders, deploy configs |
| Docs evidence | README, architecture notes, API docs, task markdown |
| Test evidence | pytest, vitest, jest, coverage, benchmark/eval logs |
| Runtime/deploy evidence | Dockerfile, Render/Vercel configs, CI logs |
| Worklog evidence | journals, blockers, decisions, release notes |
| Screenshot/demo evidence | image metadata, captions, transcript excerpts |
| Manual contribution boundaries | owned areas, teammate boundaries, public-safe notes |

## Evidence Adapter Contract

Every collector or external adapter should normalize its output to the same evidence contract.

```json
{
  "id": "ev_001",
  "source_type": "code_graph | git | test_log | screenshot | worklog | doc | deploy_config | manual_note",
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

## Candidate Claim schema

```json
{
  "id": "claim_001",
  "claim": "Implemented legal-aware chunking for retrieval quality",
  "category": "retrieval_architecture",
  "evidence_ids": ["ev_001", "ev_014"],
  "confidence": 0.91,
  "public_safe_rewrite": "Implemented structure-aware document chunking to improve retrieval grounding.",
  "risks": ["dataset path", "internal project name"],
  "needs_user_confirmation": false,
  "recommended_outputs": ["case_study", "showcase_page", "cv_bullet", "interview_story"]
}
```

## Project Showcase Output schema

```json
{
  "projectTitle": "Legal RAG Assistant",
  "oneLineSummary": "A grounded AI assistant for legal document search, drafting, and review.",
  "problem": "Legal staff need fast, cited answers across legal and internal documents.",
  "solution": "A local/team web app for search, drafting, document review, and evidence-grounded answers.",
  "myRole": "Product/engineering owner for retrieval, review UX, deployment, and release documentation.",
  "contributionBoundaries": ["Owned retrieval and deployment evidence", "Do not claim teammate-owned Langfuse work without evidence"],
  "constraints": ["private repo", "limited cloud budget", "citation grounding required"],
  "architectureSummary": "React frontend, FastAPI backend, PostgreSQL metadata, vector retrieval, static deployment.",
  "demo": {
    "videoUrl": "",
    "screenshots": []
  },
  "verifiedClaims": [
    {
      "claimId": "claim_001",
      "text": "Implemented structure-aware chunking for legal retrieval.",
      "evidenceIds": ["ev_001", "ev_014"]
    }
  ],
  "evidenceAppendix": [],
  "technicalDecisions": [],
  "validation": [],
  "results": [],
  "reflection": {
    "tradeoffs": [],
    "limitations": [],
    "nextSteps": []
  },
  "links": []
}
```

## Quality Gate per claim

Each claim must pass:

- [ ] has at least one evidence source
- [ ] evidence is not only a self-written claim
- [ ] source type is explicit: git/test/doc/screenshot/worklog/manual
- [ ] contains no secret/private data
- [ ] has confidence score
- [ ] has public-safe rewrite
- [ ] has recruiter-facing value
- [ ] respects contribution boundaries

If a claim fails, it must be marked:

```txt
Unverified / needs user confirmation
```

## Redaction-first pipeline

The pipeline must classify and redact before case-study/showcase generation:

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


## Package command design

MVP commands:

```bash
npx pow-portfolio init
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio prompt codex
npx pow-portfolio export
```

Optional later commands:

```bash
npx pow-portfolio draft --offline
npx pow-portfolio draft --agent
npx pow-portfolio export --markdown --site --slides --json
npx pow-portfolio deploy --target github-pages
npx pow-portfolio deploy --target vercel
```

The MVP should remain output-first and platform-optional. Do not add OAuth or deployment state until the local showcase compiler is proven.

## Portfolio project page requirements

A generated one-project showcase page should include:

1. Project title and one-line value proposition
2. Problem / user pain point
3. Context and constraints
4. My role and contribution boundary
5. Architecture overview
6. 3–6 evidence-backed technical claims
7. Key decisions and tradeoffs
8. Validation / tests / metrics / demo evidence
9. Timeline / milestones
10. What I would improve next
11. Public-safe evidence appendix
12. Links to demo video, screenshots, deck, or public code if available

## Generated files

```txt
.pow/
  config.json
  evidence/EVIDENCE_MAP.json
  briefs/PROJECT_BRIEF.md
  briefs/CLAIM_BRIEF.md
  briefs/REDACTION_BRIEF.md
  skill/SKILL.md
  skill/prompts/verify_claims.md
  skill/prompts/generate_case_study.md
  dist/CASE_STUDY.md
  dist/SHOWCASE_BRIEF.md
  dist/PAGE_CONTENT.md
  dist/CV_BULLETS.md
  dist/INTERVIEW_NOTES.md
  dist/SHOWCASE_PAGE.html
```

## Repository boundary

Keep source materials and generated artifacts clearly separated:

- `docs/` contains product, architecture, task, and handoff documentation.
- `templates/` contains reusable export layouts.
- `skill/` contains the bundled end-user agent skill source that ships with the repo.
- `.pow/` contains generated per-project evidence, briefs, prompts, and export artifacts.

`EVIDENCE_MAP.json` is the source of truth inside `.pow/evidence/`. Everything in `.pow/dist/` is a generated public-safe view derived from that evidence.
