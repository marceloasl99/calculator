import { StorageManager } from './storage.js';
import { I18nManager } from './i18n.js';
import { CalculatorEngine } from './calculator-engine.js';
import { HistoryManager } from './history.js';

// --- js/state.js ---
/**
 * Scientific Calculator Pro — Centralized Application State
 */

class AppState {
  constructor() {
    this.storage = new StorageManager();
    this.preferences = this.storage.loadPreferences();
    this.i18n = new I18nManager(this.preferences.locale);
    this.engine = new CalculatorEngine({
      angleMode: this.preferences.angleMode,
      memory: 0,
      ans: 0
    });
    this.history = new HistoryManager(this.storage, this.preferences.historyLimit);
    this.expression = '';
    this.lastResult = 0;
    this.errorCode = null;
    this.sideTab = 'history'; // 'history' | 'expert'
    this.expertCategory = 'complex'; // 'complex'|'matrices'|'statistics'|'solver'|'calculus'|'units'|'numberTheory'
    this.viewportMode = 'auto'; // 'auto' | 'desktop' | 'mobile'
    this.confirmingClearHistory = false;
  }

  updatePreferences(partial) {
    this.preferences = this.storage.savePreferences({
      ...this.preferences,
      ...partial
    });
    this.i18n.setLocale(this.preferences.locale);
    this.engine.setAngleMode(this.preferences.angleMode);
    this.history.setLimit(this.preferences.historyLimit);
    return this.preferences;
  }
}

export {
  AppState
};
