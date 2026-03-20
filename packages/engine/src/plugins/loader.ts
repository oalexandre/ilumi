import { readdirSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import type { PluginHost, PluginInfo } from "./host.js";

const USER_PLUGINS_DIR = join(homedir(), ".numi-calc", "plugins");

export interface PluginLoaderOptions {
  builtInDir?: string;
  userDir?: string;
}

export class PluginLoader {
  private host: PluginHost;
  private builtInDir: string | null;
  private userDir: string;
  private loadedFiles = new Set<string>();

  constructor(host: PluginHost, options?: PluginLoaderOptions) {
    this.host = host;
    this.builtInDir = options?.builtInDir ?? null;
    this.userDir = options?.userDir ?? USER_PLUGINS_DIR;
  }

  ensureUserDir(): void {
    if (!existsSync(this.userDir)) {
      mkdirSync(this.userDir, { recursive: true });
    }
  }

  loadAll(): PluginInfo[] {
    const results: PluginInfo[] = [];

    // Load built-in plugins first
    if (this.builtInDir) {
      results.push(...this.loadFromDirectory(this.builtInDir));
    }

    // Load user plugins (may override built-in)
    this.ensureUserDir();
    results.push(...this.loadFromDirectory(this.userDir));

    return results;
  }

  reload(): PluginInfo[] {
    // For hot-reload: scan directories for new/changed plugins
    const results: PluginInfo[] = [];

    if (this.builtInDir) {
      results.push(...this.loadFromDirectory(this.builtInDir));
    }
    results.push(...this.loadFromDirectory(this.userDir));

    return results;
  }

  private loadFromDirectory(dir: string): PluginInfo[] {
    const results: PluginInfo[] = [];

    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);

      try {
        const stat = statSync(fullPath);

        if (stat.isFile() && entry.endsWith(".js")) {
          if (!this.loadedFiles.has(fullPath)) {
            results.push(this.host.loadPlugin(fullPath));
            this.loadedFiles.add(fullPath);
          }
        } else if (stat.isDirectory()) {
          // Look for .js files inside subdirectory
          const subFiles = readdirSync(fullPath);
          const jsFile = subFiles.find((f) => f.endsWith(".js"));
          if (jsFile) {
            const jsPath = join(fullPath, jsFile);
            if (!this.loadedFiles.has(jsPath)) {
              results.push(this.host.loadPlugin(jsPath));
              this.loadedFiles.add(jsPath);
            }
          }
        }
      } catch {
        // Skip unreadable entries
      }
    }

    return results;
  }
}
