/** Namespaced JSON persistence shared by games; callers own validation and migrations. */
export class SettingsStore {
  constructor(private readonly storage?: Storage) {}

  namespace(namespace: string): NamespacedSettingsStore {
    if (!namespace.trim()) throw new Error("Settings namespace cannot be empty.");
    return new NamespacedSettingsStore(this, namespace);
  }

  load<T>(key: string): T | null {
    const raw = this.getStorage().getItem(key);
    return raw === null ? null : JSON.parse(raw) as T;
  }

  save<T>(key: string, value: T): void {
    this.getStorage().setItem(key, JSON.stringify(value));
  }

  private getStorage(): Storage {
    return this.storage ?? window.localStorage;
  }
}

/** A game-scoped view that prevents registered games from sharing setting keys. */
export class NamespacedSettingsStore {
  constructor(private readonly store: SettingsStore, private readonly namespace: string) {}

  load<T>(key: string): T | null {
    return this.store.load<T>(this.getKey(key));
  }

  save<T>(key: string, value: T): void {
    this.store.save(this.getKey(key), value);
  }

  private getKey(key: string): string {
    if (!key.trim()) throw new Error("Settings key cannot be empty.");
    return `${this.namespace}:${key}`;
  }
}
