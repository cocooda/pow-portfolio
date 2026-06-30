import { basename, join } from "node:path";
import { loadConfig, resolveRepoPath } from "../core/config.js";
import { buildRiskSummary, normalizeEvidence } from "../core/evidenceMap.js";
import { exists, readJson, writeJson } from "../core/fsUtils.js";
import { getGitBranch, collectGitEvidence } from "../collectors/gitCollector.js";
import { collectFileTreeEvidence } from "../collectors/fileTreeCollector.js";
import { collectDocsEvidence } from "../collectors/docsCollector.js";
import { collectTestEvidence } from "../collectors/testCollector.js";
import { collectDeployEvidence } from "../collectors/deployCollector.js";
import { collectScreenshotEvidence } from "../collectors/screenshotCollector.js";
import { collectWorklogEvidence } from "../collectors/worklogCollector.js";
import { proposeCandidateClaims } from "../core/claimScorer.js";
import { EvidenceMap } from "../core/types.js";
import { adaptUnderstandAnythingJson } from "../adapters/understandAnythingJsonAdapter.js";

export function collectCommand(cwd: string, flags: Record<string, string | boolean>): void {
  const repoPath = resolveRepoPath(cwd, typeof flags.repo === "string" ? flags.repo : undefined);
  const config = loadConfig(cwd);
  config.repo_path = repoPath;

  const rawEvidence = [
    ...collectGitEvidence(repoPath, config),
    ...collectFileTreeEvidence(repoPath, config),
    ...collectDocsEvidence(repoPath, config),
    ...collectWorklogEvidence(repoPath, config),
    ...collectTestEvidence(repoPath, config),
    ...collectDeployEvidence(repoPath, config),
    ...collectScreenshotEvidence(repoPath, config),
    ...collectUnderstandAnythingEvidence(cwd)
  ];

  const evidence = normalizeEvidence(rawEvidence);
  const claims = proposeCandidateClaims(evidence);
  const map: EvidenceMap = {
    schema_version: "0.1",
    generated_at: new Date().toISOString(),
    project: {
      root: repoPath,
      name: config.project_name || basename(repoPath),
      git_branch: getGitBranch(repoPath),
      git_remote_public_safe: false
    },
    evidence,
    claims,
    risk_summary: buildRiskSummary(evidence)
  };

  const outPath = join(cwd, ".pow", "evidence", "EVIDENCE_MAP.json");
  writeJson(outPath, map);
  console.log(`Collected ${evidence.length} evidence item(s) and ${claims.length} candidate claim(s).`);
  console.log(`Wrote ${outPath}`);
}

function collectUnderstandAnythingEvidence(cwd: string) {
  const importPath = join(cwd, ".pow", "evidence", "imports", "understand-anything.json");
  if (!exists(importPath)) return [];

  try {
    const input = readJson<unknown>(importPath);
    return Array.isArray(input) ? adaptUnderstandAnythingJson(input) : [];
  } catch {
    return [];
  }
}
