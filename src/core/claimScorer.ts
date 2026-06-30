import { CandidateClaim, ClaimQualityGate, EvidenceItem, RecommendedOutput, SourceType } from "./types.js";
import { scanSensitiveText } from "./redactionScanner.js";

interface ClaimSeed {
  category: string;
  claim: string;
  outputs: RecommendedOutput[];
  reviewerValue: string;
  evidence: EvidenceItem[];
}

const categoryLabels: Record<string, string> = {
  data_engineering: "Built a normalized evidence pipeline with schemas, collectors, and an evidence map as the source of truth",
  ai_engineering: "Designed a claim-first, token-efficient agent workflow that avoids reading raw source by default",
  project_management: "Managed the MVP through PRD, task rubrics, acceptance criteria, and scope-control docs",
  cli_tooling: "Built a local-first npm CLI that runs the project-showcase pipeline without SaaS or LLM dependencies",
  static_showcase_export: "Generated link-ready static showcase artifacts from evidence-backed claims",
  privacy_governance: "Added redaction-first public-safety checks before generating showcase copy",
  release_readiness: "Prepared the MVP for open-source release with smoke checks, docs, and package validation",
  retrieval_architecture: "Implemented retrieval/search architecture improvements",
  testing_validation: "Validated the project with tests, evaluations, or benchmarks",
  deployment: "Handled deployment, release, or cloud/runtime configuration",
  debugging_guardrails: "Fixed bugs or added reliability or permission guardrails",
  product_frontend: "Built product-facing UI or workflow improvements",
  data_persistence: "Implemented persistence, database, or migration work",
  observability: "Added logging, metrics, tracing, or observability",
  backend_api: "Implemented backend or API functionality",
  architecture_decision: "Made technical architecture or tradeoff decisions",
  product_demo: "Prepared visual demo or product walkthrough assets",
  contribution_boundary: "Documented contribution boundaries for team-safe project storytelling",
  manual_contribution: "Summarized personally owned contribution areas from manual notes"
};

const reviewerFacingValue: Record<string, string> = {
  data_engineering: "Shows data modeling and normalization work through schemas, adapters, and deterministic evidence records.",
  ai_engineering: "Shows practical AI workflow design: compact briefs, evidence IDs, claim verification, and token discipline.",
  project_management: "Demonstrates delivery planning through PRDs, task files, acceptance criteria, and explicit scope control.",
  cli_tooling: "Shows a runnable developer tool with local commands instead of a hosted service dependency.",
  static_showcase_export: "Connects the pipeline to recruiter-ready Markdown and HTML artifacts that can be linked or pasted.",
  privacy_governance: "Shows public-safety review before publication, including redaction and confirmation gates.",
  release_readiness: "Demonstrates readiness for npm/open-source sharing through repeatable smoke and package checks.",
  retrieval_architecture: "Highlights implemented retrieval/search architecture work with evidence of validation.",
  testing_validation: "Shows proof that the work was validated instead of only described.",
  deployment: "Demonstrates shipped or production-minded delivery work.",
  debugging_guardrails: "Shows reliability work, bug fixing, or guardrails that recruiters can understand quickly.",
  product_frontend: "Surfaces user-facing workflow improvements rather than generic UI work.",
  data_persistence: "Shows ownership of durable backend or data-layer changes.",
  observability: "Demonstrates operational maturity through monitoring or diagnostics.",
  backend_api: "Surfaces backend delivery work with clear technical scope.",
  architecture_decision: "Shows decision-making and tradeoff ownership, not only implementation.",
  product_demo: "Provides demo-ready proof that the project can be shown externally.",
  contribution_boundary: "Keeps team-project claims honest by stating ownership boundaries.",
  manual_contribution: "Useful only as supporting context and should not stand alone as proof."
};

export function proposeCandidateClaims(evidence: EvidenceItem[]): CandidateClaim[] {
  const grouped = new Map<string, EvidenceItem[]>();
  for (const item of evidence) {
    const keys = item.claim_hints.length > 0 ? item.claim_hints : [item.source_type];
    for (const key of keys) {
      const group = grouped.get(key) ?? [];
      group.push(item);
      grouped.set(key, group);
    }
  }

  const seeds: ClaimSeed[] = [...grouped.entries()]
    .map(([category, items]) => ({
      category,
      claim: categoryLabels[category] ?? buildFallbackClaim(category),
      outputs: outputsFor(category),
      reviewerValue: reviewerFacingValue[category] ?? "Provides a recruiter-readable summary of a concrete project contribution.",
      evidence: selectMinimalEvidence(items)
    }))
    .filter((seed) => seed.evidence.length > 0)
    .sort((left, right) => scoreEvidence(right.evidence) - scoreEvidence(left.evidence))
    .slice(0, 20);

  return seeds.map((seed, index) => buildClaim(seed, index));
}

function buildClaim(seed: ClaimSeed, index: number): CandidateClaim {
  const risks = [...new Set(seed.evidence.flatMap((item) => item.private_risk))].sort();
  const sourceTypes = [...new Set(seed.evidence.map((item) => item.source_type))].sort() as SourceType[];
  const confidence = scoreClaimConfidence(seed.evidence);
  const rewriteCandidate = buildPublicSafeRewrite(seed.claim, seed.evidence, risks);
  const gate = buildQualityGate({
    evidence: seed.evidence,
    risks,
    sourceTypes,
    confidence,
    reviewerValue: seed.reviewerValue,
    rewriteCandidate
  });
  const verified = gate.passed;

  return {
    id: `claim_${String(index + 1).padStart(4, "0")}`,
    claim: seed.claim,
    category: seed.category,
    evidence_ids: seed.evidence.map((item) => item.id),
    confidence,
    public_safe_rewrite: verified ? rewriteCandidate : "Unverified / needs user confirmation",
    risks,
    needs_user_confirmation: !verified,
    recommended_outputs: seed.outputs,
    verification_status: verified ? "verified" : "unverified",
    reviewer_facing_value: seed.reviewerValue,
    source_types: sourceTypes,
    quality_gate: gate
  };
}

function buildQualityGate(input: {
  evidence: EvidenceItem[];
  risks: string[];
  sourceTypes: SourceType[];
  confidence: number;
  reviewerValue: string;
  rewriteCandidate: string;
}): ClaimQualityGate {
  const manualOnly = input.evidence.every((item) => item.source_type === "manual_note");
  const safeRewrite = scanSensitiveText(input.rewriteCandidate);
  const hasEvidence = input.evidence.length > 0;
  const evidenceNotOnlySelfClaim = hasEvidence && !manualOnly;
  const sourceTypeClear = input.sourceTypes.length > 0;
  const noPrivateData = safeRewrite.risks.length === 0;
  const confidenceExists = Number.isFinite(input.confidence);
  const confidenceStrongEnough = confidenceExists && input.confidence >= 0.6;
  const publicSafeRewriteExists = input.rewriteCandidate.trim().length > 0;
  const reviewerFacingValue = input.reviewerValue.trim().length > 0;
  const failureReasons: string[] = [];

  if (!hasEvidence) failureReasons.push("missing_evidence");
  if (!evidenceNotOnlySelfClaim) failureReasons.push("self_authored_only_evidence");
  if (!sourceTypeClear) failureReasons.push("missing_source_type");
  if (!noPrivateData) failureReasons.push("raw_private_data_detected");
  if (!confidenceExists) failureReasons.push("missing_confidence");
  if (confidenceExists && !confidenceStrongEnough) failureReasons.push("low_confidence");
  if (!publicSafeRewriteExists) failureReasons.push("missing_public_safe_rewrite");
  if (!reviewerFacingValue) failureReasons.push("missing_reviewer_facing_value");

  return {
    has_evidence: hasEvidence,
    evidence_not_only_self_claim: evidenceNotOnlySelfClaim,
    source_type_clear: sourceTypeClear,
    no_private_data: noPrivateData,
    confidence_exists: confidenceExists,
    public_safe_rewrite_exists: publicSafeRewriteExists,
    reviewer_facing_value: reviewerFacingValue,
    passed: failureReasons.length === 0,
    failure_reasons: failureReasons
  };
}

function buildPublicSafeRewrite(claim: string, evidence: EvidenceItem[], risks: string[]): string {
  const scan = scanSensitiveText(claim);
  if (scan.risks.length > 0) {
    return scan.publicSafeText || "Rewrite needed before publishing.";
  }

  if (risks.length === 0) {
    return claim;
  }

  const hasValidation = evidence.some((item) => item.source_type === "test_log");
  if (hasValidation) {
    return `${claim} with public-safe terminology and validation evidence preserved.`;
  }

  return `${claim} using public-safe aliases instead of internal identifiers.`;
}

function selectMinimalEvidence(items: EvidenceItem[]): EvidenceItem[] {
  return [...items]
    .sort((left, right) => {
      const quality = claimEvidenceWeight(right) - claimEvidenceWeight(left);
      if (quality !== 0) return quality;
      return left.id.localeCompare(right.id);
    })
    .slice(0, 3);
}

function claimEvidenceWeight(item: EvidenceItem): number {
  const sourceBonus = item.source_type === "test_log" ? 1 : item.source_type === "git" ? 0.75 : item.source_type === "doc" ? 0.4 : 0;
  const safetyPenalty = item.private_risk.length > 0 ? 0.3 : 0;
  const manualPenalty = item.source_type === "manual_note" ? 1.5 : 0;
  return item.weight * item.confidence + sourceBonus - safetyPenalty - manualPenalty;
}

function scoreClaimConfidence(items: EvidenceItem[]): number {
  const weighted = scoreEvidence(items);
  const diversityBoost = new Set(items.map((item) => item.source_type)).size * 0.04;
  const validationBoost = items.some((item) => item.source_type === "test_log") ? 0.06 : 0;
  const manualPenalty = items.every((item) => item.source_type === "manual_note") ? 0.18 : 0;
  const riskPenalty = items.some((item) => item.private_risk.length > 0) ? 0.03 : 0;
  const raw = weighted / Math.max(items.length * 4, 1) + diversityBoost + validationBoost - manualPenalty - riskPenalty;
  return Number(Math.min(0.95, Math.max(0.35, raw)).toFixed(2));
}

function scoreEvidence(items: EvidenceItem[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.confidence, 0);
}

function outputsFor(category: string): RecommendedOutput[] {
  if (/architecture|retrieval|backend|data|ai_engineering|privacy/.test(category)) return ["case_study", "cv_bullet", "interview_story", "architecture_summary"];
  if (/test|deploy|observability|debug|release|cli|project_management/.test(category)) return ["case_study", "cv_bullet", "interview_story"];
  if (/product|demo|frontend|showcase/.test(category)) return ["case_study", "showcase_page", "cv_bullet", "interview_story"];
  return ["case_study", "interview_story"];
}

function buildFallbackClaim(category: string): string {
  return `Improved ${category.replaceAll("_", " ")} with evidence-backed implementation work`;
}
