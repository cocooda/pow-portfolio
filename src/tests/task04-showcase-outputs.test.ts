import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { initCommand } from "../commands/init.js";
import { collectCommand } from "../commands/collect.js";
import { briefCommand } from "../commands/brief.js";
import { promptCommand } from "../commands/prompt.js";
import { exportCommand } from "../commands/export.js";
import { proposeCandidateClaims } from "../core/claimScorer.js";
import { buildShowcaseModel, compileCvBullets } from "../core/portfolioCompiler.js";
import { EvidenceItem, EvidenceMap } from "../core/types.js";

function setupRepo(): string {
  const repoDir = mkdtempSync(join(tmpdir(), "pow-portfolio-task04-"));

  writeFileSync(
    join(repoDir, "README.md"),
    [
      "# Showcase Compiler",
      "",
      "## Problem",
      "",
      "Private-project developers need a recruiter-readable case study without publishing source.",
      "",
      "## Architecture",
      "",
      "TypeScript CLI with evidence collection, brief generation, and showcase export.",
      "",
      "## Validation",
      "",
      "See test-results.log for smoke coverage and build checks."
    ].join("\n"),
    "utf8"
  );

  mkdirSync(join(repoDir, "docs"), { recursive: true });
  writeFileSync(
    join(repoDir, "docs", "ARCHITECTURE.md"),
    [
      "# Architecture",
      "",
      "## Context",
      "",
      "- Local-first only",
      "- Redaction before narrative generation",
      "",
      "## Decisions",
      "",
      "- Use evidence IDs instead of raw source in outputs",
      "- Keep SHOWCASE_PAGE.html static and local-openable"
    ].join("\n"),
    "utf8"
  );

  writeFileSync(
    join(repoDir, "test-results.log"),
    [
      "14 passed",
      "coverage: 96",
      "latency: 118"
    ].join("\n"),
    "utf8"
  );

  writeFileSync(
    join(repoDir, "vercel.json"),
    JSON.stringify({ framework: "nextjs" }, null, 2),
    "utf8"
  );

  mkdirSync(join(repoDir, "screenshots"), { recursive: true });
  writeFileSync(join(repoDir, "screenshots", "demo.png"), "fake png screenshot", "utf8");

  execFileSync("git", ["init"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "task04@example.com"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Task 04"], { cwd: repoDir, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: repoDir, stdio: "ignore" });
  execFileSync(
    "git",
    ["commit", "-m", "add showcase compiler with tests and static export"],
    { cwd: repoDir, stdio: "ignore" }
  );

  return repoDir;
}

test("Task 04 brief, prompt, and export commands generate showcase-ready artifacts", () => {
  const repoDir = setupRepo();

  try {
    initCommand(repoDir, { force: true });

    writeFileSync(
      join(repoDir, ".pow", "manual_notes.md"),
      [
        "# Manual Contribution Notes",
        "",
        "## My role",
        "",
        "- Owned the CLI workflow, export scaffolding, and recruiter-safe copy generation.",
        "",
        "## Contribution boundaries",
        "",
        "- I owned the evidence pipeline and exporter implementation.",
        "- Do not claim teammate-owned branding or growth experiments.",
        "",
        "## Public aliases",
        "",
        "- stealth-monorepo-private -> Showcase Compiler",
        "",
        "## Demo transcript / screenshots captions",
        "",
        "- screenshots/demo.png: Export preview with proof highlights and evidence appendix.",
        "- internal dashboard: https://portal.corp.example.internal/admin"
      ].join("\n"),
      "utf8"
    );

    collectCommand(repoDir, { repo: "." });
    briefCommand(repoDir);
    promptCommand(repoDir, "codex");
    exportCommand(repoDir);

    const evidenceBriefPath = join(repoDir, ".pow", "briefs", "EVIDENCE_BRIEF.md");
    const promptPath = join(repoDir, ".pow", "skill", "prompts", "codex_showcase_prompt.md");
    const caseStudyPath = join(repoDir, ".pow", "dist", "CASE_STUDY.md");
    const htmlPath = join(repoDir, ".pow", "dist", "SHOWCASE_PAGE.html");
    const cvBulletsPath = join(repoDir, ".pow", "dist", "CV_BULLETS.md");

    assert.equal(existsSync(evidenceBriefPath), true);
    assert.equal(existsSync(promptPath), true);
    assert.equal(existsSync(caseStudyPath), true);
    assert.equal(existsSync(htmlPath), true);
    assert.equal(existsSync(cvBulletsPath), true);

    const evidenceBrief = readFileSync(evidenceBriefPath, "utf8");
    const prompt = readFileSync(promptPath, "utf8");
    const caseStudy = readFileSync(caseStudyPath, "utf8");
    const html = readFileSync(htmlPath, "utf8");
    const cvBullets = readFileSync(cvBulletsPath, "utf8");

    assert.match(evidenceBrief, /# EVIDENCE_BRIEF/i);
    assert.match(evidenceBrief, /Public-safe excerpt/i);
    assert.match(prompt, /read \.pow\/briefs first/i);
    assert.match(prompt, /use \.pow\/evidence only when a claim needs verification/i);
    assert.match(prompt, /do not read full source files unless required/i);
    assert.match(prompt, /every claim must map to evidence/i);
    assert.match(prompt, /needs_user_confirmation/i);
    assert.match(prompt, /redact secrets, client names, internal URLs, private repo names/i);
    assert.match(prompt, /output to \.pow\/dist/i);

    for (const requiredHeading of [
      "## Project Title + One-Line Value Proposition",
      "## Problem / User Pain Point",
      "## Context & Constraints",
      "## My Role and Contribution Boundary",
      "## Architecture Overview",
      "## Evidence-Backed Technical Claims",
      "## Key Decisions & Trade-Offs",
      "## Validation / Tests / Metrics / Demo Evidence",
      "## Timeline / Milestones",
      "## What I Would Improve Next",
      "## Public-Safe Evidence Appendix",
      "## Links"
    ]) {
      assert.match(caseStudy, new RegExp(requiredHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
      const htmlHeading = requiredHeading
        .replace(/^##\s+/, "")
        .replace(/&/g, "__AMP__")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/__AMP__/g, "(?:&|&amp;)");
      assert.match(html, new RegExp(htmlHeading, "i"));
    }

    assert.match(caseStudy, /claim_\d+/i);
    assert.match(caseStudy, /ev_\d+/i);
    assert.match(cvBullets, /Evidence: ev_\d+/i);
    assert.equal(caseStudy.includes("portal.corp.example.internal"), false);
    assert.equal(html.includes("portal.corp.example.internal"), false);
  } finally {
    rmSync(repoDir, { recursive: true, force: true });
  }
});

function makeEvidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "ev_0001",
    source_type: "doc",
    source_tool: "readme_docs_adapter",
    artifact_id: "doc:README.md",
    title: "README.md documentation evidence",
    summary: "Contains headings: pow-portfolio",
    public_safe_excerpt:
      "# pow-portfolio\n\n> Turn private local work into a public project showcase.\n\n`pow-portfolio` is a local-first npm/npx project showcase compiler.",
    private_risk: [],
    confidence: 0.82,
    paths: ["README.md"],
    claim_hints: ["cli_tooling", "static_showcase_export"],
    public_safe: true,
    weight: 4,
    ...overrides
  };
}

test("Task 05 dogfood claim generation favors project-showcase categories over generic resume claims", () => {
  const evidence = [
    makeEvidence(),
    makeEvidence({
      id: "ev_0002",
      artifact_id: "doc:docs/EFFICIENCY_DESIGN.md",
      title: "EFFICIENCY_DESIGN.md documentation evidence",
      public_safe_excerpt:
        "Evidence Adapter Contract, normalized evidence map, claim-first retrieval, compact briefs, token budgets, and no raw source to LLM by default.",
      paths: ["docs/EFFICIENCY_DESIGN.md"],
      claim_hints: ["data_engineering", "ai_engineering", "privacy_governance"]
    }),
    makeEvidence({
      id: "ev_0003",
      artifact_id: "doc:docs/RELEASE_CHECKLIST.md",
      title: "RELEASE_CHECKLIST.md documentation evidence",
      public_safe_excerpt:
        "Dogfood, QA, smoke commands, npm pack dry run, release checklist, roadmap, and acceptance criteria.",
      paths: ["docs/RELEASE_CHECKLIST.md"],
      claim_hints: ["release_readiness", "project_management"]
    }),
    makeEvidence({
      id: "ev_0004",
      source_type: "test_log",
      source_tool: "test_log_adapter",
      artifact_id: "test:src/tests/task04-showcase-outputs.test.ts",
      title: "Validation evidence: task04-showcase-outputs.test.ts",
      summary: "Detected test artifact for showcase outputs.",
      public_safe_excerpt: "src/tests/task04-showcase-outputs.test.ts",
      paths: ["src/tests/task04-showcase-outputs.test.ts"],
      claim_hints: ["testing_validation"],
      weight: 4
    })
  ];

  const claims = proposeCandidateClaims(evidence);
  const categories = claims.map((claim) => claim.category);

  assert.equal(categories.includes("data_engineering"), true);
  assert.equal(categories.includes("ai_engineering"), true);
  assert.equal(categories.includes("project_management"), true);
  assert.equal(categories.includes("release_readiness"), true);
  assert.equal(categories.includes("retrieval_architecture"), false);
  assert.equal(categories.includes("product_frontend"), false);
  assert.equal(categories.includes("data_persistence"), false);
});

test("Task 05 showcase model uses root README framing and CV bullets omit unverified placeholders", () => {
  const map: EvidenceMap = {
    schema_version: "0.1",
    generated_at: "2026-06-30T00:00:00.000Z",
    project: { root: ".", name: "pow-portfolio" },
    evidence: [
      makeEvidence({
        id: "ev_0001",
        artifact_id: "doc:docs/ARCHITECTURE.md",
        title: "ARCHITECTURE.md documentation evidence",
        public_safe_excerpt: "# Architecture\n\n## Product boundary\n\n`pow-portfolio` compiles one-project showcase packages.",
        paths: ["docs/ARCHITECTURE.md"],
        claim_hints: ["architecture_decision"]
      }),
      makeEvidence({ id: "ev_0002" }),
      makeEvidence({
        id: "ev_0003",
        source_type: "test_log",
        source_tool: "test_log_adapter",
        artifact_id: "test:src/tests/task04-showcase-outputs.test.ts",
        title: "Validation evidence",
        public_safe_excerpt: "task04 showcase output tests",
        paths: ["src/tests/task04-showcase-outputs.test.ts"],
        claim_hints: ["testing_validation"]
      })
    ],
    claims: [
      {
        id: "claim_0001",
        claim: "Built a local-first npm CLI that compiles evidence into project-showcase artifacts",
        category: "cli_tooling",
        evidence_ids: ["ev_0002", "ev_0003"],
        confidence: 0.82,
        public_safe_rewrite: "Built a local-first npm CLI that compiles evidence into project-showcase artifacts",
        risks: [],
        needs_user_confirmation: false,
        recommended_outputs: ["case_study", "cv_bullet", "interview_story"],
        verification_status: "verified",
        reviewer_facing_value: "Shows a runnable developer tool instead of only documentation.",
        source_types: ["doc", "test_log"],
        quality_gate: {
          has_evidence: true,
          evidence_not_only_self_claim: true,
          source_type_clear: true,
          no_private_data: true,
          confidence_exists: true,
          public_safe_rewrite_exists: true,
          reviewer_facing_value: true,
          passed: true,
          failure_reasons: []
        }
      },
      {
        id: "claim_0002",
        claim: "Made technical architecture or tradeoff decisions",
        category: "architecture_decision",
        evidence_ids: ["ev_0001"],
        confidence: 0.55,
        public_safe_rewrite: "Unverified / needs user confirmation",
        risks: [],
        needs_user_confirmation: true,
        recommended_outputs: ["case_study", "cv_bullet"],
        verification_status: "unverified",
        reviewer_facing_value: "Shows decision-making.",
        source_types: ["doc"],
        quality_gate: {
          has_evidence: true,
          evidence_not_only_self_claim: true,
          source_type_clear: true,
          no_private_data: true,
          confidence_exists: true,
          public_safe_rewrite_exists: true,
          reviewer_facing_value: true,
          passed: false,
          failure_reasons: ["low_confidence"]
        }
      }
    ],
    risk_summary: { total_risks: 0, risk_categories: [] }
  };

  const model = buildShowcaseModel(map);
  const cvBullets = compileCvBullets(map);

  assert.match(model.oneLineValue, /Turn private local work into a public project showcase/i);
  assert.match(cvBullets, /local-first npm CLI/i);
  assert.equal(cvBullets.includes("Unverified / needs user confirmation"), false);
});
