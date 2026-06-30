import { relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { readText, walkFiles } from "../core/fsUtils.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

const deployRegex = /(^|\/)(Dockerfile|docker-compose\.ya?ml|render\.ya?ml|vercel\.json|netlify\.toml|fly\.toml|railway\.json|Procfile|\.github\/workflows\/.*\.ya?ml)$/i;

export function collectDeployEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const files = walkFiles(repoPath, { ignore: config.ignore, maxFiles: 5000 })
    .map((abs) => ({ abs, rel: relative(repoPath, abs).replaceAll("\\", "/") }))
    .filter(({ rel }) => deployRegex.test(rel))
    .slice(0, 40);

  return files.map(({ abs, rel }) => {
    const text = readText(abs).slice(0, 1200);
    const scan = scanSensitiveText(text);
    return {
      source_type: "deploy_config",
      source_tool: "deploy_config_adapter",
      artifact_id: `deploy:${rel}`,
      title: `Deployment/config evidence: ${rel}`,
      summary: `Detected deployment or CI configuration at ${rel}.`,
      public_safe_excerpt: scan.redactedText.slice(0, 800),
      private_risk: scan.risks,
      confidence: 0.8,
      paths: [rel],
      refs: [{ label: "path", value: rel }],
      claim_hints: ["deployment"],
      public_safe: scan.publicSafe,
      weight: 4
    };
  });
}
