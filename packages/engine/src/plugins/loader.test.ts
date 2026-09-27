import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { EntityRegistry } from "../registry/entity-registry.js";

import { PluginHost } from "./host.js";
import { PluginLoader } from "./loader.js";

function fnPlugin(name: string, factor: number): string {
  return `numi.addFunction({ id: "${name}", phrases: "${name}" }, function (v) { return { double: v[0].double * ${factor} }; });`;
}

describe("PluginLoader", () => {
  let root: string;
  let userDir: string;
  let builtInDir: string;
  let registry: EntityRegistry;
  let host: PluginHost;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "ilumi-loader-"));
    userDir = join(root, "user");
    builtInDir = join(root, "builtin");
    registry = new EntityRegistry();
    host = new PluginHost(registry);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("ensureUserDir creates the user directory (recursively) and tolerates it existing", () => {
    const nested = join(root, "a", "b", "plugins");
    const loader = new PluginLoader(host, { userDir: nested });

    expect(existsSync(nested)).toBe(false);
    loader.ensureUserDir();
    expect(existsSync(nested)).toBe(true);
    expect(() => loader.ensureUserDir()).not.toThrow();
  });

  it("loadAll creates a missing user directory and returns nothing for it", () => {
    const loader = new PluginLoader(host, { userDir });
    expect(loader.loadAll()).toEqual([]);
    expect(existsSync(userDir)).toBe(true);
  });

  it("loads top-level .js files and ignores other files", () => {
    mkdirSync(userDir);
    writeFileSync(join(userDir, "triple.js"), fnPlugin("triple", 3));
    writeFileSync(join(userDir, "README.md"), "# not a plugin");
    writeFileSync(join(userDir, "notes.txt"), fnPlugin("ignored", 9));

    const results = new PluginLoader(host, { userDir }).loadAll();

    expect(results).toEqual([{ path: join(userDir, "triple.js"), loaded: true }]);
    expect(registry.callFunction("triple", [4])).toBe(12);
    expect(registry.hasFunction("ignored")).toBe(false);
  });

  it("loads the first .js file inside a plugin subdirectory", () => {
    const sub = join(userDir, "quad-plugin");
    mkdirSync(sub, { recursive: true });
    writeFileSync(join(sub, "package.json"), "{}");
    writeFileSync(join(sub, "index.js"), fnPlugin("quad", 4));

    const results = new PluginLoader(host, { userDir }).loadAll();

    expect(results).toEqual([{ path: join(sub, "index.js"), loaded: true }]);
    expect(registry.callFunction("quad", [2])).toBe(8);
  });

  it("skips subdirectories without any .js file", () => {
    const sub = join(userDir, "empty-plugin");
    mkdirSync(sub, { recursive: true });
    writeFileSync(join(sub, "readme.txt"), "nothing here");

    expect(new PluginLoader(host, { userDir }).loadAll()).toEqual([]);
  });

  it("loads built-in plugins before user plugins", () => {
    mkdirSync(builtInDir);
    mkdirSync(userDir);
    writeFileSync(join(builtInDir, "a.js"), fnPlugin("scale", 2));
    writeFileSync(join(userDir, "b.js"), fnPlugin("scale", 10));

    const results = new PluginLoader(host, { builtInDir, userDir }).loadAll();

    expect(results.map((r) => r.path)).toEqual([join(builtInDir, "a.js"), join(userDir, "b.js")]);
    // The user plugin registers last and therefore overrides the built-in one.
    expect(registry.callFunction("scale", [1])).toBe(10);
  });

  it("ignores a built-in directory that does not exist", () => {
    mkdirSync(userDir);
    writeFileSync(join(userDir, "u.js"), fnPlugin("u", 1));

    const results = new PluginLoader(host, { builtInDir: join(root, "nope"), userDir }).loadAll();
    expect(results.map((r) => r.path)).toEqual([join(userDir, "u.js")]);
  });

  it("reports a plugin that throws as not loaded and keeps loading the others", () => {
    mkdirSync(userDir);
    writeFileSync(join(userDir, "a-broken.js"), "throw new Error('boom');");
    writeFileSync(join(userDir, "b-syntax.js"), "numi.addFunction({ ");
    writeFileSync(join(userDir, "c-good.js"), fnPlugin("good", 5));

    const results = new PluginLoader(host, { userDir }).loadAll();

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ path: join(userDir, "a-broken.js"), loaded: false, error: "boom" });
    expect(results[1]?.loaded).toBe(false);
    expect(results[1]?.error).toMatch(/Unexpected end of input/);
    expect(results[2]).toEqual({ path: join(userDir, "c-good.js"), loaded: true });
    expect(registry.callFunction("good", [2])).toBe(10);
  });

  it("skips entries that cannot be stat'ed (dangling symlinks) without throwing", () => {
    mkdirSync(userDir);
    symlinkSync(join(root, "does-not-exist.js"), join(userDir, "dangling.js"));
    writeFileSync(join(userDir, "ok.js"), fnPlugin("ok", 1));

    const results = new PluginLoader(host, { userDir }).loadAll();
    expect(results).toEqual([{ path: join(userDir, "ok.js"), loaded: true }]);
  });

  it("reload only picks up files it has not loaded before", () => {
    mkdirSync(builtInDir);
    mkdirSync(userDir);
    writeFileSync(join(builtInDir, "base.js"), fnPlugin("base", 1));
    writeFileSync(join(userDir, "first.js"), fnPlugin("first", 1));
    const loader = new PluginLoader(host, { builtInDir, userDir });

    expect(loader.loadAll()).toHaveLength(2);
    expect(loader.reload()).toEqual([]);
    expect(loader.loadAll()).toEqual([]);

    writeFileSync(join(userDir, "second.js"), fnPlugin("second", 2));
    mkdirSync(join(builtInDir, "extra"));
    writeFileSync(join(builtInDir, "extra", "main.js"), fnPlugin("extra", 3));

    const reloaded = loader.reload();
    expect(reloaded.map((r) => r.path).sort()).toEqual(
      [join(builtInDir, "extra", "main.js"), join(userDir, "second.js")].sort(),
    );
    expect(registry.callFunction("second", [3])).toBe(6);
    expect(registry.callFunction("extra", [3])).toBe(9);
    expect(host.getPlugins()).toHaveLength(4);
  });

  it("reload does not recreate a missing user directory", () => {
    const loader = new PluginLoader(host, { userDir });
    expect(loader.reload()).toEqual([]);
    expect(existsSync(userDir)).toBe(false);
  });
});
