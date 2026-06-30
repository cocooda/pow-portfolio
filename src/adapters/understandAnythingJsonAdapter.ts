import { EvidenceItem } from "../core/types.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

interface UnknownGraphItem {
  id?: string;
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  path?: string;
  file?: string;
  confidence?: number;
  type?: string;
}

export function adaptUnderstandAnythingJson(input: UnknownGraphItem[]): Omit<EvidenceItem, "id">[] {
  return input.slice(0, 200).map((item, index) => {
    const summary = item.summary ?? item.description ?? item.title ?? item.name ?? "Code graph item";
    const scan = scanSensitiveText(summary);
    const path = item.path ?? item.file;
    return {
      source_type: "code_graph",
      source_tool: "understand_anything_json_adapter",
      artifact_id: `understand-anything:${item.id ?? index}`,
      title: item.title ?? item.name ?? `Code graph item ${index + 1}`,
      summary,
      public_safe_excerpt: scan.redactedText.slice(0, 800),
      private_risk: scan.risks,
      confidence: typeof item.confidence === "number" ? item.confidence : 0.65,
      paths: path ? [path] : [],
      refs: path ? [{ label: "path", value: path }] : undefined,
      claim_hints: [item.type ?? "code_graph"],
      public_safe: scan.publicSafe,
      weight: 3
    };
  });
}
