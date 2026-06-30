#!/usr/bin/env node
import { initCommand } from "./commands/init.js";
import { collectCommand } from "./commands/collect.js";
import { briefCommand } from "./commands/brief.js";
import { promptCommand } from "./commands/prompt.js";
import { exportCommand } from "./commands/export.js";
import { doctorCommand } from "./commands/doctor.js";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

function printHelp(): void {
  console.log(`pow-portfolio\n\nUsage:\n  pow-portfolio init [--force]\n  pow-portfolio collect --repo .\n  pow-portfolio brief\n  pow-portfolio prompt [codex|claude|cursor|gemini|generic]\n  pow-portfolio export\n  pow-portfolio doctor\n\nPrinciples:\n  - local-first\n  - evidence map as source of truth\n  - claim-first retrieval\n  - redaction before generation\n  - one-project showcase, not generic portfolio
  - no full repo to LLM by default\n`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  switch (parsed.command) {
    case "init":
      initCommand(cwd, parsed.flags);
      break;
    case "collect":
      collectCommand(cwd, parsed.flags);
      break;
    case "brief":
      briefCommand(cwd);
      break;
    case "prompt":
      promptCommand(cwd, parsed.positional[0] ?? "generic");
      break;
    case "export":
      exportCommand(cwd);
      break;
    case "doctor":
      doctorCommand(cwd);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${parsed.command}\n`);
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
