# Changelog

## 0.1.0 - MVP draft

- Added local-first `pow-portfolio` CLI flow: `doctor`, `init`, `collect`, `brief`, `prompt`, and `export`.
- Added deterministic evidence collectors for git, docs, file tree, tests, deployment metadata, screenshots, manual notes, and optional Understand Anything JSON.
- Added redaction-first risk scanning, candidate claim scoring, quality gates, compact briefs, and agent prompts.
- Added Markdown and static HTML project-showcase exports: `CASE_STUDY.md`, `SHOWCASE_BRIEF.md`, `PAGE_CONTENT.md`, `CV_BULLETS.md`, `INTERVIEW_NOTES.md`, and `SHOWCASE_PAGE.html`.
- Added dogfood-oriented claim categories for data engineering, AI engineering, project management, CLI tooling, static showcase export, privacy governance, and release readiness.
- Added release-readiness docs and a redacted sample private-project note set.

## Known MVP limits

- Public-safe review is heuristic and not legal or NDA advice.
- Generated prose is a draft; users should review claims, aliases, and contribution boundaries before publishing.
- No SaaS, cloud sync, OAuth, or hosted dashboard is included in the MVP.
- Agent/LLM usage is optional and starts from compact briefs; no LLM API is required for the local flow.
