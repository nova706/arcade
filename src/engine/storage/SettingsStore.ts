/** Namespaced JSON persistence shared by games; callers own validation and migrations. */
export class SettingsStore {
  constructor(private readonly storage?: Storage) {}

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
