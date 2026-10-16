import { evaluateExpression, cleanFloatingPoint, CalcError, parseAssignment, isReservedIdentifier } from './expression-parser.js';

// --- js/calculator-engine.js ---
/**
 * Scientific Calculator Pro — Core Calculator Engine & Memory Manager
 */

/**
 * Convert a finite floating-point number to a simplified rational fraction { num, den, whole, str }
 * using continued fractions within a configurable tolerance.
 */
function decimalToFraction(value, maxDenominator = 1000000, tolerance = 1e-10) {
  if (!Number.isFinite(value)) return null;
  const sign = value < 0 ? -1 : 1;
  const absVal = Math.abs(value);
  if (Math.floor(absVal) === absVal) {
    return { num: sign * absVal, den: 1, str: `${sign * absVal}/1`, isInteger: true };
  }

  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = absVal;

  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;

    if (k1 > maxDenominator) {
      h1 = h2;
      k1 = k2;
      break;
    }
    if (Math.abs(absVal - h1 / k1) <= absVal * tolerance || b === a) {
      break;
    }
    b = 1 / (b - a);
  }

  if (k1 <= 0 || k1 > maxDenominator || Math.abs(absVal - h1 / k1) > 1e-6) {
    return null;
  }

  const num = sign * h1;
  const den = k1;
  return {
    num,
    den,
    str: den === 1 ? `${num}` : `${num}/${den}`,
    isInteger: den === 1
  };
}

class CalculatorEngine {
  constructor(initialState = {}) {
    this.memory = Number(initialState.memory) || 0;
    this.ans = Number(initialState.ans) || 0;
    this.angleMode = initialState.angleMode || 'DEG';
    this.lastAction = null; // Stores last top-level binary operation for repeat '='
    this.variables = { ...(initialState.variables || {}) }; // User-defined variables (e.g. r = 5)
  }

  setAngleMode(mode) {
    if (['DEG', 'RAD', 'GRAD'].includes(mode)) {
      this.angleMode = mode;
    }
  }

  evaluate(expression, extraOptions = {}) {
    const angleMode = extraOptions.angleMode || this.angleMode;
    const ans = extraOptions.ans !== undefined ? extraOptions.ans : this.ans;
    const result = evaluateExpression(expression, {
      angleMode,
      ans,
      variables: { ...this.variables, ...(extraOptions.variables || {}) }
    });

    // Extract top-level binary operation for '=' repeat behavior (e.g. "5 + 3" -> "+ 3")
    const repeatMatch = String(expression).trim().match(/([+\-*/×÷^])\s*([0-9.]+)\s*$/);
    this.lastAction = repeatMatch ? `${repeatMatch[1]} ${repeatMatch[2]}` : null;

    this.ans = result;
    return result;
  }

  /**
   * Evaluate an input line that may be an assignment (`r = 5`) or a plain expression.
   * Returns { value, assigned } where assigned is the variable name or null.
   */
  run(input, extraOptions = {}) {
    const assignment = parseAssignment(input);
    if (assignment) {
      if (isReservedIdentifier(assignment.name)) throw new CalcError('ERR_RESERVED_NAME', assignment.name);
      const value = this.evaluate(assignment.expression, extraOptions);
      this.variables[assignment.name] = value;
      return { value, assigned: assignment.name };
    }
    return { value: this.evaluate(input, extraOptions), assigned: null };
  }

  /**
   * Evaluate without side effects on ans / repeat state (used for the live preview).
   */
  preview(input, extraOptions = {}) {
    const assignment = parseAssignment(input);
    const expr = assignment ? assignment.expression : input;
    return evaluateExpression(expr, {
      angleMode: extraOptions.angleMode || this.angleMode,
      ans: this.ans,
      variables: { ...this.variables }
    });
  }

  deleteVariable(name) {
    delete this.variables[name];
  }

  repeatLast(currentValue) {
    if (!this.lastAction) return currentValue;
    const expr = `${currentValue} ${this.lastAction}`;
    return this.evaluate(expr);
  }

  // Memory Operations: MC, MR, M+, M-, MS
  memoryClear() {
    this.memory = 0;
    return this.memory;
  }

  memoryRecall() {
    return this.memory;
  }

  memoryStore(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) throw new CalcError('ERR_INVALID_ARG');
    this.memory = cleanFloatingPoint(num, Math.abs(num));
    return this.memory;
  }

  memoryAdd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) throw new CalcError('ERR_INVALID_ARG');
    this.memory = cleanFloatingPoint(this.memory + num, Math.max(Math.abs(this.memory), Math.abs(num)));
    return this.memory;
  }

  memorySubtract(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) throw new CalcError('ERR_INVALID_ARG');
    this.memory = cleanFloatingPoint(this.memory - num, Math.max(Math.abs(this.memory), Math.abs(num)));
    return this.memory;
  }
}

export {
  decimalToFraction,
  CalculatorEngine
};
