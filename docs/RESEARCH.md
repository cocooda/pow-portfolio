# Research Summary

## Thesis

`pow-portfolio` is a local-first **project showcase compiler** for developers who need to prove work from private, local, messy, or NDA-sensitive projects without publishing source code.

Core positioning:

> Turn private local work into a public project showcase.

## Naming clarification

The package can be called `pow-portfolio`, but the primary output is not a full personal portfolio. The primary output is a **single-project case study / product showcase / technical proof page** that can be linked from a CV.

This matters because the user job is usually:

> “I need one credible link that explains what I built and proves my contribution.”

Not:

> “I need a generic website with all my projects.”

## Pain point validation

The pain point is real but must be framed narrowly.

Developers do struggle with:

- company/NDA work that cannot be shown publicly
- private repos that make GitHub profiles look weaker than reality
- backend/devops/AI work with no obvious screenshots
- messy project histories that are hard to convert into a recruiter-readable story
- team projects where contribution boundaries must be clear
- AI-generated resumes that sound generic and unverifiable

## Market gap

Adjacent tools exist:

- AI resume builders: Teal, Rezi, Kickresume, Enhancv, FlowCV
- open-source resume builders: Reactive Resume, RenderCV
- developer portfolio generators: GitHub-to-portfolio tools, profile README generators
- codebase understanding tools: Understand Anything, Axon, codebase-memory-mcp, Repomix
- proof-of-work portfolio platforms: Fueler, ShowProof-like products
- design/page platforms: Canva, Gamma, Notion, Framer, Webflow

The gap is not “make another resume builder” or “make another portfolio website builder”. The gap is:

> local repo evidence → compact claim briefs → evidence-backed public-safe project showcase content

## Differentiation

Existing tools help agents understand codebases. Portfolio platforms help users publish pages. Resume tools help users polish career text.

`pow-portfolio` helps developers convert private/local project evidence into a safe, credible **one-project showcase package**.

The key differentiators are:

1. Evidence map as source of truth.
2. Claim-first retrieval.
3. Redaction before generation.
4. Deterministic collectors before LLM.
5. Agent skill with token budget rules.
6. Outputs designed for a CV link: case study, showcase brief, page content, static page, CV bullets, interview notes.

## ICP

Primary ICP:

> Junior developers, students, and intern candidates with serious local/private repos who need a recruiter-ready project case study but cannot or do not want to publish full source code.

Secondary ICP:

> Indie hackers or founders who want to turn a private MVP repo into a public project story, showcase page, or pitch artifact.

## Build recommendation

Build order:

1. CLI + agent skill first.
2. Static Markdown/HTML project showcase export.
3. Optional MCP server in v0.2.
4. Web app much later.

Do not start with SaaS or a generic portfolio website builder.
