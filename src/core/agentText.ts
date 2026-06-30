const outputFiles = [
  "CASE_STUDY.md",
  "SHOWCASE_BRIEF.md",
  "PAGE_CONTENT.md",
  "CV_BULLETS.md",
  "INTERVIEW_NOTES.md",
  "SHOWCASE_PAGE.html"
] as const;

const showcaseSections = [
  "Project title + one-line value proposition",
  "Problem / user pain point",
  "Context & constraints",
  "My role and contribution boundary",
  "Architecture overview",
  "3-6 evidence-backed technical claims",
  "Key decisions & trade-offs",
  "Validation / tests / metrics / demo evidence",
  "Timeline / milestones",
  "What I would improve next",
  "Public-safe evidence appendix",
  "Links: demo video, screenshots, deck, GitHub if public"
] as const;

export function buildAgentSkillText(): string {
  return `# pow-portfolio Agent Skill

## Purpose

Convert local project evidence into a public-safe, evidence-backed one-project showcase package.

This is not a generic personal portfolio. The goal is a recruiter-readable case study and static showcase page that can be linked from a CV.

## Mandatory workflow

1. Read .pow/briefs first in this order:
   - PROJECT_BRIEF.md
   - EVIDENCE_BRIEF.md
   - CLAIM_BRIEF.md
   - REDACTION_BRIEF.md
2. Use .pow/evidence only when a claim needs verification or a brief is incomplete.
3. Do not read full source files unless required to resolve a specific claim.
4. Every claim must map to evidence IDs before it is presented as fact.
5. Mark uncertain claims as needs_user_confirmation.
6. Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
7. Write output to .pow/dist.

## Output files

${outputFiles.map((file) => `- ${file}`).join("\n")}

## Required showcase structure

${showcaseSections.map((section, index) => `${index + 1}. ${section}`).join("\n")}

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
`;
}

export function buildVerifyClaimsPrompt(): string {
  return `# Verify Claims

Read .pow/briefs first.
Use .pow/evidence only when a claim needs verification or a brief is incomplete.
Do not read full source files unless required.

For each candidate claim:

1. Confirm that every claim maps to evidence IDs.
2. Mark uncertain claims as needs_user_confirmation.
3. Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
4. Preserve contribution boundaries.
5. Prefer public-safe rewrites over raw excerpts.
`;
}

export function buildCaseStudyPrompt(): string {
  return `# Generate Project Showcase

Read .pow/briefs first.
Use .pow/evidence only when a claim needs verification or a brief is incomplete.
Do not read full source files unless required.

Every claim must map to evidence IDs.
Mark uncertain claims as needs_user_confirmation.
Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
Write output to .pow/dist.

Required files:

${outputFiles.map((file) => `- .pow/dist/${file}`).join("\n")}

Required structure:

${showcaseSections.map((section, index) => `${index + 1}. ${section}`).join("\n")}
`;
}

export function buildAgentPrompt(agent: string): string {
  return `# pow-portfolio prompt for ${agent}

You are generating a public-safe one-project showcase package from local project evidence.

## Mandatory workflow

- Read .pow/briefs first.
- Use .pow/evidence only when a claim needs verification or a brief is incomplete.
- Do not read full source files unless required.
- Every claim must map to evidence IDs.
- Mark uncertain claims as needs_user_confirmation.
- Respect contribution boundaries.
- Redact secrets, client names, internal URLs, private repo names, and other sensitive details.
- Write output to .pow/dist.

## Read order

1. .pow/skill/SKILL.md
2. .pow/briefs/PROJECT_BRIEF.md
3. .pow/briefs/EVIDENCE_BRIEF.md
4. .pow/briefs/CLAIM_BRIEF.md
5. .pow/briefs/REDACTION_BRIEF.md

## Output files

${outputFiles.map((file) => `- .pow/dist/${file}`).join("\n")}

## Required showcase structure

${showcaseSections.map((section, index) => `${index + 1}. ${section}`).join("\n")}

## Quality gate

- Every claim must map to evidence IDs and source types.
- Unsupported or weak claims must stay marked as needs_user_confirmation.
- Do not publish raw secrets, private names, or internal URLs.
- Do not read the full repository unless the briefs cannot verify a specific claim.
`;
}
