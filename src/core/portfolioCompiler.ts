import { CandidateClaim, EvidenceItem, EvidenceMap } from "./types.js";

interface ShowcaseClaim {
  id: string;
  text: string;
  evidenceIds: string[];
  category: string;
  confidence: number;
  status: "verified" | "needs_user_confirmation";
}

interface ShowcaseAppendixRow {
  id: string;
  sourceType: string;
  title: string;
  excerpt: string;
}

export interface ShowcaseModel {
  projectTitle: string;
  oneLineValue: string;
  problem: string[];
  context: string[];
  role: string[];
  architecture: string[];
  claims: ShowcaseClaim[];
  decisions: string[];
  validation: string[];
  timeline: string[];
  improvements: string[];
  appendix: ShowcaseAppendixRow[];
  links: string[];
  metrics: {
    evidenceCount: number;
    verifiedClaimCount: number;
    reviewClaimCount: number;
    riskCount: number;
  };
}

export function buildShowcaseModel(map: EvidenceMap): ShowcaseModel {
  const evidenceById = new Map(map.evidence.map((item) => [item.id, item]));
  const docEvidence = takeEvidence(map.evidence, (item) => item.source_type === "doc" || item.source_type === "worklog", 4);
  const priorityDocEvidence = rankNarrativeEvidence(
    map.evidence.filter(
      (item) =>
        (item.source_type === "doc" || item.source_type === "worklog") &&
        item.paths.some((path) => /(README\.md|PRD\.md|SPEC\.md|ARCHITECTURE\.md|EFFICIENCY_DESIGN\.md)$/i.test(path)) &&
        item.paths.every((path) => !/docs\/tasks\//i.test(path))
    )
  ).slice(0, 4);
  const narrativeDocs = priorityDocEvidence.length > 0 ? priorityDocEvidence : docEvidence;
  const manualEvidence = takeEvidence(
    map.evidence,
    (item) => item.source_type === "manual_note" && !/Use this file to add context that git\/docs cannot know/i.test(item.public_safe_excerpt),
    2
  );
  const testEvidence = takeEvidence(map.evidence, (item) => item.source_type === "test_log", 3);
  const deployEvidence = takeEvidence(map.evidence, (item) => item.source_type === "deploy_config", 2);
  const treeEvidence = takeEvidence(map.evidence, (item) => item.source_type === "file_tree", 1);
  const screenshotEvidence = takeEvidence(map.evidence, (item) => item.source_type === "screenshot", 3);
  const gitEvidence = takeEvidence(map.evidence, (item) => item.source_type === "git", 6);
  const verifiedClaims = map.claims.filter((claim) => !claim.needs_user_confirmation);
  const reviewClaims = map.claims.filter((claim) => claim.needs_user_confirmation);
  const selectedClaims: ShowcaseClaim[] = [...verifiedClaims, ...reviewClaims]
    .slice(0, 6)
    .map((claim): ShowcaseClaim => ({
      id: claim.id,
      text: claim.public_safe_rewrite,
      evidenceIds: claim.evidence_ids,
      category: claim.category,
      confidence: claim.confidence,
      status: claim.needs_user_confirmation ? "needs_user_confirmation" : "verified"
    }));

  const projectTitle = map.project.name;
  const oneLineValue = buildOneLineValue(map, selectedClaims, narrativeDocs[0]);
  const problem = [
    buildEvidenceBullet(pickSentence(narrativeDocs[0]?.public_safe_excerpt) || "The project needed a public-safe way to explain technical work without relying on raw source access.", collectIds(narrativeDocs.slice(0, 2))),
    buildEvidenceBullet(
      "Claims needed to stay traceable to compact evidence instead of broad repo summaries.",
      collectIds([...narrativeDocs.slice(0, 1), ...manualEvidence.slice(0, 1)])
    )
  ];
  const context = [
    buildEvidenceBullet("Work was constrained to local-first collection, compact briefs, and static export outputs.", collectIds([...narrativeDocs.slice(0, 1), ...treeEvidence])),
    buildEvidenceBullet("Public-safety review and contribution boundaries had to be preserved before publishing claims.", collectIds([...manualEvidence.slice(0, 1), ...narrativeDocs.slice(1, 2)])),
    buildEvidenceBullet(`Risk scan summary: ${map.risk_summary.total_risks} flagged signal(s) across ${map.risk_summary.risk_categories.join(", ") || "no detected categories"}.`, [])
  ];
  const role = manualEvidence.length > 0
    ? manualEvidence.map((item) => buildEvidenceBullet(compactText(item.public_safe_excerpt, 180), [item.id]))
    : ["- Add manual role and contribution notes in .pow/manual_notes.md before publishing."];
  const architecture = [
    buildEvidenceBullet("Repository structure, docs, and deployment metadata establish the technical system boundaries used for the showcase.", collectIds([...treeEvidence, ...narrativeDocs.slice(0, 1), ...deployEvidence.slice(0, 1)])),
    ...selectedClaims
      .filter((claim) => /architecture|backend|deployment|retrieval|data|ai_engineering|privacy|cli|showcase|observability|frontend/.test(claim.category))
      .slice(0, 3)
      .map((claim) => formatClaimSummary(claim))
  ];
  const decisions = [
    buildEvidenceBullet("Prefer compact briefs and claim-level verification before opening raw evidence.", collectIds(narrativeDocs.slice(0, 2))),
    buildEvidenceBullet("Keep the public artifact static and local-openable instead of coupling the MVP to deployment or auth.", collectIds([...deployEvidence.slice(0, 1), ...treeEvidence])),
    buildEvidenceBullet("Downgrade weak claims instead of polishing them into unsupported marketing copy.", collectIds(map.claims.slice(0, 2).flatMap((claim) => claim.evidence_ids).map((id) => evidenceById.get(id)).filter(Boolean) as EvidenceItem[]))
  ];
  const validation = testEvidence.length > 0
    ? testEvidence.map((item) => buildEvidenceBullet(`${item.summary}. ${compactText(item.public_safe_excerpt, 140)}`, [item.id]))
    : ["- No test or benchmark evidence was collected yet. Add logs or reports before publishing metrics."];
  if (screenshotEvidence.length > 0) {
    validation.push(buildEvidenceBullet("Visual demo assets were collected to support a recruiter-friendly walkthrough.", collectIds(screenshotEvidence.slice(0, 2))));
  }
  const timeline = buildTimeline(gitEvidence, map);
  const improvements = [
    reviewClaims.length > 0
      ? `- Resolve ${reviewClaims.length} claim(s) still marked as needs_user_confirmation before publishing the strongest version of the showcase.`
      : "- Add one more round of human review to tighten wording and remove any remaining ambiguity.",
    map.risk_summary.total_risks > 0
      ? `- Re-check public-safe aliases for ${map.risk_summary.total_risks} flagged risk signal(s) before sharing externally.`
      : "- Add public demo links, screenshots, or a deck if you want a richer outward-facing package.",
    "- Expand the evidence appendix with fresh validation logs or demo notes when new milestones land."
  ];
  const appendix = map.evidence.slice(0, 12).map((item) => ({
    id: item.id,
    sourceType: item.source_type,
    title: item.title,
    excerpt: compactText(item.public_safe_excerpt, 220)
  }));
  const links = buildLinks(screenshotEvidence, map.project.git_remote_public_safe === true);

  return {
    projectTitle,
    oneLineValue,
    problem,
    context,
    role,
    architecture,
    claims: selectedClaims,
    decisions,
    validation,
    timeline,
    improvements,
    appendix,
    links,
    metrics: {
      evidenceCount: map.evidence.length,
      verifiedClaimCount: verifiedClaims.length,
      reviewClaimCount: reviewClaims.length,
      riskCount: map.risk_summary.total_risks
    }
  };
}

export function compileCaseStudy(map: EvidenceMap): string {
  const model = buildShowcaseModel(map);

  return `# ${model.projectTitle} — Project Showcase Case Study

> Public-safe draft generated from evidence-backed claims. Review before publishing.

## Project Title + One-Line Value Proposition

- Project title: ${model.projectTitle}
- One-line value proposition: ${model.oneLineValue}

## Problem / User Pain Point

${renderMarkdownList(model.problem)}

## Context & Constraints

${renderMarkdownList(model.context)}

## My Role and Contribution Boundary

${renderMarkdownList(model.role)}

## Architecture Overview

${renderMarkdownList(model.architecture)}

## Evidence-Backed Technical Claims

${renderClaimList(model.claims)}

## Key Decisions & Trade-Offs

${renderMarkdownList(model.decisions)}

## Validation / Tests / Metrics / Demo Evidence

${renderMarkdownList(model.validation)}

## Timeline / Milestones

${renderMarkdownList(model.timeline)}

## What I Would Improve Next

${renderMarkdownList(model.improvements)}

## Public-Safe Evidence Appendix

${renderAppendix(model.appendix)}

## Links

${renderMarkdownList(model.links)}
`;
}

export function compileShowcaseBrief(map: EvidenceMap): string {
  const model = buildShowcaseModel(map);

  return `# ${model.projectTitle} — Showcase Brief

> Compact brief for a recruiter-readable project showcase package.

## Summary

- ${model.oneLineValue}
- Evidence items collected: ${model.metrics.evidenceCount}
- Verified claims ready to use: ${model.metrics.verifiedClaimCount}
- Claims still marked needs_user_confirmation: ${model.metrics.reviewClaimCount}

## Best Proof Points

${renderClaimList(model.claims.slice(0, 4))}

## Context to Keep

${renderMarkdownList(model.context.slice(0, 3))}

## Validation to Mention

${renderMarkdownList(model.validation.slice(0, 3))}

## Primary Artifact

- .pow/dist/SHOWCASE_PAGE.html is the static CV-link-ready artifact.
`;
}

export function compilePageContent(map: EvidenceMap): string {
  const model = buildShowcaseModel(map);

  return `# PAGE_CONTENT

## Project Title + One-Line Value Proposition

${model.projectTitle} - ${model.oneLineValue}

## Problem / User Pain Point

${renderMarkdownList(model.problem)}

## Context & Constraints

${renderMarkdownList(model.context)}

## My Role and Contribution Boundary

${renderMarkdownList(model.role)}

## Architecture Overview

${renderMarkdownList(model.architecture)}

## Evidence-Backed Technical Claims

${renderClaimList(model.claims)}

## Key Decisions & Trade-Offs

${renderMarkdownList(model.decisions)}

## Validation / Tests / Metrics / Demo Evidence

${renderMarkdownList(model.validation)}

## Timeline / Milestones

${renderMarkdownList(model.timeline)}

## What I Would Improve Next

${renderMarkdownList(model.improvements)}

## Public-Safe Evidence Appendix

${renderAppendix(model.appendix)}

## Links

${renderMarkdownList(model.links)}
`;
}

export function compileCvBullets(map: EvidenceMap): string {
  const model = buildShowcaseModel(map);
  const bullets = model.claims
    .filter((claim) => claim.status === "verified")
    .slice(0, 5)
    .map((claim) => `- ${trimTerminalPunctuation(claim.text)}. Evidence: ${claim.evidenceIds.join(", ")}. Confidence: ${claim.confidence}.`);

  return `# CV_BULLETS

${bullets.join("\n") || "- No evidence-backed claims are ready yet."}
`;
}

export function compileInterviewNotes(map: EvidenceMap): string {
  const model = buildShowcaseModel(map);
  const notes = model.claims.map((claim) => `## ${claim.id}: ${claim.text}

- Situation: ${model.problem[0].replace(/^- /, "")}
- Task: Explain the ownership boundary and why this claim mattered.
- Action: Walk through evidence ${claim.evidenceIds.join(", ")} and the trade-off behind ${claim.category}.
- Result: Tie back to validation, milestone progress, or demo proof.
- Status: ${claim.status}.
`);

  return `# INTERVIEW_NOTES

Use this file to prepare evidence-backed walkthroughs for recruiters and interview loops.

${notes.join("\n")}
`;
}

function takeEvidence(items: EvidenceItem[], predicate: (item: EvidenceItem) => boolean, limit: number): EvidenceItem[] {
  return items.filter(predicate).slice(0, limit);
}

function rankNarrativeEvidence(items: EvidenceItem[]): EvidenceItem[] {
  return [...items].sort((left, right) => narrativeEvidenceRank(right) - narrativeEvidenceRank(left));
}

function narrativeEvidenceRank(item: EvidenceItem): number {
  if (item.paths.some((path) => path === "README.md")) return 100;
  if (item.paths.some((path) => path === "docs/PRD.md")) return 90;
  if (item.paths.some((path) => path === "docs/SPEC.md")) return 80;
  if (item.paths.some((path) => path === "docs/ARCHITECTURE.md")) return 70;
  if (item.paths.some((path) => path === "docs/EFFICIENCY_DESIGN.md")) return 60;
  return item.weight * item.confidence;
}

function collectIds(items: EvidenceItem[]): string[] {
  return items.map((item) => item.id);
}

function buildOneLineValue(map: EvidenceMap, claims: ShowcaseClaim[], docEvidence?: EvidenceItem): string {
  const tagline = pickBlockquote(docEvidence?.public_safe_excerpt);
  if (tagline) {
    return compactText(stripMarkdown(tagline), 140);
  }
  const docSentence = pickSentence(docEvidence?.public_safe_excerpt);
  if (docSentence) {
    return compactText(stripMarkdown(docSentence), 140);
  }
  const categories = new Set(claims.map((claim) => claim.category));
  if (categories.has("retrieval_architecture")) {
    return "A retrieval-heavy engineering project packaged into a public-safe showcase with evidence-backed claims.";
  }
  if (categories.has("deployment") || categories.has("testing_validation")) {
    return "A production-minded project story assembled from local evidence, validation signals, and public-safe exports.";
  }
  return `A recruiter-readable showcase package generated from ${map.evidence.length} evidence items and ${claims.length} selected technical claims.`;
}

function buildTimeline(gitEvidence: EvidenceItem[], map: EvidenceMap): string[] {
  const dated = gitEvidence.filter((item) => item.date).sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));
  const first = dated[0];
  const last = dated[dated.length - 1];
  const bullets: string[] = [];

  if (first?.date && last?.date) {
    bullets.push(`- Milestone window: ${first.date} to ${last.date}. Evidence: ${first.id}, ${last.id}.`);
  }
  if (gitEvidence.length > 0) {
    bullets.push(`- Git history captured ${gitEvidence.length} recent commit evidence item(s) for the showcase timeline.`);
  }
  bullets.push(`- Evidence collection snapshot generated on ${map.generated_at.slice(0, 10)}.`);
  return bullets;
}

function buildLinks(screenshotEvidence: EvidenceItem[], gitRemotePublicSafe: boolean): string[] {
  const links = [
    "- Demo video: add a public URL if one is available.",
    screenshotEvidence.length > 0
      ? `- Screenshots: ${screenshotEvidence.slice(0, 3).flatMap((item) => item.paths).join(", ")}.`
      : "- Screenshots: add public-safe image paths or hosted images if available.",
    "- Deck: add portfolio_deck.md or a public slide URL if you create one.",
    gitRemotePublicSafe
      ? "- GitHub: add the public repository URL."
      : "- GitHub: add a public repository URL only if the repo is shareable."
  ];
  return links;
}

function buildEvidenceBullet(text: string, evidenceIds: string[]): string {
  const clean = compactText(text, 180);
  return `- ${clean}${evidenceIds.length > 0 ? ` Evidence: ${evidenceIds.join(", ")}.` : ""}`;
}

function formatClaimSummary(claim: ShowcaseClaim): string {
  const status = claim.status === "verified" ? "verified" : "needs_user_confirmation";
  return `- ${claim.id}: ${trimTerminalPunctuation(claim.text)}. Evidence: ${claim.evidenceIds.join(", ")}. Status: ${status}. Confidence: ${claim.confidence}.`;
}

function renderClaimList(claims: ShowcaseClaim[]): string {
  if (claims.length === 0) return "- No evidence-backed claims are ready yet.";
  return claims.map((claim) => formatClaimSummary(claim)).join("\n");
}

function renderAppendix(rows: ShowcaseAppendixRow[]): string {
  if (rows.length === 0) return "- No public-safe evidence appendix rows are available yet.";
  return rows.map((row) => `- ${row.id} [${row.sourceType}] ${row.title}: ${row.excerpt}`).join("\n");
}

function renderMarkdownList(items: string[]): string {
  return items.length > 0 ? items.join("\n") : "- No content available yet.";
}

function pickSentence(text: string | undefined): string {
  if (!text) return "";
  const normalized = compactText(stripMarkdown(text), 220);
  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized;
  return sentence.trim();
}

function pickBlockquote(text: string | undefined): string {
  if (!text) return "";
  const line = text.split("\n").find((item) => /^>\s+/.test(item.trim()));
  return line?.replace(/^>\s+/, "").trim() ?? "";
}

function compactText(text: string, maxLength: number): string {
  const singleLine = text.replaceAll(/\s+/g, " ").trim();
  return singleLine.length <= maxLength ? singleLine : `${singleLine.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function stripMarkdown(text: string): string {
  return text
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/\*\*([^*]+)\*\*/g, "$1")
    .replaceAll(/^#+\s*/gm, "")
    .replaceAll(/^>\s*/gm, "")
    .replaceAll(/^\s*[-*]\s*/gm, "")
    .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function trimTerminalPunctuation(text: string): string {
  return text.replace(/[.]+$/g, "").trim();
}
