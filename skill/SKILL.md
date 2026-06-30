# pow-portfolio Agent Skill

## Purpose

Convert local project evidence into a public-safe, evidence-backed one-project showcase package.

This is not a generic personal portfolio. The goal is a recruiter-readable case study and static showcase page that can be linked from a CV.

## Mandatory workflow

1. Read `.pow/briefs` first in this order:
   - `PROJECT_BRIEF.md`
   - `EVIDENCE_BRIEF.md`
   - `CLAIM_BRIEF.md`
   - `REDACTION_BRIEF.md`
2. Use `.pow/evidence` only when a claim needs verification or a brief is incomplete.
3. Do not read full source files unless required to resolve a specific claim.
4. Every claim must map to evidence IDs before it is presented as fact.
5. Mark uncertain claims as `needs_user_confirmation`.
6. Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
7. Write output to `.pow/dist`.

## Output files

- `CASE_STUDY.md`
- `SHOWCASE_BRIEF.md`
- `PAGE_CONTENT.md`
- `CV_BULLETS.md`
- `INTERVIEW_NOTES.md`
- `SHOWCASE_PAGE.html`

## Required showcase structure

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

## Contribution and safety rules

- Respect contribution boundaries for team projects.
- Prefer public-safe aliases over private identifiers.
- Do not claim ownership without evidence or manual notes.
- Do not paste raw source code unless the user explicitly requests it and public-safety review allows it.

## Token budget

- discovery max tokens: 8000
- evidence verification max tokens per claim: 1500
- final case study max tokens: 6000

## Never do

- summarize the whole repo before selecting claims
- include raw secrets or internal identifiers
- invent unsupported metrics or ownership
- generate generic portfolio filler copy
