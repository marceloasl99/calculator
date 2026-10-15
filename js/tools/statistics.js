import { cleanFloatingPoint, CalcError } from '../expression-parser.js';

// --- js/tools/statistics.js ---
/**
 * Scientific Calculator Pro — Expert Module C: Descriptive Statistics & Linear Regression
 */

function parseDataset(inputStr) {
  if (Array.isArray(inputStr)) {
    const nums = inputStr.map(Number);
    if (nums.length === 0 || nums.some(n => !Number.isFinite(n))) throw new CalcError('ERR_STAT_EMPTY');
    return nums;
  }
  const str = String(inputStr || '').trim();
  if (!str) throw new CalcError('ERR_STAT_EMPTY');
  // Split by semicolon, whitespace, newline, or comma
  const rawTokens = str.split(/[\s;,\n]+/).filter(Boolean);
  if (rawTokens.length === 0) throw new CalcError('ERR_STAT_EMPTY');
  const nums = rawTokens.map(t => {
    const val = Number(t);
    if (!Number.isFinite(val)) throw new CalcError('ERR_INVALID_ARG', t);
    return val;
  });
  return nums;
}

function computeQuantile(sorted, p) {
  if (sorted.length === 0) return 0;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[sorted.length - 1];
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return cleanFloatingPoint(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
  }
  return sorted[base];
}

function analyzeDataset(dataInput, options = {}) {
  const data = parseDataset(dataInput);
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  const sum = cleanFloatingPoint(data.reduce((acc, v) => acc + v, 0));
  const sumSquares = cleanFloatingPoint(data.reduce((acc, v) => acc + v * v, 0));
  const mean = cleanFloatingPoint(sum / n);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = cleanFloatingPoint(max - min);

  // Median
  const median = n % 2 === 1
    ? sorted[Math.floor(n / 2)]
    : cleanFloatingPoint((sorted[n / 2 - 1] + sorted[n / 2]) / 2);

  // Mode (supports unimodal, multimodal, or no mode when all frequencies are equal)
  const freqMap = new Map();
  let maxFreq = 0;
  for (const val of sorted) {
    const f = (freqMap.get(val) || 0) + 1;
    freqMap.set(val, f);
    if (f > maxFreq) maxFreq = f;
  }
  let modes = [];
  if (maxFreq > 1) {
    for (const [val, f] of freqMap.entries()) {
      if (f === maxFreq) modes.push(val);
    }
    // If every distinct value occurs the exact same number of times and all values are represented
    if (modes.length === freqMap.size && freqMap.size > 1) {
      modes = [];
    }
  }

  // Variance & Std Dev
  const sqDiffSum = data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const popVariance = cleanFloatingPoint(sqDiffSum / n);
  const popStdDev = cleanFloatingPoint(Math.sqrt(popVariance));
  const sampleVariance = n > 1 ? cleanFloatingPoint(sqDiffSum / (n - 1)) : null;
  const sampleStdDev = n > 1 ? cleanFloatingPoint(Math.sqrt(sampleVariance)) : null;

  // Quartiles & Custom Percentile
  const q1 = computeQuantile(sorted, 0.25);
  const q2 = median;
  const q3 = computeQuantile(sorted, 0.75);
  const iqr = cleanFloatingPoint(q3 - q1);
  const pRank = options.percentile !== undefined ? Number(options.percentile) : 90;
  const customPercentile = computeQuantile(sorted, Math.min(Math.max(pRank, 0), 100) / 100);

  // Optional Weighted Mean & Linear Regression if secondary array Y / weights is provided
  let weightedMean = null;
  let regression = null;
  if (options.secondaryData) {
    const yData = parseDataset(options.secondaryData);
    if (yData.length === n) {
      const weightSum = yData.reduce((a, b) => a + b, 0);
      if (weightSum > 0) {
        const wProd = data.reduce((acc, x, idx) => acc + x * yData[idx], 0);
        weightedMean = cleanFloatingPoint(wProd / weightSum);
      }
      if (n >= 2) {
        const yMean = yData.reduce((a, b) => a + b, 0) / n;
        let sxy = 0, sxx = 0, syy = 0;
        for (let i = 0; i < n; i++) {
          const dx = data[i] - mean;
          const dy = yData[i] - yMean;
          sxy += dx * dy;
          sxx += dx * dx;
          syy += dy * dy;
        }
        if (sxx > 0) {
          const slope = cleanFloatingPoint(sxy / sxx);
          const intercept = cleanFloatingPoint(yMean - slope * mean);
          const r = (syy > 0) ? cleanFloatingPoint(sxy / Math.sqrt(sxx * syy)) : 0;
          const r2 = cleanFloatingPoint(r * r);
          regression = {
            slope,
            intercept,
            r,
            r2,
            equation: `y = ${intercept} ${slope >= 0 ? '+' : '-'} ${Math.abs(slope)}x`
          };
        }
      }
    }
  }

  return {
    count: n,
    sum,
    sumSquares,
    mean,
    weightedMean,
    median,
    modes,
    min,
    max,
    range,
    popVariance,
    sampleVariance,
    popStdDev,
    sampleStdDev,
    q1,
    q2,
    q3,
    iqr,
    percentileRank: pRank,
    customPercentile,
    regression
  };
}

function linearRegression(pointsOrX, maybeY) {
  let xArr = [];
  let yArr = [];
  if (Array.isArray(pointsOrX) && pointsOrX.length > 0 && typeof pointsOrX[0] === 'object' && pointsOrX[0] !== null && 'x' in pointsOrX[0] && 'y' in pointsOrX[0]) {
    xArr = pointsOrX.map(p => Number(p.x));
    yArr = pointsOrX.map(p => Number(p.y));
  } else if (Array.isArray(pointsOrX) && Array.isArray(maybeY)) {
    xArr = pointsOrX.map(Number);
    yArr = maybeY.map(Number);
  } else {
    throw new CalcError('ERR_STAT_EMPTY');
  }
  const n = xArr.length;
  if (n < 2 || yArr.length !== n) throw new CalcError('ERR_STAT_EMPTY');
  const xMean = xArr.reduce((a, b) => a + b, 0) / n;
  const yMean = yArr.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xArr[i] - xMean;
    const dy = yArr[i] - yMean;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0) throw new CalcError('ERR_INVALID_ARG');
  const slope = cleanFloatingPoint(sxy / sxx);
  const intercept = cleanFloatingPoint(yMean - slope * xMean);
  const r = (syy > 0) ? cleanFloatingPoint(sxy / Math.sqrt(sxx * syy)) : 0;
  const r2 = cleanFloatingPoint(r * r);
  return {
    slope,
    intercept,
    r,
    r2,
    equation: `y = ${intercept} ${slope >= 0 ? '+' : '-'} ${Math.abs(slope)}x`
  };
}

function calculateWeightedMean(values, weights) {
  const v = parseDataset(values);
  const w = parseDataset(weights);
  if (v.length !== w.length || v.length === 0) throw new CalcError('ERR_INVALID_ARG');
  const wSum = w.reduce((a, b) => a + b, 0);
  if (wSum <= 0) throw new CalcError('ERR_INVALID_ARG');
  const prod = v.reduce((acc, x, i) => acc + x * w[i], 0);
  return cleanFloatingPoint(prod / wSum);
}

export {
  parseDataset,
  computeQuantile,
  analyzeDataset,
  calculateWeightedMean as weightedMean,
  linearRegression
};
