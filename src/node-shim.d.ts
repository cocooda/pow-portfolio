declare const process: {
  argv: string[];
  cwd(): string;
  version: string;
  exitCode?: number;
};

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function copyFileSync(from: string, to: string): void;
  export function readdirSync(path: string, options?: { withFileTypes?: boolean }): Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
  export function statSync(path: string): { size: number; mtime: Date };
}

declare module "node:path" {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function relative(from: string, to: string): string;
  export function basename(path: string): string;
}

declare module "node:child_process" {
  export function execFileSync(command: string, args?: string[], options?: Record<string, unknown>): string;
}
