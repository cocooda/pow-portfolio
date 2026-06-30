import { join } from "node:path";
import { EvidenceMap } from "../core/types.js";
import { ensureDir, writeText } from "../core/fsUtils.js";
import { buildShowcaseModel } from "../core/portfolioCompiler.js";

export function exportHtml(map: EvidenceMap, outDir: string): void {
  ensureDir(outDir);
  const model = buildShowcaseModel(map);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(model.projectTitle)} - Project Showcase</title>
  <style>
    :root {
      --paper: #f4efe6;
      --ink: #1d1b17;
      --muted: #6b6256;
      --card: #fffdf9;
      --line: #d5ccbd;
      --accent: #b24c2a;
      --accent-soft: #f2d7ca;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      background:
        radial-gradient(circle at top left, rgba(178, 76, 42, 0.14), transparent 28%),
        linear-gradient(180deg, #fbf6ef 0%, var(--paper) 100%);
      color: var(--ink);
      line-height: 1.6;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 18px 64px;
    }
    header {
      background: rgba(255, 253, 249, 0.82);
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(45, 31, 14, 0.08);
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 12px;
      color: var(--muted);
      margin: 0 0 8px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(2.6rem, 8vw, 5.6rem);
      line-height: 0.94;
    }
    .lede {
      max-width: 760px;
      font-size: 1.05rem;
      margin: 0;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 20px;
    }
    .metric {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 14px 16px;
    }
    .metric strong {
      display: block;
      font-size: 1.6rem;
      line-height: 1;
      margin-bottom: 6px;
    }
    section {
      background: rgba(255, 253, 249, 0.78);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px;
      margin-top: 18px;
      box-shadow: 0 16px 40px rgba(45, 31, 14, 0.05);
    }
    h2 {
      margin-top: 0;
      font-size: 1.3rem;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li + li {
      margin-top: 10px;
    }
    .claims {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .claim {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 16px;
    }
    .claim h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 1.05rem;
    }
    .status {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 12px;
      background: var(--accent-soft);
      color: var(--accent);
    }
    code {
      font-family: "Courier New", monospace;
      background: #efe7da;
      padding: 1px 5px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Project showcase / case study</p>
      <h1>${escapeHtml(model.projectTitle)}</h1>
      <p class="lede">${escapeHtml(model.oneLineValue)}</p>
      <div class="metrics">
        <div class="metric"><strong>${model.metrics.evidenceCount}</strong><span>Evidence items</span></div>
        <div class="metric"><strong>${model.metrics.verifiedClaimCount}</strong><span>Verified claims</span></div>
        <div class="metric"><strong>${model.metrics.reviewClaimCount}</strong><span>Needs review</span></div>
        <div class="metric"><strong>${model.metrics.riskCount}</strong><span>Risk signals</span></div>
      </div>
    </header>
    ${renderSection("Project Title + One-Line Value Proposition", [
      `Project title: ${escapeHtml(model.projectTitle)}`,
      `One-line value proposition: ${escapeHtml(model.oneLineValue)}`
    ])}
    ${renderSection("Problem / User Pain Point", model.problem)}
    ${renderSection("Context & Constraints", model.context)}
    ${renderSection("My Role and Contribution Boundary", model.role)}
    ${renderSection("Architecture Overview", model.architecture)}
    <section>
      <h2>Evidence-Backed Technical Claims</h2>
      <div class="claims">${model.claims.map(renderClaimCard).join("\n") || "<p>No evidence-backed claims are ready yet.</p>"}</div>
    </section>
    ${renderSection("Key Decisions & Trade-Offs", model.decisions)}
    ${renderSection("Validation / Tests / Metrics / Demo Evidence", model.validation)}
    ${renderSection("Timeline / Milestones", model.timeline)}
    ${renderSection("What I Would Improve Next", model.improvements)}
    ${renderSection("Public-Safe Evidence Appendix", model.appendix.map((row) => `- ${row.id} [${row.sourceType}] ${row.title}: ${row.excerpt}`))}
    ${renderSection("Links", model.links)}
  </main>
</body>
</html>`;

  writeText(join(outDir, "SHOWCASE_PAGE.html"), html);
}

function renderSection(title: string, items: string[]): string {
  return `<section>
      <h2>${escapeHtml(title)}</h2>
      <ul>${items.map((item) => `<li>${escapeHtml(stripBullet(item))}</li>`).join("")}</ul>
    </section>`;
}

function renderClaimCard(claim: ReturnType<typeof buildShowcaseModel>["claims"][number]): string {
  return `<article class="claim">
        <h3>${escapeHtml(claim.id)} - ${escapeHtml(claim.text)}</h3>
        <p><strong>Category:</strong> ${escapeHtml(claim.category)}</p>
        <p><strong>Evidence:</strong> ${claim.evidenceIds.map(escapeHtml).join(", ")}</p>
        <p><strong>Confidence:</strong> ${claim.confidence}</p>
        <span class="status">${escapeHtml(claim.status)}</span>
      </article>`;
}

function stripBullet(text: string): string {
  return text.replace(/^- /, "").trim();
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
