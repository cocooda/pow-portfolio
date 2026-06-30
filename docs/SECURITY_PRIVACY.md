# Security and Privacy Notes

`pow-portfolio` is designed to be local-first. The default pipeline should not upload source code, logs, or evidence to any cloud service.

## Non-goal

This tool is not legal advice and cannot guarantee NDA compliance.

It helps create a **public-safety review workflow** for project case studies/showcase pages. The user is still responsible for final approval before publishing.

## Redaction-first rule

Sensitive evidence must be classified before case-study/showcase generation.

```txt
collect evidence
→ classify sensitivity
→ redact or abstract
→ verify public-safe
→ generate output
```

## Risk categories

- secrets/API keys/tokens
- customer/client names
- internal URLs
- private repo names
- proprietary algorithm details
- database schema-sensitive fields
- exact prompts/system instructions
- NDA project labels
- personally identifiable information
- teammate-owned work incorrectly claimed as personal contribution

## Default ignored paths

- `.env`, `.env.*`
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `.next/`, `coverage/`
- binary archives
- private key files

## Agent rules

Agents should:

- read `.pow/briefs` first
- use evidence IDs for every claim
- mark uncertain claims
- respect contribution boundaries
- avoid raw source files unless explicitly needed
- never include secrets or internal identifiers in public outputs
- generate a project showcase/case study, not a generic personal portfolio
