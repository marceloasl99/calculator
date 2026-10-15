import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateExpression,
  CalcError,
  cleanFloatingPoint,
  toRadians,
  fromRadians
} from '../js/expression-parser.js';

import {
  CalculatorEngine,
  decimalToFraction
} from '../js/calculator-engine.js';

import { Complex } from '../js/tools/complex.js';
import {
  matrixMultiply,
  matrixInverse,
  matrixDeterminant,
  solveLinearSystem
} from '../js/tools/matrices.js';
import {
  analyzeDataset,
  linearRegression
} from '../js/tools/statistics.js';
import { solveEquation } from '../js/tools/equation-solver.js';
import {
  numericalDerivative,
  numericalIntegral
} from '../js/tools/calculus.js';
import {
  isPrime,
  primeFactorization,
  convertBase,
  bitwiseOp
} from '../js/tools/number-theory.js';
import { convertUnit } from '../js/unit-conversions.js';

const close = (actual, expected, tol = 1e-7) => {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `Expected ${actual} to be within ${tol} of ${expected}`
  );
};

test('1. Basic addition: 2 + 2 = 4', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('2 + 2'), 4);
});

test('2. Operator precedence: 2 + 3 × 4 = 14', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('2 + 3 × 4'), 14);
});

test('3. Parentheses precedence: (2 + 3) × 4 = 20', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('(2 + 3) × 4'), 20);
});

test('4. Exponentiation: 2^10 = 1024', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('2^10'), 1024);
});

test('5. Square root: √81 = 9', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('√81'), 9);
});

test('6. Base-10 logarithm: log10(1000) = 3', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('log10(1000)'), 3);
});

test('7. Natural logarithm: ln(e) = 1', () => {
  const engine = new CalculatorEngine();
  close(engine.evaluate('ln(e)'), 1);
});

test('8. Trigonometry in DEG: sin(30°) = 0.5', () => {
  const engine = new CalculatorEngine({ angleMode: 'DEG' });
  close(engine.evaluate('sin(30)'), 0.5);
});

test('9. Trigonometry in DEG: cos(60°) = 0.5', () => {
  const engine = new CalculatorEngine({ angleMode: 'DEG' });
  close(engine.evaluate('cos(60)'), 0.5);
});

test('10. Angle mode switching: DEG -> RAD -> GRAD', () => {
  const engine = new CalculatorEngine();
  engine.setAngleMode('DEG');
  close(engine.evaluate('sin(90)'), 1);
  engine.setAngleMode('RAD');
  close(engine.evaluate('sin(pi / 2)'), 1);
  engine.setAngleMode('GRAD');
  close(engine.evaluate('sin(100)'), 1);
});

test('11. Percentage conversion: 25% = 0.25 and contextual 200 + 10% = 220', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('25%'), 0.25);
  assert.equal(engine.evaluate('200 + 10%'), 220);
});

test('12. Memory operations: MS, M+, M-, MR, MC', () => {
  const engine = new CalculatorEngine();
  engine.memoryClear();
  engine.memoryStore(10);
  engine.memoryAdd(5);
  engine.memorySubtract(3);
  assert.equal(engine.memoryRecall(), 12);
  engine.memoryClear();
  assert.equal(engine.memoryRecall(), 0);
});

test('13. Division by zero handling', () => {
  const engine = new CalculatorEngine();
  assert.throws(() => engine.evaluate('15 / 0'), (err) => err instanceof CalcError && err.code === 'ERR_DIV_ZERO');
});

test('14. Logarithm of negative number in real mode', () => {
  const engine = new CalculatorEngine();
  assert.throws(() => engine.evaluate('ln(-5)'), (err) => err instanceof CalcError && err.code === 'ERR_LOG_DOMAIN');
});

test('15. Unclosed parentheses error handling', () => {
  const engine = new CalculatorEngine();
  assert.throws(() => engine.evaluate('(2 + 3 * (4 - 1)'), (err) => err instanceof CalcError && err.code === 'ERR_UNCLOSED_PAREN');
});

test('16. Invalid character error handling', () => {
  const engine = new CalculatorEngine();
  assert.throws(() => engine.evaluate('2 + $3'), (err) => err instanceof CalcError && err.code === 'ERR_INVALID_CHAR');
});

test('17. Matrix multiplication with valid dimensions', () => {
  const matProd = matrixMultiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
  assert.deepEqual(matProd, [[19, 22], [43, 50]]);
});

test('18. Singular matrix inversion error handling', () => {
  assert.throws(() => matrixInverse([[1, 2], [2, 4]]), (err) => err instanceof CalcError && err.code === 'ERR_SINGULAR_MATRIX');
});

test('19. Statistics reference dataset (mean=5, popStdDev=2, median=4.5, mode=[4])', () => {
  const stats = analyzeDataset([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(stats.mean, 5);
  assert.equal(stats.median, 4.5);
  assert.equal(stats.popStdDev, 2);
  assert.equal(stats.popVariance, 4);
  close(stats.sampleVariance, 32 / 7);
  assert.deepEqual(stats.modes, [4]);
});

test('20. Linear regression computes slope, intercept, and correlation r', () => {
  const reg = linearRegression([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }]);
  close(reg.slope, 2);
  close(reg.intercept, 1);
  close(reg.r, 1);
});

test('21. Numerical equation solver on x^2 - 9 = 0 on [0, 5] -> root 3', () => {
  const sol = solveEquation({ expression: 'x^2 - 9', variable: 'x', method: 'bisection', a: 0, b: 5, tolerance: 1e-8 });
  assert.equal(sol.converged, true);
  close(sol.root, 3, 1e-6);
  assert.ok(sol.residual < 1e-6);
});

test('22. Numerical derivative of x^2 at x = 3 -> 6', () => {
  const deriv = numericalDerivative({ expression: 'x^2', variable: 'x', x0: 3 });
  close(deriv.value, 6, 1e-7);
});

test('23. Numerical definite integral of x^2 on [0, 3] -> 9', () => {
  const integ = numericalIntegral({ expression: 'x^2', variable: 'x', a: 0, b: 3, tolerance: 1e-8 });
  close(integ.value, 9, 1e-6);
});

test('24. Floating point precision cleanup: 0.1 + 0.2 = 0.3 exact', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('0.1 + 0.2'), 0.3);
});

test('25. Implicit multiplication & nested groups: 2(3 + 4(1 + 1)) = 22', () => {
  const engine = new CalculatorEngine();
  assert.equal(engine.evaluate('2(3 + 4(1 + 1))'), 22);
});

test('26. Complex arithmetic: (3 + 2i) * (1 + 4i) = -5 + 14i', () => {
  const z1 = new Complex(3, 2);
  const z2 = new Complex(1, 4);
  const prod = Complex.mul(z1, z2);
  assert.equal(prod.re, -5);
  assert.equal(prod.im, 14);
});

test('27. Unit conversion: temperature 100°C = 212°F = 373.15K', () => {
  close(convertUnit(100, 'temperature', 'C', 'F'), 212);
  close(convertUnit(100, 'temperature', 'C', 'K'), 373.15);
  close(convertUnit(1, 'length', 'km', 'm'), 1000);
});

test('28. Number theory: prime factorization and base conversion', () => {
  assert.equal(isPrime(97), true);
  assert.equal(isPrime(100), false);
  const pf = primeFactorization(360);
  assert.equal(pf.formatted, '2^3 × 3^2 × 5');
  assert.equal(convertBase('255', 10).hex, 'FF');
  assert.equal(convertBase('1010', 2).dec, '10');
});

test('29. Rational fraction conversion: 0.75 -> 3/4', () => {
  const frac = decimalToFraction(0.75);
  assert.ok(frac);
  assert.equal(frac.str, '3/4');
});
