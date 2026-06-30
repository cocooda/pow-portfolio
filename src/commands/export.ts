import { join } from "node:path";
import { readJson, exists } from "../core/fsUtils.js";
import { EvidenceMap } from "../core/types.js";
import { exportMarkdown } from "../exporters/markdownExporter.js";
import { exportHtml } from "../exporters/htmlExporter.js";

export function exportCommand(cwd: string): void {
  const evidencePath = join(cwd, ".pow", "evidence", "EVIDENCE_MAP.json");
  if (!exists(evidencePath)) {
    throw new Error("Missing evidence map. Run collect first.");
  }
  const map = readJson<EvidenceMap>(evidencePath);
  const outDir = join(cwd, ".pow", "dist");
  exportMarkdown(map, outDir);
  exportHtml(map, outDir);
  console.log("Wrote .pow/dist/CASE_STUDY.md");
  console.log("Wrote .pow/dist/SHOWCASE_BRIEF.md");
  console.log("Wrote .pow/dist/PAGE_CONTENT.md");
  console.log("Wrote .pow/dist/CV_BULLETS.md");
  console.log("Wrote .pow/dist/INTERVIEW_NOTES.md");
  console.log("Wrote .pow/dist/SHOWCASE_PAGE.html");
}
