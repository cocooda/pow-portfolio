import { basename, relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { readText, safeStat, walkFiles } from "../core/fsUtils.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

const testLogRegex = /(test|pytest|vitest|jest|coverage|benchmark|eval|result|report).*(\.log|\.txt|\.md|\.json)$/i;

export function collectTestEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const files = walkFiles(repoPath, { ignore: config.ignore, maxFiles: 5000 })
    .map((abs) => ({ abs, rel: relative(repoPath, abs).replaceAll("\\", "/") }))
    .filter(({ rel }) => testLogRegex.test(rel) || /(^|\/)(tests?|__tests__)\//i.test(rel))
    .slice(0, 50);

  return files.map(({ abs, rel }) => {
    const stat = safeStat(abs);
    const text = isLikelyText(rel, stat?.size ?? 0) ? readText(abs).slice(0, 1400) : `${rel} (${stat?.size ?? 0} bytes)`;
    const scan = scanSensitiveText(text);
    const metricHints = extractMetricHints(text);

    return {
      source_type: "test_log",
      source_tool: "test_log_adapter",
      artifact_id: `test:${rel}`,
      title: `Validation evidence: ${basename(rel)}`,
      summary: metricHints.length ? `Detected validation signals: ${metricHints.join("; ")}` : `Detected test or validation artifact ${rel}.`,
      public_safe_excerpt: scan.redactedText.slice(0, 900),
      private_risk: scan.risks,
      confidence: 0.78,
      paths: [rel],
      refs: [{ label: "path", value: rel }],
      claim_hints: ["testing_validation"],
      public_safe: scan.publicSafe,
      weight: 4
    };
  });
}

function isLikelyText(path: string, size: number): boolean {
  return size < 250_000 && /\.(log|txt|md|json|xml|yaml|yml|out)$/i.test(path);
}

function extractMetricHints(text: string): string[] {
  const hints: string[] = [];
  const patterns = [/\d+\s+passed/gi, /coverage[:\s]+\d+/gi, /accuracy[:\s]+[\d.]+/gi, /latency[:\s]+[\d.]+/gi, /hit[_-]?rate[:\s]+[\d.]+/gi];
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[0];
    if (match) hints.push(match);
  }
  return hints.slice(0, 5);
}
