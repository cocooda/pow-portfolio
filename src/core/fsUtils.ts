import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeJson(path: string, value: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf8");
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function copyIfExists(from: string, to: string): void {
  if (!existsSync(from)) return;
  ensureDir(dirname(to));
  copyFileSync(from, to);
}

export function exists(path: string): boolean {
  return existsSync(path);
}

export function walkFiles(root: string, options?: { ignore?: string[]; maxFiles?: number }): string[] {
  const ignore = options?.ignore ?? [];
  const maxFiles = options?.maxFiles ?? 5000;
  const out: string[] = [];

  function ignored(abs: string): boolean {
    const rel = relative(root, abs).replaceAll("\\", "/");
    if (!rel || rel.startsWith("..")) return false;
    const segments = rel.split("/");

    return ignore.some((pattern) => {
      const normalized = pattern.replaceAll("\\", "/").replace(/\/+$/, "");
      if (!normalized) return false;
      if (normalized.includes("/")) {
        return rel === normalized || rel.startsWith(`${normalized}/`);
      }
      return rel === normalized || segments.includes(normalized);
    });
  }

  function visit(dir: string): void {
    if (out.length >= maxFiles || ignored(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (ignored(abs)) continue;
      if (entry.isDirectory()) {
        visit(abs);
      } else if (entry.isFile()) {
        out.push(abs);
        if (out.length >= maxFiles) return;
      }
    }
  }

  visit(root);
  return out;
}

export function safeStat(path: string): { size: number; mtime: Date } | null {
  try {
    const st = statSync(path);
    return { size: st.size, mtime: st.mtime };
  } catch {
    return null;
  }
}
