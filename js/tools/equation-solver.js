import { evaluateExpression, cleanFloatingPoint, CalcError } from '../expression-parser.js';

// --- js/tools/equation-solver.js ---
/**
 * Scientific Calculator Pro — Expert Module D: Numerical Equation Solver f(x) = 0
 * Implements Bisection, Newton-Raphson, and Secant methods with convergence and residual tracking.
 */

function solveEquation(options = {}) {
  const expr = String(options.expression || '').trim();
  if (!expr) throw new CalcError('ERR_EMPTY');
  const variable = String(options.variable || 'x').trim() || 'x';
  const method = options.method || 'bisection'; // 'bisection' | 'newton' | 'secant'
  const tolerance = Math.max(Number(options.tolerance) || 1e-7, 1e-13);
  const maxIterations = Math.min(Math.max(Number(options.maxIterations) || 100, 1), 1000);
  const angleMode = options.angleMode || 'RAD';

  const evalAt = (val) => {
    return evaluateExpression(expr, {
      angleMode,
      variables: { [variable]: val }
    });
  };

  if (method === 'bisection') {
    let a = Number(options.a !== undefined ? options.a : -10);
    let b = Number(options.b !== undefined ? options.b : 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) {
      throw new CalcError('ERR_SOLVER_INTERVAL');
    }
    let fa = evalAt(a);
    let fb = evalAt(b);

    if (Math.abs(fa) <= tolerance) {
      return { converged: true, root: cleanFloatingPoint(a), residual: Math.abs(fa), iterations: 1, method: 'Bisection', isApproximate: true };
    }
    if (Math.abs(fb) <= tolerance) {
      return { converged: true, root: cleanFloatingPoint(b), residual: Math.abs(fb), iterations: 1, method: 'Bisection', isApproximate: true };
    }
    if (fa * fb > 0) {
      return {
        converged: false,
        root: null,
        residual: null,
        iterations: 0,
        method: 'Bisection',
        reasonCode: 'ERR_BISECTION_SIGN'
      };
    }

    let mid = a;
    let fmid = fa;
    for (let iter = 1; iter <= maxIterations; iter++) {
      mid = (a + b) / 2;
      fmid = evalAt(mid);
      if (Math.abs(fmid) <= tolerance || (b - a) / 2 <= tolerance) {
        return {
          converged: true,
          root: cleanFloatingPoint(mid),
          residual: cleanFloatingPoint(Math.abs(fmid)),
          iterations: iter,
          method: 'Bisection',
          isApproximate: true
        };
      }
      if (fa * fmid < 0) {
        b = mid;
        fb = fmid;
      } else {
        a = mid;
        fa = fmid;
      }
    }

    return {
      converged: false,
      root: cleanFloatingPoint(mid),
      residual: cleanFloatingPoint(Math.abs(fmid)),
      iterations: maxIterations,
      method: 'Bisection',
      reasonCode: 'ERR_MAX_ITER'
    };
  }

  if (method === 'newton') {
    let x = Number(options.x0 !== undefined ? options.x0 : 1);
    if (!Number.isFinite(x)) throw new CalcError('ERR_INVALID_ARG');

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fx = evalAt(x);
      if (Math.abs(fx) <= tolerance) {
        return {
          converged: true,
          root: cleanFloatingPoint(x),
          residual: cleanFloatingPoint(Math.abs(fx)),
          iterations: iter,
          method: 'Newton-Raphson',
          isApproximate: true
        };
      }
      const h = Math.max(Math.abs(x) * 1e-6, 1e-7);
      const dfx = (evalAt(x + h) - evalAt(x - h)) / (2 * h);
      if (Math.abs(dfx) < 1e-14 || !Number.isFinite(dfx)) {
        return {
          converged: false,
          root: cleanFloatingPoint(x),
          residual: cleanFloatingPoint(Math.abs(fx)),
          iterations: iter,
          method: 'Newton-Raphson',
          reasonCode: 'ERR_ZERO_DERIVATIVE'
        };
      }
      const xNext = x - fx / dfx;
      if (!Number.isFinite(xNext)) {
        return {
          converged: false,
          root: null,
          residual: null,
          iterations: iter,
          method: 'Newton-Raphson',
          reasonCode: 'ERR_DIVERGED'
        };
      }
      if (Math.abs(xNext - x) <= tolerance) {
        const fNext = evalAt(xNext);
        return {
          converged: true,
          root: cleanFloatingPoint(xNext),
          residual: cleanFloatingPoint(Math.abs(fNext)),
          iterations: iter,
          method: 'Newton-Raphson',
          isApproximate: true
        };
      }
      x = xNext;
    }

    const finalFx = evalAt(x);
    return {
      converged: false,
      root: cleanFloatingPoint(x),
      residual: cleanFloatingPoint(Math.abs(finalFx)),
      iterations: maxIterations,
      method: 'Newton-Raphson',
      reasonCode: 'ERR_MAX_ITER'
    };
  }

  // Secant method
  let x0 = Number(options.a !== undefined ? options.a : 0);
  let x1 = Number(options.b !== undefined ? options.b : 2);
  let f0 = evalAt(x0);
  let f1 = evalAt(x1);

  for (let iter = 1; iter <= maxIterations; iter++) {
    if (Math.abs(f1) <= tolerance) {
      return {
        converged: true,
        root: cleanFloatingPoint(x1),
        residual: cleanFloatingPoint(Math.abs(f1)),
        iterations: iter,
        method: 'Secant',
        isApproximate: true
      };
    }
    if (Math.abs(f1 - f0) < 1e-14) {
      return {
        converged: false,
        root: cleanFloatingPoint(x1),
        residual: cleanFloatingPoint(Math.abs(f1)),
        iterations: iter,
        method: 'Secant',
        reasonCode: 'ERR_ZERO_DERIVATIVE'
      };
    }
    const x2 = x1 - f1 * ((x1 - x0) / (f1 - f0));
    if (Math.abs(x2 - x1) <= tolerance) {
      const f2 = evalAt(x2);
      return {
        converged: true,
        root: cleanFloatingPoint(x2),
        residual: cleanFloatingPoint(Math.abs(f2)),
        iterations: iter,
        method: 'Secant',
        isApproximate: true
      };
    }
    x0 = x1;
    f0 = f1;
    x1 = x2;
    f1 = evalAt(x1);
  }

  return {
    converged: false,
    root: cleanFloatingPoint(x1),
    residual: cleanFloatingPoint(Math.abs(f1)),
    iterations: maxIterations,
    method: 'Secant',
    reasonCode: 'ERR_MAX_ITER'
  };
}

export {
  solveEquation
};
