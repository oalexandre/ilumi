export interface UnitDefinition {
  id: string;
  phrases: string;
  baseUnitId: string;
  format: string;
  ratio: number;
  /** Optional custom conversion for non-linear units like temperature */
  toBase?: (value: number) => number;
  fromBase?: (value: number) => number;
}

export class UnitRegistry {
  private units = new Map<string, UnitDefinition>();
  private phraseIndex = new Map<string, string>();

  addUnit(definition: UnitDefinition): void {
    this.units.set(definition.id, definition);

    const phrases = definition.phrases.split(",").map((p) => p.trim().toLowerCase());
    for (const phrase of phrases) {
      if (phrase) {
        this.phraseIndex.set(phrase, definition.id);
      }
    }
    // Also index by id
    this.phraseIndex.set(definition.id.toLowerCase(), definition.id);
  }

  findByPhrase(phrase: string): UnitDefinition | undefined {
    const id = this.phraseIndex.get(phrase.toLowerCase());
    if (!id) return undefined;
    return this.units.get(id);
  }

  getById(id: string): UnitDefinition | undefined {
    return this.units.get(id);
  }

  hasPhrase(phrase: string): boolean {
    return this.phraseIndex.has(phrase.toLowerCase());
  }

  convert(value: number, fromId: string, toId: string): number {
    const from = this.units.get(fromId);
    const to = this.units.get(toId);

    if (!from) throw new Error(`Unknown unit "${fromId}"`);
    if (!to) throw new Error(`Unknown unit "${toId}"`);

    if (from.baseUnitId !== to.baseUnitId && from.id !== to.baseUnitId && to.id !== from.baseUnitId) {
      // Check if they share a common base
      const fromBase = this.resolveBaseUnit(from);
      const toBase = this.resolveBaseUnit(to);
      if (fromBase !== toBase) {
        throw new Error(`Cannot convert between "${from.format}" and "${to.format}" (incompatible units)`);
      }
    }

    // Convert to base unit, then to target
    const baseValue = this.toBase(value, from);
    return this.fromBase(baseValue, to);
  }

  private resolveBaseUnit(unit: UnitDefinition): string {
    // If this unit IS a base unit (baseUnitId refers to itself or the base exists)
    const base = this.units.get(unit.baseUnitId);
    if (!base) return unit.baseUnitId;
    if (base.id === base.baseUnitId) return base.id;
    return base.baseUnitId;
  }

  private toBase(value: number, unit: UnitDefinition): number {
    if (unit.toBase) return unit.toBase(value);
    return value * unit.ratio;
  }

  private fromBase(baseValue: number, unit: UnitDefinition): number {
    if (unit.fromBase) return unit.fromBase(baseValue);
    return baseValue / unit.ratio;
  }

  getAllPhrases(): string[] {
    return [...this.phraseIndex.keys()];
  }

  /** Get all units compatible with the given unit (same base dimension) */
  getCompatiblePhrases(phrase: string): string[] {
    const unit = this.findByPhrase(phrase);
    if (!unit) return [];
    const base = this.resolveBaseUnit(unit);

    const compatible: string[] = [];
    for (const [, def] of this.units) {
      if (def.id === unit.id) continue;
      if (this.resolveBaseUnit(def) === base) {
        // Add the primary phrase (first one)
        const primary = def.phrases.split(",")[0]?.trim();
        if (primary) compatible.push(primary);
      }
    }
    return compatible;
  }

  /** Get all unit definitions grouped by base */
  getAllUnits(): UnitDefinition[] {
    return [...this.units.values()];
  }
}
