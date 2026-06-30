# Release Checklist

Use this before publishing or showcasing the MVP.

## Required files

- [ ] `README.md` explains that this is a one-project showcase compiler, not a generic resume builder.
- [ ] `docs/PRD.md` exists.
- [ ] `docs/EFFICIENCY_DESIGN.md` explains the token-efficient, evidence-first architecture.
- [ ] `skill/SKILL.md` matches the CLI command behavior and brief-first agent workflow.
- [ ] `templates/`, `schemas/`, `skill/`, public `docs/`, and `examples/` are included by `package.json`.

## Local QA flow

```bash
npm install
npm run build
node dist/cli.js doctor
node dist/cli.js init --force
node dist/cli.js collect --repo .
node dist/cli.js brief
node dist/cli.js prompt codex
node dist/cli.js export
npm pack --dry-run
```

## Dogfood review

- [ ] `.pow/evidence/EVIDENCE_MAP.json` exists and contains evidence IDs.
- [ ] `.pow/briefs/PROJECT_BRIEF.md`, `EVIDENCE_BRIEF.md`, `CLAIM_BRIEF.md`, and `REDACTION_BRIEF.md` exist.
- [ ] `.pow/dist/CASE_STUDY.md`, `SHOWCASE_BRIEF.md`, `PAGE_CONTENT.md`, `CV_BULLETS.md`, `INTERVIEW_NOTES.md`, and `SHOWCASE_PAGE.html` exist.
- [ ] Public outputs frame one project, not a generic personal portfolio.
- [ ] Claims map to evidence IDs.
- [ ] Redaction risks are visible before publication.
- [ ] No raw secrets, internal URLs, or private customer names appear in generated public outputs.
- [ ] `SHOWCASE_PAGE.html` can be opened as a static link-ready page.

## Scope guardrails

- [ ] No SaaS or cloud dependency is required.
- [ ] No LLM API key is required for MVP commands.
- [ ] No MCP server is required for MVP commands.
- [ ] No deployment command is required to get the core output.
