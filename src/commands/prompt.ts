import { join } from "node:path";
import { writeText } from "../core/fsUtils.js";
import { buildAgentPrompt } from "../core/agentText.js";

export function promptCommand(cwd: string, agent: string): void {
  const normalized = agent || "generic";
  const prompt = buildAgentPrompt(normalized);
  const outPath = join(cwd, ".pow", "skill", "prompts", `${normalized}_showcase_prompt.md`);
  writeText(outPath, prompt);
  console.log(`Wrote ${outPath}`);
  console.log(prompt);
}
