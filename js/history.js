// --- js/history.js ---
/**
 * Scientific Calculator Pro — Persistent Calculation History Manager
 */
class HistoryManager {
  constructor(storageManager, maxItems = 100) {
    this.storage = storageManager;
    this.maxItems = maxItems;
    this.items = this.storage ? this.storage.loadHistory() : [];
  }

  setLimit(limit) {
    this.maxItems = Math.min(Math.max(Number(limit) || 100, 10), 500);
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(0, this.maxItems);
      this._persist();
    }
  }

  addEntry(entry) {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      expression: String(entry.expression),
      result: Number(entry.result),
      timestamp: entry.timestamp || new Date().toISOString(),
      mode: entry.mode || 'simple',
      angleMode: entry.angleMode || 'DEG',
      precisionMode: entry.precisionMode || 'auto'
    };
    this.items.unshift(record);
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(0, this.maxItems);
    }
    this._persist();
    return record;
  }

  getEntry(id) {
    return this.items.find(item => item.id === id) || null;
  }

  removeEntry(id) {
    this.items = this.items.filter(item => item.id !== id);
    this._persist();
  }

  clearAll() {
    this.items = [];
    this._persist();
  }

  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [...this.items];
    return this.items.filter(item =>
      item.expression.toLowerCase().includes(q) ||
      String(item.result).toLowerCase().includes(q) ||
      item.mode.toLowerCase().includes(q)
    );
  }

  _persist() {
    if (this.storage) {
      this.storage.saveHistory(this.items);
    }
  }
}

export {
  HistoryManager
};
