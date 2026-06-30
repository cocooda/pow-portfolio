import { execFileSync } from "node:child_process";

export function runCommand(command: string, args: string[], cwd: string): string | null {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 10 * 1024 * 1024
    });
  } catch {
    return null;
  }
}

export function hasCommand(command: string): boolean {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
