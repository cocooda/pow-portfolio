import { relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { safeStat, walkFiles } from "../core/fsUtils.js";

const imageRegex = /\.(png|jpe?g|webp|gif|svg)$/i;

export function collectScreenshotEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const files = walkFiles(repoPath, { ignore: config.ignore, maxFiles: 5000 })
    .map((abs) => ({ abs, rel: relative(repoPath, abs).replaceAll("\\", "/") }))
    .filter(({ rel }) => imageRegex.test(rel) && /screenshot|demo|portfolio|docs|assets|public/i.test(rel))
    .slice(0, 40);

  return files.map(({ abs, rel }) => {
    const stat = safeStat(abs);
    return {
      source_type: "screenshot",
      source_tool: "manual_screenshot_adapter",
      artifact_id: `screenshot:${rel}`,
      title: `Screenshot/demo visual: ${rel}`,
      summary: `Detected visual artifact ${rel}${stat ? ` (${stat.size} bytes)` : ""}. Add a manual caption for stronger portfolio evidence.`,
      public_safe_excerpt: `[Screenshot path only] ${rel}`,
      private_risk: [],
      confidence: 0.55,
      paths: [rel],
      refs: [{ label: "path", value: rel }],
      claim_hints: ["product_demo"],
      public_safe: true,
      weight: 2
    };
  });
}
