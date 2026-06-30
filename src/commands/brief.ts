import { join } from "node:path";
import { readJson, writeText, exists } from "../core/fsUtils.js";
import { EvidenceMap } from "../core/types.js";
import { buildClaimBrief, buildEvidenceBrief, buildProjectBrief, buildRedactionBrief } from "../core/briefBuilder.js";

export function briefCommand(cwd: string): void {
  const evidencePath = join(cwd, ".pow", "evidence", "EVIDENCE_MAP.json");
  if (!exists(evidencePath)) {
    throw new Error("Missing .pow/evidence/EVIDENCE_MAP.json. Run `pow-portfolio collect --repo .` first.");
  }
  const map = readJson<EvidenceMap>(evidencePath);
  writeText(join(cwd, ".pow", "briefs", "PROJECT_BRIEF.md"), buildProjectBrief(map));
  writeText(join(cwd, ".pow", "briefs", "EVIDENCE_BRIEF.md"), buildEvidenceBrief(map));
  writeText(join(cwd, ".pow", "briefs", "CLAIM_BRIEF.md"), buildClaimBrief(map));
  writeText(join(cwd, ".pow", "briefs", "REDACTION_BRIEF.md"), buildRedactionBrief(map));
  console.log("Wrote .pow/briefs/PROJECT_BRIEF.md");
  console.log("Wrote .pow/briefs/EVIDENCE_BRIEF.md");
  console.log("Wrote .pow/briefs/CLAIM_BRIEF.md");
  console.log("Wrote .pow/briefs/REDACTION_BRIEF.md");
}
