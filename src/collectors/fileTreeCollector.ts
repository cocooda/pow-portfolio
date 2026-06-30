import { relative } from "node:path";
import { EvidenceItem, PowConfig } from "../core/types.js";
import { walkFiles } from "../core/fsUtils.js";

export function collectFileTreeEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const files = walkFiles(repoPath, { ignore: config.ignore, maxFiles: 2000 });
  const rels = files.map((f) => relative(repoPath, f).replaceAll("\\", "/"));
  const topDirs = countTopDirs(rels);
  const interesting = rels.filter((p) => /^(src|app|frontend|backend|api|server|client|tests|docs|infra|scripts|alembic|migrations)\//.test(p)).slice(0, 120);

  return [
    {
      source_type: "file_tree",
      source_tool: "file_tree_adapter",
      artifact_id: "file_tree:repo_structure",
      title: "Repository structure summary",
      summary: `Detected ${rels.length} files. Main top-level areas: ${topDirs.slice(0, 8).map(([k, v]) => `${k} (${v})`).join(", ")}.`,
      public_safe_excerpt: interesting.slice(0, 40).join("\n"),
      private_risk: [],
      confidence: 0.7,
      paths: interesting,
      refs: topDirs.slice(0, 8).map(([name, count]) => ({ label: "top_level_area", value: `${name}:${count}` })),
      claim_hints: inferTreeHints(rels),
      public_safe: true,
      weight: 2
    }
  ];
}

function countTopDirs(paths: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const p of paths) {
    const key = p.includes("/") ? p.split("/")[0] : "root";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function inferTreeHints(paths: string[]): string[] {
  const text = paths.join(" ").toLowerCase();
  const hints = new Set<string>();
  if (/schemas\/|evidence|collector|adapter/.test(text)) hints.add("data_engineering");
  if (/skill\/|prompt|brief|agent|claimscorer|portfoliocompiler/.test(text)) hints.add("ai_engineering");
  if (/docs\/tasks|prd|roadmap|agent\.md/.test(text)) hints.add("project_management");
  if (/src\/cli|src\/commands|package\.json/.test(text)) hints.add("cli_tooling");
  if (/templates\/|showcase_page|case_study|cv_bullets|interview_notes|html/.test(text)) hints.add("static_showcase_export");
  if (/redaction|security|privacy/.test(text)) hints.add("privacy_governance");
  if (/test|spec|coverage/.test(text)) hints.add("testing_validation");
  if (/docker|vercel|render|github\/workflows|ci/.test(text)) hints.add("deployment");
  if (/frontend|react|vite|component/.test(text)) hints.add("product_frontend");
  if (/backend|fastapi|api|server|routes/.test(text)) hints.add("backend_api");
  if (/migration|postgres|supabase|database/.test(text)) hints.add("data_persistence");
  return [...hints];
}
