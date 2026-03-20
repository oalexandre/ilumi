export class EvalContext {
  private variables = new Map<string, number>();

  get(name: string): number | undefined {
    return this.variables.get(name);
  }

  set(name: string, value: number): void {
    this.variables.set(name, value);
  }

  has(name: string): boolean {
    return this.variables.has(name);
  }

  clear(): void {
    this.variables.clear();
  }
}
