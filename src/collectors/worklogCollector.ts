import { join, relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { exists, readText } from "../core/fsUtils.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

export function collectWorklogEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const manualNotesPath = join(repoPath, config.manual_notes_path);
  if (!exists(manualNotesPath)) return [];

  const rel = relative(repoPath, manualNotesPath).replaceAll("\\", "/");
  const text = readText(manualNotesPath).slice(0, config.max_doc_excerpt_chars);
  const scan = scanSensitiveText(text);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  return [
    {
      source_type: "manual_note",
      source_tool: "worklog_adapter",
      artifact_id: `manual:${rel}`,
      title: "Manual contribution notes",
      summary: "User-authored role, contribution, and demo notes for claim verification.",
      public_safe_excerpt: scan.redactedText.slice(0, 900),
      private_risk: scan.risks,
      confidence: 0.84,
      paths: [rel],
      refs: [
        { label: "path", value: rel },
        ...lines.slice(0, 3).map((line, index) => ({ label: `line_hint_${index + 1}`, value: line }))
      ],
      claim_hints: inferManualHints(text),
      public_safe: scan.publicSafe,
      weight: 5
    }
  ];
}

function inferManualHints(text: string): string[] {
  const lower = text.toLowerCase();
  const hints = new Set<string>(["manual_contribution"]);
  if (/role|owned|ownership|contribution/.test(lower)) hints.add("contribution_boundary");
  if (/demo|screenshot|caption|walkthrough/.test(lower)) hints.add("product_demo");
  if (/architecture|design|tradeoff/.test(lower)) hints.add("architecture_decision");
  return [...hints];
}
