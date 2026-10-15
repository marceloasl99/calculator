// --- js/storage.js ---
/**
 * Scientific Calculator Pro — Safe LocalStorage Manager with Schema Validation & Fallback Recovery
 */

const STORAGE_KEYS = {
  PREFERENCES: 'scp_preferences_v1',
  HISTORY: 'scp_history_v1',
  MEMORY: 'scp_memory_v1'
};

const DEFAULT_PREFERENCES = {
  locale: 'pt-BR',
  theme: 'ocean',
  customAccent: '',
  mode: 'intermediate',
  angleMode: 'DEG',
  precisionMode: 'auto',
  decimalPlaces: 6,
  scientificNotation: false,
  showFraction: false,
  soundEnabled: false,
  historyLimit: 100
};

const VALID_LOCALES = ['en', 'es', 'pt-BR', 'it', 'fr', 'de'];
const VALID_THEMES = ['light', 'dark', 'auto', 'graphite', 'ocean', 'purple', 'emerald', 'high-contrast'];
const VALID_MODES = ['simple', 'intermediate', 'expert'];
const VALID_ANGLES = ['DEG', 'RAD', 'GRAD'];

function validatePreferences(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES };
  return {
    locale: VALID_LOCALES.includes(raw.locale) ? raw.locale : DEFAULT_PREFERENCES.locale,
    theme: VALID_THEMES.includes(raw.theme) ? raw.theme : DEFAULT_PREFERENCES.theme,
    customAccent: typeof raw.customAccent === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.customAccent) ? raw.customAccent : '',
    mode: VALID_MODES.includes(raw.mode) ? raw.mode : DEFAULT_PREFERENCES.mode,
    angleMode: VALID_ANGLES.includes(raw.angleMode) ? raw.angleMode : DEFAULT_PREFERENCES.angleMode,
    precisionMode: raw.precisionMode === 'fixed' ? 'fixed' : 'auto',
    decimalPlaces: Number.isInteger(Number(raw.decimalPlaces)) ? Math.min(Math.max(Number(raw.decimalPlaces), 0), 12) : 6,
    scientificNotation: Boolean(raw.scientificNotation),
    showFraction: Boolean(raw.showFraction),
    soundEnabled: Boolean(raw.soundEnabled),
    historyLimit: Number.isInteger(Number(raw.historyLimit)) ? Math.min(Math.max(Number(raw.historyLimit), 10), 500) : 100
  };
}

class StorageManager {
  constructor(backingStore = null) {
    this.memoryFallback = new Map();
    this.backingStore = backingStore;
  }

  _getStore() {
    if (this.backingStore) return this.backingStore;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (_) {
      // Blocked in sandboxed iframe
    }
    return null;
  }

  loadPreferences() {
    try {
      const store = this._getStore();
      const rawStr = store ? store.getItem(STORAGE_KEYS.PREFERENCES) : this.memoryFallback.get(STORAGE_KEYS.PREFERENCES);
      if (!rawStr) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(rawStr);
      return validatePreferences(parsed);
    } catch (_) {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  savePreferences(prefs) {
    const validated = validatePreferences(prefs);
    const serialized = JSON.stringify(validated);
    try {
      const store = this._getStore();
      if (store) store.setItem(STORAGE_KEYS.PREFERENCES, serialized);
      else this.memoryFallback.set(STORAGE_KEYS.PREFERENCES, serialized);
    } catch (_) {
      this.memoryFallback.set(STORAGE_KEYS.PREFERENCES, serialized);
    }
    return validated;
  }

  loadHistory() {
    try {
      const store = this._getStore();
      const rawStr = store ? store.getItem(STORAGE_KEYS.HISTORY) : this.memoryFallback.get(STORAGE_KEYS.HISTORY);
      if (!rawStr) return [];
      const parsed = JSON.parse(rawStr);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item =>
        item &&
        typeof item.expression === 'string' &&
        typeof item.result === 'number' &&
        Number.isFinite(item.result)
      );
    } catch (_) {
      return [];
    }
  }

  saveHistory(items) {
    const serialized = JSON.stringify(items);
    try {
      const store = this._getStore();
      if (store) store.setItem(STORAGE_KEYS.HISTORY, serialized);
      else this.memoryFallback.set(STORAGE_KEYS.HISTORY, serialized);
    } catch (_) {
      this.memoryFallback.set(STORAGE_KEYS.HISTORY, serialized);
    }
  }
}

export {
  STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  VALID_LOCALES,
  VALID_THEMES,
  VALID_MODES,
  VALID_ANGLES,
  validatePreferences,
  StorageManager
};
