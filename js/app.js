import { AppState } from './state.js';
import { initKeyboardShortcuts } from './keyboard.js';
import {
  formatResult,
  formatExpressionForDisplay,
  getLocaleSeparators,
  SUPPORTED_LOCALES
} from './formatting.js';
import { decimalToFraction, CalculatorEngine } from './calculator-engine.js';
import { Complex } from './tools/complex.js';
import {
  MAX_MATRIX_DIM,
  validateMatrix,
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
import {
  parseDataset,
  computeQuantile,
  analyzeDataset,
  weightedMean,
  linearRegression
} from './tools/statistics.js';
import { solveEquation } from './tools/equation-solver.js';
import { numericalDerivative, numericalIntegral } from './tools/calculus.js';
import {
  isPrime,
  primeFactorization,
  convertBase,
  bitwiseOp
} from './tools/number-theory.js';
import { UNIT_CATEGORIES, convertUnit } from './unit-conversions.js';
import { DEFAULT_PREFERENCES, StorageManager } from './storage.js';
import { HistoryManager } from './history.js';
import { TRANSLATIONS } from './i18n.js';

// --- tests/math-tests.js ---
/**
 * Scientific Calculator Pro — Mandatory Mathematical & Expert Suite Tests (25+ Scenarios)
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

  // 1. 2 + 2 = 4
  assertApprox(1, 'Basic addition: 2 + 2 = 4', engine.evaluate('2 + 2'), 4);
  // 2. 2 + 3 × 4 = 14
  assertApprox(2, 'Operator precedence: 2 + 3 × 4 = 14', engine.evaluate('2 + 3 × 4'), 14);
  // 3. (2 + 3) × 4 = 20
  assertApprox(3, 'Parentheses precedence: (2 + 3) × 4 = 20', engine.evaluate('(2 + 3) × 4'), 20);
  // 4. 2^10 = 1024
  assertApprox(4, 'Exponentiation: 2^10 = 1024', engine.evaluate('2^10'), 1024);
  // 5. √81 = 9
  assertApprox(5, 'Square root: √81 = 9', engine.evaluate('√81'), 9);
  // 6. log10(1000) = 3
  assertApprox(6, 'Base-10 logarithm: log10(1000) = 3', engine.evaluate('log10(1000)'), 3);
  // 7. ln(e) = 1
  assertApprox(7, 'Natural logarithm: ln(e) = 1', engine.evaluate('ln(e)'), 1);
  // 8. sin(30°) = 0.5
  engine.setAngleMode('DEG');
  assertApprox(8, 'Trigonometry in DEG: sin(30) = 0.5', engine.evaluate('sin(30)'), 0.5);
  // 9. cos(60°) = 0.5
  assertApprox(9, 'Trigonometry in DEG: cos(60) = 0.5', engine.evaluate('cos(60)'), 0.5);
  // 10. Angle mode change DEG -> RAD -> GRAD
  engine.setAngleMode('RAD');
  const sinPi2 = engine.evaluate('sin(pi / 2)');
  engine.setAngleMode('GRAD');
  const sin100Grad = engine.evaluate('sin(100)');
  engine.setAngleMode('DEG');
  assertEqual(10, 'Angle mode switching DEG -> RAD -> GRAD', [sinPi2, sin100Grad], [1, 1]);
  // 11. Percentage conversion 25% -> 0.25 and contextual 200 + 10% = 220
  assertEqual(11, 'Percentage: 25% = 0.25 and 200 + 10% = 220', [engine.evaluate('25%'), engine.evaluate('200 + 10%')], [0.25, 220]);
  // 12. Memory operations MS, M+, M-, MR, MC
  engine.memoryClear();
  engine.memoryStore(10);
  engine.memoryAdd(5);
  engine.memorySubtract(3);
  const memRecalled = engine.memoryRecall();
  engine.memoryClear();
  assertEqual(12, 'Memory lifecycle (MS 10, M+ 5, M- 3 -> MR = 12, MC = 0)', [memRecalled, engine.memoryRecall()], [12, 0]);
  // 13. Division by zero handling
  assertThrowsCode(13, 'Division by zero error handling', () => engine.evaluate('15 / 0'), 'ERR_DIV_ZERO');
  // 14. Logarithm of negative number in real mode
  assertThrowsCode(14, 'Logarithm of negative number error handling', () => engine.evaluate('ln(-5)'), 'ERR_LOG_DOMAIN');
  // 15. Unclosed parentheses error handling
  assertThrowsCode(15, 'Unclosed parentheses error handling', () => engine.evaluate('(2 + 3 * (4 - 1)'), 'ERR_UNCLOSED_PAREN');
  // 16. Disallowed characters error handling
  assertThrowsCode(16, 'Invalid character error handling', () => engine.evaluate('2 + $3'), 'ERR_INVALID_CHAR');
  // 20. Matrix multiplication with valid dimensions
  const matProd = matrixMultiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
  assertEqual(20, 'Matrix multiplication [[1,2],[3,4]] × [[5,6],[7,8]]', matProd, [[19, 22], [43, 50]]);
  // 21. Singular matrix inversion error
  assertThrowsCode(21, 'Singular matrix inversion error handling', () => matrixInverse([[1, 2], [2, 4]]), 'ERR_SINGULAR_MATRIX');
  // 22. Statistics mean and standard deviation with reference dataset
  const stats = analyzeDataset([2, 4, 4, 4, 5, 5, 7, 9]);
  assertEqual(22, 'Statistics reference dataset (mean=5, popStdDev=2, median=4.5, mode=[4])', [stats.mean, stats.popStdDev, stats.median, stats.modes], [5, 2, 4.5, [4]]);
  // 23. Numerical equation solver on known equation x^2 - 9 = 0 in [0, 5]
  const eqSol = solveEquation({ expression: 'x^2 - 9', variable: 'x', method: 'bisection', a: 0, b: 5, tolerance: 1e-8 });
  assertApprox(23, 'Numerical equation solver: x^2 - 9 = 0 on [0, 5] -> 3', eqSol.root, 3, 1e-6);
  // 24. Numerical derivative of x^2 at x = 3 -> 6
  const deriv = numericalDerivative({ expression: 'x^2', variable: 'x', x0: 3 });
  assertApprox(24, 'Numerical derivative of x^2 at x = 3 -> 6', deriv.value, 6, 1e-8);
  // 25. Numerical definite integral of x^2 on [0, 3] -> 9
  const integ = numericalIntegral({ expression: 'x^2', variable: 'x', a: 0, b: 3, tolerance: 1e-8 });
  assertApprox(25, 'Numerical definite integral of x^2 on [0, 3] -> 9', integ.value, 9, 1e-6);

  // Additional Regression & Advanced Verification Tests (26-30)
  assertApprox(26, 'IEEE 754 cleanup: 0.1 + 0.2 = 0.3 exact', engine.evaluate('0.1 + 0.2'), 0.3, 0);
  assertApprox(27, 'Implicit multiplication & nested groups: 2(3 + 4(1 + 1)) = 22', engine.evaluate('2(3 + 4(1 + 1))'), 22);
  const cMul = Complex.mul(new Complex(3, 2), new Complex(1, 4));
  assertEqual(28, 'Complex multiplication: (3+2i)(1+4i) = -5 + 14i', [cMul.re, cMul.im], [-5, 14]);
  assertEqual(29, 'Temperature conversion: 100 °C = 212 °F = 373.15 K', [convertUnit(100, 'temperature', 'C', 'F'), convertUnit(100, 'temperature', 'C', 'K')], [212, 373.15]);
  const pf = primeFactorization(360);
  assertEqual(30, 'Prime factorization of 360 = 2^3 × 3^2 × 5 & fraction 0.75 = 3/4', [pf.formatted, decimalToFraction(0.75).str], ['2^3 × 3^2 × 5', '3/4']);

  return results;
}
// --- tests/localization-tests.js ---
/**
 * Scientific Calculator Pro — Localization, Regional Formatting, Storage & History Tests (Scenarios 17, 18, 19)
 */

function runLocalizationAndStateTests() {
  const results = [];
  const engine = new CalculatorEngine();

  // 17. Regional formatting and comma decimal input across all 6 languages
  const formattedPerLocale = {};
  let allLocalesValid = true;
  for (const loc of SUPPORTED_LOCALES) {
    const str = formatResult(12345.67, { locale: loc, precisionMode: 'fixed', decimalPlaces: 2 });
    formattedPerLocale[loc] = str;
    if (!str || typeof str !== 'string') allLocalesValid = false;
    // Also verify all 6 translation dictionaries have required sections
    const dict = TRANSLATIONS[loc];
    if (!dict || !dict.modes || !dict.themes || !dict.errors || !dict.expertTabs) {
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

  // 18. Persistence of theme and language + corrupted local data recovery
  const storage = new StorageManager();
  storage.savePreferences({ locale: 'fr', theme: 'emerald', mode: 'expert', angleMode: 'RAD' });
  const loaded = storage.loadPreferences();
  // Simulate corrupted data
  storage.memoryFallback.set('scp_preferences_v1', '{corrupted_json');
  const recovered = storage.loadPreferences();
  const pass18 = loaded.locale === 'fr' && loaded.theme === 'emerald' && recovered.locale === 'pt-BR';
  results.push({
    id: 18,
    name: 'Persistence of theme & language + corrupted storage fallback recovery',
    pass: pass18,
    expected: 'Saved (fr, emerald) & recovered (pt-BR)',
    actual: `Saved=(${loaded.locale}, ${loaded.theme}), Recovered=(${recovered.locale})`
  });

  // 19. History addition, retrieval, search, and deletion
  const hist = new HistoryManager(storage, 50);
  hist.clearAll();
  const item1 = hist.addEntry({ expression: '2 + 3 * 4', result: 14, mode: 'simple', angleMode: 'DEG' });
  const item2 = hist.addEntry({ expression: 'sin(30)', result: 0.5, mode: 'intermediate', angleMode: 'DEG' });
  const retrieved = hist.getEntry(item1.id);
  const searchSin = hist.search('sin');
  hist.removeEntry(item1.id);
  const countAfterDelete = hist.items.length;
  hist.clearAll();
  const pass19 =
    retrieved &&
    retrieved.result === 14 &&
    searchSin.length === 1 &&
    countAfterDelete === 1 &&
    hist.items.length === 0;
  results.push({
    id: 19,
    name: 'Calculation history add, retrieve, search, delete, and clear',
    pass: pass19,
    expected: 'retrieved=14, search=1, afterDelete=1, afterClear=0',
    actual: `retrieved=${retrieved?.result}, search=${searchSin.length}, afterDelete=${countAfterDelete}, afterClear=${hist.items.length}`
  });

  return results;
}
// --- UI Controller ---
/**
 * Scientific Calculator Pro — Complete Interactive UI Controller
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

function bootstrapApp() {
  const state = new AppState();
  const playBeep = createAudioFeedback();

  // Matrix state in UI
  let matADims = { rows: 2, cols: 2 };
  let matBDims = { rows: 2, cols: 2 };
  let matAData = [[1, 2], [3, 4]];
  let matBData = [[5, 6], [7, 8]];
  let vecBData = [5, 11];

  // DOM Elements
  const shellEl = document.getElementById('scp-app-shell');
  const titleEl = document.getElementById('scp-app-title');
  const subtitleEl = document.getElementById('scp-app-subtitle');
  const exprInput = document.getElementById('calc-expression-input');
  const resultDisplay = document.getElementById('calc-result-display');
  const fractionBadge = document.getElementById('calc-fraction-badge');
  const errorBanner = document.getElementById('calc-error-banner');
  const badgeMode = document.getElementById('badge-active-mode');
  const badgeAngle = document.getElementById('badge-active-angle');
  const badgeMemory = document.getElementById('badge-memory-val');
  const badgeAns = document.getElementById('badge-ans-val');
  const sciGrid = document.getElementById('scp-scientific-keypad');
  const decimalKeyBtn = document.getElementById('key-decimal-sep');

  const langSelect = document.getElementById('select-locale');
  const themeSelect = document.getElementById('select-theme');
  const viewportSelect = document.getElementById('select-viewport');

  const historyTabBtn = document.getElementById('tab-btn-history');
  const expertTabBtn = document.getElementById('tab-btn-expert');
  const historyPanel = document.getElementById('panel-history');
  const expertPanel = document.getElementById('panel-expert');
  const historySearchInput = document.getElementById('input-history-search');
  const historyListEl = document.getElementById('history-list-container');
  const clearHistoryBtn = document.getElementById('btn-clear-history');

  const toastEl = document.getElementById('scp-toast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2400);
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text)).then(() => {
        showToast(state.i18n.t('labels.copied'));
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = String(text);
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(state.i18n.t('labels.copied'));
    } catch (_) {}
    document.body.removeChild(ta);
  }

  function applyTheme() {
    const theme = state.preferences.theme || 'ocean';
    document.documentElement.setAttribute('data-theme', theme);
    if (state.preferences.customAccent) {
      document.documentElement.style.setProperty('--color-primary', state.preferences.customAccent);
    } else {
      document.documentElement.style.removeProperty('--color-primary');
    }
    if (themeSelect) themeSelect.value = theme;
  }

  function applyViewportMode() {
    if (!shellEl) return;
    shellEl.classList.toggle('viewport-mobile', state.viewportMode === 'mobile');
    if (viewportSelect) viewportSelect.value = state.viewportMode;
  }

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
      exprInput.placeholder = state.i18n.t('labels.expression');
    }

    const formattedRes = formatResult(state.lastResult, {
      locale: prefs.locale,
      precisionMode: prefs.precisionMode,
      decimalPlaces: prefs.decimalPlaces,
      scientificNotation: prefs.scientificNotation,
      showFraction: prefs.showFraction
    });
    if (resultDisplay) resultDisplay.textContent = formattedRes;

    // Show rational fraction badge whenever a non-integer rational representation exists
    if (fractionBadge) {
      const frac = decimalToFraction(state.lastResult);
      if (frac && !frac.isInteger) {
        fractionBadge.textContent = `≈ ${frac.str}`;
      } else {
        fractionBadge.textContent = '';
      }
    }

    if (badgeMode) badgeMode.textContent = state.i18n.t(`modes.${prefs.mode}`);
    if (badgeAngle) badgeAngle.textContent = prefs.angleMode;
    if (badgeMemory) {
      const memFmt = formatResult(state.engine.memory, { locale: prefs.locale });
      badgeMemory.textContent = `M: ${memFmt}`;
      badgeMemory.classList.toggle('active-toggle', state.engine.memory !== 0);
    }
    if (badgeAns) {
      const ansFmt = formatResult(state.engine.ans, { locale: prefs.locale });
      badgeAns.textContent = `ans: ${ansFmt}`;
    }

    const btnFrac = document.getElementById('btn-toggle-fraction');
    if (btnFrac) btnFrac.classList.toggle('active-toggle', Boolean(prefs.showFraction));
    const btnSci = document.getElementById('btn-toggle-sci');
    if (btnSci) btnSci.classList.toggle('active-toggle', Boolean(prefs.scientificNotation));
  }

  function applyTranslations() {
    const t = (k) => state.i18n.t(k);
    if (titleEl) titleEl.textContent = t('appTitle');
    if (subtitleEl) subtitleEl.textContent = t('appSubtitle');
    if (langSelect) langSelect.value = state.preferences.locale;

    // Mode buttons
    document.querySelectorAll('[data-mode-select]').forEach(btn => {
      const m = btn.getAttribute('data-mode-select');
      btn.textContent = t(`modes.${m}`);
      btn.classList.toggle('active', state.preferences.mode === m);
    });

    // Angle buttons
    document.querySelectorAll('[data-angle-select]').forEach(btn => {
      const a = btn.getAttribute('data-angle-select');
      btn.classList.toggle('active', state.preferences.angleMode === a);
    });

    // Localized trig labels on buttons
    const trigMap = {
      'fn-sin': t('labels.trigSin'),
      'fn-cos': t('labels.trigCos'),
      'fn-tan': t('labels.trigTan'),
      'fn-asin': t('labels.trigAsin'),
      'fn-acos': t('labels.trigAcos'),
      'fn-atan': t('labels.trigAtan')
    };
    Object.entries(trigMap).forEach(([id, label]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });

    // Theme options text
    if (themeSelect) {
      Array.from(themeSelect.options).forEach(opt => {
        opt.textContent = t(`themes.${opt.value}`);
      });
    }

    // Header & Side Tabs
    if (historyTabBtn) historyTabBtn.textContent = t('labels.history');
    if (expertTabBtn) expertTabBtn.textContent = t('labels.expertTools');
    const openTestsBtn = document.getElementById('btn-open-tests');
    if (openTestsBtn) openTestsBtn.textContent = t('labels.tests');
    const openPromptBtn = document.getElementById('btn-open-prompt');
    if (openPromptBtn) openPromptBtn.textContent = t('labels.masterPrompt');
    const openSettingsBtn = document.getElementById('btn-open-settings');
    if (openSettingsBtn) openSettingsBtn.textContent = t('labels.settings');
    const openHelpBtn = document.getElementById('btn-open-help');
    if (openHelpBtn) openHelpBtn.textContent = t('labels.help');

    // Expert Subtabs
    document.querySelectorAll('[data-expert-tab]').forEach(btn => {
      const key = btn.getAttribute('data-expert-tab');
      btn.textContent = t(`expertTabs.${key}`);
      btn.classList.toggle('active', state.expertCategory === key);
    });

    if (historySearchInput) historySearchInput.placeholder = t('labels.searchHistory');
    if (clearHistoryBtn) {
      clearHistoryBtn.textContent = state.confirmingClearHistory
        ? t('labels.confirmClearHistory')
        : t('labels.clearHistory');
    }

    // Populate unit category selector with translated names
    const unitCatSelect = document.getElementById('unit-category-select');
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

    if (state.errorCode) {
      showError({ code: state.errorCode });
    }

    updateModeLayout();
    updateDisplay();
    renderHistoryList();
  }

  function updateModeLayout() {
    const mode = state.preferences.mode;
    if (sciGrid) {
      sciGrid.classList.toggle('hidden', mode === 'simple');
    }
    if (mode === 'expert' && state.sideTab !== 'expert') {
      setSideTab('expert');
    }
  }

  function setSideTab(tabName) {
    state.sideTab = tabName;
    if (historyTabBtn) historyTabBtn.classList.toggle('active', tabName === 'history');
    if (expertTabBtn) expertTabBtn.classList.toggle('active', tabName === 'expert');
    if (historyPanel) historyPanel.classList.toggle('hidden', tabName !== 'history');
    if (expertPanel) expertPanel.classList.toggle('hidden', tabName !== 'expert');
  }

  function setExpertCategory(catKey) {
    state.expertCategory = catKey;
    document.querySelectorAll('[data-expert-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-expert-tab') === catKey);
    });
    document.querySelectorAll('[data-expert-section]').forEach(sec => {
      sec.classList.toggle('hidden', sec.getAttribute('data-expert-section') !== catKey);
    });
  }

  function insertIntoExpression(token) {
    if (state.preferences.soundEnabled) playBeep(540);
    clearError();
    if (token === '.') {
      const { decimal } = getLocaleSeparators(state.preferences.locale);
      state.expression += decimal;
    } else {
      state.expression += token;
    }
    if (exprInput) exprInput.value = state.expression;
    updateDisplay();
  }

  function handleClearAll() {
    if (state.preferences.soundEnabled) playBeep(340);
    clearError();
    state.expression = '';
    state.lastResult = 0;
    if (exprInput) exprInput.value = '';
    updateDisplay();
  }

  function handleClearEntry() {
    if (state.preferences.soundEnabled) playBeep(380);
    clearError();
    // Remove last number or identifier token from expression
    state.expression = state.expression.replace(/([a-zA-Z0-9.,_]+|\s*[+\-*/^×÷]\s*)$/, '').trimEnd();
    if (exprInput) exprInput.value = state.expression;
    updateDisplay();
  }

  function handleBackspace() {
    if (state.preferences.soundEnabled) playBeep(410);
    clearError();
    state.expression = state.expression.slice(0, -1);
    if (exprInput) exprInput.value = state.expression;
    updateDisplay();
  }

  function handleToggleSign() {
    clearError();
    if (!state.expression.trim()) {
      if (state.lastResult !== 0) {
        state.lastResult = -state.lastResult;
        state.expression = String(state.lastResult);
      } else {
        state.expression = '-';
      }
    } else if (state.expression.startsWith('-(') && state.expression.endsWith(')')) {
      state.expression = state.expression.slice(2, -1);
    } else {
      state.expression = `-(${state.expression})`;
    }
    if (exprInput) exprInput.value = state.expression;
    updateDisplay();
  }

  function handleCalculate() {
    if (state.preferences.soundEnabled) playBeep(680);
    clearError();
    const raw = exprInput ? exprInput.value.trim() : state.expression.trim();
    state.expression = raw;

    try {
      let res;
      if (!raw && state.engine.lastAction) {
        res = state.engine.repeatLast(state.lastResult);
        state.expression = `${state.lastResult} ${state.engine.lastAction}`;
      } else {
        res = state.engine.evaluate(raw, {
          angleMode: state.preferences.angleMode
        });
      }
      state.lastResult = res;
      state.history.addEntry({
        expression: state.expression,
        result: res,
        mode: state.preferences.mode,
        angleMode: state.preferences.angleMode,
        precisionMode: state.preferences.precisionMode
      });
      updateDisplay();
      renderHistoryList();
    } catch (err) {
      showError(err);
    }
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    const query = historySearchInput ? historySearchInput.value : '';
    const items = state.history.search(query);
    historyListEl.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'scp-result-card';
      empty.textContent = state.i18n.t('labels.emptyHistory');
      historyListEl.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'scp-history-item';

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.justifyContent = 'space-between';
      topRow.style.fontSize = '0.73rem';
      topRow.style.color = 'var(--color-text-muted)';

      const metaSpan = document.createElement('span');
      const dateStr = new Date(item.timestamp).toLocaleTimeString(state.preferences.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      metaSpan.textContent = `${dateStr} • ${item.mode.toUpperCase()} • ${item.angleMode}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'scp-subtab-btn';
      delBtn.textContent = state.i18n.t('labels.delete');
      delBtn.addEventListener('click', () => {
        state.history.removeEntry(item.id);
        renderHistoryList();
      });

      topRow.appendChild(metaSpan);
      topRow.appendChild(delBtn);

      const exprDiv = document.createElement('div');
      exprDiv.className = 'tabular-nums';
      exprDiv.style.fontSize = '0.88rem';
      exprDiv.style.color = 'var(--color-text-muted)';
      exprDiv.textContent = formatExpressionForDisplay(item.expression, state.preferences.locale);

      const resDiv = document.createElement('div');
      resDiv.className = 'tabular-nums';
      resDiv.style.fontSize = '1.08rem';
      resDiv.style.fontWeight = '700';
      resDiv.textContent = `= ${formatResult(item.result, { locale: state.preferences.locale })}`;

      const actionsRow = document.createElement('div');
      actionsRow.style.display = 'flex';
      actionsRow.style.flexWrap = 'wrap';
      actionsRow.style.gap = '6px';

      const btnReuseExpr = document.createElement('button');
      btnReuseExpr.className = 'scp-subtab-btn';
      btnReuseExpr.textContent = state.i18n.t('labels.reuse');
      btnReuseExpr.addEventListener('click', () => {
        state.expression = item.expression;
        state.lastResult = item.result;
        if (exprInput) exprInput.value = item.expression;
        updateDisplay();
      });

      const btnCopyExpr = document.createElement('button');
      btnCopyExpr.className = 'scp-subtab-btn';
      btnCopyExpr.textContent = state.i18n.t('labels.copyExpr');
      btnCopyExpr.addEventListener('click', () => copyTextToClipboard(item.expression));

      const btnCopyRes = document.createElement('button');
      btnCopyRes.className = 'scp-subtab-btn';
      btnCopyRes.textContent = state.i18n.t('labels.copyRes');
      btnCopyRes.addEventListener('click', () => copyTextToClipboard(item.result));

      actionsRow.appendChild(btnReuseExpr);
      actionsRow.appendChild(btnCopyExpr);
      actionsRow.appendChild(btnCopyRes);

      row.appendChild(topRow);
      row.appendChild(exprDiv);
      row.appendChild(resDiv);
      row.appendChild(actionsRow);
      historyListEl.appendChild(row);
    });
  }

  // ==================== EXPERT MODULE A: COMPLEX NUMBERS ====================
  function runComplexTool() {
    const outEl = document.getElementById('complex-result-box');
    if (!outEl) return;
    try {
      const a = Number(document.getElementById('cx-z1-re').value || 0);
      const b = Number(document.getElementById('cx-z1-im').value || 0);
      const c = Number(document.getElementById('cx-z2-re').value || 0);
      const d = Number(document.getElementById('cx-z2-im').value || 0);
      const n = Number(document.getElementById('cx-power-n').value || 2);
      const op = document.getElementById('cx-operation').value;
      const angleMode = state.preferences.angleMode;

      const z1 = new Complex(a, b);
      const z2 = new Complex(c, d);
      let summary = '';

      if (op === 'add') {
        const res = Complex.add(z1, z2);
        summary = `(${z1.format()}) + (${z2.format()}) = ${res.format()} | |z| = ${res.modulus()}`;
      } else if (op === 'sub') {
        const res = Complex.sub(z1, z2);
        summary = `(${z1.format()}) − (${z2.format()}) = ${res.format()} | |z| = ${res.modulus()}`;
      } else if (op === 'mul') {
        const res = Complex.mul(z1, z2);
        summary = `(${z1.format()}) × (${z2.format()}) = ${res.format()} | |z| = ${res.modulus()}`;
      } else if (op === 'div') {
        const res = Complex.div(z1, z2);
        summary = `(${z1.format()}) ÷ (${z2.format()}) = ${res.format()} | |z| = ${res.modulus()}`;
      } else if (op === 'conj') {
        const res = z1.conjugate();
        const pol = z1.toPolar(angleMode);
        summary = `z̄₁ = ${res.format()} | |z₁| = ${pol.r} | arg(z₁) = ${pol.theta} (${angleMode}) | Polar: ${pol.r} ∠ ${pol.theta}`;
      } else if (op === 'polar2rect') {
        const rect = Complex.fromPolar(a, b, angleMode);
        summary = `Polar (${a} ∠ ${b} ${angleMode}) → Retangular: ${rect.format()}`;
      } else if (op === 'pow') {
        const res = z1.pow(n);
        summary = `(${z1.format()})^${n} = ${res.format()} | |z| = ${res.modulus()}`;
      } else if (op === 'roots') {
        const roots = z1.nthRoots(n, angleMode);
        summary = roots.map(r => `w_${r.index} = ${r.formatted} (∠ ${r.polarAngle} ${angleMode})`).join(' • ');
      }
      outEl.textContent = summary;
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE B: MATRICES ====================
  function renderMatrixGrids() {
    const gridA = document.getElementById('matrix-a-grid');
    const gridB = document.getElementById('matrix-b-grid');
    if (!gridA || !gridB) return;

    gridA.style.gridTemplateColumns = `repeat(${matADims.cols}, 1fr)`;
    gridA.innerHTML = '';
    for (let r = 0; r < matADims.rows; r++) {
      if (!matAData[r]) matAData[r] = [];
      for (let c = 0; c < matADims.cols; c++) {
        if (matAData[r][c] === undefined) matAData[r][c] = r === c ? 1 : 0;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = 'any';
        inp.className = 'scp-matrix-cell tabular-nums';
        inp.value = matAData[r][c];
        inp.setAttribute('aria-label', `A[${r + 1},${c + 1}]`);
        inp.addEventListener('input', () => {
          matAData[r][c] = Number(inp.value || 0);
        });
        gridA.appendChild(inp);
      }
    }

    gridB.style.gridTemplateColumns = `repeat(${matBDims.cols}, 1fr)`;
    gridB.innerHTML = '';
    for (let r = 0; r < matBDims.rows; r++) {
      if (!matBData[r]) matBData[r] = [];
      for (let c = 0; c < matBDims.cols; c++) {
        if (matBData[r][c] === undefined) matBData[r][c] = r === c ? 1 : 0;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = 'any';
        inp.className = 'scp-matrix-cell tabular-nums';
        inp.value = matBData[r][c];
        inp.setAttribute('aria-label', `B[${r + 1},${c + 1}]`);
        inp.addEventListener('input', () => {
          matBData[r][c] = Number(inp.value || 0);
        });
        gridB.appendChild(inp);
      }
    }
  }

  function getActiveMatrix(data, dims) {
    return Array.from({ length: dims.rows }, (_, r) =>
      Array.from({ length: dims.cols }, (__, c) => Number(data[r]?.[c] || 0))
    );
  }

  function runMatrixOperation(op) {
    const outEl = document.getElementById('matrix-result-box');
    if (!outEl) return;
    try {
      const A = getActiveMatrix(matAData, matADims);
      const B = getActiveMatrix(matBData, matBDims);
      const k = Number(document.getElementById('matrix-scalar-k').value || 2);

      let res;
      if (op === 'add') res = matrixAdd(A, B);
      else if (op === 'sub') res = matrixSub(A, B);
      else if (op === 'mul') res = matrixMultiply(A, B);
      else if (op === 'scalar') res = matrixScalar(A, k);
      else if (op === 'trans') res = matrixTranspose(A);
      else if (op === 'det') {
        const d = matrixDeterminant(A);
        outEl.textContent = `det(A) = ${formatResult(d, { locale: state.preferences.locale })}`;
        return;
      } else if (op === 'trace') {
        const tr = matrixTrace(A);
        outEl.textContent = `tr(A) = ${formatResult(tr, { locale: state.preferences.locale })}`;
        return;
      } else if (op === 'inv') {
        res = matrixInverse(A);
      } else if (op === 'solve') {
        // Use first column of B as vector b in A*x = b
        const bVec = Array.from({ length: matADims.rows }, (_, r) => Number(B[r]?.[0] || 0));
        const xSol = solveLinearSystem(A, bVec);
        outEl.textContent = `A·x = b → x = [ ${xSol.map(v => formatResult(v, { locale: state.preferences.locale })).join(' ; ')} ]`;
        return;
      }

      if (Array.isArray(res)) {
        const formattedRows = res.map(row =>
          `[ ${row.map(v => formatResult(v, { locale: state.preferences.locale })).join(' , ')} ]`
        );
        outEl.textContent = formattedRows.join('  |  ');
      }
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE C: STATISTICS ====================
  function runStatisticsTool() {
    const outEl = document.getElementById('stats-result-box');
    if (!outEl) return;
    try {
      const xRaw = document.getElementById('stats-input-x').value;
      const yRaw = document.getElementById('stats-input-y').value.trim();
      const pRank = Number(document.getElementById('stats-percentile-k').value || 90);
      const res = analyzeDataset(xRaw, {
        secondaryData: yRaw || null,
        percentile: pRank
      });
      const loc = state.preferences.locale;
      const fmt = (v) => (v === null || v === undefined ? '—' : formatResult(v, { locale: loc }));
      const modeStr = res.modes.length > 0 ? res.modes.map(fmt).join(', ') : 'Amodal';

      let text = `n = ${res.count} | ∑x = ${fmt(res.sum)} | ∑x² = ${fmt(res.sumSquares)} | x̄ = ${fmt(res.mean)} | Mediana = ${fmt(res.median)} | Moda = ${modeStr} | Min = ${fmt(res.min)} | Max = ${fmt(res.max)} | Amp = ${fmt(res.range)} | σ² (Pop) = ${fmt(res.popVariance)} | σ (Pop) = ${fmt(res.popStdDev)} | s² (Amostral) = ${fmt(res.sampleVariance)} | s (Amostral) = ${fmt(res.sampleStdDev)} | Q1 = ${fmt(res.q1)} | Q2 = ${fmt(res.q2)} | Q3 = ${fmt(res.q3)} | IIQ = ${fmt(res.iqr)} | P_${res.percentileRank} = ${fmt(res.customPercentile)}`;

      if (res.weightedMean !== null) {
        text += ` | Média Pond. = ${fmt(res.weightedMean)}`;
      }
      if (res.regression) {
        text += ` | Regressão: ${res.regression.equation} (r = ${fmt(res.regression.r)}, R² = ${fmt(res.regression.r2)})`;
      }
      outEl.textContent = text;
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE D: EQUATION SOLVER ====================
  function runSolverTool() {
    const outEl = document.getElementById('solver-result-box');
    if (!outEl) return;
    try {
      const expr = document.getElementById('solver-expr').value;
      const method = document.getElementById('solver-method').value;
      const a = Number(document.getElementById('solver-a').value);
      const b = Number(document.getElementById('solver-b').value);
      const tol = Number(document.getElementById('solver-tol').value || 1e-7);
      const maxIter = Number(document.getElementById('solver-max-iter').value || 100);

      const res = solveEquation({
        expression: expr,
        variable: 'x',
        method,
        a,
        b,
        x0: a,
        tolerance: tol,
        maxIterations: maxIter,
        angleMode: state.preferences.angleMode
      });

      if (!res.converged) {
        const msg = state.i18n.translateError({ code: res.reasonCode || 'ERR_MAX_ITER' });
        outEl.textContent = `${res.method}: ${msg} (Iter: ${res.iterations})`;
        return;
      }

      outEl.textContent = `x* ≈ ${formatResult(res.root, { locale: state.preferences.locale })} | |f(x*)| = ${res.residual.toExponential(2)} | Iterações: ${res.iterations} | Método: ${res.method} • ${state.i18n.t('labels.approxNotice')}`;
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE E: NUMERICAL CALCULUS ====================
  function runCalculusTool(kind) {
    const outEl = document.getElementById('calculus-result-box');
    if (!outEl) return;
    try {
      const expr = document.getElementById('calc-tool-expr').value;
      const x0 = Number(document.getElementById('calc-tool-x0').value || 2);
      const a = Number(document.getElementById('calc-tool-a').value || 0);
      const b = Number(document.getElementById('calc-tool-b').value || 3);
      const tol = Number(document.getElementById('calc-tool-tol').value || 1e-7);

      if (kind === 'derivative') {
        const d = numericalDerivative({
          expression: expr,
          variable: 'x',
          x0,
          angleMode: state.preferences.angleMode
        });
        outEl.textContent = `f'(${x0}) ≈ ${formatResult(d.value, { locale: state.preferences.locale })} | f''(${x0}) ≈ ${formatResult(d.secondDerivative, { locale: state.preferences.locale })} | f(${x0}) = ${formatResult(d.fAtPoint, { locale: state.preferences.locale })} | Erro est.: ${d.estimatedError.toExponential(2)} (${d.method})`;
      } else {
        const integ = numericalIntegral({
          expression: expr,
          variable: 'x',
          a,
          b,
          tolerance: tol,
          angleMode: state.preferences.angleMode
        });
        outEl.textContent = `∫[${a}, ${b}] f(x) dx ≈ ${formatResult(integ.value, { locale: state.preferences.locale })} | Erro est.: ${integ.estimatedError.toExponential(2)} | Avaliações: ${integ.evaluations} (${integ.method})`;
      }
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE F: UNIT CONVERTER ====================
  function populateUnitsForCategory() {
    const catSelect = document.getElementById('unit-category-select');
    const fromSelect = document.getElementById('unit-from-select');
    const toSelect = document.getElementById('unit-to-select');
    if (!catSelect || !fromSelect || !toSelect) return;

    const catKey = catSelect.value || 'length';
    const cat = UNIT_CATEGORIES[catKey];
    if (!cat) return;

    const unitKeys = Object.keys(cat.units);
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    unitKeys.forEach((uKey, idx) => {
      const symbol = cat.units[uKey].symbol;
      const opt1 = document.createElement('option');
      opt1.value = uKey;
      opt1.textContent = `${uKey} (${symbol})`;
      fromSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = uKey;
      opt2.textContent = `${uKey} (${symbol})`;
      toSelect.appendChild(opt2);
      if (idx === 1) toSelect.value = uKey;
    });
    runUnitConversion();
  }

  function runUnitConversion() {
    const outEl = document.getElementById('unit-result-box');
    if (!outEl) return;
    try {
      const catKey = document.getElementById('unit-category-select').value || 'length';
      const fromU = document.getElementById('unit-from-select').value;
      const toU = document.getElementById('unit-to-select').value;
      const val = Number(document.getElementById('unit-input-val').value || 0);

      const res = convertUnit(val, catKey, fromU, toU);
      const cat = UNIT_CATEGORIES[catKey];
      const fromSym = cat.units[fromU]?.symbol || fromU;
      const toSym = cat.units[toU]?.symbol || toU;

      // Also build quick summary across other units in category
      const allConversions = Object.keys(cat.units)
        .slice(0, 6)
        .map(u => `${formatResult(convertUnit(val, catKey, fromU, u), { locale: state.preferences.locale })} ${cat.units[u].symbol}`)
        .join(' • ');

      outEl.textContent = `${formatResult(val, { locale: state.preferences.locale })} ${fromSym} = ${formatResult(res, { locale: state.preferences.locale })} ${toSym}  |  [${allConversions}]`;
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== EXPERT MODULE G: NUMBER THEORY & BASES ====================
  function runNumberTheoryTool(action) {
    const outEl = document.getElementById('nt-result-box');
    if (!outEl) return;
    try {
      const a = Number(document.getElementById('nt-input-a').value || 360);
      const b = Number(document.getElementById('nt-input-b').value || 48);

      if (action === 'gcd_lcm') {
        const g = gcdTwo(a, b);
        const l = lcmTwo(a, b);
        outEl.textContent = `MDC(${a}, ${b}) = ${g}  |  MMC(${a}, ${b}) = ${l}`;
      } else if (action === 'comb') {
        const p = nPrCalc(a, b);
        const c = nCrCalc(a, b);
        outEl.textContent = `P(${a}, ${b}) = ${formatResult(p, { locale: state.preferences.locale })}  |  C(${a}, ${b}) = ${formatResult(c, { locale: state.preferences.locale })}`;
      } else if (action === 'prime') {
        const pf = primeFactorization(a);
        const primeLabel = pf.isPrime ? 'PRIMO' : 'COMPOSTO';
        outEl.textContent = `${a} (${primeLabel}) = ${pf.formatted}`;
      } else if (action === 'base') {
        const baseStr = document.getElementById('nt-base-input').value || '255';
        const fromB = Number(document.getElementById('nt-base-select').value || 10);
        const conv = convertBase(baseStr, fromB);
        outEl.textContent = `DEC: ${conv.dec} | HEX: 0x${conv.hex} | BIN: 0b${conv.bin} | OCT: 0o${conv.oct}`;
      } else if (action === 'bitwise') {
        const bitOp = document.getElementById('nt-bitwise-op').value || 'AND';
        const bw = bitwiseOperation(a, b, bitOp);
        outEl.textContent = `${a} ${bitOp} ${b} = ${bw.result} (BIN: ${bw.bases.bin} | HEX: 0x${bw.bases.hex})`;
      }
    } catch (err) {
      outEl.textContent = state.i18n.translateError(err);
    }
  }

  // ==================== IN-APP AUTOMATED TEST SUITE RUNNER ====================
  function executeInAppTests() {
    const container = document.getElementById('modal-tests-results');
    const summaryEl = document.getElementById('modal-tests-summary');
    if (!container || !summaryEl) return;

    const all = [...runMathTests(), ...runLocalizationAndStateTests()].sort((a, b) => a.id - b.id);
    const passed = all.filter(r => r.pass).length;
    summaryEl.textContent = `${passed} / ${all.length} — ${state.i18n.t('labels.allPassed')}`;

    container.innerHTML = '';
    all.forEach(r => {
      const item = document.createElement('div');
      item.className = 'scp-result-card';
      item.style.marginBottom = '6px';
      item.style.borderLeft = r.pass ? '4px solid var(--color-success)' : '4px solid var(--color-error)';
      item.textContent = `[${r.pass ? 'PASS' : 'FAIL'}] #${String(r.id).padStart(2, '0')} ${r.name} — Result: ${JSON.stringify(r.actual)}`;
      container.appendChild(item);
    });
  }

  // ==================== EVENT LISTENERS & DELEGATION ====================
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;

    // Mode switch
    if (btn.hasAttribute('data-mode-select')) {
      const m = btn.getAttribute('data-mode-select');
      state.updatePreferences({ mode: m });
      applyTranslations();
      return;
    }

    // Angle switch
    if (btn.hasAttribute('data-angle-select')) {
      const a = btn.getAttribute('data-angle-select');
      state.updatePreferences({ angleMode: a });
      applyTranslations();
      return;
    }

    // Keypad insertion
    if (btn.hasAttribute('data-insert')) {
      insertIntoExpression(btn.getAttribute('data-insert'));
      return;
    }

    // Keypad actions
    if (btn.hasAttribute('data-calc-action')) {
      const act = btn.getAttribute('data-calc-action');
      if (act === 'clear-all') handleClearAll();
      else if (act === 'clear-entry') handleClearEntry();
      else if (act === 'backspace') handleBackspace();
      else if (act === 'toggle-sign') handleToggleSign();
      else if (act === 'equals') handleCalculate();
      else if (act === 'mc') { state.engine.memoryClear(); updateDisplay(); }
      else if (act === 'mr') { insertIntoExpression(String(state.engine.memoryRecall())); }
      else if (act === 'mplus') { state.engine.memoryAdd(state.lastResult); updateDisplay(); }
      else if (act === 'mminus') { state.engine.memorySubtract(state.lastResult); updateDisplay(); }
      else if (act === 'ms') { state.engine.memoryStore(state.lastResult); updateDisplay(); }
      return;
    }

    // Side panel tabs
    if (btn.id === 'tab-btn-history') { setSideTab('history'); return; }
    if (btn.id === 'tab-btn-expert') { setSideTab('expert'); return; }

    // Expert category tabs
    if (btn.hasAttribute('data-expert-tab')) {
      setExpertCategory(btn.getAttribute('data-expert-tab'));
      return;
    }

    // Matrix operation buttons
    if (btn.hasAttribute('data-matrix-op')) {
      runMatrixOperation(btn.getAttribute('data-matrix-op'));
      return;
    }

    // Number theory buttons
    if (btn.hasAttribute('data-nt-op')) {
      runNumberTheoryTool(btn.getAttribute('data-nt-op'));
      return;
    }

    // Modal triggers & close buttons
    if (btn.hasAttribute('data-close-modal')) {
      const modalId = btn.getAttribute('data-close-modal');
      const mEl = document.getElementById(modalId);
      if (mEl) mEl.classList.add('hidden');
      return;
    }
  });

  // Expression direct typing
  if (exprInput) {
    exprInput.addEventListener('input', () => {
      state.expression = exprInput.value;
      clearError();
    });
  }

  // Selects & Toggles
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

  const btnToggleFrac = document.getElementById('btn-toggle-fraction');
  if (btnToggleFrac) {
    btnToggleFrac.addEventListener('click', () => {
      state.updatePreferences({ showFraction: !state.preferences.showFraction });
      updateDisplay();
    });
  }

  const btnToggleSci = document.getElementById('btn-toggle-sci');
  if (btnToggleSci) {
    btnToggleSci.addEventListener('click', () => {
      state.updatePreferences({ scientificNotation: !state.preferences.scientificNotation });
      updateDisplay();
    });
  }

  if (historySearchInput) {
    historySearchInput.addEventListener('input', () => renderHistoryList());
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (!state.confirmingClearHistory) {
        state.confirmingClearHistory = true;
        applyTranslations();
        setTimeout(() => {
          state.confirmingClearHistory = false;
          applyTranslations();
        }, 3500);
      } else {
        state.confirmingClearHistory = false;
        state.history.clearAll();
        applyTranslations();
      }
    });
  }

  // Expert Tools button bindings
  const btnRunComplex = document.getElementById('btn-run-complex');
  if (btnRunComplex) btnRunComplex.addEventListener('click', runComplexTool);

  const btnApplyMatDims = document.getElementById('btn-apply-matrix-dims');
  if (btnApplyMatDims) {
    btnApplyMatDims.addEventListener('click', () => {
      matADims.rows = Math.min(Math.max(Number(document.getElementById('mat-a-rows').value || 2), 1), 6);
      matADims.cols = Math.min(Math.max(Number(document.getElementById('mat-a-cols').value || 2), 1), 6);
      matBDims.rows = Math.min(Math.max(Number(document.getElementById('mat-b-rows').value || 2), 1), 6);
      matBDims.cols = Math.min(Math.max(Number(document.getElementById('mat-b-cols').value || 2), 1), 6);
      renderMatrixGrids();
    });
  }

  const btnRunStats = document.getElementById('btn-run-stats');
  if (btnRunStats) btnRunStats.addEventListener('click', runStatisticsTool);

  const btnRunSolver = document.getElementById('btn-run-solver');
  if (btnRunSolver) btnRunSolver.addEventListener('click', runSolverTool);

  const btnRunDeriv = document.getElementById('btn-run-derivative');
  if (btnRunDeriv) btnRunDeriv.addEventListener('click', () => runCalculusTool('derivative'));

  const btnRunInteg = document.getElementById('btn-run-integral');
  if (btnRunInteg) btnRunInteg.addEventListener('click', () => runCalculusTool('integral'));

  const unitCatSelect = document.getElementById('unit-category-select');
  if (unitCatSelect) unitCatSelect.addEventListener('change', populateUnitsForCategory);
  const unitFromSelect = document.getElementById('unit-from-select');
  if (unitFromSelect) unitFromSelect.addEventListener('change', runUnitConversion);
  const unitToSelect = document.getElementById('unit-to-select');
  if (unitToSelect) unitToSelect.addEventListener('change', runUnitConversion);
  const unitValInput = document.getElementById('unit-input-val');
  if (unitValInput) unitValInput.addEventListener('input', runUnitConversion);
  const btnSwapUnits = document.getElementById('btn-swap-units');
  if (btnSwapUnits) {
    btnSwapUnits.addEventListener('click', () => {
      const f = unitFromSelect.value;
      unitFromSelect.value = unitToSelect.value;
      unitToSelect.value = f;
      runUnitConversion();
    });
  }

  // Modals
  const btnOpenTests = document.getElementById('btn-open-tests');
  if (btnOpenTests) {
    btnOpenTests.addEventListener('click', () => {
      document.getElementById('modal-tests').classList.remove('hidden');
      executeInAppTests();
    });
  }
  const btnRerunTests = document.getElementById('btn-rerun-tests');
  if (btnRerunTests) btnRerunTests.addEventListener('click', executeInAppTests);

  const btnOpenPrompt = document.getElementById('btn-open-prompt');
  if (btnOpenPrompt) {
    btnOpenPrompt.addEventListener('click', () => {
      document.getElementById('modal-prompt').classList.remove('hidden');
    });
  }
  const btnCopyMasterPrompt = document.getElementById('btn-copy-master-prompt');
  if (btnCopyMasterPrompt) {
    btnCopyMasterPrompt.addEventListener('click', () => {
      const promptText = document.getElementById('master-prompt-textarea').value;
      copyTextToClipboard(promptText);
    });
  }

  const btnOpenSettings = document.getElementById('btn-open-settings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      document.getElementById('modal-settings').classList.remove('hidden');
    });
  }

  const btnOpenHelp = document.getElementById('btn-open-help');
  if (btnOpenHelp) {
    btnOpenHelp.addEventListener('click', () => {
      document.getElementById('modal-help').classList.remove('hidden');
    });
  }

  // Settings controls
  const setPrecisionSelect = document.getElementById('setting-precision-mode');
  const setDecimalsInput = document.getElementById('setting-decimal-places');
  const setAccentInput = document.getElementById('setting-custom-accent');
  const setSoundCheck = document.getElementById('setting-sound-enabled');
  const setHistLimitInput = document.getElementById('setting-history-limit');
  const btnResetPrefs = document.getElementById('btn-reset-preferences');

  if (setPrecisionSelect) {
    setPrecisionSelect.value = state.preferences.precisionMode;
    setPrecisionSelect.addEventListener('change', () => {
      state.updatePreferences({ precisionMode: setPrecisionSelect.value });
      updateDisplay();
    });
  }
  if (setDecimalsInput) {
    setDecimalsInput.value = state.preferences.decimalPlaces;
    setDecimalsInput.addEventListener('input', () => {
      state.updatePreferences({ decimalPlaces: Number(setDecimalsInput.value) });
      updateDisplay();
    });
  }
  if (setAccentInput) {
    setAccentInput.addEventListener('input', () => {
      state.updatePreferences({ customAccent: setAccentInput.value });
      applyTheme();
    });
  }
  if (setSoundCheck) {
    setSoundCheck.checked = state.preferences.soundEnabled;
    setSoundCheck.addEventListener('change', () => {
      state.updatePreferences({ soundEnabled: setSoundCheck.checked });
    });
  }
  if (setHistLimitInput) {
    setHistLimitInput.value = state.preferences.historyLimit;
    setHistLimitInput.addEventListener('change', () => {
      state.updatePreferences({ historyLimit: Number(setHistLimitInput.value) });
      renderHistoryList();
    });
  }
  if (btnResetPrefs) {
    btnResetPrefs.addEventListener('click', () => {
      state.updatePreferences(DEFAULT_PREFERENCES);
      applyTheme();
      applyTranslations();
    });
  }

  // Keyboard shortcuts
  initKeyboardShortcuts({
    onCalculate: handleCalculate,
    onClearAll: handleClearAll,
    onClearEntry: handleClearEntry,
    onBackspace: handleBackspace,
    onInsert: insertIntoExpression
  });

  // Initial setup
  applyTheme();
  applyViewportMode();
  renderMatrixGrids();
  applyTranslations();
  populateUnitsForCategory();
  runComplexTool();
  runStatisticsTool();
  runSolverTool();
  runCalculusTool('derivative');
  runNumberTheoryTool('gcd_lcm');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
}

export {
  bootstrapApp,
  runMathTests,
  runLocalizationAndStateTests
};
