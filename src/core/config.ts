import { join, resolve } from "node:path";
import { PowConfig } from "./types.js";
import { exists, readJson, writeJson } from "./fsUtils.js";

export function defaultConfig(repoPath: string): PowConfig {
  return {
    project_name: repoPath.split(/[\\/]/).filter(Boolean).pop() ?? "local-project",
    repo_path: repoPath,
    output_dir: ".pow/dist",
    manual_notes_path: ".pow/manual_notes.md",
    screenshots_dir: "screenshots",
    max_commits: 80,
    max_doc_excerpt_chars: 2200,
    public_aliases: {},
    ignore: [
      ".git",
      ".pow",
      ".pow/dist",
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      "vendor",
      "__pycache__",
      ".venv",
      "venv",
      ".env"
    ],
    token_budget: {
      discovery_max_tokens: 8000,
      evidence_verification_max_tokens_per_claim: 1500,
      final_case_study_max_tokens: 6000,
      never_do: [
        "paste entire source files unless requested",
        "summarize whole repo before claim selection",
        "include raw secrets or internal identifiers",
        "claim ownership without contribution evidence"
      ]
    }
  };
}

export function loadConfig(cwd: string): PowConfig {
  const path = join(cwd, ".pow", "config.json");
  if (!exists(path)) return defaultConfig(cwd);
  return readJson<PowConfig>(path);
}

export function saveConfig(cwd: string, config: PowConfig): void {
  writeJson(join(cwd, ".pow", "config.json"), config);
}

export function resolveRepoPath(cwd: string, repoArg?: string): string {
  return resolve(cwd, repoArg ?? loadConfig(cwd).repo_path ?? ".");
}
