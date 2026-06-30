import { join } from "node:path";
import { EvidenceMap } from "../core/types.js";
import { ensureDir, writeText } from "../core/fsUtils.js";
import { compileCaseStudy, compileCvBullets, compileInterviewNotes, compilePageContent, compileShowcaseBrief } from "../core/portfolioCompiler.js";

export function exportMarkdown(map: EvidenceMap, outDir: string): void {
  ensureDir(outDir);
  writeText(join(outDir, "CASE_STUDY.md"), compileCaseStudy(map));
  writeText(join(outDir, "SHOWCASE_BRIEF.md"), compileShowcaseBrief(map));
  writeText(join(outDir, "PAGE_CONTENT.md"), compilePageContent(map));
  writeText(join(outDir, "CV_BULLETS.md"), compileCvBullets(map));
  writeText(join(outDir, "INTERVIEW_NOTES.md"), compileInterviewNotes(map));
}
