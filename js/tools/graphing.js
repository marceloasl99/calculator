import { compileExpression, cleanFloatingPoint } from '../expression-parser.js';

// --- js/tools/graphing.js ---
/**
 * Scientific Calculator Pro — Expert Module: Function Plotter
 * Samples y = f(x) over a viewport, splits discontinuities into segments
 * and locates roots and local extrema for annotation.
 */

/**
 * Sample a function across [xMin, xMax].
 * Returns { segments: [[{x, y}, ...], ...], roots: [x...], extrema: [{x, y, kind}] }.
 * Points where f is undefined, or jumps across a vertical asymptote, break the curve.
 */
function sampleFunction(expression, { xMin = -10, xMax = 10, samples = 600, angleMode = 'RAD', yRange = null, variables = {} } = {}) {
  const f = compileExpression(expression, { variable: 'x', angleMode, variables });
  const step = (xMax - xMin) / samples;
  const jumpLimit = yRange ? Math.abs(yRange) * 4 : Infinity;

  const points = [];
  for (let k = 0; k <= samples; k++) {
    const x = xMin + k * step;
    let y = NaN;
    try {
      y = f(x);
    } catch (_) {
      y = NaN;
    }
    points.push({ x, y: Number.isFinite(y) ? y : NaN });
  }

  const segments = [];
  let current = [];
  for (let k = 0; k < points.length; k++) {
    const p = points[k];
    const prev = points[k - 1];
    const breaks = Number.isNaN(p.y) || (prev && !Number.isNaN(prev.y) && Math.abs(p.y - prev.y) > jumpLimit);
    if (breaks) {
      if (current.length > 1) segments.push(current);
      current = Number.isNaN(p.y) ? [] : [p];
    } else {
      current.push(p);
    }
  }
  if (current.length > 1) segments.push(current);

  const roots = [];
  const extrema = [];
  for (const seg of segments) {
    for (let k = 1; k < seg.length; k++) {
      const a = seg[k - 1];
      const b = seg[k];
      if (a.y === 0) pushUnique(roots, a.x, step);
      else if (a.y * b.y < 0) pushUnique(roots, refineRoot(f, a.x, b.x), step);

      if (k < seg.length - 1) {
        const c = seg[k + 1];
        if (b.y > a.y && b.y > c.y) extrema.push({ x: b.x, y: b.y, kind: 'max' });
        else if (b.y < a.y && b.y < c.y) extrema.push({ x: b.x, y: b.y, kind: 'min' });
      }
    }
  }

  return {
    segments,
    roots: roots.slice(0, 12).map(cleanFloatingPoint),
    extrema: extrema.slice(0, 12).map(e => ({ x: cleanFloatingPoint(e.x), y: cleanFloatingPoint(e.y), kind: e.kind }))
  };
}

function refineRoot(f, a, b) {
  let fa = f(a);
  for (let k = 0; k < 60; k++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (!Number.isFinite(fm)) return m;
    if (fm === 0 || Math.abs(b - a) < 1e-12) return m;
    if (fa * fm < 0) {
      b = m;
    } else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

function pushUnique(list, x, step) {
  if (!list.some(v => Math.abs(v - x) < step)) list.push(x);
}

/**
 * Pick "nice" grid spacing (1, 2, 5 × 10^k) for an axis span.
 */
function niceStep(span, targetTicks = 10) {
  const raw = Math.abs(span) / targetTicks;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const residual = raw / magnitude;
  const factor = residual >= 5 ? 5 : residual >= 2 ? 2 : 1;
  return factor * magnitude;
}

export {
  sampleFunction,
  niceStep
};
