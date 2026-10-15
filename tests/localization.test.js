import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPPORTED_LOCALES,
  formatResult,
  getLocaleSeparators,
  formatExpressionForDisplay
} from '../js/formatting.js';

import { CalculatorEngine } from '../js/calculator-engine.js';
import { StorageManager, DEFAULT_PREFERENCES } from '../js/storage.js';
import { HistoryManager } from '../js/history.js';
import { TRANSLATIONS, I18nManager } from '../js/i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('all six locale JSON files exist and have consistent structure', () => {
  const localesDir = path.join(__dirname, '..', 'locales');
  const requiredKeys = ['appTitle', 'appSubtitle', 'modes', 'themes', 'angles', 'labels', 'expertTabs', 'unitCategories', 'errors'];

  for (const loc of SUPPORTED_LOCALES) {
    const filePath = path.join(localesDir, `${loc}.json`);
    assert.ok(fs.existsSync(filePath), `Missing locale file: ${loc}.json`);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const key of requiredKeys) {
      assert.ok(Object.prototype.hasOwnProperty.call(data, key), `Locale ${loc} missing key '${key}'`);
    }

    assert.equal(typeof data.modes.simple, 'string');
    assert.equal(typeof data.modes.intermediate, 'string');
    assert.equal(typeof data.modes.expert, 'string');

    assert.equal(typeof data.errors.ERR_DIV_ZERO, 'string');
    assert.equal(typeof data.errors.ERR_LOG_DOMAIN, 'string');
    assert.equal(typeof data.errors.ERR_SINGULAR_MATRIX, 'string');
  }
});

test('regional number formatting correctly formats decimals and thousands for all locales', () => {
  const testVal = 12345.67;

  // en: 12,345.67
  const enStr = formatResult(testVal, { locale: 'en', precisionMode: 'fixed', decimalPlaces: 2 });
  assert.ok(enStr.includes('12') && enStr.includes('345') && enStr.includes('.67'));

  // pt-BR: 12.345,67
  const ptStr = formatResult(testVal, { locale: 'pt-BR', precisionMode: 'fixed', decimalPlaces: 2 });
  assert.ok(ptStr.includes('12') && ptStr.includes('345') && ptStr.includes(',67'));

  // de: 12.345,67 or 12 345,67
  const deStr = formatResult(testVal, { locale: 'de', precisionMode: 'fixed', decimalPlaces: 2 });
  assert.ok(deStr.includes(',67'));

  // fr: 12 345,67
  const frStr = formatResult(testVal, { locale: 'fr', precisionMode: 'fixed', decimalPlaces: 2 });
  assert.ok(frStr.includes(',67'));
});

test('parser accepts both comma and dot decimal inputs across cultures', () => {
  const engine = new CalculatorEngine();
  const valDot = engine.evaluate('1.5 + 2.25');
  const valComma = engine.evaluate('1,5 + 2,25');
  assert.equal(valDot, 3.75);
  assert.equal(valComma, 3.75);
});

test('i18n manager correctly translates keys and handles fallback', () => {
  const i18n = new I18nManager('pt-BR');
  assert.equal(i18n.t('modes.simple'), 'Simples');
  assert.equal(i18n.t('errors.ERR_DIV_ZERO'), TRANSLATIONS['pt-BR'].errors.ERR_DIV_ZERO);

  i18n.setLocale('en');
  assert.equal(i18n.t('modes.simple'), 'Simple');
  assert.equal(i18n.t('errors.ERR_DIV_ZERO'), 'Division by zero is undefined.');

  // Unknown key fallback
  assert.equal(i18n.t('nonexistent.key', 'FallbackText'), 'FallbackText');
});

test('storage manager saves preferences and safely handles corrupted data', () => {
  const storage = new StorageManager();
  storage.savePreferences({ locale: 'it', theme: 'purple', mode: 'expert', angleMode: 'RAD' });
  const loaded = storage.loadPreferences();
  assert.equal(loaded.locale, 'it');
  assert.equal(loaded.theme, 'purple');
  assert.equal(loaded.mode, 'expert');
  assert.equal(loaded.angleMode, 'RAD');

  // Corrupted data test
  storage.memoryFallback.set('scp_preferences_v1', '{invalid_json_corrupted');
  const recovered = storage.loadPreferences();
  assert.equal(recovered.locale, DEFAULT_PREFERENCES.locale);
  assert.equal(recovered.theme, DEFAULT_PREFERENCES.theme);
});

test('history manager supports adding, retrieving, searching, removing, and clearing items', () => {
  const storage = new StorageManager();
  const hist = new HistoryManager(storage, 50);
  hist.clearAll();

  const item1 = hist.addEntry({ expression: '2 + 3 * 4', result: 14, mode: 'simple' });
  const item2 = hist.addEntry({ expression: 'sin(30)', result: 0.5, mode: 'intermediate' });
  const item3 = hist.addEntry({ expression: '√81', result: 9, mode: 'intermediate' });

  assert.equal(hist.items.length, 3);
  assert.equal(hist.getEntry(item1.id).result, 14);

  const searchSin = hist.search('sin');
  assert.equal(searchSin.length, 1);
  assert.equal(searchSin[0].result, 0.5);

  hist.removeEntry(item2.id);
  assert.equal(hist.items.length, 2);
  assert.equal(hist.search('sin').length, 0);

  hist.clearAll();
  assert.equal(hist.items.length, 0);
});
