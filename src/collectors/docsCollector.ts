import { basename, relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { readText, walkFiles } from "../core/fsUtils.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

const docRegex = /(^|\/)(README|CHANGELOG|RELEASE|PRODUCT|SPEC|DESIGN|ARCHITECTURE|ROADMAP|TASKS|WORKLOG|JOURNAL)[^/]*\.md$|\/(docs|tasks)\/.*\.md$/i;

export function collectDocsEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const files = walkFiles(repoPath, { ignore: config.ignore, maxFiles: 3000 })
    .map((abs) => ({ abs, rel: relative(repoPath, abs).replaceAll("\\", "/") }))
    .filter(({ rel }) => docRegex.test(rel))
    .slice(0, 60);

  return files.map(({ abs, rel }) => {
    const text = readText(abs).slice(0, config.max_doc_excerpt_chars);
    const headings = extractHeadings(text).slice(0, 12);
    const scan = scanSensitiveText(text);
    const title = `${basename(rel)} documentation evidence`;

    return {
      source_type: rel.toLowerCase().includes("worklog") || rel.toLowerCase().includes("journal") ? "worklog" : "doc",
      source_tool: rel.toLowerCase().includes("worklog") || rel.toLowerCase().includes("journal") ? "worklog_adapter" : "readme_docs_adapter",
      artifact_id: `doc:${rel}`,
      title,
      summary: headings.length > 0 ? `Contains headings: ${headings.join("; ")}` : `Documentation file ${rel}.`,
      public_safe_excerpt: scan.redactedText.slice(0, 1200),
      private_risk: scan.risks,
      confidence: 0.72,
      paths: [rel],
      refs: [{ label: "path", value: rel }],
      claim_hints: inferDocHints(text + " " + rel),
      public_safe: scan.publicSafe,
      weight: rel.toLowerCase().includes("worklog") ? 4 : 3
    };
  });
}

function extractHeadings(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => line.replace(/^#{1,4}\s+/, "").trim());
}

function inferDocHints(text: string): string[] {
  const lower = text.toLowerCase();
  const hints = new Set<string>();
  if (/evidence adapter|evidence map|normaliz|schema|jsonl|data quality|collector|adapter contract/.test(lower)) hints.add("data_engineering");
  if (/claim-first|token|llm|agent|prompt|brief|hallucination|raw source|evidence verification/.test(lower)) hints.add("ai_engineering");
  if (/prd|roadmap|task|acceptance criteria|rubric|scope|non-goal|release checklist|dogfood/.test(lower)) hints.add("project_management");
  if (/npm|npx|cli|command|doctor|init|collect|export/.test(lower)) hints.add("cli_tooling");
  if (/showcase_page|showcase page|static html|case study|cv bullet|interview notes|page_content|template/.test(lower)) hints.add("static_showcase_export");
  if (/redaction|public-safe|privacy|secret|sensitive|contribution boundar/.test(lower)) hints.add("privacy_governance");
  if (/smoke|npm pack|package files|changelog|release readiness|qa|quickstart/.test(lower)) hints.add("release_readiness");
  if (/architecture|design|tradeoff|decision/.test(lower)) hints.add("architecture_decision");
  if (/test|coverage|eval|benchmark|metric/.test(lower)) hints.add("testing_validation");
  if (/deploy|render|vercel|docker|cloud/.test(lower)) hints.add("deployment");
  if (/\brag\b|embedding|chunk|citation|\bsearch\b|retrieval\/search|retrieval ranking|retrieval pipeline/.test(lower)) hints.add("retrieval_architecture");
  if (/bug|fix|blocker|issue|incident|hotfix/.test(lower)) hints.add("debugging_guardrails");
  if (/\bux\b|\bui\b|frontend|component|screen|onboarding/.test(lower)) hints.add("product_frontend");
  return [...hints];
}
