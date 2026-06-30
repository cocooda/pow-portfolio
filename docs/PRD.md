# PRD — pow-portfolio

## 1. Product Summary

`pow-portfolio` is a local-first npm/npx **project showcase compiler**.

It takes a local repository and related project artifacts as input, extracts structured evidence deterministically, then helps an AI agent generate a public-safe, evidence-backed **single-project case study / technical proof page** that can be linked from a CV.

It is not a generic resume builder, not a full personal portfolio CMS, and not a codebase-understanding engine.

## 2. Product Positioning

**Tagline**

> Turn private local work into a public project showcase.

**Primary user job**

> I need one credible link that explains what I built, what I contributed, how the system works, and what evidence supports my claims — without publishing source code.

**Core promise**

> Every public claim should be traceable to evidence.

## 3. Target Users

### Primary ICP

Junior developers, students, and intern candidates with serious local/private/team projects who need a recruiter-ready project case study but cannot or do not want to publish full source code.

### Secondary ICP

Indie hackers or founders who want to turn a private MVP repo into a public project story, showcase page, or pitch artifact.

### Anti-ICP for MVP

- Users who only need a pretty resume template.
- Users who want a hosted portfolio CMS.
- Users who expect legal/NDA compliance guarantees.
- Teams wanting enterprise analytics or manager dashboards.

## 4. Problem Statement

Developers often have strong project evidence scattered across git history, README files, docs, worklogs, task files, screenshots, test logs, deployment configs, release notes, and demo transcripts. But they struggle to convert this messy evidence into a polished project showcase.

This problem is sharper when:

- the repo is private or local
- the project is team-based and contribution boundaries matter
- source code cannot be public
- the work is backend, AI, data, or infrastructure-heavy and hard to screenshot
- AI-generated resume bullets sound generic or unverifiable

## 5. Goals

### Product goals

1. Generate a recruiter-readable single-project showcase package.
2. Keep raw source code local by default.
3. Use `EVIDENCE_MAP.json` as the source of truth.
4. Reduce LLM token cost through deterministic evidence collection and compact briefs.
5. Enforce claim-level evidence mapping.
6. Run redaction/public-safety checks before generation.
7. Produce a static HTML technical proof page as the CV-link-ready artifact.
8. Support agent workflows without requiring a SaaS backend.

### Portfolio skill goals for this project

This repo should demonstrate:

- **Data engineering:** Evidence Adapter Contract, evidence normalization, schemas, deterministic collectors, validation, data quality gates.
- **AI engineering:** claim-first retrieval, token budgets, LLM-safe context packaging, anti-hallucination rules, brief-first agent workflow.
- **Digital project management:** PRD, scope control, task specs, acceptance criteria, rubrics, roadmap, release readiness.
- **Developer tooling:** npm/npx CLI, file-based workflow, static export, cross-platform commands.
- **Privacy/data governance:** redaction-first classification, public-safe aliases, contribution-boundary checks.

## 6. Non-Goals

- Do not build SaaS/auth/payment.
- Do not build a full personal portfolio website builder.
- Do not build a codebase knowledge graph engine.
- Do not require a paid LLM API.
- Do not upload repo content by default.
- Do not claim legal or NDA compliance.
- Do not generate unsupported personal claims.

## 7. MVP Scope

The MVP should prioritize a local/offline pipeline. It should not require API keys, hosted auth, cloud storage, or a web dashboard.

The MVP should support this flow:

```bash
npx pow-portfolio init
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio prompt codex
npx pow-portfolio export
```

The MVP should generate:

```txt
.pow/evidence/EVIDENCE_MAP.json
.pow/briefs/PROJECT_BRIEF.md
.pow/briefs/CLAIM_BRIEF.md
.pow/briefs/REDACTION_BRIEF.md
.pow/dist/CASE_STUDY.md
.pow/dist/SHOWCASE_BRIEF.md
.pow/dist/PAGE_CONTENT.md
.pow/dist/CV_BULLETS.md
.pow/dist/INTERVIEW_NOTES.md
.pow/dist/SHOWCASE_PAGE.html
```

`SHOWCASE_PAGE.html` is the public, CV-link-ready artifact. The Markdown files are supporting views for editing, repackaging, and interview prep.

## 8. User Workflow

1. User runs `init` inside a local repo.
2. User optionally fills `.pow/manual_notes.md` with role, contribution boundaries, private aliases, demo links, and screenshot captions.
3. User runs `collect`.
4. Deterministic collectors extract evidence from git, docs, tests, logs, deployment configs, screenshots, and manual notes.
5. Redaction scanner flags sensitive evidence.
6. Claim scorer proposes candidate claims.
7. User runs `brief` to create compact agent-readable context.
8. User runs `prompt codex` or another agent prompt.
9. Agent uses briefs and evidence IDs to improve outputs without reading the full repo by default.
10. User runs `export` to create project showcase artifacts.
11. User can host or attach `.pow/dist/SHOWCASE_PAGE.html` as the public project link.

## 9. Key Functional Requirements

### FR1 — Workspace initialization

`init` must create a `.pow` workspace with config, manual notes, skill prompts, and output directories.

### FR2 — Deterministic evidence collection

`collect` must gather cheap local signals without requiring LLM calls.

Supported MVP evidence sources:

- git commits and changed files
- file tree architecture hints
- README/docs/worklogs/release notes
- test/eval/benchmark logs
- deploy config metadata
- screenshot/demo metadata
- manual user notes
- optional Understand Anything JSON adapter

### FR3 — Evidence Adapter Contract

Every collector must normalize output to a common schema with source type, source tool, artifact ID, public-safe excerpt, private risks, confidence, claim hints, and weight.

The adapter contract is the main extensibility point. `pow-portfolio` should not compete with tools such as code graph generators; it should convert their outputs into evidence items.

### FR4 — Redaction-first classification

Sensitive evidence must be flagged before public narrative generation.

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

### FR5 — Claim-first retrieval and scoring

The tool should propose claims from evidence, not summarize the whole repo first. Every candidate claim must include evidence IDs, confidence, risks, public-safe rewrite, and recommended outputs.

### FR6 — Agent-ready briefs

Briefs must be compact, human-readable, and optimized for agents.

The agent should read:

1. `PROJECT_BRIEF.md`
2. `CLAIM_BRIEF.md`
3. `REDACTION_BRIEF.md`
4. `EVIDENCE_MAP.json` only if needed

### FR7 — Project showcase export

Exporters must generate Markdown and static HTML views from `EVIDENCE_MAP.json` and briefs. `SHOWCASE_PAGE.html` is the primary link-ready output; the Markdown files are supporting artifacts derived from the same evidence map.

### FR8 — Quality gates

Each claim must pass quality checks before being treated as verified.

If a claim fails, it must be marked as:

```txt
Unverified / needs user confirmation
```

## 10. Product Success Metrics

For the MVP, success is not measured by users or revenue yet. It is measured by artifact quality and workflow reliability.

| Metric | Target |
|---|---:|
| Full local smoke flow completes | 100% on sample repo |
| Evidence items generated on non-empty repo | >= 10 |
| Candidate claims generated | >= 5 |
| Claims with evidence IDs | 100% |
| Public outputs generated | 6/6 required files |
| Redaction brief generated before export | yes |
| Source code uploaded by default | never |
| Agent prompt instructs brief-first workflow | yes |

## 11. MVP Done Definition

The MVP is done when a blank repo can install/build the package and a real project repo can run the full flow to produce a credible project showcase package with evidence-backed claims and public-safety warnings.

## 12. Agent and efficiency requirements

The public repo must include:

- `docs/EFFICIENCY_DESIGN.md` for Evidence Adapter Contract, claim-first retrieval, redaction-first flow, and token budgets.
- `skill/SKILL.md` and `skill/prompts/` as user-facing package assets for brief-first showcase generation.

Private coding-agent orchestration files, implementation task breakdowns, handoff notes, and planning rubrics should stay outside the public repository.

Agents should optimize for:

```txt
minimum tokens per verified project-showcase claim
```

They should not optimize for maximum codebase understanding.

## 13. Open Questions

- Should `export` produce only draft content, or should it also validate that all claims pass quality gates?
- Should users approve claims interactively in v0.1 or defer to agent/manual editing?
- Should `EVIDENCE_MAP.json` include raw snippets, or only public-safe excerpts and private local refs?
- Should screenshots be treated as evidence by metadata only in MVP, or should caption files be required?
- Should package name remain `pow-portfolio` long-term or later become `pow-showcase` / `proofcase`?
