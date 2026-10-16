import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateExpression,
  compileExpression,
  parseAssignment,
  isReservedIdentifier,
  PHYSICAL_CONSTANTS,
  CalcError
} from '../js/expression-parser.js';
import { CalculatorEngine } from '../js/calculator-engine.js';
import { sampleFunction, niceStep } from '../js/tools/graphing.js';
import { compoundInterest, loanSchedule, convertRate, percentChange } from '../js/tools/finance.js';
import { StorageManager, VALID_THEMES } from '../js/storage.js';
import { TRANSLATIONS } from '../js/i18n.js';
import { runMathTests, runLocalizationAndStateTests } from '../js/app.js';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const close = (actual, expected, tol = 1e-7) => {
  assert.ok(Math.abs(actual - expected) <= tol, `Expected ${actual} to be within ${tol} of ${expected}`);
};

function memoryStore() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
}

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flattenKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

test('v2: physical constants are case-sensitive CODATA values', () => {
  close(evaluateExpression('NA * kB'), 8.31446261815, 1e-9);
  close(evaluateExpression('h / (2π)') / PHYSICAL_CONSTANTS.hbar.value, 1, 1e-9);
  assert.equal(evaluateExpression('c'), 299792458);
  close(evaluateExpression('2e'), 2 * Math.E, 1e-10);
});

test('v2: assignments create variables and reserved names are rejected', () => {
  assert.deepEqual(parseAssignment('r = 5'), { name: 'r', expression: '5' });
  assert.equal(parseAssignment('2 + 3'), null);
  assert.ok(isReservedIdentifier('sin'));
  assert.ok(isReservedIdentifier('pi'));
  assert.ok(!isReservedIdentifier('radius'));

  const engine = new CalculatorEngine({ angleMode: 'DEG' });
  assert.deepEqual(engine.run('radius = 3'), { value: 3, assigned: 'radius' });
  close(engine.run('π radius^2').value, 9 * Math.PI);
  assert.throws(() => engine.run('cos = 1'), (err) => err instanceof CalcError && err.code === 'ERR_RESERVED_NAME');
  engine.deleteVariable('radius');
  assert.throws(() => engine.run('radius + 1'), (err) => err.code === 'ERR_UNKNOWN_FUNC');
});

test('v2: preview evaluates without changing ans or repeat state', () => {
  const engine = new CalculatorEngine();
  engine.evaluate('10 + 5');
  assert.equal(engine.ans, 15);
  assert.equal(engine.preview('ans * 2'), 30);
  assert.equal(engine.ans, 15);
  assert.equal(engine.lastAction, '+ 5');
});

test('v2: repeat-equals state resets after an expression without a trailing operation', () => {
  const engine = new CalculatorEngine();
  engine.evaluate('2 + 3');
  assert.equal(engine.lastAction, '+ 3');
  engine.evaluate('sin(30)');
  assert.equal(engine.lastAction, null);
});

test('v2: compiled expressions evaluate repeatedly and match the interpreter', () => {
  const f = compileExpression('x^3 - 2x + 1', { variable: 'x' });
  for (const x of [-2, -0.5, 0, 1.25, 3]) {
    assert.equal(f(x), evaluateExpression('x^3 - 2x + 1', { variables: { x } }));
  }
});

test('v2: plotter finds roots, extrema and splits curves at asymptotes', () => {
  const parabola = sampleFunction('x^2 - 4', { xMin: -5, xMax: 5, samples: 500 });
  const roots = parabola.roots.slice().sort((a, b) => a - b);
  close(roots[0], -2, 1e-6);
  close(roots[1], 2, 1e-6);
  assert.ok(parabola.extrema.some(e => e.kind === 'min' && Math.abs(e.y + 4) < 1e-3));

  const hyperbola = sampleFunction('1/x', { xMin: -5, xMax: 5, samples: 400, yRange: 10 });
  assert.ok(hyperbola.segments.length >= 2, 'curve must break at x = 0');

  assert.equal(niceStep(20, 10), 2);
  assert.equal(niceStep(1, 10), 0.1);
});

test('v2: finance — compound interest with contributions', () => {
  const simple = compoundInterest({ principal: 1000, ratePercent: 10, periods: 2 });
  close(simple.futureValue, 1210);
  close(simple.interest, 210);

  const withContrib = compoundInterest({ principal: 0, ratePercent: 1, periods: 12, contribution: 100 });
  close(withContrib.futureValue, 100 * ((Math.pow(1.01, 12) - 1) / 0.01), 1e-6);
  assert.equal(withContrib.series.length, 12);
});

test('v2: finance — Price and SAC amortization schedules', () => {
  const price = loanSchedule({ amount: 10000, ratePercent: 1, periods: 12, system: 'price' });
  close(price.firstPayment, 888.4878867834, 1e-6);
  close(price.firstPayment, price.lastPayment, 1e-9);
  assert.equal(price.rows[11].balance, 0);

  const sac = loanSchedule({ amount: 12000, ratePercent: 1, periods: 12, system: 'sac' });
  close(sac.rows[0].amortization, 1000);
  close(sac.firstPayment, 1120);
  close(sac.lastPayment, 1010);
  assert.ok(sac.totalInterest < price.totalInterest * 1.2);

  assert.throws(() => loanSchedule({ amount: 0, ratePercent: 1, periods: 12 }), (err) => err.code === 'ERR_INVALID_ARG');
});

test('v2: finance — rate conversion and percent change', () => {
  close(convertRate(1, 12, 1), 12.682503013197, 1e-9);
  close(convertRate(12.682503013197, 1, 12), 1, 1e-9);
  assert.equal(percentChange(80, 100), 25);
  assert.throws(() => percentChange(0, 5), (err) => err.code === 'ERR_DIV_ZERO');
});

test('v2: storage persists variables and memory and ignores invalid entries', () => {
  const store = memoryStore();
  const storage = new StorageManager(store);
  storage.saveVariables({ r: 5, bad: 'x' });
  storage.saveMemory(42);
  assert.deepEqual(storage.loadVariables(), { r: 5 });
  assert.equal(storage.loadMemory(), 42);
  store.setItem('scp_variables_v1', '{broken');
  assert.deepEqual(storage.loadVariables(), {});
  assert.ok(VALID_THEMES.includes('aurora') && VALID_THEMES.includes('sunset'));
});

test('v2: every locale has exactly the same translation keys as English', () => {
  const reference = flattenKeys(TRANSLATIONS.en).sort();
  for (const [loc, dict] of Object.entries(TRANSLATIONS)) {
    assert.deepEqual(flattenKeys(dict).sort(), reference, `Locale ${loc} keys differ from en`);
  }
});

test('v2: js/i18n.js is in sync with locales/*.json', () => {
  for (const loc of Object.keys(TRANSLATIONS)) {
    const json = JSON.parse(fs.readFileSync(path.join(rootDir, 'locales', `${loc}.json`), 'utf8'));
    assert.deepEqual(TRANSLATIONS[loc], json, `Run "npm run sync-locales" — ${loc} is out of date`);
  }
});

test('v2: every data-i18n key used in index.html exists', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-title)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 40);
  for (const key of keys) {
    const value = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), TRANSLATIONS.en);
    assert.equal(typeof value, 'string', `Missing translation for ${key}`);
  }
});

test('v2: the in-browser test suite passes in Node as well', () => {
  const all = [...runMathTests(), ...runLocalizationAndStateTests()];
  assert.equal(all.length, 36);
  const failed = all.filter(r => !r.pass);
  assert.deepEqual(failed, []);
});

test('v2: tiny magnitudes survive floating-point cleanup while rounding residue is removed', () => {
  assert.equal(evaluateExpression('h'), 6.62607015e-34);
  assert.equal(evaluateExpression('1e-20'), 1e-20);
  assert.equal(evaluateExpression('0.1 + 0.2 - 0.3'), 0);
  assert.equal(evaluateExpression('sqrt(2)^2 - 2'), 0);
  const engine = new CalculatorEngine();
  engine.memoryStore(1.602176634e-19);
  assert.equal(engine.memoryRecall(), 1.602176634e-19);
});
