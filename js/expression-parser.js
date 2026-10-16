// --- js/expression-parser.js ---
/**
 * Scientific Calculator Pro — Safe Mathematical Expression Parser & Evaluator
 * Zero dynamic code execution: uses custom Tokenizer + Shunting-Yard + RPN Evaluator.
 */

class CalcError extends Error {
  constructor(code, details = '') {
    super(code);
    this.name = 'CalcError';
    this.code = code;
    this.details = details;
  }
}

const CONSTANTS = {
  pi: Math.PI,
  'π': Math.PI,
  e: Math.E,
  phi: 1.618033988749895,
  'φ': 1.618033988749895,
  c: 299792458,
  g0: 9.80665,
  inf: Infinity,
  '∞': Infinity
};

// Case-sensitive CODATA 2018 physical constants (SI units), insertable from the Constants library
const PHYSICAL_CONSTANTS = {
  c: { value: 299792458, unit: 'm/s', key: 'speedOfLight' },
  h: { value: 6.62607015e-34, unit: 'J·s', key: 'planck' },
  hbar: { value: 1.054571817e-34, unit: 'J·s', key: 'reducedPlanck' },
  G: { value: 6.6743e-11, unit: 'm³/(kg·s²)', key: 'gravitational' },
  g0: { value: 9.80665, unit: 'm/s²', key: 'standardGravity' },
  NA: { value: 6.02214076e23, unit: 'mol⁻¹', key: 'avogadro' },
  kB: { value: 1.380649e-23, unit: 'J/K', key: 'boltzmann' },
  R: { value: 8.314462618, unit: 'J/(mol·K)', key: 'gasConstant' },
  qe: { value: 1.602176634e-19, unit: 'C', key: 'elementaryCharge' },
  me: { value: 9.1093837015e-31, unit: 'kg', key: 'electronMass' },
  mp: { value: 1.67262192369e-27, unit: 'kg', key: 'protonMass' },
  eps0: { value: 8.8541878128e-12, unit: 'F/m', key: 'vacuumPermittivity' },
  mu0: { value: 1.25663706212e-6, unit: 'N/A²', key: 'vacuumPermeability' },
  sigma: { value: 5.670374419e-8, unit: 'W/(m²·K⁴)', key: 'stefanBoltzmann' },
  atm: { value: 101325, unit: 'Pa', key: 'standardAtmosphere' }
};

const RESERVED_IDENTIFIERS = new Set(['ans', 'mod', 'rem']);

function isReservedIdentifier(name) {
  const lower = String(name).toLowerCase();
  return (
    RESERVED_IDENTIFIERS.has(lower) ||
    Object.prototype.hasOwnProperty.call(CONSTANTS, lower) ||
    Object.prototype.hasOwnProperty.call(PHYSICAL_CONSTANTS, name) ||
    Object.prototype.hasOwnProperty.call(FUNCTION_ALIASES, lower)
  );
}

// Map localized and canonical function names to internal canonical function identifiers
const FUNCTION_ALIASES = {
  sin: 'sin', sen: 'sin',
  cos: 'cos',
  tan: 'tan', tg: 'tan',
  asin: 'asin', arcsin: 'asin', arcsen: 'asin',
  acos: 'acos', arccos: 'acos',
  atan: 'atan', arctan: 'atan', arctg: 'atan',
  sinh: 'sinh', senh: 'sinh',
  cosh: 'cosh',
  tanh: 'tanh', tgh: 'tanh',
  asinh: 'asinh', arcsinh: 'asinh', arcsenh: 'asinh',
  acosh: 'acosh', arccosh: 'acosh',
  atanh: 'atanh', arctanh: 'atanh',
  ln: 'ln',
  log10: 'log10', log: 'log10', lg: 'log10',
  log2: 'log2',
  logbase: 'logBase', logb: 'logBase',
  sqrt: 'sqrt', raiz: 'sqrt', '√': 'sqrt',
  cbrt: 'cbrt', '∛': 'cbrt',
  nthroot: 'nthRoot', root: 'nthRoot',
  abs: 'abs',
  floor: 'floor', piso: 'floor',
  ceil: 'ceil', teto: 'ceil',
  round: 'round', arred: 'round',
  exp: 'exp',
  pow10: 'pow10',
  pow2: 'pow2',
  inv: 'inv',
  fact: 'fact',
  gcd: 'gcd', mdc: 'gcd',
  lcm: 'lcm', mmc: 'lcm',
  npr: 'nPr',
  ncr: 'nCr',
  mod: 'modFunc',
  rem: 'remFunc',
  sign: 'sign'
};

const MULTI_ARG_FUNCS = new Set(['nthRoot', 'logBase', 'gcd', 'lcm', 'nPr', 'nCr', 'modFunc', 'remFunc']);

/**
 * Remove IEEE 754 noise. `scale` is the magnitude of the operands that produced `val`:
 * results smaller than 1e-15 × scale are rounding residue (e.g. 0.1 + 0.2 - 0.3) and become 0,
 * while genuinely tiny quantities such as Planck's constant are preserved.
 */
function cleanFloatingPoint(val, scale = 1) {
  if (!Number.isFinite(val)) return val;
  if (Math.abs(val) < 1e-15 * scale) return 0;
  // Round to 12 significant digits to eliminate IEEE 754 artifacts like 0.30000000000000004 or sin(30deg)=0.49999999999999994
  const rounded12 = Number(val.toPrecision(12));
  if (Math.abs(val - rounded12) <= Math.abs(val) * 1e-12) {
    return rounded12 === 0 ? 0 : rounded12;
  }
  return val;
}

function toRadians(val, angleMode = 'DEG') {
  if (angleMode === 'DEG') return (val * Math.PI) / 180;
  if (angleMode === 'GRAD') return (val * Math.PI) / 200;
  return val;
}

function fromRadians(rad, angleMode = 'DEG') {
  if (angleMode === 'DEG') return (rad * 180) / Math.PI;
  if (angleMode === 'GRAD') return (rad * 200) / Math.PI;
  return rad;
}

function factorial(n) {
  if (!Number.isFinite(n) || Number.isNaN(n)) throw new CalcError('ERR_FACT_DOMAIN');
  if (n < 0 || Math.floor(n) !== n) throw new CalcError('ERR_FACT_DOMAIN');
  if (n > 170) throw new CalcError('ERR_OVERFLOW');
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function gcdTwo(a, b) {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new CalcError('ERR_INVALID_ARG');
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcmTwo(a, b) {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcdTwo(a, b)) * b);
}

function nPrCalc(n, r) {
  if (n < 0 || r < 0 || Math.floor(n) !== n || Math.floor(r) !== r || r > n) {
    throw new CalcError('ERR_COMB_DOMAIN');
  }
  if (n > 170) throw new CalcError('ERR_OVERFLOW');
  let res = 1;
  for (let i = n - r + 1; i <= n; i++) res *= i;
  return res;
}

function nCrCalc(n, r) {
  if (n < 0 || r < 0 || Math.floor(n) !== n || Math.floor(r) !== r || r > n) {
    throw new CalcError('ERR_COMB_DOMAIN');
  }
  if (r > n - r) r = n - r;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - r + i)) / i;
  }
  return Math.round(res);
}

/**
 * Normalize localized input string into canonical mathematical string before tokenizing.
 */
function normalizeExpressionInput(rawExpr, options = {}) {
  if (typeof rawExpr !== 'string') throw new CalcError('ERR_SYNTAX');
  let s = rawExpr.trim();
  if (!s) throw new CalcError('ERR_EMPTY');

  // Replace visual operators with canonical ones
  s = s
    .replace(/×/g, '*')
    .replace(/⋅/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');

  // Handle semicolon argument separators (always converted to comma)
  s = s.replace(/;/g, ',');

  // Handle comma decimal vs comma argument separator:
  // If comma is between digits and not inside a multi-arg function call, or if locale uses comma decimal:
  // For safety, if a function with 2 arguments is present and uses comma, e.g. nthRoot(27, 3), preserve the comma separating args.
  // Any comma matching (\d),(\d) where there is no space after comma is treated as decimal separator unless inside a 2-arg function with exact 2 integer args.
  const hasMultiArgFunc = /(nthRoot|root|logBase|logb|gcd|mdc|lcm|mmc|nPr|nCr|mod|rem)\s*\(/i.test(s);
  if (!hasMultiArgFunc) {
    s = s.replace(/(\d),(\d)/g, '$1.$2');
  } else {
    // Even inside multi-arg functions, if semicolon was used it is already `,`;
    // if `1,5` is followed by another `,`, convert decimal commas carefully
    s = s.replace(/(\d),(\d+)\s*,/g, '$1.$2,');
    s = s.replace(/,\s*(\d+),(\d+)\s*\)/g, ', $1.$2)');
  }

  return s;
}

/**
 * Tokenize canonical expression into structured tokens
 */
function tokenizeExpression(rawExpr, options = {}) {
  const s = normalizeExpressionInput(rawExpr, options);
  const tokens = [];
  let i = 0;
  const len = s.length;

  while (i < len) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (including scientific notation like 1.5e-4 or 2E3)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(s[i + 1]))) {
      let numStr = '';
      let hasDot = false;
      while (i < len && (/\d/.test(s[i]) || s[i] === '.')) {
        if (s[i] === '.') {
          if (hasDot) throw new CalcError('ERR_SYNTAX');
          hasDot = true;
        }
        numStr += s[i++];
      }
      // Check scientific notation suffix e/E followed by optional +/- and digits
      if (i < len && (s[i] === 'e' || s[i] === 'E')) {
        const nextChar = s[i + 1];
        const nextNextChar = s[i + 2];
        if (/\d/.test(nextChar) || ((nextChar === '+' || nextChar === '-') && /\d/.test(nextNextChar))) {
          numStr += s[i++];
          if (s[i] === '+' || s[i] === '-') numStr += s[i++];
          while (i < len && /\d/.test(s[i])) {
            numStr += s[i++];
          }
        }
      }
      const val = Number(numStr);
      if (Number.isNaN(val)) throw new CalcError('ERR_SYNTAX');
      tokens.push({ type: 'NUMBER', value: val });
      continue;
    }

    // Unicode prefix root √ or ∛
    if (ch === '√' || ch === '∛') {
      tokens.push({ type: 'FUNC', value: ch === '√' ? 'sqrt' : 'cbrt' });
      i++;
      continue;
    }

    // Special constant symbols
    if (ch === 'π' || ch === 'φ' || ch === '∞') {
      tokens.push({ type: 'CONST', name: ch, value: CONSTANTS[ch] });
      i++;
      continue;
    }

    // Degree symbol ° (converts preceding value from degrees to radians or scales by 1 in DEG mode)
    if (ch === '°') {
      tokens.push({ type: 'POSTFIX', value: '°' });
      i++;
      continue;
    }

    // Identifiers (functions, constants, variables like ans, x, mod, rem)
    if (/[a-zA-Z_]/.test(ch)) {
      let id = '';
      while (i < len && /[a-zA-Z0-9_]/.test(s[i])) {
        id += s[i++];
      }
      const lower = id.toLowerCase();

      if (lower === 'mod' || lower === 'rem') {
        // Could be binary operator `10 mod 3` or function `mod(10, 3)`
        let j = i;
        while (j < len && /\s/.test(s[j])) j++;
        if (s[j] === '(' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'OP' || tokens[tokens.length - 1].type === 'LPAREN' || tokens[tokens.length - 1].type === 'COMMA')) {
          tokens.push({ type: 'FUNC', value: FUNCTION_ALIASES[lower] });
        } else {
          tokens.push({ type: 'OP', value: lower });
        }
        continue;
      }

      if (lower === 'ans') {
        const ansVal = options.ans !== undefined ? Number(options.ans) : 0;
        tokens.push({ type: 'NUMBER', value: ansVal, isAns: true });
        continue;
      }

      if (options.variables && Object.prototype.hasOwnProperty.call(options.variables, id)) {
        tokens.push({ type: 'NUMBER', value: Number(options.variables[id]), isVar: true, name: id });
        continue;
      }
      if (options.variables && Object.prototype.hasOwnProperty.call(options.variables, lower)) {
        tokens.push({ type: 'NUMBER', value: Number(options.variables[lower]), isVar: true, name: lower });
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(PHYSICAL_CONSTANTS, id)) {
        tokens.push({ type: 'CONST', name: id, value: PHYSICAL_CONSTANTS[id].value });
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(CONSTANTS, lower)) {
        tokens.push({ type: 'CONST', name: lower, value: CONSTANTS[lower] });
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(FUNCTION_ALIASES, lower)) {
        tokens.push({ type: 'FUNC', value: FUNCTION_ALIASES[lower] });
        continue;
      }

      throw new CalcError('ERR_UNKNOWN_FUNC', id);
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    if (ch === '!' || ch === '%') {
      tokens.push({ type: 'POSTFIX', value: ch });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    throw new CalcError('ERR_INVALID_CHAR', ch);
  }

  return insertImplicitMultiplication(tokens);
}

/**
 * Inserts explicit '*' tokens where implicit multiplication is mathematically unambiguous:
 * e.g., 2π -> 2 * π, 3(4+5) -> 3 * (4+5), (1+2)(3+4) -> (1+2) * (3+4), 2sin(30) -> 2 * sin(30)
 */
function insertImplicitMultiplication(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    if (out.length > 0) {
      const prev = out[out.length - 1];
      const prevIsValue =
        prev.type === 'NUMBER' ||
        prev.type === 'CONST' ||
        prev.type === 'RPAREN' ||
        prev.type === 'POSTFIX';
      const currStartsValue =
        curr.type === 'NUMBER' ||
        curr.type === 'CONST' ||
        curr.type === 'FUNC' ||
        curr.type === 'LPAREN';

      if (prevIsValue && currStartsValue) {
        out.push({ type: 'OP', value: '*', implicit: true });
      }
    }
    out.push(curr);
  }
  return out;
}

const OP_INFO = {
  '+': { prec: 1, assoc: 'L', arity: 2 },
  '-': { prec: 1, assoc: 'L', arity: 2 },
  '*': { prec: 2, assoc: 'L', arity: 2 },
  '/': { prec: 2, assoc: 'L', arity: 2 },
  mod: { prec: 2, assoc: 'L', arity: 2 },
  rem: { prec: 2, assoc: 'L', arity: 2 },
  'u-': { prec: 3, assoc: 'R', arity: 1 },
  'u+': { prec: 3, assoc: 'R', arity: 1 },
  '^': { prec: 4, assoc: 'R', arity: 2 },
  '!': { prec: 5, assoc: 'L', arity: 1 },
  '%': { prec: 5, assoc: 'L', arity: 1 },
  '°': { prec: 5, assoc: 'L', arity: 1 }
};

/**
 * Convert infix tokens to Reverse Polish Notation (RPN) using Shunting-Yard.
 * Also marks contextual percentage operations: A + B% or A - B%.
 */
function toRPN(tokens) {
  const output = [];
  const opStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;

    if (tok.type === 'NUMBER' || tok.type === 'CONST') {
      output.push(tok);
      continue;
    }

    if (tok.type === 'FUNC') {
      opStack.push(tok);
      continue;
    }

    if (tok.type === 'COMMA') {
      let foundParen = false;
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'LPAREN') {
          foundParen = true;
          break;
        }
        output.push(opStack.pop());
      }
      if (!foundParen) throw new CalcError('ERR_SYNTAX');
      continue;
    }

    if (tok.type === 'LPAREN') {
      opStack.push(tok);
      continue;
    }

    if (tok.type === 'RPAREN') {
      let foundParen = false;
      while (opStack.length > 0) {
        const top = opStack.pop();
        if (top.type === 'LPAREN') {
          foundParen = true;
          break;
        }
        output.push(top);
      }
      if (!foundParen) throw new CalcError('ERR_UNCLOSED_PAREN');
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNC') {
        output.push(opStack.pop());
      }
      continue;
    }

    if (tok.type === 'POSTFIX') {
      if (!prev || (prev.type !== 'NUMBER' && prev.type !== 'CONST' && prev.type !== 'RPAREN' && prev.type !== 'POSTFIX')) {
        throw new CalcError('ERR_SYNTAX');
      }
      // Check if this '%' is part of contextual A + B% or A - B%
      if (tok.value === '%') {
        const nextTok = i + 1 < tokens.length ? tokens[i + 1] : null;
        const nextIsLowPrec = !nextTok || nextTok.type === 'RPAREN' || (nextTok.type === 'OP' && (nextTok.value === '+' || nextTok.value === '-'));
        const topOp = opStack.length > 0 ? opStack[opStack.length - 1] : null;
        if (nextIsLowPrec && topOp && topOp.type === 'OP' && (topOp.value === '+' || topOp.value === '-')) {
          output.push({ type: 'POSTFIX', value: '%_CTX' });
          continue;
        }
      }
      output.push(tok);
      continue;
    }

    if (tok.type === 'OP') {
      let opVal = tok.value;
      const isUnary =
        !prev ||
        prev.type === 'OP' ||
        prev.type === 'LPAREN' ||
        prev.type === 'COMMA' ||
        prev.type === 'FUNC';

      if (isUnary) {
        if (opVal === '-') opVal = 'u-';
        else if (opVal === '+') opVal = 'u+';
        else throw new CalcError('ERR_SYNTAX');
      }

      const currInfo = OP_INFO[opVal];
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'FUNC') {
          output.push(opStack.pop());
          continue;
        }
        if (top.type !== 'OP') break;
        const topInfo = OP_INFO[top.value];
        if (
          (currInfo.assoc === 'L' && currInfo.prec <= topInfo.prec) ||
          (currInfo.assoc === 'R' && currInfo.prec < topInfo.prec)
        ) {
          output.push(opStack.pop());
        } else {
          break;
        }
      }
      opStack.push({ type: 'OP', value: opVal });
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop();
    if (top.type === 'LPAREN' || top.type === 'RPAREN') {
      throw new CalcError('ERR_UNCLOSED_PAREN');
    }
    output.push(top);
  }

  return output;
}

/**
 * Evaluate RPN queue safely and return numerical result
 */
function evaluateRPN(rpn, options = {}) {
  const angleMode = options.angleMode || 'DEG';
  const stack = [];

  for (let i = 0; i < rpn.length; i++) {
    const tok = rpn[i];

    if (tok.type === 'NUMBER' || tok.type === 'CONST') {
      stack.push(tok.value);
      continue;
    }

    if (tok.type === 'POSTFIX') {
      if (stack.length < 1) throw new CalcError('ERR_SYNTAX');
      const a = stack.pop();
      if (tok.value === '!') {
        stack.push(factorial(a));
      } else if (tok.value === '%') {
        stack.push(a / 100);
      } else if (tok.value === '%_CTX') {
        // Contextual percentage: requires base value underneath on stack
        if (stack.length >= 1) {
          const base = stack[stack.length - 1];
          stack.push(base * (a / 100));
        } else {
          stack.push(a / 100);
        }
      } else if (tok.value === '°') {
        // Explicit degree symbol on number: if engine is in RAD mode, convert deg->rad; if in DEG mode, keep degrees
        if (angleMode === 'RAD') {
          stack.push((a * Math.PI) / 180);
        } else if (angleMode === 'GRAD') {
          stack.push((a * 200) / 180);
        } else {
          stack.push(a);
        }
      }
      continue;
    }

    if (tok.type === 'OP') {
      const info = OP_INFO[tok.value];
      if (info.arity === 1) {
        if (stack.length < 1) throw new CalcError('ERR_SYNTAX');
        const a = stack.pop();
        stack.push(tok.value === 'u-' ? -a : +a);
        continue;
      }

      if (stack.length < 2) throw new CalcError('ERR_SYNTAX');
      const b = stack.pop();
      const a = stack.pop();
      let res;

      switch (tok.value) {
        case '+':
          // Cancellation residue (e.g. 0.1 + 0.2 - 0.3) is measured against the operands
          res = cleanFloatingPoint(a + b, Math.max(Math.abs(a), Math.abs(b)));
          break;
        case '-':
          res = cleanFloatingPoint(a - b, Math.max(Math.abs(a), Math.abs(b)));
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) throw new CalcError('ERR_DIV_ZERO');
          res = a / b;
          break;
        case 'mod':
          if (b === 0) throw new CalcError('ERR_DIV_ZERO');
          res = ((a % b) + b) % b;
          break;
        case 'rem':
          if (b === 0) throw new CalcError('ERR_DIV_ZERO');
          res = a % b;
          break;
        case '^':
          if (a === 0 && b < 0) throw new CalcError('ERR_DIV_ZERO');
          if (a < 0 && Math.floor(b) !== b) throw new CalcError('ERR_NEG_SQRT');
          res = Math.pow(a, b);
          break;
        default:
          throw new CalcError('ERR_SYNTAX');
      }

      if (Number.isNaN(res)) throw new CalcError('ERR_INVALID_ARG');
      if (!Number.isFinite(res)) throw new CalcError('ERR_OVERFLOW');
      stack.push(res);
      continue;
    }

    if (tok.type === 'FUNC') {
      const fn = tok.value;
      if (MULTI_ARG_FUNCS.has(fn)) {
        if (stack.length < 2) throw new CalcError('ERR_SYNTAX');
        const b = stack.pop();
        const a = stack.pop();
        let res;
        switch (fn) {
          case 'nthRoot':
            if (b === 0) throw new CalcError('ERR_INVALID_ARG');
            if (a < 0) {
              if (Math.abs(b % 2) !== 1) throw new CalcError('ERR_NEG_SQRT');
              res = -Math.pow(-a, 1 / b);
            } else {
              res = Math.pow(a, 1 / b);
            }
            break;
          case 'logBase':
            if (a <= 0 || b <= 0 || b === 1) throw new CalcError('ERR_LOG_DOMAIN');
            res = Math.log(a) / Math.log(b);
            break;
          case 'gcd':
            res = gcdTwo(a, b);
            break;
          case 'lcm':
            res = lcmTwo(a, b);
            break;
          case 'nPr':
            res = nPrCalc(a, b);
            break;
          case 'nCr':
            res = nCrCalc(a, b);
            break;
          case 'modFunc':
            if (b === 0) throw new CalcError('ERR_DIV_ZERO');
            res = ((a % b) + b) % b;
            break;
          case 'remFunc':
            if (b === 0) throw new CalcError('ERR_DIV_ZERO');
            res = a % b;
            break;
          default:
            throw new CalcError('ERR_UNKNOWN_FUNC', fn);
        }
        stack.push(res);
        continue;
      }

      if (stack.length < 1) throw new CalcError('ERR_SYNTAX');
      const a = stack.pop();
      let res;

      switch (fn) {
        case 'sin': {
          const rad = toRadians(a, angleMode);
          // Exact zero check for multiples of pi
          res = cleanFloatingPoint(Math.sin(rad));
          break;
        }
        case 'cos': {
          const rad = toRadians(a, angleMode);
          res = cleanFloatingPoint(Math.cos(rad));
          break;
        }
        case 'tan': {
          const rad = toRadians(a, angleMode);
          const cosVal = cleanFloatingPoint(Math.cos(rad));
          if (Math.abs(cosVal) < 1e-14) throw new CalcError('ERR_TRIG_DOMAIN');
          res = cleanFloatingPoint(Math.tan(rad));
          break;
        }
        case 'asin':
          if (a < -1 || a > 1) throw new CalcError('ERR_TRIG_DOMAIN');
          res = fromRadians(Math.asin(a), angleMode);
          break;
        case 'acos':
          if (a < -1 || a > 1) throw new CalcError('ERR_TRIG_DOMAIN');
          res = fromRadians(Math.acos(a), angleMode);
          break;
        case 'atan':
          res = fromRadians(Math.atan(a), angleMode);
          break;
        case 'sinh':
          res = Math.sinh(a);
          break;
        case 'cosh':
          res = Math.cosh(a);
          break;
        case 'tanh':
          res = Math.tanh(a);
          break;
        case 'asinh':
          res = Math.asinh(a);
          break;
        case 'acosh':
          if (a < 1) throw new CalcError('ERR_TRIG_DOMAIN');
          res = Math.acosh(a);
          break;
        case 'atanh':
          if (a <= -1 || a >= 1) throw new CalcError('ERR_TRIG_DOMAIN');
          res = Math.atanh(a);
          break;
        case 'ln':
          if (a <= 0) throw new CalcError('ERR_LOG_DOMAIN');
          res = Math.log(a);
          break;
        case 'log10':
          if (a <= 0) throw new CalcError('ERR_LOG_DOMAIN');
          res = Math.log10(a);
          break;
        case 'log2':
          if (a <= 0) throw new CalcError('ERR_LOG_DOMAIN');
          res = Math.log2(a);
          break;
        case 'sqrt':
          if (a < 0) throw new CalcError('ERR_NEG_SQRT');
          res = Math.sqrt(a);
          break;
        case 'cbrt':
          res = Math.cbrt(a);
          break;
        case 'abs':
          res = Math.abs(a);
          break;
        case 'floor':
          res = Math.floor(a);
          break;
        case 'ceil':
          res = Math.ceil(a);
          break;
        case 'round':
          res = Math.round(a);
          break;
        case 'exp':
          res = Math.exp(a);
          break;
        case 'pow10':
          res = Math.pow(10, a);
          break;
        case 'pow2':
          res = Math.pow(2, a);
          break;
        case 'inv':
          if (a === 0) throw new CalcError('ERR_DIV_ZERO');
          res = 1 / a;
          break;
        case 'fact':
          res = factorial(a);
          break;
        case 'sign':
          res = Math.sign(a);
          break;
        default:
          throw new CalcError('ERR_UNKNOWN_FUNC', fn);
      }

      if (Number.isNaN(res)) throw new CalcError('ERR_INVALID_ARG');
      if (!Number.isFinite(res)) throw new CalcError('ERR_OVERFLOW');
      stack.push(res);
    }
  }

  if (stack.length !== 1) throw new CalcError('ERR_SYNTAX');
  return cleanFloatingPoint(stack[0], 0);
}

function evaluateExpression(expr, options = {}) {
  const tokens = tokenizeExpression(expr, options);
  const rpn = toRPN(tokens);
  return evaluateRPN(rpn, options);
}

/**
 * Parse an expression once and return a fast evaluator f(x) for repeated sampling
 * (function plotting, root scanning). The variable token is patched in place on each call.
 */
function compileExpression(expr, options = {}) {
  const variable = options.variable || 'x';
  const variables = { ...(options.variables || {}), [variable]: 0 };
  const tokens = tokenizeExpression(expr, { ...options, variables });
  const rpn = toRPN(tokens);
  const slots = rpn.filter(tok => tok.isVar && tok.name === variable);
  const evalOptions = { angleMode: options.angleMode || 'RAD' };
  return function evaluateAt(x) {
    for (const slot of slots) slot.value = x;
    return evaluateRPN(rpn, evalOptions);
  };
}

/**
 * Detect a top-level assignment such as `r = 5` or `area = π r^2`.
 * Returns { name, expression } or null when the input is a plain expression.
 */
function parseAssignment(rawExpr) {
  const match = String(rawExpr || '').match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=(?!=)\s*(.+)$/);
  if (!match) return null;
  return { name: match[1], expression: match[2] };
}

export {
  CalcError,
  CONSTANTS,
  PHYSICAL_CONSTANTS,
  isReservedIdentifier,
  compileExpression,
  parseAssignment,
  FUNCTION_ALIASES,
  cleanFloatingPoint,
  toRadians,
  fromRadians,
  factorial,
  gcdTwo,
  lcmTwo,
  nPrCalc,
  nCrCalc,
  normalizeExpressionInput,
  tokenizeExpression,
  toRPN,
  evaluateRPN,
  evaluateExpression
};
