import { existsSync } from "node:fs";
import { join } from "node:path";
import { hasCommand } from "../core/commandUtils.js";

export function doctorCommand(cwd: string): void {
  console.log("pow-portfolio doctor");
  console.log(`- cwd: ${cwd}`);
  console.log(`- node: ${process.version}`);
  console.log(`- git available: ${hasCommand("git") ? "yes" : "no"}`);
  console.log(`- .git found: ${existsSync(join(cwd, ".git")) ? "yes" : "no"}`);
  console.log(`- .pow found: ${existsSync(join(cwd, ".pow")) ? "yes" : "no"}`);
}
