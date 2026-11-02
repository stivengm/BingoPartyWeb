/** Ventana deslizante sencilla: `hit` devuelve false si se superó el tope. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(max: number, windowMs: number, now: () => number = Date.now) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
  }

  hit(key: string): boolean {
    const t = this.now();
    const recent = (this.hits.get(key) ?? []).filter((h) => t - h < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(t);
    this.hits.set(key, recent);
    return true;
  }

  /** Limpia claves sin actividad reciente. */
  prune(): void {
    const t = this.now();
    for (const [key, list] of this.hits) {
      if (list.every((h) => t - h >= this.windowMs)) this.hits.delete(key);
    }
  }
}
