import { EvidenceItem, PowConfig } from "../core/types.js";
import { runCommand } from "../core/commandUtils.js";
import { scanSensitiveText } from "../core/redactionScanner.js";

export function getGitBranch(repoPath: string): string | undefined {
  return runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"], repoPath)?.trim();
}

export function collectGitEvidence(repoPath: string, config: PowConfig): Omit<EvidenceItem, "id">[] {
  const format = "%H%x1f%ad%x1f%an%x1f%s";
  const raw = runCommand("git", ["log", `--max-count=${config.max_commits}`, "--date=short", `--pretty=format:${format}`, "--numstat"], repoPath);
  if (!raw) return [];

  const blocks = raw.split(/\n(?=[a-f0-9]{7,40}\x1f)/i).filter(Boolean);
  const items: Omit<EvidenceItem, "id">[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const [hash, date, author, subject] = (lines[0] ?? "").split("\x1f");
    if (!hash || !subject) continue;
    const paths = lines
      .slice(1)
      .map((line) => line.split("\t").at(-1) ?? "")
      .filter(Boolean)
      .slice(0, 20);

    const summary = `${subject}. Changed ${paths.length} file(s).`;
    const scan = scanSensitiveText(summary + "\n" + paths.join("\n"));
    const hints = inferGitHints(subject, paths);

    items.push({
      source_type: "git",
      source_tool: "git_adapter",
      artifact_id: `commit:${hash}`,
      title: `Commit ${hash.slice(0, 7)}: ${subject}`,
      summary,
      public_safe_excerpt: scan.redactedText.split("\n")[0] ?? subject,
      private_risk: scan.risks,
      confidence: 0.75,
      paths,
      refs: [
        { label: "commit", value: hash },
        { label: "author", value: author },
        { label: "date", value: date }
      ],
      commit: hash,
      date,
      claim_hints: hints,
      public_safe: scan.publicSafe,
      weight: 3
    });
  }

  return items;
}

function inferGitHints(subject: string, paths: string[]): string[] {
  const text = `${subject} ${paths.join(" ")}`.toLowerCase();
  const hints = new Set<string>();
  if (/evidence|collector|adapter|schema|normaliz|data quality/.test(text)) hints.add("data_engineering");
  if (/claim|brief|prompt|skill|agent|llm|token|portfolio compiler/.test(text)) hints.add("ai_engineering");
  if (/prd|roadmap|task|rubric|acceptance|dogfood|release checklist/.test(text)) hints.add("project_management");
  if (/src\/cli|src\/commands|package\.json|npm|npx|doctor|init|collect|export/.test(text)) hints.add("cli_tooling");
  if (/template|showcase_page|case_study|cv_bullets|interview_notes|html|static export/.test(text)) hints.add("static_showcase_export");
  if (/redaction|privacy|security|secret|sensitive|public-safe/.test(text)) hints.add("privacy_governance");
  if (/smoke|npm pack|package files|changelog|release readiness|qa/.test(text)) hints.add("release_readiness");
  if (/test|spec|coverage|pytest|vitest|jest/.test(text)) hints.add("testing_validation");
  if (/deploy|docker|render|vercel|ci|github action/.test(text)) hints.add("deployment");
  if (/fix|bug|hotfix|guard|quota|permission|auth/.test(text)) hints.add("debugging_guardrails");
  if (/\brag\b|retrieval\/search|retrieval ranking|retrieval pipeline|chunk|embedding|citation|\bsearch\b/.test(text)) hints.add("retrieval_architecture");
  if (/\bui\b|\bux\b|frontend|component|screen|onboarding/.test(text)) hints.add("product_frontend");
  if (/postgres|supabase|database|migration|alembic/.test(text)) hints.add("data_persistence");
  if (/logging|trace|observability|langfuse|metrics/.test(text)) hints.add("observability");
  return [...hints];
}
