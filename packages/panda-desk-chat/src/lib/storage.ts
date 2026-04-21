// Input: key-value pairs to persist
// Output: Stored/retrieved values from localStorage
// Pos: Lib layer — shared persistence abstraction

const PREFIX = 'panda-desk:';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // storage full or unavailable
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
