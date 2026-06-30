export type SourceType =
  | "code_graph"
  | "git"
  | "test_log"
  | "screenshot"
  | "worklog"
  | "doc"
  | "file_tree"
  | "deploy_config"
  | "manual_note";

export interface EvidenceRef {
  label: string;
  value: string;
}

export type RecommendedOutput =
  | "case_study"
  | "cv_bullet"
  | "interview_story"
  | "architecture_summary"
  | "showcase_page";

export type PublicSafetyStatus = "safe" | "safe_with_redaction" | "needs_review" | "unsafe";
export type SensitivityLevel = "public" | "internal" | "sensitive" | "unknown";
export type ClaimVerificationStatus = "verified" | "unverified";

export interface ClaimQualityGate {
  has_evidence: boolean;
  evidence_not_only_self_claim: boolean;
  source_type_clear: boolean;
  no_private_data: boolean;
  confidence_exists: boolean;
  public_safe_rewrite_exists: boolean;
  reviewer_facing_value: boolean;
  passed: boolean;
  failure_reasons: string[];
}

export interface PowConfig {
  project_name: string;
  repo_path: string;
  output_dir: string;
  manual_notes_path: string;
  screenshots_dir: string;
  max_commits: number;
  max_doc_excerpt_chars: number;
  public_aliases: Record<string, string>;
  ignore: string[];
  token_budget: TokenBudgetManifest;
}

export interface TokenBudgetManifest {
  discovery_max_tokens: number;
  evidence_verification_max_tokens_per_claim: number;
  final_case_study_max_tokens: number;
  never_do: string[];
}

export interface EvidenceItem {
  id: string;
  source_type: SourceType;
  source_tool: string;
  artifact_id: string;
  title: string;
  summary: string;
  public_safe_excerpt: string;
  private_risk: string[];
  confidence: number;
  paths: string[];
  refs?: EvidenceRef[];
  commit?: string;
  date?: string;
  claim_hints: string[];
  public_safe: boolean;
  sensitivity?: SensitivityLevel;
  weight: number;
}

export interface CandidateClaim {
  id: string;
  claim: string;
  category: string;
  evidence_ids: string[];
  confidence: number;
  public_safe_rewrite: string;
  risks: string[];
  needs_user_confirmation: boolean;
  recommended_outputs: RecommendedOutput[];
  verification_status: ClaimVerificationStatus;
  reviewer_facing_value: string;
  source_types: SourceType[];
  quality_gate: ClaimQualityGate;
}

export interface EvidenceMap {
  schema_version: "0.1";
  generated_at: string;
  project: {
    root: string;
    name: string;
    package_manager?: string;
    git_branch?: string;
    git_remote_public_safe?: boolean;
  };
  evidence: EvidenceItem[];
  claims: CandidateClaim[];
  risk_summary: {
    total_risks: number;
    risk_categories: string[];
  };
}

export interface CommandContext {
  cwd: string;
  repoPath: string;
  powDir: string;
  configPath: string;
}
