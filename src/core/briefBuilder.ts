import { EvidenceMap } from "./types.js";

export function buildProjectBrief(map: EvidenceMap): string {
  const topEvidence = map.evidence.slice(0, 8).map((item) => `- ${item.id} [${item.source_type}] ${item.title}: ${item.summary}`).join("\n");
  const topClaims = map.claims.slice(0, 8).map((claim) => `- ${claim.id} (${claim.category}, ${claim.verification_status}, confidence ${claim.confidence}): ${claim.public_safe_rewrite}\n  Evidence: ${claim.evidence_ids.join(", ")}`).join("\n");

  return `# PROJECT_BRIEF\n\nProject: ${map.project.name}\nRoot: ${map.project.root}\nGenerated: ${map.generated_at}\n\n## What the tool found\n\n- Evidence items: ${map.evidence.length}\n- Candidate claims: ${map.claims.length}\n- Risk categories: ${map.risk_summary.risk_categories.join(", ") || "none detected"}\n\n## Top evidence\n\n${topEvidence || "No evidence collected yet."}\n\n## Top candidate claims\n\n${topClaims || "No candidate claims generated yet."}\n`;
}

export function buildEvidenceBrief(map: EvidenceMap): string {
  const blocks = map.evidence.slice(0, 20).map((item) => {
    const refs = item.refs?.slice(0, 4).map((ref) => `${ref.label}: ${ref.value}`).join("; ") || "none";
    return `## ${item.id}: ${item.title}\n\n- Source: ${item.source_type} via ${item.source_tool}\n- Summary: ${item.summary}\n- Public-safe excerpt: ${item.public_safe_excerpt.slice(0, 320).replaceAll("\n", " ")}\n- Claim hints: ${item.claim_hints.join(", ") || "none"}\n- Paths: ${item.paths.join(", ") || "none"}\n- Refs: ${refs}\n- Risks: ${item.private_risk.join(", ") || "none"}\n- Confidence: ${item.confidence}\n`;
  });

  return `# EVIDENCE_BRIEF\n\nRead this after PROJECT_BRIEF and before opening .pow/evidence/EVIDENCE_MAP.json. Use the full evidence map only when a claim needs deeper verification.\n\n${blocks.join("\n") || "No evidence collected yet."}\n`;
}

export function buildClaimBrief(map: EvidenceMap): string {
  const blocks = map.claims.map((claim) => {
    const evidence = claim.evidence_ids
      .map((id) => map.evidence.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => `  - ${item!.id} [${item!.source_type}/${item!.source_tool}] ${item!.title}\n    Why relevant: ${item!.summary}\n    Public-safe excerpt: ${item!.public_safe_excerpt.slice(0, 360).replaceAll("\n", " ")}`)
      .join("\n");
    return `## ${claim.id}: ${claim.public_safe_rewrite}\n\n- Verification status: ${claim.verification_status}\n- Category: ${claim.category}\n- Source types: ${claim.source_types.join(", ") || "unknown"}\n- Evidence IDs: ${claim.evidence_ids.join(", ")}\n- Confidence: ${claim.confidence}\n- Needs user confirmation: ${claim.needs_user_confirmation}\n- Risks: ${claim.risks.join(", ") || "none"}\n- Reviewer-facing value: ${claim.reviewer_facing_value}\n- Recommended outputs: ${claim.recommended_outputs.join(", ")}\n- Quality gate: ${claim.quality_gate.passed ? "passed" : `failed (${claim.quality_gate.failure_reasons.join(", ")})`}\n\nEvidence:\n${evidence}\n`;
  });
  return `# CLAIM_BRIEF\n\nEvery public claim must cite evidence IDs. Claims marked as needing confirmation should not be published as final facts without user review.\n\n${blocks.join("\n")}`;
}

export function buildRedactionBrief(map: EvidenceMap): string {
  const risky = map.evidence.filter((item) => item.private_risk.length > 0 || !item.public_safe);
  const rows = risky.map((item) => `- ${item.id} ${item.title}\n  - Sensitivity: ${item.sensitivity ?? "unknown"}\n  - Risks: ${item.private_risk.join(", ")}\n  - Paths: ${item.paths.join(", ")}\n  - Suggested action: redact, alias, abstract, or exclude from public output.`).join("\n");

  return `# REDACTION_BRIEF\n\nThis is a public-safety review aid, not legal advice. Review all risky evidence before publishing.\n\n## Risk summary\n\n- Total risk signals: ${map.risk_summary.total_risks}\n- Categories: ${map.risk_summary.risk_categories.join(", ") || "none detected"}\n\n## Risky evidence\n\n${rows || "No obvious risks detected by the basic scanner."}\n\n## Default redaction rules\n\n- Replace customer/client/org names with public-safe aliases.\n- Remove secrets, internal URLs, emails, tokens, private repo names.\n- Do not publish raw source, raw prompts, private schemas, or exact proprietary implementation details.\n`;
}
