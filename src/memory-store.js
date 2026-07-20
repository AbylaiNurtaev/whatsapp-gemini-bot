const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class ExpiringMap {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
    this.items = new Map();
  }

  get(key) {
    const entry = this.items.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.items.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.items.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    this.sweep();
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.items.entries()) {
      if (entry.expiresAt <= now) this.items.delete(key);
    }
  }
}
