import { EvidenceItem, EvidenceMap, SensitivityLevel } from "./types.js";

export function makeEvidenceId(index: number): string {
  return `ev_${String(index + 1).padStart(4, "0")}`;
}

export function normalizeEvidence(items: Omit<EvidenceItem, "id">[]): EvidenceItem[] {
  return [...items]
    .sort((left, right) =>
      [
        left.source_type,
        left.source_tool,
        left.artifact_id,
        left.title
      ].join("\u0000").localeCompare(
        [right.source_type, right.source_tool, right.artifact_id, right.title].join("\u0000")
      )
    )
    .map((item, index) => ({
      ...item,
      id: makeEvidenceId(index),
      sensitivity: item.sensitivity ?? deriveSensitivity(item.private_risk, item.public_safe)
    }));
}

export function buildRiskSummary(evidence: EvidenceItem[]): EvidenceMap["risk_summary"] {
  const categories = new Set<string>();
  let total = 0;
  for (const item of evidence) {
    total += item.private_risk.length;
    for (const risk of item.private_risk) categories.add(risk);
  }
  return { total_risks: total, risk_categories: [...categories].sort() };
}

function deriveSensitivity(risks: string[], publicSafe: boolean): SensitivityLevel {
  if (risks.length === 0) return publicSafe ? "public" : "unknown";
  if (risks.some((risk) => /secrets|personally_identifiable|database_schema|proprietary|exact_prompts/.test(risk))) {
    return "sensitive";
  }
  return "internal";
}
