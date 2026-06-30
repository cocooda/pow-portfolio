import { SensitivityLevel } from "./types.js";

export interface RedactionScanResult {
  publicSafe: boolean;
  risks: string[];
  redactedText: string;
  publicSafeText: string;
  sensitivity: SensitivityLevel;
}

type Rule = {
  name: string;
  regex: RegExp;
  replacement: string;
  sensitivity?: SensitivityLevel;
};

const rules: Rule[] = [
  {
    name: "secrets_api_keys_tokens",
    regex: /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|secret|bearer)\s*[:=]\s*['"]?[A-Za-z0-9_\-.]{12,}/gi,
    replacement: "[REDACTED_SECRET]",
    sensitivity: "sensitive"
  },
  {
    name: "secrets_api_keys_tokens",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    replacement: "[REDACTED_JWT]",
    sensitivity: "sensitive"
  },
  {
    name: "secrets_api_keys_tokens",
    regex: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g,
    replacement: "[REDACTED_PRIVATE_KEY]",
    sensitivity: "sensitive"
  },
  {
    name: "secrets_api_keys_tokens",
    regex: /^[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|DSN|DATABASE_URL)[A-Z0-9_]*=.*/gim,
    replacement: "[REDACTED_ENV]",
    sensitivity: "sensitive"
  },
  {
    name: "customer_client_names",
    regex: /\b(customer|client|account|partner|tenant|organization|company)\s*(?:name)?\s*[:=-]\s*[A-Z][A-Za-z0-9&.-]*(?:\s+[A-Z][A-Za-z0-9&.-]*){0,3}/g,
    replacement: "$1 [PUBLIC_CUSTOMER_ALIAS]",
    sensitivity: "internal"
  },
  {
    name: "internal_urls",
    regex: /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+|[^\s/]+\.(?:internal|local|corp))[^\s)]*/gi,
    replacement: "[REDACTED_INTERNAL_URL]",
    sensitivity: "internal"
  },
  {
    name: "private_repo_names",
    regex: /\b(?:repo|repository|monorepo|project)\s*[:=-]\s*[A-Za-z0-9._-]*(?:private|internal|stealth|confidential|nda)[A-Za-z0-9._-]*/gi,
    replacement: "[PUBLIC_REPO_ALIAS]",
    sensitivity: "internal"
  },
  {
    name: "proprietary_algorithm_details",
    regex: /\b(?:proprietary|partner-specific|internal-only|custom)\b.{0,80}\b(?:algorithm|ranking|heuristic|model|pipeline|fusion)\b/gi,
    replacement: "[ABSTRACTED_PROPRIETARY_IMPLEMENTATION]",
    sensitivity: "sensitive"
  },
  {
    name: "database_schema_sensitive_fields",
    regex: /\b(?:schema|table|tables|column|columns|field|fields)\b.{0,160}\b(?:ssn|salary|payroll|dob|birth|email|phone|address|tax|password|secret|token)\b/gi,
    replacement: "[ABSTRACTED_SCHEMA_DETAILS]",
    sensitivity: "sensitive"
  },
  {
    name: "exact_prompts_system_instructions",
    regex: /\b(?:system prompt|developer prompt|exact prompt|exact instruction|prompt text)\b[:=-]?.{0,240}/gi,
    replacement: "[ABSTRACTED_PROMPT_INSTRUCTIONS]",
    sensitivity: "sensitive"
  },
  {
    name: "exact_prompts_system_instructions",
    regex: /\byou are (?:an?|the)\b.{0,200}\b(?:instruction|assistant|verifier|agent)\b.{0,120}/gi,
    replacement: "[ABSTRACTED_SYSTEM_INSTRUCTIONS]",
    sensitivity: "sensitive"
  },
  {
    name: "nda_project_labels",
    regex: /\b(?:nda\s*[:=-]|nda project|confidential project|do not share|internal only|private project|codename)\b.{0,80}/gi,
    replacement: "[PUBLIC_SAFE_PROJECT_ALIAS]",
    sensitivity: "internal"
  },
  {
    name: "personally_identifiable_information",
    regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    replacement: "[REDACTED_EMAIL]",
    sensitivity: "sensitive"
  },
  {
    name: "personally_identifiable_information",
    regex: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
    sensitivity: "sensitive"
  }
];

export function scanSensitiveText(input: string): RedactionScanResult {
  const risks = new Set<string>();
  let redactedText = input;
  let sensitivity: SensitivityLevel = "public";

  for (const rule of rules) {
    if (!rule.regex.test(redactedText)) {
      rule.regex.lastIndex = 0;
      continue;
    }

    risks.add(rule.name);
    sensitivity = elevateSensitivity(sensitivity, rule.sensitivity ?? "internal");
    redactedText = redactedText.replace(rule.regex, (_, ...groups: unknown[]) => {
      if (typeof rule.replacement === "string" && rule.replacement.includes("$1") && typeof groups[0] === "string") {
        return rule.replacement.replace("$1", groups[0] as string);
      }
      return rule.replacement;
    });
    rule.regex.lastIndex = 0;
  }

  return {
    publicSafe: risks.size === 0,
    risks: [...risks].sort(),
    redactedText,
    publicSafeText: toPublicSafeText(redactedText),
    sensitivity: risks.size === 0 ? "public" : sensitivity
  };
}

function elevateSensitivity(current: SensitivityLevel, next: SensitivityLevel): SensitivityLevel {
  const order: SensitivityLevel[] = ["public", "unknown", "internal", "sensitive"];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

function toPublicSafeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\[(?:REDACTED|ABSTRACTED|PUBLIC_SAFE)[^\]]*\]/g, "[REDACTED]")
    .trim();
}
