import { AppState } from './state.js';
import { initKeyboardShortcuts } from './keyboard.js';
import {
  formatResult,
  formatExpressionForDisplay,
  getLocaleSeparators,
  SUPPORTED_LOCALES
} from './formatting.js';
import { decimalToFraction, CalculatorEngine } from './calculator-engine.js';
import {
  PHYSICAL_CONSTANTS,
  compileExpression,
  gcdTwo,
  lcmTwo,
  nPrCalc,
  nCrCalc
} from './expression-parser.js';
import { Complex } from './tools/complex.js';
import {
  matrixAdd,
  matrixSub,
  matrixScalar,
  matrixMultiply,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  matrixTrace,
  solveLinearSystem
} from './tools/matrices.js';
import { analyzeDataset, parseDataset } from './tools/statistics.js';
import { solveEquation } from './tools/equation-solver.js';
import { numericalDerivative, numericalIntegral } from './tools/calculus.js';
import { primeFactorization, convertBase, bitwiseOperation } from './tools/number-theory.js';
import { compoundInterest, loanSchedule, convertRate } from './tools/finance.js';
import { sampleFunction, niceStep } from './tools/graphing.js';
import { UNIT_CATEGORIES, convertUnit } from './unit-conversions.js';
import { DEFAULT_PREFERENCES, StorageManager } from './storage.js';
import { HistoryManager } from './history.js';
import { TRANSLATIONS } from './i18n.js';

const APP_VERSION = '2.0.0';

// --- tests/math-tests.js ---
/**
 * Scientific Calculator Pro — In-browser mathematical & expert suite tests
 */

function runMathTests() {
  const results = [];
  const engine = new CalculatorEngine({ angleMode: 'DEG' });

  function assertApprox(id, name, actual, expected, tol = 1e-9) {
    const pass = typeof actual === 'number' && !Number.isNaN(actual) && Math.abs(actual - expected) <= tol;
    results.push({ id, name, pass, expected, actual });
  }

  function assertEqual(id, name, actual, expected) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ id, name, pass, expected, actual });
  }

  function assertThrowsCode(id, name, fn, expectedCode) {
    let actualCode = null;
    try {
      fn();
    } catch (e) {
      actualCode = e.code || e.message;
    }
    const pass = actualCode === expectedCode;
    results.push({ id, name, pass, expected: expectedCode, actual: actualCode });
  }

  assertApprox(1, 'Basic addition: 2 + 2 = 4', engine.evaluate('2 + 2'), 4);
  assertApprox(2, 'Operator precedence: 2 + 3 × 4 = 14', engine.evaluate('2 + 3 × 4'), 14);
  assertApprox(3, 'Parentheses precedence: (2 + 3) × 4 = 20', engine.evaluate('(2 + 3) × 4'), 20);
  assertApprox(4, 'Exponentiation: 2^10 = 1024', engine.evaluate('2^10'), 1024);
  assertApprox(5, 'Square root: √81 = 9', engine.evaluate('√81'), 9);
  assertApprox(6, 'Base-10 logarithm: log10(1000) = 3', engine.evaluate('log10(1000)'), 3);
  assertApprox(7, 'Natural logarithm: ln(e) = 1', engine.evaluate('ln(e)'), 1);
  engine.setAngleMode('DEG');
  assertApprox(8, 'Trigonometry in DEG: sin(30) = 0.5', engine.evaluate('sin(30)'), 0.5);
  assertApprox(9, 'Trigonometry in DEG: cos(60) = 0.5', engine.evaluate('cos(60)'), 0.5);
  engine.setAngleMode('RAD');
  const sinPi2 = engine.evaluate('sin(pi / 2)');
  engine.setAngleMode('GRAD');
  const sin100Grad = engine.evaluate('sin(100)');
  engine.setAngleMode('DEG');
  assertEqual(10, 'Angle mode switching DEG -> RAD -> GRAD', [sinPi2, sin100Grad], [1, 1]);
  assertEqual(11, 'Percentage: 25% = 0.25 and 200 + 10% = 220', [engine.evaluate('25%'), engine.evaluate('200 + 10%')], [0.25, 220]);
  engine.memoryClear();
  engine.memoryStore(10);
  engine.memoryAdd(5);
  engine.memorySubtract(3);
  const memRecalled = engine.memoryRecall();
  engine.memoryClear();
  assertEqual(12, 'Memory lifecycle (MS 10, M+ 5, M- 3 -> MR = 12, MC = 0)', [memRecalled, engine.memoryRecall()], [12, 0]);
  assertThrowsCode(13, 'Division by zero error handling', () => engine.evaluate('15 / 0'), 'ERR_DIV_ZERO');
  assertThrowsCode(14, 'Logarithm of negative number error handling', () => engine.evaluate('ln(-5)'), 'ERR_LOG_DOMAIN');
  assertThrowsCode(15, 'Unclosed parentheses error handling', () => engine.evaluate('(2 + 3 * (4 - 1)'), 'ERR_UNCLOSED_PAREN');
  assertThrowsCode(16, 'Invalid character error handling', () => engine.evaluate('2 + $3'), 'ERR_INVALID_CHAR');
  const matProd = matrixMultiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
  assertEqual(20, 'Matrix multiplication [[1,2],[3,4]] × [[5,6],[7,8]]', matProd, [[19, 22], [43, 50]]);
  assertThrowsCode(21, 'Singular matrix inversion error handling', () => matrixInverse([[1, 2], [2, 4]]), 'ERR_SINGULAR_MATRIX');
  const stats = analyzeDataset([2, 4, 4, 4, 5, 5, 7, 9]);
  assertEqual(22, 'Statistics reference dataset (mean=5, popStdDev=2, median=4.5, mode=[4])', [stats.mean, stats.popStdDev, stats.median, stats.modes], [5, 2, 4.5, [4]]);
  const eqSol = solveEquation({ expression: 'x^2 - 9', variable: 'x', method: 'bisection', a: 0, b: 5, tolerance: 1e-8 });
  assertApprox(23, 'Numerical equation solver: x^2 - 9 = 0 on [0, 5] -> 3', eqSol.root, 3, 1e-6);
  const deriv = numericalDerivative({ expression: 'x^2', variable: 'x', x0: 3 });
  assertApprox(24, 'Numerical derivative of x^2 at x = 3 -> 6', deriv.value, 6, 1e-8);
  const integ = numericalIntegral({ expression: 'x^2', variable: 'x', a: 0, b: 3, tolerance: 1e-8 });
  assertApprox(25, 'Numerical definite integral of x^2 on [0, 3] -> 9', integ.value, 9, 1e-6);
  assertApprox(26, 'IEEE 754 cleanup: 0.1 + 0.2 = 0.3 exact', engine.evaluate('0.1 + 0.2'), 0.3, 0);
  assertApprox(27, 'Implicit multiplication & nested groups: 2(3 + 4(1 + 1)) = 22', engine.evaluate('2(3 + 4(1 + 1))'), 22);
  const cMul = Complex.mul(new Complex(3, 2), new Complex(1, 4));
  assertEqual(28, 'Complex multiplication: (3+2i)(1+4i) = -5 + 14i', [cMul.re, cMul.im], [-5, 14]);
  assertEqual(29, 'Temperature conversion: 100 °C = 212 °F = 373.15 K', [convertUnit(100, 'temperature', 'C', 'F'), convertUnit(100, 'temperature', 'C', 'K')], [212, 373.15]);
  const pf = primeFactorization(360);
  assertEqual(30, 'Prime factorization of 360 = 2^3 × 3^2 × 5 & fraction 0.75 = 3/4', [pf.formatted, decimalToFraction(0.75).str], ['2^3 × 3^2 × 5', '3/4']);

  // v2 features
  const varEngine = new CalculatorEngine({ angleMode: 'RAD' });
  varEngine.run('r = 2');
  assertApprox(31, 'Variables: r = 2 then π r^2 = 4π', varEngine.run('π r^2').value, 4 * Math.PI, 1e-9);
  assertThrowsCode(32, 'Variables: reserved names are rejected (sin = 3)', () => varEngine.run('sin = 3'), 'ERR_RESERVED_NAME');
  assertApprox(33, 'Physical constants: NA × kB = R', engine.evaluate('NA kB'), 8.31446261815, 1e-9);
  const f = compileExpression('x^2 - 4', { variable: 'x' });
  const plot = sampleFunction('x^2 - 4', { xMin: -5, xMax: 5, samples: 200 });
  assertEqual(34, 'Plotter: compiled f(3) = 5 and roots of x^2 - 4 are ±2', [f(3), plot.roots.map(Math.round).sort((a, b) => a - b)], [5, [-2, 2]]);
  const price = loanSchedule({ amount: 10000, ratePercent: 1, periods: 12, system: 'price' });
  assertApprox(35, 'Finance: Price installment for 10 000 at 1% × 12 = 888.49', Math.round(price.firstPayment * 100) / 100, 888.49, 1e-9);
  const ci = compoundInterest({ principal: 1000, ratePercent: 10, periods: 2 });
  assertApprox(36, 'Finance: compound interest 1000 at 10% for 2 periods = 1210', ci.futureValue, 1210, 1e-9);

  return results;
}

// --- tests/localization-tests.js ---
/**
 * Scientific Calculator Pro — Localization, formatting, storage & history tests.
 * Runs against an isolated in-memory store so it never touches the user's saved data.
 */

function createMemoryStore() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}

function runLocalizationAndStateTests() {
  const results = [];
  const engine = new CalculatorEngine();

  const formattedPerLocale = {};
  let allLocalesValid = true;
  for (const loc of SUPPORTED_LOCALES) {
    const str = formatResult(12345.67, { locale: loc, precisionMode: 'fixed', decimalPlaces: 2 });
    formattedPerLocale[loc] = str;
    if (!str || typeof str !== 'string') allLocalesValid = false;
    const dict = TRANSLATIONS[loc];
    if (!dict || !dict.modes || !dict.themes || !dict.errors || !dict.expertTabs || !dict.lab || !dict.constants) {
      allLocalesValid = false;
    }
  }
  const valComma = engine.evaluate('1,5 + 2,25');
  const valDot = engine.evaluate('1.5 + 2.25');
  results.push({
    id: 17,
    name: 'Regional formatting & decimal parsing across 6 languages (en, es, pt-BR, it, fr, de)',
    pass: allLocalesValid && valComma === 3.75 && valDot === 3.75,
    expected: '6 valid locales + 1,5 + 2,25 = 3.75',
    actual: `Locales OK=${allLocalesValid}, commaSum=${valComma}, pt-BR=${formattedPerLocale['pt-BR']}, en=${formattedPerLocale.en}`
  });

  const memStore = createMemoryStore();
  const storage = new StorageManager(memStore);
  storage.savePreferences({ locale: 'fr', theme: 'emerald', mode: 'expert', angleMode: 'RAD' });
  const loaded = storage.loadPreferences();
  memStore.setItem('scp_preferences_v1', '{corrupted_json');
  const recovered = storage.loadPreferences();
  results.push({
    id: 18,
    name: 'Persistence of theme & language + corrupted storage fallback recovery',
    pass: loaded.locale === 'fr' && loaded.theme === 'emerald' && recovered.locale === DEFAULT_PREFERENCES.locale,
    expected: `Saved (fr, emerald) & recovered (${DEFAULT_PREFERENCES.locale})`,
    actual: `Saved=(${loaded.locale}, ${loaded.theme}), Recovered=(${recovered.locale})`
  });

  const hist = new HistoryManager(storage, 50);
  const item1 = hist.addEntry({ expression: '2 + 3 * 4', result: 14, mode: 'simple', angleMode: 'DEG' });
  hist.addEntry({ expression: 'sin(30)', result: 0.5, mode: 'intermediate', angleMode: 'DEG' });
  const retrieved = hist.getEntry(item1.id);
  const searchSin = hist.search('sin');
  hist.removeEntry(item1.id);
  const countAfterDelete = hist.items.length;
  hist.clearAll();
  results.push({
    id: 19,
    name: 'Calculation history add, retrieve, search, delete, and clear',
    pass: retrieved && retrieved.result === 14 && searchSin.length === 1 && countAfterDelete === 1 && hist.items.length === 0,
    expected: 'retrieved=14, search=1, afterDelete=1, afterClear=0',
    actual: `retrieved=${retrieved?.result}, search=${searchSin.length}, afterDelete=${countAfterDelete}, afterClear=${hist.items.length}`
  });

  return results;
}

// --- UI Controller ---
/**
 * Scientific Calculator Pro v2 — Interactive UI Controller
 */

function createAudioFeedback() {
  let ctx = null;
  return function playClick(freq = 520) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (_) {
      // Ignore audio errors
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

const OPERATOR_START = /^[+\-×÷*/^%!]|^\^|^ mod /;
const TRIG_LABEL_KEYS = { sin: 'trigSin', cos: 'trigCos', tan: 'trigTan', asin: 'trigAsin', acos: 'trigAcos', atan: 'trigAtan' };

function bootstrapApp() {
  const state = new AppState();
  const playBeep = createAudioFeedback();
  const $ = (id) => document.getElementById(id);

  // Matrix state in UI
  const matADims = { rows: 2, cols: 2 };
  const matBDims = { rows: 2, cols: 2 };
  const matAData = [[1, 2], [3, 4]];
  const matBData = [[5, 6], [7, 8]];

  // Keypad layers, caret & history navigation
  let layer2nd = false;
  let layerHyp = false;
  let caret = null; // null = end of expression
  let justEvaluated = false;
  let historyCursor = -1;

  // DOM Elements
  const shellEl = $('scp-app-shell');
  const titleEl = $('scp-app-title');
  const subtitleEl = $('scp-app-subtitle');
  const exprInput = $('calc-expression-input');
  const previewEl = $('calc-preview');
  const resultDisplay = $('calc-result-display');
  const fractionBadge = $('calc-fraction-badge');
  const errorBanner = $('calc-error-banner');
  const badgeMode = $('badge-active-mode');
  const badgeAngle = $('badge-active-angle');
  const badgeMemory = $('badge-memory-val');
  const badgeAns = $('badge-ans-val');
  const sciGrid = $('scp-scientific-keypad');
  const decimalKeyBtn = $('key-decimal-sep');
  const variablesStrip = $('variables-strip');

  const langSelect = $('select-locale');
  const themeSelect = $('select-theme');
  const viewportSelect = $('select-viewport');

  const historyTabBtn = $('tab-btn-history');
  const expertTabBtn = $('tab-btn-expert');
  const libraryTabBtn = $('tab-btn-library');
  const historyPanel = $('panel-history');
  const expertPanel = $('panel-expert');
  const libraryPanel = $('panel-library');
  const historySearchInput = $('input-history-search');
  const historyListEl = $('history-list-container');
  const clearHistoryBtn = $('btn-clear-history');

  const toastEl = $('scp-toast');
  let toastTimer = null;

  const t = (key, fallback) => state.i18n.t(key, fallback);
  const tf = (key, params = {}) => String(t(key)).replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
  const fmt = (v, extra = {}) => (v === null || v === undefined ? '—' : formatResult(v, { locale: state.preferences.locale, ...extra }));
  // Lab result cards favour readability over full precision
  const fmtLab = (v) => fmt(v, { maxFractionDigits: 6 });
  const SUPER_DIGITS = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  // Escapes a formatted number and renders "× 10⁻³⁴" exponents as <sup> (monospace fonts lack most superscript glyphs)
  const numHtml = (text) => escapeHtml(text).replace(/× 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, exp) => `× 10<sup>${exp.replace(/./g, (ch) => SUPER_DIGITS[ch])}</sup>`);

  // Remember the factory labels of dual-layer keys
  document.querySelectorAll('[data-insert-2nd]').forEach(btn => {
    btn.dataset.label1st = btn.textContent;
  });

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2400);
  }

  function copyTextToClipboard(text, message = t('labels.copied')) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text)).then(() => showToast(message)).catch(() => fallbackCopy(text, message));
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const ta = document.createElement('textarea');
    ta.value = String(text);
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(message);
    } catch (_) {}
    document.body.removeChild(ta);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('hidden');
    const focusable = el.querySelector('button, input, select, textarea');
    if (focusable) focusable.focus();
  }

  function closeModal(el) {
    if (el) el.classList.add('hidden');
  }

  // ==================== THEME, VIEWPORT & LAYOUT ====================
  function applyTheme() {
    const theme = state.preferences.theme || 'ocean';
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    const accent = state.preferences.customAccent;
    if (accent) {
      root.style.setProperty('--color-primary', accent);
      root.style.setProperty('--color-on-primary', hexLuminance(accent) > 0.45 ? '#0b1020' : '#ffffff');
    } else {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-on-primary');
    }
    if (themeSelect) themeSelect.value = theme;
    const accentInput = $('setting-custom-accent');
    if (accentInput) {
      accentInput.value = accent || toHexColor(getComputedStyle(root).getPropertyValue('--color-primary')) || '#38bdf8';
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', getComputedStyle(root).getPropertyValue('--color-background').trim() || '#0b1020');
    requestGraphRender();
  }

  function toHexColor(value) {
    const v = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : '';
  }

  function applyViewportMode() {
    if (!shellEl) return;
    shellEl.classList.toggle('viewport-mobile', state.viewportMode === 'mobile');
    if (viewportSelect) viewportSelect.value = state.viewportMode;
    requestGraphRender();
  }

  function setMobileView(view) {
    state.mobileView = view;
    if (shellEl) shellEl.setAttribute('data-mobile-view', view);
    document.querySelectorAll('[data-mobile-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mobile-nav') === view);
    });
    if (view !== 'calc') setSideTab(view);
    window.scrollTo({ top: 0 });
  }

  function setSideTab(tabName) {
    const valid = ['history', 'expert', 'library'];
    const tab = valid.includes(tabName) ? tabName : 'history';
    state.sideTab = tab;
    if (historyTabBtn) historyTabBtn.classList.toggle('active', tab === 'history');
    if (expertTabBtn) expertTabBtn.classList.toggle('active', tab === 'expert');
    if (libraryTabBtn) libraryTabBtn.classList.toggle('active', tab === 'library');
    if (historyPanel) historyPanel.classList.toggle('hidden', tab !== 'history');
    if (expertPanel) expertPanel.classList.toggle('hidden', tab !== 'expert');
    if (libraryPanel) libraryPanel.classList.toggle('hidden', tab !== 'library');
    if (state.mobileView !== 'calc' && state.mobileView !== tab) {
      state.mobileView = tab;
      if (shellEl) shellEl.setAttribute('data-mobile-view', tab);
      document.querySelectorAll('[data-mobile-nav]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mobile-nav') === tab);
      });
    }
    if (tab === 'expert') requestGraphRender();
  }

  function setExpertCategory(catKey) {
    const exists = document.querySelector(`[data-expert-section="${catKey}"]`);
    const key = exists ? catKey : 'graph';
    state.expertCategory = key;
    document.querySelectorAll('[data-expert-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-expert-tab') === key);
    });
    document.querySelectorAll('[data-expert-section]').forEach(sec => {
      sec.classList.toggle('hidden', sec.getAttribute('data-expert-section') !== key);
    });
    if (key === 'graph') requestGraphRender();
  }

  function updateModeLayout() {
    const mode = state.preferences.mode;
    if (sciGrid) sciGrid.classList.toggle('hidden', mode === 'simple');
    if (mode === 'expert' && state.sideTab !== 'expert') setSideTab('expert');
  }

  // ==================== DISPLAY ====================
  function showError(err) {
    state.errorCode = err && err.code ? err.code : 'ERR_SYNTAX';
    if (errorBanner) {
      errorBanner.textContent = state.i18n.translateError(err);
      errorBanner.classList.remove('hidden');
    }
  }

  function clearError() {
    state.errorCode = null;
    if (errorBanner) {
      errorBanner.textContent = '';
      errorBanner.classList.add('hidden');
    }
  }

  function updateDisplay() {
    const prefs = state.preferences;
    const { decimal } = getLocaleSeparators(prefs.locale);
    if (decimalKeyBtn) decimalKeyBtn.textContent = decimal;

    if (exprInput && document.activeElement !== exprInput) {
      exprInput.value = state.expression;
    }

    const formattedRes = formatResult(state.lastResult, {
      locale: prefs.locale,
      precisionMode: prefs.precisionMode,
      decimalPlaces: prefs.decimalPlaces,
      scientificNotation: prefs.scientificNotation,
      showFraction: prefs.showFraction
    });
    if (resultDisplay && resultDisplay.dataset.value !== formattedRes) {
      resultDisplay.dataset.value = formattedRes;
      resultDisplay.innerHTML = numHtml(formattedRes);
      resultDisplay.classList.toggle('long', formattedRes.length > 13);
      resultDisplay.classList.toggle('very-long', formattedRes.length > 20);
      resultDisplay.classList.remove('flash');
      void resultDisplay.offsetWidth;
      resultDisplay.classList.add('flash');
    }

    if (fractionBadge) {
      const frac = prefs.showFraction ? null : decimalToFraction(state.lastResult, 10000);
      fractionBadge.textContent = frac && !frac.isInteger ? `= ${frac.str}` : '';
    }

    if (badgeMode) badgeMode.textContent = t(`modes.${prefs.mode}`);
    if (badgeAngle) badgeAngle.textContent = prefs.angleMode;
    if (badgeMemory) {
      badgeMemory.textContent = `M: ${fmt(state.engine.memory)}`;
      badgeMemory.classList.toggle('active-toggle', state.engine.memory !== 0);
    }
    if (badgeAns) badgeAns.textContent = `ans: ${fmt(state.engine.ans)}`;

    const btnFrac = $('btn-toggle-fraction');
    if (btnFrac) btnFrac.classList.toggle('active-toggle', Boolean(prefs.showFraction));
    const btnSci = $('btn-toggle-sci');
    if (btnSci) btnSci.classList.toggle('active-toggle', Boolean(prefs.scientificNotation));

    updatePreview();
  }

  function updatePreview() {
    if (!previewEl) return;
    const expr = state.expression.trim();
    if (!state.preferences.livePreview || !expr || justEvaluated) {
      previewEl.textContent = '';
      return;
    }
    try {
      const value = state.engine.preview(expr, { angleMode: state.preferences.angleMode });
      const formatted = fmt(value, {
        precisionMode: state.preferences.precisionMode,
        decimalPlaces: state.preferences.decimalPlaces,
        scientificNotation: state.preferences.scientificNotation
      });
      previewEl.innerHTML = `= ${numHtml(formatted)}`;
    } catch (_) {
      previewEl.textContent = '';
    }
  }

  function setExpression(expr, newCaret = null) {
    state.expression = expr;
    justEvaluated = false;
    caret = newCaret;
    if (exprInput) {
      exprInput.value = expr;
      if (document.activeElement === exprInput) {
        const pos = newCaret === null ? expr.length : newCaret;
        exprInput.setSelectionRange(pos, pos);
      }
    }
    updateDisplay();
  }

  function currentCaret() {
    const len = state.expression.length;
    if (caret === null || caret > len) return len;
    return caret;
  }

  // ==================== TRANSLATIONS ====================
  function applyTranslations() {
    document.documentElement.lang = state.preferences.locale;
    if (titleEl && titleEl.firstChild) titleEl.firstChild.nodeValue = `${t('appTitle')} `;
    if (subtitleEl) subtitleEl.textContent = t('appSubtitle');
    if (langSelect) langSelect.value = state.preferences.locale;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const text = t(el.getAttribute('data-i18n-title'));
      el.setAttribute('title', text);
      el.setAttribute('aria-label', text);
    });

    document.querySelectorAll('[data-mode-select]').forEach(btn => {
      const m = btn.getAttribute('data-mode-select');
      btn.textContent = t(`modes.${m}`);
      btn.classList.toggle('active', state.preferences.mode === m);
    });

    document.querySelectorAll('[data-angle-select]').forEach(btn => {
      btn.classList.toggle('active', state.preferences.angleMode === btn.getAttribute('data-angle-select'));
    });

    if (themeSelect) {
      Array.from(themeSelect.options).forEach(opt => {
        opt.textContent = t(`themes.${opt.value}`);
      });
    }

    document.querySelectorAll('[data-expert-tab]').forEach(btn => {
      const key = btn.getAttribute('data-expert-tab');
      btn.textContent = t(`expertTabs.${key}`);
      btn.classList.toggle('active', state.expertCategory === key);
    });

    if (historySearchInput) historySearchInput.placeholder = t('labels.searchHistory');
    const constSearch = $('input-constants-search');
    if (constSearch) constSearch.placeholder = t('library.filter');
    if (exprInput) exprInput.placeholder = t('labels.expression');
    updateClearHistoryButton();

    const unitCatSelect = $('unit-category-select');
    if (unitCatSelect) {
      const currentVal = unitCatSelect.value || 'length';
      unitCatSelect.innerHTML = '';
      Object.keys(UNIT_CATEGORIES).forEach(catKey => {
        const opt = document.createElement('option');
        opt.value = catKey;
        opt.textContent = t(`unitCategories.${catKey}`);
        unitCatSelect.appendChild(opt);
      });
      unitCatSelect.value = currentVal;
    }

    if (state.errorCode) showError({ code: state.errorCode });

    updateKeypadLayers();
    updateModeLayout();
    updateDisplay();
    renderHistoryList();
    renderLibrary();
    renderVariablesStrip();
    rerunLabs();
  }

  // ==================== KEYPAD ====================
  function trigFunctionName(base) {
    let name = base;
    if (layer2nd) name = `a${name}`;
    if (layerHyp) name = `${name}h`;
    return name;
  }

  function updateKeypadLayers() {
    if (!sciGrid) return;
    sciGrid.classList.toggle('layer-2nd', layer2nd);
    sciGrid.classList.toggle('layer-hyp', layerHyp);
    const k2 = $('key-2nd');
    const kh = $('key-hyp');
    if (k2) k2.setAttribute('aria-pressed', String(layer2nd));
    if (kh) kh.setAttribute('aria-pressed', String(layerHyp));

    sciGrid.querySelectorAll('[data-trig]').forEach(btn => {
      const name = trigFunctionName(btn.getAttribute('data-trig'));
      btn.textContent = TRIG_LABEL_KEYS[name] ? t(`labels.${TRIG_LABEL_KEYS[name]}`) : name;
    });
    sciGrid.querySelectorAll('[data-insert-2nd]').forEach(btn => {
      btn.textContent = layer2nd ? btn.getAttribute('data-label-2nd') : btn.dataset.label1st;
    });
    const gcdKey = $('fn-gcd');
    if (gcdKey && !layer2nd) gcdKey.textContent = state.preferences.locale === 'pt-BR' ? 'MDC' : 'gcd';
    if (gcdKey && layer2nd) gcdKey.textContent = state.preferences.locale === 'pt-BR' ? 'MMC' : 'lcm';
  }

  function releaseLayers() {
    if (layer2nd || layerHyp) {
      layer2nd = false;
      layerHyp = false;
      updateKeypadLayers();
    }
  }

  function insertIntoExpression(token) {
    if (state.preferences.soundEnabled) playBeep(540);
    clearError();
    historyCursor = -1;
    let text = token;
    if (token === '.') text = getLocaleSeparators(state.preferences.locale).decimal;

    let expr = state.expression;
    let pos = currentCaret();
    if (justEvaluated) {
      justEvaluated = false;
      if (OPERATOR_START.test(text)) {
        expr = 'ans';
      } else {
        expr = '';
      }
      pos = expr.length;
    }
    const next = expr.slice(0, pos) + text + expr.slice(pos);
    const newPos = pos + text.length;
    setExpression(next, newPos === next.length ? null : newPos);
  }

  function handleClearAll() {
    if (state.preferences.soundEnabled) playBeep(340);
    clearError();
    justEvaluated = false;
    historyCursor = -1;
    state.lastResult = 0;
    setExpression('');
  }

  function handleClearEntry() {
    if (state.preferences.soundEnabled) playBeep(380);
    clearError();
    justEvaluated = false;
    setExpression(state.expression.replace(/([a-zA-Z0-9.,_π]+|\s*[+\-*/^×÷]\s*)$/, '').trimEnd());
  }

  function handleBackspace() {
    if (state.preferences.soundEnabled) playBeep(410);
    clearError();
    justEvaluated = false;
    const pos = currentCaret();
    if (pos === 0) return;
    const before = state.expression.slice(0, pos);
    const after = state.expression.slice(pos);
    const fnMatch = before.match(/[a-zA-Z]+\($/) || before.match(/ mod $/);
    const cut = fnMatch ? fnMatch[0].length : 1;
    const next = before.slice(0, -cut) + after;
    const newPos = pos - cut;
    setExpression(next, newPos === next.length ? null : newPos);
  }

  function handleToggleSign() {
    clearError();
    const expr = state.expression.trim();
    if (!expr || justEvaluated) {
      justEvaluated = false;
      if (state.lastResult !== 0) {
        state.lastResult = -state.lastResult;
        setExpression(String(state.lastResult));
      } else {
        setExpression('-');
      }
    } else if (expr.startsWith('-(') && expr.endsWith(')')) {
      setExpression(expr.slice(2, -1));
    } else {
      setExpression(`-(${expr})`);
    }
  }

  function handleCalculate() {
    if (state.preferences.soundEnabled) playBeep(680);
    clearError();
    const raw = exprInput ? exprInput.value.trim() : state.expression.trim();
    state.expression = raw;
    historyCursor = -1;

    try {
      let res;
      let assigned = null;
      if ((!raw || justEvaluated) && state.engine.lastAction) {
        res = state.engine.repeatLast(state.lastResult);
        state.expression = `${state.lastResult} ${state.engine.lastAction}`;
      } else {
        const outcome = state.engine.run(raw, { angleMode: state.preferences.angleMode });
        res = outcome.value;
        assigned = outcome.assigned;
      }
      state.lastResult = res;
      state.history.addEntry({
        expression: state.expression,
        result: res,
        mode: state.preferences.mode,
        angleMode: state.preferences.angleMode,
        precisionMode: state.preferences.precisionMode
      });
      if (assigned) {
        state.persistEngine();
        showToast(tf('labels.variableSaved', { name: assigned }));
        renderVariablesStrip();
        renderLibrary();
      }
      justEvaluated = true;
      caret = null;
      if (exprInput) exprInput.value = state.expression;
      updateDisplay();
      renderHistoryList();
    } catch (err) {
      showError(err);
    }
  }

  function navigateHistory(direction) {
    const items = state.history.items;
    if (items.length === 0) return;
    historyCursor = Math.min(Math.max(historyCursor + direction, -1), items.length - 1);
    justEvaluated = false;
    setExpression(historyCursor === -1 ? '' : items[historyCursor].expression);
  }

  function copyResult() {
    copyTextToClipboard(String(state.lastResult));
  }

  function shareLink() {
    const base = window.location.href.split(/[?#]/)[0];
    const params = new URLSearchParams();
    const expr = state.expression.trim();
    if (expr) params.set('expr', expr);
    params.set('mode', state.preferences.mode);
    params.set('angle', state.preferences.angleMode);
    copyTextToClipboard(`${base}?${params.toString()}`, t('labels.linkCopied'));
  }

  // ==================== HISTORY ====================
  function updateClearHistoryButton() {
    if (!clearHistoryBtn) return;
    clearHistoryBtn.textContent = state.confirmingClearHistory ? t('labels.confirmClearHistory') : t('labels.clearHistory');
    clearHistoryBtn.classList.toggle('confirming', state.confirmingClearHistory);
  }

  function iconButton(icon, title, onClick, extraClass = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `scp-mini-btn ${extraClass}`.trim();
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = `<svg class="ico"><use href="#${icon}"/></svg>`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    const query = historySearchInput ? historySearchInput.value : '';
    const items = state.history.search(query);
    historyListEl.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'scp-empty';
      empty.textContent = t('labels.emptyHistory');
      historyListEl.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'scp-history-item';

      const meta = document.createElement('div');
      meta.className = 'scp-history-meta';
      const dateStr = new Date(item.timestamp).toLocaleTimeString(state.preferences.locale, { hour: '2-digit', minute: '2-digit' });
      meta.textContent = `${dateStr} · ${t(`modes.${item.mode}`, item.mode)} · ${item.angleMode}`;

      const exprBtn = document.createElement('button');
      exprBtn.type = 'button';
      exprBtn.className = 'scp-history-expr';
      exprBtn.title = t('labels.reuse');
      exprBtn.textContent = formatExpressionForDisplay(item.expression, state.preferences.locale);
      exprBtn.addEventListener('click', () => {
        justEvaluated = false;
        state.lastResult = item.result;
        setExpression(item.expression);
        if (state.mobileView !== 'calc') setMobileView('calc');
      });

      const resBtn = document.createElement('button');
      resBtn.type = 'button';
      resBtn.className = 'scp-history-res';
      resBtn.title = t('labels.reuse');
      resBtn.innerHTML = `= ${numHtml(fmt(item.result))}`;
      resBtn.addEventListener('click', () => {
        insertIntoExpression(String(item.result));
        if (state.mobileView !== 'calc') setMobileView('calc');
      });

      const actions = document.createElement('div');
      actions.className = 'scp-history-actions';
      actions.appendChild(iconButton('i-copy', t('labels.copyRes'), () => copyTextToClipboard(item.result)));
      actions.appendChild(iconButton('i-trash', t('labels.delete'), () => {
        state.history.removeEntry(item.id);
        renderHistoryList();
      }, 'danger'));

      row.appendChild(meta);
      row.appendChild(actions);
      row.appendChild(exprBtn);
      row.appendChild(resBtn);
      historyListEl.appendChild(row);
    });
  }

  function exportHistory(kind) {
    const items = state.history.items;
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'json') {
      downloadFile(`calculator-history-${stamp}.json`, JSON.stringify(items, null, 2), 'application/json');
    } else {
      const quote = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const lines = ['timestamp,expression,result,mode,angle'];
      items.forEach(i => lines.push([i.timestamp, quote(i.expression), i.result, i.mode, i.angleMode].join(',')));
      downloadFile(`calculator-history-${stamp}.csv`, lines.join('\n'), 'text/csv');
    }
    showToast(t('labels.exported'));
  }

  // ==================== LIBRARY: CONSTANTS & VARIABLES ====================
  function renderLibrary() {
    const constList = $('library-constants');
    if (constList) {
      const query = ($('input-constants-search')?.value || '').trim().toLowerCase();
      constList.innerHTML = '';
      Object.entries(PHYSICAL_CONSTANTS).forEach(([symbol, info]) => {
        const name = t(`constants.${info.key}`);
        if (query && !`${symbol} ${name}`.toLowerCase().includes(query)) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scp-const-item';
        btn.innerHTML = `<span class="scp-const-symbol">${escapeHtml(symbol)}</span><span class="scp-const-name">${escapeHtml(name)}</span><span class="scp-const-value">${numHtml(fmt(info.value))} ${escapeHtml(info.unit)}</span>`;
        btn.addEventListener('click', () => insertSymbol(symbol));
        constList.appendChild(btn);
      });
    }

    const varList = $('library-variables');
    if (varList) {
      varList.innerHTML = '';
      const entries = Object.entries(state.engine.variables);
      if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'scp-empty';
        empty.textContent = t('library.noVariables');
        varList.appendChild(empty);
      }
      entries.forEach(([name, value]) => {
        const row = document.createElement('div');
        row.className = 'scp-var-item';
        const label = document.createElement('button');
        label.type = 'button';
        label.className = 'scp-mini-btn';
        label.innerHTML = `<span><b>${escapeHtml(name)}</b> = ${numHtml(fmt(value))}</span>`;
        label.addEventListener('click', () => insertSymbol(name));
        row.appendChild(label);
        row.appendChild(iconButton('i-trash', t('labels.deleteVar'), () => {
          state.engine.deleteVariable(name);
          state.persistEngine();
          renderLibrary();
          renderVariablesStrip();
        }, 'danger'));
        varList.appendChild(row);
      });
    }
  }

  function renderVariablesStrip() {
    if (!variablesStrip) return;
    const entries = Object.entries(state.engine.variables);
    variablesStrip.classList.toggle('hidden', entries.length === 0);
    variablesStrip.innerHTML = '';
    entries.forEach(([name, value]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'scp-var-chip';
      chip.innerHTML = `<b>${escapeHtml(name)}</b> = ${numHtml(fmt(value))}`;
      chip.addEventListener('click', () => insertIntoExpression(name));
      variablesStrip.appendChild(chip);
    });
  }

  function insertSymbol(symbol) {
    insertIntoExpression(symbol);
    showToast(tf('labels.inserted', { name: symbol }));
    if (state.mobileView !== 'calc') setMobileView('calc');
  }

  // ==================== RESULT RENDERING HELPERS ====================
  function renderMetrics(items, accentIndex = -1) {
    return `<div class="scp-metrics">${items
      .map(([label, value], i) => `<div class="scp-metric${i === accentIndex ? ' accent' : ''}"><span>${escapeHtml(label)}</span><strong>${numHtml(value)}</strong></div>`)
      .join('')}</div>`;
  }

  function renderMatrixTable(matrix) {
    return `<table class="scp-matrix-table">${matrix
      .map(row => `<tr>${row.map(v => `<td>${escapeHtml(fmt(v))}</td>`).join('')}</tr>`)
      .join('')}</table>`;
  }

  function renderError(outEl, err) {
    outEl.innerHTML = `<div class="scp-result-error">${escapeHtml(state.i18n.translateError(err))}</div>`;
  }

  function svgLineChart(values, { height = 120, color = 'var(--color-primary)' } = {}) {
    if (values.length < 2) return '';
    const width = 600;
    const max = Math.max(...values);
    const min = Math.min(0, ...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - ((v - min) / span) * (height - 8) - 4]);
    const line = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `0,${height} ${line} ${width},${height}`;
    return `<svg class="scp-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img">
      <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.35"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <polygon points="${area}" fill="url(#chartFill)"/>
      <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    </svg>`;
  }

  function svgHistogram(data) {
    const n = data.length;
    if (n < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const bins = Math.min(Math.max(Math.ceil(Math.sqrt(n)), 4), 12);
    const width = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    data.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / width), bins - 1);
      counts[idx]++;
    });
    const top = Math.max(...counts);
    const W = 600;
    const H = 140;
    const barW = W / bins;
    const bars = counts.map((c, i) => {
      const h = (c / top) * (H - 40);
      return `<rect x="${(i * barW + 3).toFixed(1)}" y="${(H - 18 - h).toFixed(1)}" width="${(barW - 6).toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="var(--color-primary)" opacity="0.85"/>
        <text x="${(i * barW + barW / 2).toFixed(1)}" y="${(H - 22 - h).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--color-text-muted)">${c || ''}</text>`;
    }).join('');
    const labels = `<text x="2" y="${H - 3}" font-size="11" fill="var(--color-text-muted)">${escapeHtml(fmt(min))}</text><text x="${W - 2}" y="${H - 3}" font-size="11" text-anchor="end" fill="var(--color-text-muted)">${escapeHtml(fmt(max))}</text>`;
    return `<svg class="scp-chart" viewBox="0 0 ${W} ${H}" role="img">${bars}${labels}</svg>`;
  }

  // ==================== EXPERT: GRAPH ====================
  const graphState = { xMin: -10, xMax: 10, yMin: -6, yMax: 6, compiled: [], frame: 0 };
  const graphCanvas = $('graph-canvas');
  const graphTooltip = $('graph-tooltip');
  const GRAPH_INPUT_IDS = ['graph-fn-1', 'graph-fn-2', 'graph-fn-3'];
  const GRAPH_NAMES = ['f', 'g', 'h'];

  function readGraphInputs() {
    const read = (id, fallback) => {
      const v = Number($(id)?.value);
      return Number.isFinite(v) ? v : fallback;
    };
    const xMin = read('graph-xmin', -10);
    const xMax = read('graph-xmax', 10);
    const yMin = read('graph-ymin', -6);
    const yMax = read('graph-ymax', 6);
    if (xMax > xMin && yMax > yMin) Object.assign(graphState, { xMin, xMax, yMin, yMax });
  }

  function writeGraphInputs() {
    const round = (v) => Number(v.toPrecision(5));
    const set = (id, v) => {
      const el = $(id);
      if (el) el.value = round(v);
    };
    set('graph-xmin', graphState.xMin);
    set('graph-xmax', graphState.xMax);
    set('graph-ymin', graphState.yMin);
    set('graph-ymax', graphState.yMax);
  }

  function requestGraphRender() {
    if (graphState.frame) return;
    graphState.frame = requestAnimationFrame(() => {
      graphState.frame = 0;
      drawGraph();
    });
  }

  function formatTick(v) {
    const clean = Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(6));
    const { decimal } = getLocaleSeparators(state.preferences.locale);
    return String(clean).replace('.', decimal);
  }

  function drawGraph(updateSummary = false) {
    if (!graphCanvas) return;
    const rect = graphCanvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.round(rect.width);
    const H = Math.round(rect.height);
    if (graphCanvas.width !== W * dpr || graphCanvas.height !== H * dpr) {
      graphCanvas.width = W * dpr;
      graphCanvas.height = H * dpr;
    }
    const ctx = graphCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const css = getComputedStyle(document.documentElement);
    const color = (name) => css.getPropertyValue(name).trim();
    const { xMin, xMax, yMin, yMax } = graphState;
    const sx = (x) => ((x - xMin) / (xMax - xMin)) * W;
    const sy = (y) => H - ((y - yMin) / (yMax - yMin)) * H;

    // Grid
    const stepX = niceStep(xMax - xMin, Math.max(4, Math.round(W / 80)));
    const stepY = niceStep(yMax - yMin, Math.max(4, Math.round(H / 60)));
    ctx.lineWidth = 1;
    ctx.strokeStyle = color('--grid-line');
    ctx.beginPath();
    for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
      ctx.moveTo(Math.round(sx(x)) + 0.5, 0);
      ctx.lineTo(Math.round(sx(x)) + 0.5, H);
    }
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
      ctx.moveTo(0, Math.round(sy(y)) + 0.5);
      ctx.lineTo(W, Math.round(sy(y)) + 0.5);
    }
    ctx.stroke();

    // Axes
    const axisX = Math.min(Math.max(sy(0), 0), H);
    const axisY = Math.min(Math.max(sx(0), 0), W);
    ctx.strokeStyle = color('--axis-line');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(axisX) + 0.5);
    ctx.lineTo(W, Math.round(axisX) + 0.5);
    ctx.moveTo(Math.round(axisY) + 0.5, 0);
    ctx.lineTo(Math.round(axisY) + 0.5, H);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = color('--color-text-muted');
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelY = Math.min(Math.max(axisX + 4, 2), H - 14);
    for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
      if (Math.abs(x) < stepX / 2 || sx(x) < 16 || sx(x) > W - 16) continue;
      ctx.fillText(formatTick(x), sx(x), labelY);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labelX = Math.min(Math.max(axisY + 5, 2), W - 40);
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
      if (Math.abs(y) < stepY / 2 || sy(y) < 10 || sy(y) > H - 10) continue;
      ctx.fillText(formatTick(y), labelX, sy(y));
    }

    // Curves
    const summaries = [];
    graphState.compiled = [];
    GRAPH_INPUT_IDS.forEach((id, idx) => {
      const expr = ($(id)?.value || '').trim();
      if (!expr) return;
      const stroke = color(`--plot-${idx + 1}`);
      try {
        const sampled = sampleFunction(expr, {
          xMin, xMax, samples: Math.min(Math.max(W, 200), 1600), angleMode: 'RAD',
          yRange: yMax - yMin, variables: state.engine.variables
        });
        graphState.compiled.push({ name: GRAPH_NAMES[idx], fn: compileExpression(expr, { variable: 'x', angleMode: 'RAD', variables: state.engine.variables }), stroke });
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2.4;
        ctx.lineJoin = 'round';
        ctx.shadowColor = stroke;
        ctx.shadowBlur = 6;
        sampled.segments.forEach(seg => {
          ctx.beginPath();
          seg.forEach((p, i) => {
            const py = Math.min(Math.max(sy(p.y), -H), 2 * H);
            if (i === 0) ctx.moveTo(sx(p.x), py);
            else ctx.lineTo(sx(p.x), py);
          });
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
        ctx.fillStyle = stroke;
        sampled.roots.forEach(r => {
          ctx.beginPath();
          ctx.arc(sx(r), sy(0), 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        sampled.extrema.forEach(e => {
          ctx.beginPath();
          ctx.arc(sx(e.x), sy(e.y), 4, 0, Math.PI * 2);
          ctx.stroke();
        });
        summaries.push({ idx, expr, stroke, ...sampled });
      } catch (err) {
        summaries.push({ idx, expr, stroke, error: err });
      }
    });

    if (updateSummary || graphState.summaryDirty) {
      graphState.summaryDirty = false;
      renderGraphSummary(summaries);
    }
  }

  function renderGraphSummary(summaries) {
    const outEl = $('graph-result-box');
    if (!outEl) return;
    outEl.innerHTML = summaries.map(s => {
      const head = `<span class="scp-fn-dot" style="--dot:${s.stroke}"></span><b>${GRAPH_NAMES[s.idx]}(x) = ${escapeHtml(s.expr)}</b>`;
      if (s.error) return `<div class="scp-legend-row">${head}<span class="scp-result-error">${escapeHtml(state.i18n.translateError(s.error))}</span></div>`;
      const roots = s.roots.length ? s.roots.map(r => `<span class="scp-pill">x = ${escapeHtml(fmt(r, { precisionMode: 'fixed', decimalPlaces: 4 }))}</span>`).join('') : `<span class="scp-hint">${escapeHtml(t('lab.noRoots'))}</span>`;
      const extrema = s.extrema.slice(0, 4).map(e => `<span class="scp-pill">${escapeHtml(t(`lab.${e.kind}`))} (${escapeHtml(fmt(e.x, { precisionMode: 'fixed', decimalPlaces: 3 }))}; ${escapeHtml(fmt(e.y, { precisionMode: 'fixed', decimalPlaces: 3 }))})</span>`).join('');
      return `<div class="scp-legend-row">${head}</div>
        <div class="scp-legend-row"><span class="scp-hint">${escapeHtml(t('lab.roots'))}:</span>${roots}</div>
        ${extrema ? `<div class="scp-legend-row"><span class="scp-hint">${escapeHtml(t('lab.extrema'))}:</span>${extrema}</div>` : ''}`;
    }).join('');
  }

  function runGraphTool() {
    readGraphInputs();
    graphState.summaryDirty = true;
    drawGraph(true);
  }

  function zoomGraph(factor, cx = 0.5, cy = 0.5) {
    const { xMin, xMax, yMin, yMax } = graphState;
    const px = xMin + (xMax - xMin) * cx;
    const py = yMax - (yMax - yMin) * cy;
    graphState.xMin = px - (px - xMin) * factor;
    graphState.xMax = px + (xMax - px) * factor;
    graphState.yMin = py - (py - yMin) * factor;
    graphState.yMax = py + (yMax - py) * factor;
    writeGraphInputs();
    graphState.summaryDirty = true;
    requestGraphRender();
  }

  if (graphCanvas) {
    let drag = null;
    graphCanvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, view: { ...graphState } };
      graphCanvas.setPointerCapture(e.pointerId);
      graphCanvas.classList.add('dragging');
    });
    graphCanvas.addEventListener('pointermove', (e) => {
      const rect = graphCanvas.getBoundingClientRect();
      if (drag) {
        const dx = ((e.clientX - drag.x) / rect.width) * (drag.view.xMax - drag.view.xMin);
        const dy = ((e.clientY - drag.y) / rect.height) * (drag.view.yMax - drag.view.yMin);
        graphState.xMin = drag.view.xMin - dx;
        graphState.xMax = drag.view.xMax - dx;
        graphState.yMin = drag.view.yMin + dy;
        graphState.yMax = drag.view.yMax + dy;
        writeGraphInputs();
        requestGraphRender();
        if (graphTooltip) graphTooltip.classList.add('hidden');
        return;
      }
      if (!graphTooltip || graphState.compiled.length === 0) return;
      const x = graphState.xMin + ((e.clientX - rect.left) / rect.width) * (graphState.xMax - graphState.xMin);
      const lines = [`x = ${fmt(x, { precisionMode: 'fixed', decimalPlaces: 4 })}`];
      graphState.compiled.forEach(c => {
        let y;
        try { y = c.fn(x); } catch (_) { y = NaN; }
        lines.push(`<span style="color:${c.stroke}">●</span> ${c.name}(x) = ${Number.isFinite(y) ? escapeHtml(fmt(y, { precisionMode: 'fixed', decimalPlaces: 4 })) : '—'}`);
      });
      graphTooltip.innerHTML = lines.join('<br>');
      graphTooltip.classList.remove('hidden');
      const left = e.clientX - rect.left + 14;
      const top = e.clientY - rect.top + 14;
      graphTooltip.style.left = `${Math.min(left, rect.width - graphTooltip.offsetWidth - 6)}px`;
      graphTooltip.style.top = `${Math.min(top, rect.height - graphTooltip.offsetHeight - 6)}px`;
    });
    const endDrag = () => {
      if (drag) {
        drag = null;
        graphCanvas.classList.remove('dragging');
        graphState.summaryDirty = true;
        requestGraphRender();
      }
    };
    graphCanvas.addEventListener('pointerup', endDrag);
    graphCanvas.addEventListener('pointercancel', endDrag);
    graphCanvas.addEventListener('pointerleave', () => graphTooltip && graphTooltip.classList.add('hidden'));
    graphCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = graphCanvas.getBoundingClientRect();
      zoomGraph(Math.exp(e.deltaY * 0.0015), (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    }, { passive: false });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => requestGraphRender()).observe(graphCanvas);
    }
  }

  function plotCurrentExpression() {
    const expr = state.expression.trim();
    if (!/(^|[^a-zA-Z_])x([^a-zA-Z0-9_]|$)/.test(expr)) {
      showToast(t('labels.noPlotVar'));
      return;
    }
    const input = $('graph-fn-1');
    if (input) input.value = expr;
    setSideTab('expert');
    setExpertCategory('graph');
    if (window.matchMedia('(max-width: 760px)').matches || state.viewportMode === 'mobile') setMobileView('expert');
    runGraphTool();
  }

  // ==================== EXPERT: COMPLEX ====================
  function runComplexTool() {
    const outEl = $('complex-result-box');
    if (!outEl) return;
    try {
      const a = Number($('cx-z1-re').value || 0);
      const b = Number($('cx-z1-im').value || 0);
      const c = Number($('cx-z2-re').value || 0);
      const d = Number($('cx-z2-im').value || 0);
      const n = Number($('cx-power-n').value || 2);
      const op = $('cx-operation').value;
      const angleMode = state.preferences.angleMode;
      const z1 = new Complex(a, b);
      const z2 = new Complex(c, d);

      const describe = (z, headline) => {
        const pol = z.toPolar(angleMode);
        return `<div class="scp-result-headline">${escapeHtml(headline)}</div>${renderMetrics([
          [t('lab.modulus'), fmtLab(pol.r)],
          [`${t('lab.argument')} (${angleMode})`, fmtLab(pol.theta)],
          [t('lab.polar'), `${fmtLab(pol.r)} ∠ ${fmtLab(pol.theta)}`],
          [t('lab.conjugate'), z.conjugate().format()]
        ])}`;
      };

      if (op === 'add') outEl.innerHTML = describe(Complex.add(z1, z2), `(${z1.format()}) + (${z2.format()}) = ${Complex.add(z1, z2).format()}`);
      else if (op === 'sub') outEl.innerHTML = describe(Complex.sub(z1, z2), `(${z1.format()}) − (${z2.format()}) = ${Complex.sub(z1, z2).format()}`);
      else if (op === 'mul') outEl.innerHTML = describe(Complex.mul(z1, z2), `(${z1.format()}) × (${z2.format()}) = ${Complex.mul(z1, z2).format()}`);
      else if (op === 'div') {
        const res = Complex.div(z1, z2);
        outEl.innerHTML = describe(res, `(${z1.format()}) ÷ (${z2.format()}) = ${res.format()}`);
      } else if (op === 'conj') outEl.innerHTML = describe(z1, `z₁ = ${z1.format()}`);
      else if (op === 'polar2rect') {
        const rect = Complex.fromPolar(a, b, angleMode);
        outEl.innerHTML = describe(rect, `${a} ∠ ${b} ${angleMode} = ${rect.format()}`);
      } else if (op === 'pow') {
        const res = z1.pow(n);
        outEl.innerHTML = describe(res, `(${z1.format()})^${n} = ${res.format()}`);
      } else if (op === 'roots') {
        const roots = z1.nthRoots(n, angleMode);
        outEl.innerHTML = `<div class="scp-result-headline">ⁿ√(${escapeHtml(z1.format())}), n = ${n}</div>${renderMetrics(
          roots.map(r => [`w${r.index}  ∠ ${fmtLab(r.polarAngle)} ${angleMode}`, r.formatted])
        )}`;
      }
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: MATRICES ====================
  function renderMatrixGrids() {
    const build = (gridEl, dims, data, label) => {
      if (!gridEl) return;
      gridEl.style.gridTemplateColumns = `repeat(${dims.cols}, minmax(0, 1fr))`;
      gridEl.innerHTML = '';
      for (let r = 0; r < dims.rows; r++) {
        if (!data[r]) data[r] = [];
        for (let c = 0; c < dims.cols; c++) {
          if (data[r][c] === undefined) data[r][c] = r === c ? 1 : 0;
          const inp = document.createElement('input');
          inp.type = 'number';
          inp.step = 'any';
          inp.className = 'scp-matrix-cell tabular-nums';
          inp.value = data[r][c];
          inp.setAttribute('aria-label', `${label}[${r + 1},${c + 1}]`);
          inp.addEventListener('input', () => {
            data[r][c] = Number(inp.value || 0);
          });
          gridEl.appendChild(inp);
        }
      }
    };
    build($('matrix-a-grid'), matADims, matAData, 'A');
    build($('matrix-b-grid'), matBDims, matBData, 'B');
  }

  function getActiveMatrix(data, dims) {
    return Array.from({ length: dims.rows }, (_, r) =>
      Array.from({ length: dims.cols }, (__, c) => Number(data[r]?.[c] || 0))
    );
  }

  function runMatrixOperation(op) {
    const outEl = $('matrix-result-box');
    if (!outEl) return;
    state.lastMatrixOp = op;
    try {
      const A = getActiveMatrix(matAData, matADims);
      const B = getActiveMatrix(matBData, matBDims);
      const k = Number($('matrix-scalar-k').value || 2);
      const labels = { add: 'A + B', sub: 'A − B', mul: 'A × B', scalar: `${k} · A`, trans: 'Aᵀ', inv: 'A⁻¹' };

      if (op === 'det') {
        outEl.innerHTML = `<div class="scp-result-headline">det(A) = ${escapeHtml(fmt(matrixDeterminant(A)))}<small>${escapeHtml(t('lab.determinant'))}</small></div>`;
        return;
      }
      if (op === 'trace') {
        outEl.innerHTML = `<div class="scp-result-headline">tr(A) = ${escapeHtml(fmt(matrixTrace(A)))}<small>${escapeHtml(t('lab.trace'))}</small></div>`;
        return;
      }
      if (op === 'solve') {
        const bVec = Array.from({ length: matADims.rows }, (_, r) => Number(B[r]?.[0] || 0));
        const xSol = solveLinearSystem(A, bVec);
        outEl.innerHTML = `<div class="scp-result-headline">A·x = b<small>${escapeHtml(t('lab.solution'))}</small></div>${renderMetrics(xSol.map((v, i) => [`x${i + 1}`, fmt(v)]))}`;
        return;
      }

      let res;
      if (op === 'add') res = matrixAdd(A, B);
      else if (op === 'sub') res = matrixSub(A, B);
      else if (op === 'mul') res = matrixMultiply(A, B);
      else if (op === 'scalar') res = matrixScalar(A, k);
      else if (op === 'trans') res = matrixTranspose(A);
      else if (op === 'inv') res = matrixInverse(A);
      outEl.innerHTML = `<div class="scp-result-headline">${escapeHtml(labels[op])} =</div>${renderMatrixTable(res)}`;
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: STATISTICS ====================
  function runStatisticsTool() {
    const outEl = $('stats-result-box');
    if (!outEl) return;
    try {
      const xRaw = $('stats-input-x').value;
      const yRaw = $('stats-input-y').value.trim();
      const pRank = Number($('stats-percentile-k').value || 90);
      const res = analyzeDataset(xRaw, { secondaryData: yRaw || null, percentile: pRank });
      const modeStr = res.modes.length > 0 ? res.modes.map(v => fmtLab(v)).join(', ') : t('lab.amodal');
      const items = [
        [t('lab.count'), String(res.count)],
        [t('lab.mean'), fmtLab(res.mean)],
        [t('lab.median'), fmtLab(res.median)],
        [t('lab.mode'), modeStr],
        [t('lab.stdPop'), fmtLab(res.popStdDev)],
        [t('lab.stdSample'), fmtLab(res.sampleStdDev)],
        [t('lab.varPop'), fmtLab(res.popVariance)],
        [t('lab.varSample'), fmtLab(res.sampleVariance)],
        [t('lab.min'), fmtLab(res.min)],
        [t('lab.max'), fmtLab(res.max)],
        [t('lab.range'), fmtLab(res.range)],
        [t('lab.sum'), fmtLab(res.sum)],
        [t('lab.sumSquares'), fmtLab(res.sumSquares)],
        ['Q1', fmtLab(res.q1)],
        ['Q3', fmtLab(res.q3)],
        [t('lab.iqr'), fmtLab(res.iqr)],
        [`P${res.percentileRank}`, fmtLab(res.customPercentile)]
      ];
      if (res.weightedMean !== null) items.push([t('lab.weightedMean'), fmtLab(res.weightedMean)]);
      let html = renderMetrics(items, 1);
      html += `<div class="scp-subhead">${escapeHtml(t('lab.histogram'))}</div>${svgHistogram(parseDataset(xRaw))}`;
      if (res.regression) {
        html += `<div class="scp-subhead">${escapeHtml(t('lab.regression'))}</div>${renderMetrics([
          ['y = a + bx', `y = ${fmtLab(res.regression.intercept)} ${res.regression.slope >= 0 ? '+' : '−'} ${fmtLab(Math.abs(res.regression.slope))}x`],
          ['r', fmtLab(res.regression.r)],
          ['R²', fmtLab(res.regression.r2)]
        ], 0)}`;
      }
      outEl.innerHTML = html;
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: SOLVER ====================
  function runSolverTool() {
    const outEl = $('solver-result-box');
    if (!outEl) return;
    try {
      const res = solveEquation({
        expression: $('solver-expr').value,
        variable: 'x',
        method: $('solver-method').value,
        a: Number($('solver-a').value),
        b: Number($('solver-b').value),
        x0: Number($('solver-a').value),
        tolerance: Number($('solver-tol').value || 1e-7),
        maxIterations: Number($('solver-max-iter').value || 100),
        angleMode: state.preferences.angleMode
      });
      if (!res.converged) {
        renderError(outEl, { code: res.reasonCode || 'ERR_MAX_ITER' });
        return;
      }
      outEl.innerHTML = `<div class="scp-result-headline">x* ≈ ${escapeHtml(fmtLab(res.root))}<small>${escapeHtml(res.method)}</small></div>${renderMetrics([
        [t('lab.residual'), res.residual.toExponential(2)],
        [t('lab.iterations'), String(res.iterations)]
      ])}<p class="scp-hint" style="margin-top:8px">${escapeHtml(t('labels.approxNotice'))}</p>`;
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: CALCULUS ====================
  function runCalculusTool(kind) {
    const outEl = $('calculus-result-box');
    if (!outEl) return;
    state.lastCalculusKind = kind;
    try {
      const expr = $('calc-tool-expr').value;
      const x0 = Number($('calc-tool-x0').value || 0);
      const a = Number($('calc-tool-a').value || 0);
      const b = Number($('calc-tool-b').value || 1);
      const tol = Number($('calc-tool-tol').value || 1e-7);
      if (kind === 'derivative') {
        const d = numericalDerivative({ expression: expr, variable: 'x', x0, angleMode: state.preferences.angleMode });
        outEl.innerHTML = `<div class="scp-result-headline">f′(${escapeHtml(fmtLab(x0))}) ≈ ${escapeHtml(fmtLab(d.value))}<small>${escapeHtml(t('lab.derivative'))}</small></div>${renderMetrics([
          [t('lab.secondDerivative'), fmtLab(d.secondDerivative)],
          [t('lab.fAtPoint'), fmtLab(d.fAtPoint)],
          [t('lab.estError'), d.estimatedError.toExponential(2)]
        ])}`;
      } else {
        const integ = numericalIntegral({ expression: expr, variable: 'x', a, b, tolerance: tol, angleMode: state.preferences.angleMode });
        outEl.innerHTML = `<div class="scp-result-headline">∫[${escapeHtml(fmtLab(a))}, ${escapeHtml(fmtLab(b))}] ≈ ${escapeHtml(fmtLab(integ.value))}<small>${escapeHtml(t('lab.integral'))}</small></div>${renderMetrics([
          [t('lab.estError'), integ.estimatedError.toExponential(2)],
          [t('lab.evaluations'), String(integ.evaluations)]
        ])}`;
      }
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: FINANCE ====================
  function runFinanceTool(op) {
    const outEl = $('finance-result-box');
    if (!outEl) return;
    state.lastFinanceOp = op;
    const money = (v) => fmt(v, { precisionMode: 'fixed', decimalPlaces: 2 });
    try {
      const principal = Number($('fin-principal').value || 0);
      const ratePercent = Number($('fin-rate').value || 0);
      const periods = Number($('fin-periods').value || 1);
      const contribution = Number($('fin-contribution').value || 0);

      if (op === 'compound') {
        const res = compoundInterest({ principal, ratePercent, periods, contribution });
        outEl.innerHTML = `<div class="scp-result-headline">${escapeHtml(money(res.futureValue))}<small>${escapeHtml(t('lab.futureValue'))}</small></div>${renderMetrics([
          [t('lab.invested'), money(res.invested)],
          [t('lab.interestEarned'), money(res.interest)]
        ])}<div class="scp-subhead">${escapeHtml(t('lab.growth'))}</div>${svgLineChart([principal, ...res.series])}`;
      } else {
        const res = loanSchedule({ amount: principal, ratePercent, periods, system: op });
        const rows = res.rows.map(r => `<tr><td>${r.period}</td><td>${escapeHtml(money(r.payment))}</td><td>${escapeHtml(money(r.interest))}</td><td>${escapeHtml(money(r.amortization))}</td><td>${escapeHtml(money(r.balance))}</td></tr>`).join('');
        outEl.innerHTML = `<div class="scp-result-headline">${escapeHtml(money(res.firstPayment))}<small>${escapeHtml(t('lab.firstInstallment'))} · ${op === 'sac' ? 'SAC' : 'Price'}</small></div>${renderMetrics([
          [t('lab.lastInstallment'), money(res.lastPayment)],
          [t('lab.totalPaid'), money(res.totalPaid)],
          [t('lab.totalInterest'), money(res.totalInterest)]
        ])}<div class="scp-subhead">${escapeHtml(t('lab.balance'))}</div>${svgLineChart([principal, ...res.rows.map(r => r.balance)])}
        <div class="scp-subhead">${escapeHtml(t('lab.schedule'))}</div>
        <div class="scp-table-scroll"><table class="scp-data-table"><thead><tr><th>${escapeHtml(t('lab.period'))}</th><th>${escapeHtml(t('lab.payment'))}</th><th>${escapeHtml(t('lab.interest'))}</th><th>${escapeHtml(t('lab.amortization'))}</th><th>${escapeHtml(t('lab.balance'))}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    } catch (err) {
      renderError(outEl, err);
    }
  }

  function runRateConversion() {
    const out = $('fin-conv-result');
    if (!out) return;
    try {
      const value = convertRate(Number($('fin-conv-rate').value), Number($('fin-conv-from').value), Number($('fin-conv-to').value));
      out.textContent = `= ${fmt(value, { precisionMode: 'fixed', decimalPlaces: 4 })} %`;
    } catch (_) {
      out.textContent = '—';
    }
  }

  // ==================== EXPERT: UNITS ====================
  function populateUnitsForCategory() {
    const catSelect = $('unit-category-select');
    const fromSelect = $('unit-from-select');
    const toSelect = $('unit-to-select');
    if (!catSelect || !fromSelect || !toSelect) return;
    const cat = UNIT_CATEGORIES[catSelect.value || 'length'];
    if (!cat) return;
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    Object.keys(cat.units).forEach((uKey, idx) => {
      const label = `${cat.units[uKey].symbol} · ${uKey}`;
      fromSelect.appendChild(new Option(label, uKey));
      toSelect.appendChild(new Option(label, uKey));
      if (idx === 1) toSelect.value = uKey;
    });
    runUnitConversion();
  }

  function runUnitConversion() {
    const outEl = $('unit-result-box');
    if (!outEl) return;
    try {
      const catKey = $('unit-category-select').value || 'length';
      const fromU = $('unit-from-select').value;
      const toU = $('unit-to-select').value;
      const val = Number($('unit-input-val').value || 0);
      const cat = UNIT_CATEGORIES[catKey];
      const res = convertUnit(val, catKey, fromU, toU);
      const rows = Object.keys(cat.units).map(u => {
        let converted;
        try { converted = fmt(convertUnit(val, catKey, fromU, u)); } catch (_) { converted = '—'; }
        return `<tr class="${u === toU ? 'highlight' : ''}"><td>${escapeHtml(u)}</td><td>${escapeHtml(converted)} ${escapeHtml(cat.units[u].symbol)}</td></tr>`;
      }).join('');
      outEl.innerHTML = `<div class="scp-result-headline">${escapeHtml(fmt(val))} ${escapeHtml(cat.units[fromU]?.symbol || fromU)} = ${escapeHtml(fmt(res))} ${escapeHtml(cat.units[toU]?.symbol || toU)}</div>
        <div class="scp-subhead">${escapeHtml(t('lab.allUnits'))}</div><div class="scp-table-scroll"><table class="scp-data-table"><tbody>${rows}</tbody></table></div>`;
    } catch (err) {
      renderError(outEl, err);
    }
  }

  // ==================== EXPERT: NUMBER THEORY ====================
  function runNumberTheoryTool(action) {
    const outEl = $('nt-result-box');
    if (!outEl) return;
    state.lastNtOp = action;
    try {
      const a = Math.trunc(Number($('nt-input-a').value || 0));
      const b = Math.trunc(Number($('nt-input-b').value || 0));
      if (action === 'gcd_lcm') {
        outEl.innerHTML = renderMetrics([
          [`gcd(${a}, ${b})`, String(gcdTwo(a, b))],
          [`lcm(${a}, ${b})`, String(lcmTwo(a, b))]
        ], 0);
      } else if (action === 'comb') {
        outEl.innerHTML = renderMetrics([
          [`P(${a}, ${b})`, fmt(nPrCalc(a, b))],
          [`C(${a}, ${b})`, fmt(nCrCalc(a, b))]
        ], 1);
      } else if (action === 'prime') {
        const pf = primeFactorization(a);
        outEl.innerHTML = `<div class="scp-result-headline">${a} = ${escapeHtml(pf.formatted)}<small>${escapeHtml(pf.isPrime ? t('lab.prime') : t('lab.composite'))}</small></div>`;
      } else if (action === 'base') {
        const conv = convertBase($('nt-base-input').value || '0', Number($('nt-base-select').value || 10));
        outEl.innerHTML = renderMetrics([
          ['DEC', conv.dec],
          ['HEX', `0x${conv.hex}`],
          ['OCT', `0o${conv.oct}`],
          ['BIN', `0b${conv.bin}`]
        ]);
      } else if (action === 'bitwise') {
        const op = $('nt-bitwise-op').value || 'AND';
        const bw = bitwiseOperation(a, b, op);
        outEl.innerHTML = `<div class="scp-result-headline">${op === 'NOT' ? `NOT ${a}` : `${a} ${op} ${b}`} = ${bw.result}</div>${renderMetrics([
          ['HEX', `0x${bw.bases.hex}`],
          ['BIN', `0b${bw.bases.bin}`]
        ])}`;
      }
    } catch (err) {
      renderError(outEl, err);
    }
  }

  function rerunLabs() {
    runComplexTool();
    runMatrixOperation(state.lastMatrixOp || 'det');
    runStatisticsTool();
    runSolverTool();
    runCalculusTool(state.lastCalculusKind || 'derivative');
    runFinanceTool(state.lastFinanceOp || 'compound');
    runRateConversion();
    runUnitConversion();
    runNumberTheoryTool(state.lastNtOp || 'gcd_lcm');
    graphState.summaryDirty = true;
    requestGraphRender();
  }

  // ==================== IN-APP TEST RUNNER ====================
  function executeInAppTests() {
    const container = $('modal-tests-results');
    const summaryEl = $('modal-tests-summary');
    if (!container || !summaryEl) return;
    const all = [...runMathTests(), ...runLocalizationAndStateTests()].sort((a, b) => a.id - b.id);
    const passed = all.filter(r => r.pass).length;
    summaryEl.textContent = tf('labels.testsPassed', { passed, total: all.length });
    summaryEl.classList.toggle('fail', passed !== all.length);
    container.innerHTML = all.map(r => `<div class="scp-test-item${r.pass ? '' : ' fail'}">
        <span class="scp-test-status">${r.pass ? 'PASS' : 'FAIL'}</span><span>#${String(r.id).padStart(2, '0')} ${escapeHtml(r.name)}</span>
        <code>${escapeHtml(JSON.stringify(r.actual))}</code></div>`).join('');
  }

  // ==================== EVENT DELEGATION ====================
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) {
      if (event.target.classList && event.target.classList.contains('scp-modal-backdrop')) closeModal(event.target);
      return;
    }

    if (btn.hasAttribute('data-mode-select')) {
      state.updatePreferences({ mode: btn.getAttribute('data-mode-select') });
      applyTranslations();
      return;
    }

    if (btn.hasAttribute('data-angle-select')) {
      state.updatePreferences({ angleMode: btn.getAttribute('data-angle-select') });
      applyTranslations();
      return;
    }

    if (btn.hasAttribute('data-trig')) {
      insertIntoExpression(`${trigFunctionName(btn.getAttribute('data-trig'))}(`);
      releaseLayers();
      return;
    }

    if (btn.hasAttribute('data-insert')) {
      const token = layer2nd && btn.hasAttribute('data-insert-2nd') ? btn.getAttribute('data-insert-2nd') : btn.getAttribute('data-insert');
      insertIntoExpression(token);
      if (btn.closest('#scp-scientific-keypad')) releaseLayers();
      return;
    }

    if (btn.hasAttribute('data-calc-action')) {
      const act = btn.getAttribute('data-calc-action');
      if (act === 'clear-all') handleClearAll();
      else if (act === 'clear-entry') handleClearEntry();
      else if (act === 'backspace') handleBackspace();
      else if (act === 'toggle-sign') handleToggleSign();
      else if (act === 'equals') handleCalculate();
      else if (act === 'toggle-2nd') { layer2nd = !layer2nd; updateKeypadLayers(); }
      else if (act === 'toggle-hyp') { layerHyp = !layerHyp; updateKeypadLayers(); }
      else if (act === 'mc') { state.engine.memoryClear(); state.persistEngine(); updateDisplay(); }
      else if (act === 'mr') { insertIntoExpression(String(state.engine.memoryRecall())); }
      else if (act === 'mplus') { state.engine.memoryAdd(state.lastResult); state.persistEngine(); updateDisplay(); }
      else if (act === 'mminus') { state.engine.memorySubtract(state.lastResult); state.persistEngine(); updateDisplay(); }
      else if (act === 'ms') { state.engine.memoryStore(state.lastResult); state.persistEngine(); updateDisplay(); }
      return;
    }

    if (btn.id === 'tab-btn-history') { setSideTab('history'); return; }
    if (btn.id === 'tab-btn-expert') { setSideTab('expert'); return; }
    if (btn.id === 'tab-btn-library') { setSideTab('library'); return; }

    if (btn.hasAttribute('data-mobile-nav')) {
      setMobileView(btn.getAttribute('data-mobile-nav'));
      return;
    }

    if (btn.hasAttribute('data-expert-tab')) {
      setExpertCategory(btn.getAttribute('data-expert-tab'));
      return;
    }

    if (btn.hasAttribute('data-matrix-op')) {
      runMatrixOperation(btn.getAttribute('data-matrix-op'));
      return;
    }

    if (btn.hasAttribute('data-nt-op')) {
      runNumberTheoryTool(btn.getAttribute('data-nt-op'));
      return;
    }

    if (btn.hasAttribute('data-fin-op')) {
      runFinanceTool(btn.getAttribute('data-fin-op'));
      return;
    }

    if (btn.hasAttribute('data-graph-action')) {
      const action = btn.getAttribute('data-graph-action');
      if (action === 'zoom-in') zoomGraph(0.7);
      else if (action === 'zoom-out') zoomGraph(1 / 0.7);
      else if (action === 'reset') {
        Object.assign(graphState, { xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
        writeGraphInputs();
        graphState.summaryDirty = true;
        requestGraphRender();
      }
      return;
    }

    if (btn.hasAttribute('data-close-modal')) {
      closeModal($(btn.getAttribute('data-close-modal')));
    }
  });

  // Expression typing & caret tracking
  if (exprInput) {
    exprInput.addEventListener('input', () => {
      state.expression = exprInput.value;
      caret = exprInput.selectionStart;
      justEvaluated = false;
      clearError();
      updatePreview();
    });
    ['click', 'keyup', 'select'].forEach(evt => exprInput.addEventListener(evt, () => {
      caret = exprInput.selectionStart;
    }));
  }

  // Selects & toggles
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      state.updatePreferences({ locale: langSelect.value });
      applyTranslations();
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      state.updatePreferences({ theme: themeSelect.value });
      applyTheme();
    });
  }

  if (viewportSelect) {
    viewportSelect.addEventListener('change', () => {
      state.viewportMode = viewportSelect.value;
      applyViewportMode();
    });
  }

  $('btn-toggle-fraction')?.addEventListener('click', () => {
    state.updatePreferences({ showFraction: !state.preferences.showFraction });
    updateDisplay();
  });
  $('btn-toggle-sci')?.addEventListener('click', () => {
    state.updatePreferences({ scientificNotation: !state.preferences.scientificNotation });
    updateDisplay();
  });

  $('btn-copy-result')?.addEventListener('click', copyResult);
  $('btn-share-link')?.addEventListener('click', shareLink);
  $('btn-plot-expression')?.addEventListener('click', plotCurrentExpression);

  historySearchInput?.addEventListener('input', renderHistoryList);
  $('input-constants-search')?.addEventListener('input', renderLibrary);
  $('btn-export-csv')?.addEventListener('click', () => exportHistory('csv'));
  $('btn-export-json')?.addEventListener('click', () => exportHistory('json'));

  if (clearHistoryBtn) {
    let confirmTimer = null;
    clearHistoryBtn.addEventListener('click', () => {
      if (!state.confirmingClearHistory) {
        state.confirmingClearHistory = true;
        updateClearHistoryButton();
        confirmTimer = setTimeout(() => {
          state.confirmingClearHistory = false;
          updateClearHistoryButton();
        }, 3500);
      } else {
        clearTimeout(confirmTimer);
        state.confirmingClearHistory = false;
        state.history.clearAll();
        updateClearHistoryButton();
        renderHistoryList();
      }
    });
  }

  // Expert tool bindings
  $('btn-run-graph')?.addEventListener('click', runGraphTool);
  [...GRAPH_INPUT_IDS, 'graph-xmin', 'graph-xmax', 'graph-ymin', 'graph-ymax'].forEach(id => {
    $(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runGraphTool();
    });
    $(id)?.addEventListener('change', runGraphTool);
  });
  $('btn-run-complex')?.addEventListener('click', runComplexTool);
  $('cx-operation')?.addEventListener('change', runComplexTool);
  ['mat-a-rows', 'mat-a-cols', 'mat-b-rows', 'mat-b-cols'].forEach(id => {
    $(id)?.addEventListener('change', () => {
      const clamp = (el) => Math.min(Math.max(Math.round(Number($(el).value) || 1), 1), 6);
      matADims.rows = clamp('mat-a-rows');
      matADims.cols = clamp('mat-a-cols');
      matBDims.rows = clamp('mat-b-rows');
      matBDims.cols = clamp('mat-b-cols');
      renderMatrixGrids();
    });
  });
  $('btn-run-stats')?.addEventListener('click', runStatisticsTool);
  $('btn-run-solver')?.addEventListener('click', runSolverTool);
  $('btn-run-derivative')?.addEventListener('click', () => runCalculusTool('derivative'));
  $('btn-run-integral')?.addEventListener('click', () => runCalculusTool('integral'));
  ['fin-conv-rate', 'fin-conv-from', 'fin-conv-to'].forEach(id => {
    $(id)?.addEventListener('input', runRateConversion);
    $(id)?.addEventListener('change', runRateConversion);
  });

  const unitFromSelect = $('unit-from-select');
  const unitToSelect = $('unit-to-select');
  $('unit-category-select')?.addEventListener('change', populateUnitsForCategory);
  unitFromSelect?.addEventListener('change', runUnitConversion);
  unitToSelect?.addEventListener('change', runUnitConversion);
  $('unit-input-val')?.addEventListener('input', runUnitConversion);
  $('btn-swap-units')?.addEventListener('click', () => {
    const f = unitFromSelect.value;
    unitFromSelect.value = unitToSelect.value;
    unitToSelect.value = f;
    runUnitConversion();
  });

  // Modals
  $('btn-open-tests')?.addEventListener('click', () => {
    openModal('modal-tests');
    executeInAppTests();
  });
  $('btn-rerun-tests')?.addEventListener('click', executeInAppTests);
  $('btn-open-prompt')?.addEventListener('click', () => {
    closeModal($('modal-settings'));
    openModal('modal-prompt');
  });
  $('btn-copy-master-prompt')?.addEventListener('click', () => copyTextToClipboard($('master-prompt-textarea').value));
  $('btn-open-settings')?.addEventListener('click', () => openModal('modal-settings'));
  $('btn-open-help')?.addEventListener('click', () => openModal('modal-help'));

  // Settings
  const setPrecisionSelect = $('setting-precision-mode');
  const setDecimalsInput = $('setting-decimal-places');
  const setAccentInput = $('setting-custom-accent');
  const setSoundCheck = $('setting-sound-enabled');
  const setPreviewCheck = $('setting-live-preview');
  const setHistLimitInput = $('setting-history-limit');

  function syncSettingsForm() {
    if (setPrecisionSelect) setPrecisionSelect.value = state.preferences.precisionMode;
    if (setDecimalsInput) setDecimalsInput.value = state.preferences.decimalPlaces;
    if (setSoundCheck) setSoundCheck.checked = state.preferences.soundEnabled;
    if (setPreviewCheck) setPreviewCheck.checked = state.preferences.livePreview;
    if (setHistLimitInput) setHistLimitInput.value = state.preferences.historyLimit;
  }

  setPrecisionSelect?.addEventListener('change', () => {
    state.updatePreferences({ precisionMode: setPrecisionSelect.value });
    updateDisplay();
  });
  setDecimalsInput?.addEventListener('input', () => {
    state.updatePreferences({ decimalPlaces: Number(setDecimalsInput.value) });
    updateDisplay();
  });
  setAccentInput?.addEventListener('input', () => {
    state.updatePreferences({ customAccent: setAccentInput.value });
    applyTheme();
  });
  $('btn-clear-accent')?.addEventListener('click', () => {
    state.updatePreferences({ customAccent: '' });
    applyTheme();
  });
  setSoundCheck?.addEventListener('change', () => state.updatePreferences({ soundEnabled: setSoundCheck.checked }));
  setPreviewCheck?.addEventListener('change', () => {
    state.updatePreferences({ livePreview: setPreviewCheck.checked });
    updatePreview();
  });
  setHistLimitInput?.addEventListener('change', () => {
    state.updatePreferences({ historyLimit: Number(setHistLimitInput.value) });
    renderHistoryList();
  });
  $('btn-reset-preferences')?.addEventListener('click', () => {
    state.updatePreferences(DEFAULT_PREFERENCES);
    syncSettingsForm();
    applyTheme();
    applyTranslations();
  });

  // Keyboard shortcuts
  initKeyboardShortcuts({
    onCalculate: handleCalculate,
    onClearAll: handleClearAll,
    onClearEntry: handleClearEntry,
    onBackspace: handleBackspace,
    onInsert: insertIntoExpression,
    onHistoryNavigate: navigateHistory,
    onCopyResult: copyResult,
    onHelp: () => openModal('modal-help'),
    onCloseModal: closeModal
  });

  // Initial setup
  syncSettingsForm();
  applyTheme();
  applyViewportMode();
  renderMatrixGrids();
  setExpertCategory(state.expertCategory);
  populateUnitsForCategory();
  applyTranslations();

  // URL parameters: deep linking, automation and screenshots
  const params = new URLSearchParams(window.location.search);
  if (params.has('theme')) {
    state.updatePreferences({ theme: params.get('theme') });
    applyTheme();
  }
  if (params.has('lang') || params.has('locale')) {
    state.updatePreferences({ locale: params.get('lang') || params.get('locale') });
  }
  if (params.has('mode')) state.updatePreferences({ mode: params.get('mode') });
  if (params.has('angle')) state.updatePreferences({ angleMode: params.get('angle') });
  if (params.has('viewport')) {
    state.viewportMode = params.get('viewport');
    applyViewportMode();
  }
  if (params.has('lang') || params.has('locale') || params.has('mode') || params.has('angle')) applyTranslations();
  if (params.has('tab')) {
    const tab = params.get('tab');
    if (tab === 'keypad' || tab === 'calc') setMobileView('calc');
    else setSideTab(tab);
  }
  if (params.has('view')) setMobileView(params.get('view'));
  if (params.has('expertTab')) {
    setSideTab('expert');
    setExpertCategory(params.get('expertTab'));
  }
  if (params.has('expr')) {
    setExpression(params.get('expr'));
    handleCalculate();
  }
  if (params.has('tests')) {
    openModal('modal-tests');
    executeInAppTests();
  }

  // Expose a tiny automation surface for screenshots and debugging
  window.scpApp = {
    version: APP_VERSION,
    state,
    setExpression,
    calculate: handleCalculate,
    setSideTab,
    setExpertCategory,
    setMobileView,
    runGraphTool,
    runFinanceTool,
    runMatrixOperation,
    openModal,
    executeInAppTests
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
}

export {
  APP_VERSION,
  bootstrapApp,
  runMathTests,
  runLocalizationAndStateTests
};
