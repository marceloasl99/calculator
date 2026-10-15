import { evaluateExpression, cleanFloatingPoint, CalcError } from '../expression-parser.js';

// --- js/tools/calculus.js ---
/**
 * Scientific Calculator Pro — Expert Module E: Numerical Derivatives & Definite Integrals
 * Uses 5-point central finite difference stencil for derivatives and Adaptive Simpson's Rule for integrals.
 */

function numericalDerivative(options = {}) {
  const expr = String(options.expression || '').trim();
  if (!expr) throw new CalcError('ERR_EMPTY');
  const variable = String(options.variable || 'x').trim() || 'x';
  const x0 = Number(options.x0 !== undefined ? options.x0 : 1);
  if (!Number.isFinite(x0)) throw new CalcError('ERR_INVALID_ARG');
  const angleMode = options.angleMode || 'RAD';
  const h = Math.max(Number(options.step) || 1e-4, 1e-7);

  const f = (x) => evaluateExpression(expr, { angleMode, variables: { [variable]: x } });

  const fm2 = f(x0 - 2 * h);
  const fm1 = f(x0 - h);
  const f0 = f(x0);
  const fp1 = f(x0 + h);
  const fp2 = f(x0 + 2 * h);

  // 5-point stencil O(h^4) first derivative
  const firstDeriv = (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h);
  // 3-point stencil O(h^2) for error estimate comparison
  const threePoint = (fp1 - fm1) / (2 * h);
  const estimatedError = Math.abs(firstDeriv - threePoint);

  // 5-point stencil second derivative
  const secondDeriv = (-fp2 + 16 * fp1 - 30 * f0 + 16 * fm1 - fm2) / (12 * h * h);

  if (!Number.isFinite(firstDeriv)) throw new CalcError('ERR_CALC_DISCONTINUITY');

  return {
    value: cleanFloatingPoint(firstDeriv),
    secondDerivative: cleanFloatingPoint(secondDeriv),
    fAtPoint: cleanFloatingPoint(f0),
    point: x0,
    estimatedError: cleanFloatingPoint(estimatedError),
    method: '5-Point Central Finite Difference O(h⁴)',
    isApproximate: true
  };
}

function numericalIntegral(options = {}) {
  const expr = String(options.expression || '').trim();
  if (!expr) throw new CalcError('ERR_EMPTY');
  const variable = String(options.variable || 'x').trim() || 'x';
  const a = Number(options.a !== undefined ? options.a : 0);
  const b = Number(options.b !== undefined ? options.b : 1);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new CalcError('ERR_INVALID_ARG');
  const tolerance = Math.max(Number(options.tolerance) || 1e-7, 1e-12);
  const angleMode = options.angleMode || 'RAD';

  if (a === b) {
    return {
      value: 0,
      estimatedError: 0,
      evaluations: 1,
      method: "Adaptive Simpson's Rule",
      isApproximate: true
    };
  }

  const sign = a < b ? 1 : -1;
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  let evaluations = 0;

  const f = (x) => {
    evaluations++;
    const val = evaluateExpression(expr, { angleMode, variables: { [variable]: x } });
    if (!Number.isFinite(val)) throw new CalcError('ERR_CALC_DISCONTINUITY');
    return val;
  };

  function simpson(left, right, fa, fm, fb) {
    const mid = (left + right) / 2;
    const lmid = (left + mid) / 2;
    const rmid = (mid + right) / 2;
    const flm = f(lmid);
    const frm = f(rmid);
    const h = right - left;
    const whole = (h / 6) * (fa + 4 * fm + fb);
    const leftSimp = (h / 12) * (fa + 4 * flm + fm);
    const rightSimp = (h / 12) * (fm + 4 * frm + fb);
    return { mid, lmid, rmid, flm, frm, whole, sum: leftSimp + rightSimp };
  }

  let totalError = 0;

  function recurse(left, right, fa, fm, fb, eps, depth) {
    const s = simpson(left, right, fa, fm, fb);
    const diff = s.sum - s.whole;
    if (depth <= 0 || Math.abs(diff) <= 15 * eps) {
      totalError += Math.abs(diff) / 15;
      return s.sum + diff / 15;
    }
    return (
      recurse(left, s.mid, fa, s.flm, fm, eps / 2, depth - 1) +
      recurse(s.mid, right, fm, s.frm, fb, eps / 2, depth - 1)
    );
  }

  const fa = f(low);
  const fb = f(high);
  const fm = f((low + high) / 2);
  const rawResult = sign * recurse(low, high, fa, fm, fb, tolerance, 14);

  return {
    value: cleanFloatingPoint(rawResult),
    estimatedError: cleanFloatingPoint(totalError),
    evaluations,
    method: "Adaptive Simpson's Rule",
    isApproximate: true
  };
}

export {
  numericalDerivative,
  numericalIntegral
};
