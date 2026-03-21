import type { PluginManifest } from "../core-plugins/types.js";
import type { EntityRegistry } from "./entity-registry.js";

export function registerPlugin(registry: EntityRegistry, manifest: PluginManifest): void {
  if (manifest.functions) {
    for (const [name, { fn, detail }] of Object.entries(manifest.functions)) {
      registry.registerFunction(name, fn, detail);
    }
  }

  if (manifest.constants) {
    for (const [name, { value, detail }] of Object.entries(manifest.constants)) {
      registry.registerConstant(name, value, detail);
    }
  }

  if (manifest.units) {
    for (const unit of manifest.units) {
      registry.addUnit(unit);
    }
  }

  if (manifest.lineRefs) {
    for (const [name, { handler, detail }] of Object.entries(manifest.lineRefs)) {
      registry.registerLineRef(name, handler, detail);
    }
  }

  if (manifest.dateLiterals) {
    for (const [name, { resolver, detail }] of Object.entries(manifest.dateLiterals)) {
      registry.registerDateLiteral(name, resolver, detail);
    }
  }

  if (manifest.baseConversions) {
    for (const [name, { formatter, detail, aliases, category }] of Object.entries(manifest.baseConversions)) {
      registry.registerBaseConversion(name, formatter, detail, category);
      if (aliases) {
        for (const alias of aliases) {
          registry.registerBaseConversion(alias, formatter, detail, category);
        }
      }
    }
  }

  if (manifest.help) {
    registry.registerHelpSections(manifest.help, "core");
  }
}
