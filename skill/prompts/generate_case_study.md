# Generate Project Showcase

Read `.pow/briefs` first.
Use `.pow/evidence` only when a claim needs verification or a brief is incomplete.
Do not read full source files unless required.

Every claim must map to evidence IDs.
Mark uncertain claims as `needs_user_confirmation`.
Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
Write output to `.pow/dist`.

Required files:

- `.pow/dist/CASE_STUDY.md`
- `.pow/dist/SHOWCASE_BRIEF.md`
- `.pow/dist/PAGE_CONTENT.md`
- `.pow/dist/CV_BULLETS.md`
- `.pow/dist/INTERVIEW_NOTES.md`
- `.pow/dist/SHOWCASE_PAGE.html`

Required structure:

1. Project title + one-line value proposition
2. Problem / user pain point
3. Context & constraints
4. My role and contribution boundary
5. Architecture overview
6. 3-6 evidence-backed technical claims
7. Key decisions & trade-offs
8. Validation / tests / metrics / demo evidence
9. Timeline / milestones
10. What I would improve next
11. Public-safe evidence appendix
12. Links: demo video, screenshots, deck, GitHub if public
