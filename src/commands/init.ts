import { join } from "node:path";
import { defaultConfig, saveConfig } from "../core/config.js";
import { ensureDir, exists, writeText } from "../core/fsUtils.js";
import { buildAgentSkillText, buildCaseStudyPrompt, buildVerifyClaimsPrompt } from "../core/agentText.js";

export function initCommand(cwd: string, flags: Record<string, string | boolean>): void {
  const powDir = join(cwd, ".pow");
  if (exists(powDir) && !flags.force) {
    console.log(".pow already exists. Use --force to overwrite config/skill scaffolding.");
    return;
  }
  ensureDir(join(powDir, "evidence"));
  ensureDir(join(powDir, "evidence", "imports"));
  ensureDir(join(powDir, "briefs"));
  ensureDir(join(powDir, "skill", "prompts"));
  ensureDir(join(powDir, "dist"));

  const config = defaultConfig(cwd);
  saveConfig(cwd, config);

  writeText(join(powDir, "manual_notes.md"), `# Manual Contribution Notes\n\nUse this file to add context that git/docs cannot know.\n\n## My role\n\n- ...\n\n## Contribution boundaries\n\n- I owned ...\n- Teammate/client owned ...\n\n## Public aliases\n\n- Internal project/client name → public-safe alias\n\n## Demo transcript / screenshots captions\n\n- ...\n`);

  writeText(join(powDir, "skill", "SKILL.md"), buildAgentSkillText());
  writeText(join(powDir, "skill", "prompts", "verify_claims.md"), buildVerifyClaimsPrompt());
  writeText(join(powDir, "skill", "prompts", "generate_case_study.md"), buildCaseStudyPrompt());

  console.log("Initialized .pow workspace.");
}
