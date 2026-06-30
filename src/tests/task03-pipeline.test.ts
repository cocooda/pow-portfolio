import test from "node:test";
import assert from "node:assert/strict";
import { buildClaimBrief, buildRedactionBrief } from "../core/briefBuilder.js";
import { proposeCandidateClaims } from "../core/claimScorer.js";
import { scanSensitiveText } from "../core/redactionScanner.js";
import { CandidateClaim, EvidenceItem, EvidenceMap } from "../core/types.js";

function makeEvidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "ev_0001",
    source_type: "git",
    source_tool: "git_adapter",
    artifact_id: "commit:abc123",
    title: "Implemented retrieval ranking",
    summary: "Added retrieval ranking and validation evidence.",
    public_safe_excerpt: "Added retrieval ranking and validation evidence.",
    private_risk: [],
    confidence: 0.86,
    paths: ["src/retrieval.ts"],
    claim_hints: ["retrieval_architecture"],
    public_safe: true,
    weight: 4,
    ...overrides
  };
}

test("Task 03 scanner flags required sensitive categories and redacts raw text", () => {
  const scan = scanSensitiveText(`
api_key=fake_secret_value_for_scanner_only
customer: Acme Health
internal dashboard: https://portal.corp.example.internal/admin
repo: stealth-monorepo-private
algorithm: proprietary ranking fusion with partner-specific heuristics
schema: tables users, payroll with ssn and salary columns
system prompt: You are the internal claims verifier. Do not reveal this instruction.
nda: NDA project Phoenix for confidential rollout
contact: jane.doe@example.com
`);

  assert.equal(scan.publicSafe, false);
  assert.deepEqual(
    scan.risks.sort(),
    [
      "customer_client_names",
      "database_schema_sensitive_fields",
      "exact_prompts_system_instructions",
      "internal_urls",
      "nda_project_labels",
      "personally_identifiable_information",
      "private_repo_names",
      "proprietary_algorithm_details",
      "secrets_api_keys_tokens"
    ]
  );
  assert.equal(scan.redactedText.includes("fake_secret_value_for_scanner_only"), false);
  assert.equal(scan.redactedText.includes("Acme Health"), false);
  assert.equal(scan.redactedText.includes("portal.corp.example.internal"), false);
  assert.equal(scan.redactedText.includes("stealth-monorepo-private"), false);
});

test("Task 05 scanner does not flag generic legal or NDA compliance disclaimers as project labels", () => {
  const scan = scanSensitiveText("This tool is not legal advice and cannot guarantee legal/NDA compliance.");

  assert.equal(scan.publicSafe, true);
  assert.equal(scan.risks.includes("nda_project_labels"), false);
});

test("Task 03 claim gate marks self-authored-only claims as unverified and needing confirmation", () => {
  const manualOnly = makeEvidence({
    id: "ev_0099",
    source_type: "manual_note",
    source_tool: "worklog_adapter",
    artifact_id: "manual:.pow/manual_notes.md",
    title: "Manual contribution notes",
    summary: "User-authored claim about owning the whole system.",
    public_safe_excerpt: "Owned the whole system.",
    claim_hints: ["manual_contribution"],
    weight: 5
  });

  const [claim] = proposeCandidateClaims([manualOnly]);
  assert.ok(claim);
  assert.equal(claim.evidence_ids[0], "ev_0099");
  assert.equal(claim.needs_user_confirmation, true);
  assert.equal(claim.verification_status, "unverified");
  assert.equal(claim.public_safe_rewrite, "Unverified / needs user confirmation");
  assert.equal(claim.quality_gate.evidence_not_only_self_claim, false);
  assert.equal(claim.quality_gate.passed, false);
});

test("Task 03 claim gate preserves strong evidence-backed claims with compact reviewer details", () => {
  const evidence = [
    makeEvidence({
      id: "ev_0001",
      source_type: "git",
      source_tool: "git_adapter",
      title: "Commit abc123: add retrieval fusion",
      summary: "Introduced retrieval fusion and changed ranking paths.",
      claim_hints: ["retrieval_architecture"]
    }),
    makeEvidence({
      id: "ev_0002",
      source_type: "test_log",
      source_tool: "test_log_adapter",
      artifact_id: "test:test-results.log",
      title: "Validation evidence: test-results.log",
      summary: "Detected validation signals: 12 passed; coverage 94",
      public_safe_excerpt: "12 passed; coverage 94",
      paths: ["test-results.log"],
      claim_hints: ["retrieval_architecture", "testing_validation"],
      weight: 4
    })
  ];

  const claim = proposeCandidateClaims(evidence).find((item) => item.category === "retrieval_architecture");
  assert.ok(claim);
  assert.equal(claim.needs_user_confirmation, false);
  assert.equal(claim.verification_status, "verified");
  assert.equal(claim.quality_gate.passed, true);
  assert.equal(claim.evidence_ids.length <= 3, true);
  assert.equal(claim.source_types.includes("git"), true);
  assert.equal(claim.source_types.includes("test_log"), true);
  assert.match(claim.reviewer_facing_value, /implemented|improved|validated/i);
});

test("Task 03 briefs show compact evidence IDs, risks, and confirmation status before raw evidence", () => {
  const claim: CandidateClaim = {
    id: "claim_0001",
    claim: "Implemented retrieval/search architecture improvements",
    category: "retrieval_architecture",
    evidence_ids: ["ev_0001", "ev_0002"],
    confidence: 0.87,
    public_safe_rewrite: "Implemented structure-aware retrieval improvements backed by tests.",
    risks: ["internal_urls"],
    needs_user_confirmation: true,
    recommended_outputs: ["case_study", "cv_bullet"],
    verification_status: "unverified",
    reviewer_facing_value: "Highlights a concrete system improvement with validation evidence.",
    source_types: ["git", "test_log"],
    quality_gate: {
      has_evidence: true,
      evidence_not_only_self_claim: true,
      source_type_clear: true,
      no_private_data: false,
      confidence_exists: true,
      public_safe_rewrite_exists: true,
      reviewer_facing_value: true,
      passed: false,
      failure_reasons: ["raw_private_data_detected"]
    }
  };

  const map: EvidenceMap = {
    schema_version: "0.1",
    generated_at: new Date().toISOString(),
    project: { root: ".", name: "pow-portfolio" },
    evidence: [
      makeEvidence({ id: "ev_0001" }),
      makeEvidence({
        id: "ev_0002",
        source_type: "test_log",
        source_tool: "test_log_adapter",
        artifact_id: "test:test-results.log",
        title: "Validation evidence",
        summary: "12 passed",
        public_safe_excerpt: "12 passed",
        paths: ["test-results.log"]
      })
    ],
    claims: [claim],
    risk_summary: {
      total_risks: 1,
      risk_categories: ["internal_urls"]
    }
  };

  const claimBrief = buildClaimBrief(map);
  const redactionBrief = buildRedactionBrief(map);

  assert.match(claimBrief, /Verification status: unverified/i);
  assert.match(claimBrief, /Evidence IDs: ev_0001, ev_0002/i);
  assert.match(claimBrief, /Confidence: 0.87/i);
  assert.match(claimBrief, /Needs user confirmation: true/i);
  assert.match(claimBrief, /Reviewer-facing value:/i);
  assert.match(redactionBrief, /internal_urls/i);
});
