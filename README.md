# pow-portfolio

> Turn private local work into a public project showcase.

`pow-portfolio` is a local-first npm/npx **project showcase compiler**. It scans a local repository, extracts compact project evidence, proposes evidence-backed claims, and generates public-safe project case-study/showcase artifacts without asking an LLM to read the entire repo by default.

It is **not** a generic resume builder, **not** a full personal portfolio CMS, and **not** a codebase-understanding engine.

## What this tool actually creates

The main output is **one project showcase package**: a recruiter-readable link or set of copy-ready Markdown files for a single project.

Use it when you want to put a link on your CV like:

```txt
Legal RAG Assistant — Project case study: https://...
```

The tool helps produce the content behind that link:

- what problem the project solved
- what you personally contributed
- how the system works
- key technical decisions and trade-offs
- demo/screenshots/evaluation/test evidence
- public-safe proof without publishing source code

## Why this exists

Many developers, students, intern candidates, indie hackers, and founders have real work trapped in private repos, NDA/client projects, messy local projects, or team repos where they cannot publish source code. They still need to prove what they actually built.

`pow-portfolio` turns local evidence into a **project case study / technical proof page** that can be shared from a CV, personal site, Notion, Canva, Gamma, Framer, GitHub Pages, Vercel, or any portfolio platform.

The main link-ready artifact is `SHOWCASE_PAGE.html`: a static HTML technical proof page meant to be hosted or attached as the public project link from a CV.

## Core artifacts

`EVIDENCE_MAP.json` is the source of truth. Markdown and HTML are just views generated from it.

Generated outputs:

- `EVIDENCE_MAP.json` — normalized evidence and candidate claims
- `PROJECT_BRIEF.md` — compact project context for an agent/LLM
- `CLAIM_BRIEF.md` — candidate claims with evidence IDs
- `REDACTION_BRIEF.md` — public-safety risks before generation
- `CASE_STUDY.md` — long-form technical case study
- `SHOWCASE_BRIEF.md` — compact copy-ready brief for Canva/Gamma/Notion/portfolio platforms
- `PAGE_CONTENT.md` — sectioned landing/project-page copy
- `CV_BULLETS.md` — CV-ready bullets derived from verified claims
- `INTERVIEW_NOTES.md` — interview walkthrough and STAR-style notes
- `SHOWCASE_PAGE.html` — static one-project showcase page

These generated artifacts live under `.pow/`. Repository docs stay in `docs/`, reusable export layouts stay in `templates/`, bundled agent instructions stay in `skill/`, and generated per-project output stays in `.pow/`.

## Core principle

> Minimum tokens per verified project-showcase claim.

The pipeline is claim-first and redaction-first:

```txt
collect cheap deterministic signals
→ classify sensitivity
→ propose candidate claims
→ retrieve minimal evidence per claim
→ verify each claim
→ generate public-safe project narrative
```

## Quickstart

```bash
# inside any local repo
npx pow-portfolio init
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio prompt codex
npx pow-portfolio export
```

During local development:

```bash
npm install
npm run build
node dist/cli.js doctor
node dist/cli.js init --force
node dist/cli.js collect --repo .
node dist/cli.js brief
node dist/cli.js prompt codex
node dist/cli.js export
```

Or run the bundled smoke check:

```bash
npm run test:smoke
```

The MVP does not require a SaaS account, cloud deployment, MCP server, or LLM API key. Agent/LLM use is optional and starts from generated briefs under `.pow/briefs`.

## Commands

| Command | Purpose |
|---|---|
| `init` | Create `.pow/config.json`, manual notes, and agent skill files. |
| `collect` | Collect git/docs/tests/deploy/screenshots evidence into `.pow/evidence/EVIDENCE_MAP.json`. |
| `brief` | Generate compact briefs for agents: project, claims, redaction. |
| `prompt <agent>` | Generate a prompt for Codex, Claude, Cursor, Gemini CLI, or generic agents. |
| `export` | Compile Markdown and static HTML project-showcase artifacts. |
| `doctor` | Check local environment and repo readiness. |

## Recommended showcase page structure

The generated page/content should follow this one-project case-study format:

1. Hero — project name, one-liner, demo/code/video links
2. Problem — pain point, target user, why it mattered
3. Solution — core workflow and use case
4. My Role — contribution boundaries, especially for team projects
5. Demo — video, screenshots, workflow snapshots
6. Architecture — diagram, stack, data flow, deployment, AI/RAG/retrieval details if relevant
7. Key Technical Decisions — why solution A was chosen over B
8. Evidence — commits, PR summaries, test logs, eval results, worklog, docs, screenshots
9. Result — metrics, performance, validation, what worked
10. Reflection — trade-offs, limitations, next steps

## What gets collected

MVP collectors are deterministic and low-cost:

- Git commits and changed files
- File tree and architecture hints
- README/docs/worklogs/release notes
- Test, coverage, eval, and benchmark logs
- Deploy config metadata
- Screenshot/demo metadata
- Manual contribution notes
- Optional adapter output such as Understand Anything JSON

Raw source code is not sent anywhere by default.

## Agent workflow

`pow-portfolio` creates `.pow/skill/SKILL.md` and prompt templates. Agents should read briefs first and only request targeted evidence when a claim cannot be verified.

The rule is strict:

> No public project-showcase claim without evidence IDs.

## Security and privacy

This tool helps with public-safety review, but it is not legal advice and cannot guarantee NDA compliance.

The redaction scanner flags common risk categories:

- secrets/API keys/tokens
- customer/client names
- internal URLs
- private repo names
- proprietary algorithm details
- database schema-sensitive fields
- exact prompts/system instructions
- NDA project labels
- personally identifiable information

## Public repo scope

This public repository contains the product code, user-facing documentation, schemas, templates, examples, and the package skill assets needed to fork, clone, build, and run the tool.

Internal coding-agent playbooks, task breakdowns, handoff notes, and superpowers/plans are intentionally kept out of the public repository.

## Project status

This repo is an MVP skeleton with a working local pipeline. See:

- [`docs/PRD.md`](docs/PRD.md) — product requirements and scope control
- [`docs/SPEC.md`](docs/SPEC.md) — product and schema specification
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — low-cost local-first architecture
- [`docs/EFFICIENCY_DESIGN.md`](docs/EFFICIENCY_DESIGN.md) — Evidence Adapter Contract, token budgets, claim-first pipeline
- [`docs/RESEARCH.md`](docs/RESEARCH.md) — market and pain-point summary
- [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) — release-readiness checklist
- [`CHANGELOG.md`](CHANGELOG.md) — release notes draft
