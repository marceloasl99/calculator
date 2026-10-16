import { cleanFloatingPoint, CalcError } from '../expression-parser.js';

// --- js/tools/finance.js ---
/**
 * Scientific Calculator Pro — Expert Module H: Financial Mathematics
 * Compound interest with periodic contributions, loan amortization (Price & SAC) and rate conversion.
 */

function requireFinite(...values) {
  for (const v of values) {
    if (!Number.isFinite(v)) throw new CalcError('ERR_INVALID_ARG');
  }
}

/**
 * Future value of a present amount plus end-of-period contributions.
 * ratePercent is the interest rate per period (e.g. 1 for 1% per month).
 */
function compoundInterest({ principal = 0, ratePercent = 0, periods = 0, contribution = 0 } = {}) {
  const pv = Number(principal);
  const i = Number(ratePercent) / 100;
  const n = Math.round(Number(periods));
  const pmt = Number(contribution);
  requireFinite(pv, i, n, pmt);
  if (n < 0 || n > 1200 || i <= -1) throw new CalcError('ERR_INVALID_ARG');

  const growth = Math.pow(1 + i, n);
  const fvPrincipal = pv * growth;
  const fvContrib = i === 0 ? pmt * n : pmt * ((growth - 1) / i);
  const futureValue = fvPrincipal + fvContrib;
  const invested = pv + pmt * n;

  const series = [];
  let balance = pv;
  for (let k = 1; k <= n; k++) {
    balance = balance * (1 + i) + pmt;
    series.push(cleanFloatingPoint(balance));
  }

  return {
    futureValue: cleanFloatingPoint(futureValue),
    invested: cleanFloatingPoint(invested),
    interest: cleanFloatingPoint(futureValue - invested),
    series
  };
}

/**
 * Loan amortization schedule.
 * system 'price' = constant installments (French/Price table), 'sac' = constant amortization.
 */
function loanSchedule({ amount = 0, ratePercent = 0, periods = 1, system = 'price' } = {}) {
  const pv = Number(amount);
  const i = Number(ratePercent) / 100;
  const n = Math.round(Number(periods));
  requireFinite(pv, i, n);
  if (pv <= 0 || n < 1 || n > 1200 || i < 0) throw new CalcError('ERR_INVALID_ARG');

  const rows = [];
  let balance = pv;
  let totalPaid = 0;
  let totalInterest = 0;

  if (system === 'sac') {
    const amortization = pv / n;
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      const payment = amortization + interest;
      balance -= amortization;
      totalPaid += payment;
      totalInterest += interest;
      rows.push({ period: k, payment, interest, amortization, balance: Math.max(balance, 0) });
    }
  } else {
    const payment = i === 0 ? pv / n : (pv * i) / (1 - Math.pow(1 + i, -n));
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      const amortization = payment - interest;
      balance -= amortization;
      totalPaid += payment;
      totalInterest += interest;
      rows.push({ period: k, payment, interest, amortization, balance: Math.max(balance, 0) });
    }
  }

  const clean = rows.map(r => ({
    period: r.period,
    payment: cleanFloatingPoint(r.payment),
    interest: cleanFloatingPoint(r.interest),
    amortization: cleanFloatingPoint(r.amortization),
    balance: Math.abs(r.balance) < 1e-8 ? 0 : cleanFloatingPoint(r.balance)
  }));

  return {
    system: system === 'sac' ? 'sac' : 'price',
    firstPayment: clean[0].payment,
    lastPayment: clean[clean.length - 1].payment,
    totalPaid: cleanFloatingPoint(totalPaid),
    totalInterest: cleanFloatingPoint(totalInterest),
    rows: clean
  };
}

/**
 * Convert an interest rate between compounding periods, e.g. 1% a month -> 12.68% a year.
 */
function convertRate(ratePercent, fromPeriodsPerYear, toPeriodsPerYear) {
  const r = Number(ratePercent) / 100;
  const from = Number(fromPeriodsPerYear);
  const to = Number(toPeriodsPerYear);
  requireFinite(r, from, to);
  if (r <= -1 || from <= 0 || to <= 0) throw new CalcError('ERR_INVALID_ARG');
  return cleanFloatingPoint((Math.pow(1 + r, from / to) - 1) * 100);
}

/**
 * Percentage change from an old value to a new value.
 */
function percentChange(oldValue, newValue) {
  const a = Number(oldValue);
  const b = Number(newValue);
  requireFinite(a, b);
  if (a === 0) throw new CalcError('ERR_DIV_ZERO');
  return cleanFloatingPoint(((b - a) / Math.abs(a)) * 100);
}

export {
  compoundInterest,
  loanSchedule,
  convertRate,
  percentChange
};
