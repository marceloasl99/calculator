import { CalcError } from '../expression-parser.js';

// --- js/tools/number-theory.js ---
/**
 * Scientific Calculator Pro — Expert Module G: Number Theory, Primes, Combinatorics & Base/Bitwise
 */

const MAX_PRIME_LIMIT = 999999999999; // 10^12 safety limit

function isPrime(n) {
  const num = Number(n);
  if (!Number.isInteger(num) || num < 2) return false;
  if (num > MAX_PRIME_LIMIT) throw new CalcError('ERR_LIMIT_EXCEEDED');
  if (num === 2 || num === 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function primeFactorization(n) {
  let num = Math.trunc(Number(n));
  if (!Number.isFinite(num) || num < 2) throw new CalcError('ERR_INVALID_ARG');
  if (num > MAX_PRIME_LIMIT) throw new CalcError('ERR_LIMIT_EXCEEDED');

  const factors = [];
  let d = 2;
  while (d * d <= num) {
    if (num % d === 0) {
      let count = 0;
      while (num % d === 0) {
        num = Math.trunc(num / d);
        count++;
      }
      factors.push({ prime: d, exponent: count });
    }
    d = d === 2 ? 3 : d + 2;
  }
  if (num > 1) {
    factors.push({ prime: num, exponent: 1 });
  }
  const formatted = factors
    .map(f => (f.exponent > 1 ? `${f.prime}^${f.exponent}` : `${f.prime}`))
    .join(' × ');

  return { factors, formatted, isPrime: factors.length === 1 && factors[0].exponent === 1 };
}

function convertBase(valueStr, fromBase = 10) {
  const clean = String(valueStr || '').trim().replace(/^0[xXbBoO]/, '');
  if (!clean) throw new CalcError('ERR_EMPTY');
  const base = Number(fromBase);
  if (![2, 8, 10, 16].includes(base)) throw new CalcError('ERR_INVALID_ARG');

  const validPattern = {
    2: /^-?[01]+$/,
    8: /^-?[0-7]+$/,
    10: /^-?[0-9]+$/,
    16: /^-?[0-9a-fA-F]+$/
  }[base];

  if (!validPattern.test(clean)) throw new CalcError('ERR_INVALID_BASE_DIGIT');
  const sign = clean.startsWith('-') ? -1 : 1;
  const unsigned = clean.replace(/^-/, '');
  const decVal = sign * parseInt(unsigned, base);
  if (!Number.isSafeInteger(decVal)) throw new CalcError('ERR_OVERFLOW');

  const absVal = Math.abs(decVal);
  const prefix = decVal < 0 ? '-' : '';
  return {
    dec: decVal.toString(10),
    bin: prefix + absVal.toString(2),
    oct: prefix + absVal.toString(8),
    hex: prefix + absVal.toString(16).toUpperCase()
  };
}

function bitwiseOperation(a, b, op) {
  const intA = Math.trunc(Number(a));
  const intB = Math.trunc(Number(b || 0));
  if (!Number.isFinite(intA) || !Number.isFinite(intB)) throw new CalcError('ERR_INVALID_ARG');

  let res;
  switch (op) {
    case 'AND': res = intA & intB; break;
    case 'OR': res = intA | intB; break;
    case 'XOR': res = intA ^ intB; break;
    case 'NOT': res = ~intA; break;
    case 'LSHIFT': res = intA << Math.min(Math.max(intB, 0), 31); break;
    case 'RSHIFT': res = intA >> Math.min(Math.max(intB, 0), 31); break;
    default: throw new CalcError('ERR_INVALID_ARG');
  }
  return {
    result: res,
    bases: convertBase(String(res), 10)
  };
}


export {
  isPrime,
  primeFactorization,
  convertBase,
  bitwiseOperation,
  bitwiseOperation as bitwiseOp
};
