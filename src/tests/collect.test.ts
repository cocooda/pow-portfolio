import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { initCommand } from "../commands/init.js";
import { collectCommand } from "../commands/collect.js";
import { readJson } from "../core/fsUtils.js";
import { EvidenceMap } from "../core/types.js";

function setupRepo(): string {
  const repoDir = mkdtempSync(join(tmpdir(), "pow-portfolio-task02-"));

  writeFileSync(join(repoDir, "README.md"), "# Demo Repo\n\n## Architecture\n\nA local-first showcase compiler.\n", "utf8");
  mkdirSync(join(repoDir, "docs"), { recursive: true });
  writeFileSync(join(repoDir, "docs", "WORKLOG.md"), "# Worklog\n\n## Decisions\n\n- Added deterministic evidence collection.\n", "utf8");
  writeFileSync(join(repoDir, "test-results.log"), "12 passed\ncoverage: 94\n", "utf8");
  writeFileSync(join(repoDir, "vercel.json"), "{\n  \"framework\": \"nextjs\"\n}\n", "utf8");
  mkdirSync(join(repoDir, "screenshots"), { recursive: true });
  writeFileSync(join(repoDir, "screenshots", "demo.png"), "fake png screenshot", "utf8");

  execFileSync("git", ["init"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "task02@example.com"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Task 02"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "seed repo"], { cwd: repoDir, stdio: "ignore" });

  return repoDir;
}

test("init creates import workspace and collect emits normalized evidence from all MVP adapters", () => {
  const repoDir = setupRepo();

  try {
    initCommand(repoDir, { force: true });

    assert.equal(existsSync(join(repoDir, ".pow", "evidence", "imports")), true);

    writeFileSync(
      join(repoDir, ".pow", "manual_notes.md"),
      "# Manual Contribution Notes\n\n## My role\n\n- Owned the local-first CLI.\n\n## Demo transcript / screenshots captions\n\n- screenshots/demo.png: Overview of the collection flow.\n",
      "utf8"
    );
    writeFileSync(
      join(repoDir, ".pow", "evidence", "imports", "understand-anything.json"),
      JSON.stringify([
        {
          id: "graph-node-1",
          title: "Retrieval flow",
          summary: "Summarizes retrieval orchestration without exposing source.",
          path: "src/retrieval.ts",
          confidence: 0.88,
          type: "retrieval_architecture"
        }
      ]),
      "utf8"
    );

    collectCommand(repoDir, { repo: "." });

    const map = readJson<EvidenceMap>(join(repoDir, ".pow", "evidence", "EVIDENCE_MAP.json"));
    const tools = new Set(map.evidence.map((item) => item.source_tool));

    assert.equal(tools.has("git_adapter"), true);
    assert.equal(tools.has("readme_docs_adapter"), true);
    assert.equal(tools.has("worklog_adapter"), true);
    assert.equal(tools.has("test_log_adapter"), true);
    assert.equal(tools.has("manual_screenshot_adapter"), true);
    assert.equal(tools.has("deploy_config_adapter"), true);
    assert.equal(tools.has("understand_anything_json_adapter"), true);

    const manualEvidence = map.evidence.find((item) => item.artifact_id === "manual:.pow/manual_notes.md");
    assert.ok(manualEvidence);

    const gitEvidence = map.evidence.find((item) => item.source_tool === "git_adapter");
    assert.ok(gitEvidence?.refs?.some((ref) => ref.label === "commit"));
  } finally {
    rmSync(repoDir, { recursive: true, force: true });
  }
});
