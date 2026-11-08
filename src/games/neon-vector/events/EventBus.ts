import type { GameEventMap } from "../types";

type Listener<T> = (payload: T) => void;

/** Synchronous, typed event channel. Listener errors remain visible to callers. */
export class EventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): () => void {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }
    listeners.add(listener as Listener<never>);
    return () => listeners?.delete(listener as Listener<never>);
  }

  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export type GameEvents = EventBus<GameEventMap>;
