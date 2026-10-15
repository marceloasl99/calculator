import { cleanFloatingPoint, CalcError } from '../expression-parser.js';

// --- js/tools/matrices.js ---
/**
 * Scientific Calculator Pro — Expert Module B: Matrices & Linear Systems
 * Supports dimensions 1x1 up to 6x6 with Gaussian elimination & partial pivoting.
 */

const MAX_MATRIX_DIM = 6;

function validateMatrix(mat) {
  if (!Array.isArray(mat) || mat.length === 0 || mat.length > MAX_MATRIX_DIM) {
    throw new CalcError('ERR_DIM_MISMATCH');
  }
  const cols = Array.isArray(mat[0]) ? mat[0].length : 0;
  if (cols === 0 || cols > MAX_MATRIX_DIM) throw new CalcError('ERR_DIM_MISMATCH');
  const cleaned = [];
  for (let r = 0; r < mat.length; r++) {
    if (!Array.isArray(mat[r]) || mat[r].length !== cols) {
      throw new CalcError('ERR_DIM_MISMATCH');
    }
    const row = [];
    for (let c = 0; c < cols; c++) {
      const v = Number(mat[r][c]);
      if (!Number.isFinite(v)) throw new CalcError('ERR_INVALID_ARG');
      row.push(v);
    }
    cleaned.push(row);
  }
  return { matrix: cleaned, rows: mat.length, cols };
}

function matrixAdd(A, B) {
  const a = validateMatrix(A);
  const b = validateMatrix(B);
  if (a.rows !== b.rows || a.cols !== b.cols) throw new CalcError('ERR_DIM_MISMATCH');
  return a.matrix.map((row, r) => row.map((val, c) => cleanFloatingPoint(val + b.matrix[r][c])));
}

function matrixSub(A, B) {
  const a = validateMatrix(A);
  const b = validateMatrix(B);
  if (a.rows !== b.rows || a.cols !== b.cols) throw new CalcError('ERR_DIM_MISMATCH');
  return a.matrix.map((row, r) => row.map((val, c) => cleanFloatingPoint(val - b.matrix[r][c])));
}

function matrixScalar(A, k) {
  const a = validateMatrix(A);
  const scalar = Number(k);
  if (!Number.isFinite(scalar)) throw new CalcError('ERR_INVALID_ARG');
  return a.matrix.map(row => row.map(val => cleanFloatingPoint(val * scalar)));
}

function matrixMultiply(A, B) {
  const a = validateMatrix(A);
  const b = validateMatrix(B);
  if (a.cols !== b.rows) throw new CalcError('ERR_DIM_MISMATCH');
  const result = Array.from({ length: a.rows }, () => Array(b.cols).fill(0));
  for (let r = 0; r < a.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      let sum = 0;
      for (let k = 0; k < a.cols; k++) {
        sum += a.matrix[r][k] * b.matrix[k][c];
      }
      result[r][c] = cleanFloatingPoint(sum);
    }
  }
  return result;
}

function matrixTranspose(A) {
  const a = validateMatrix(A);
  const result = Array.from({ length: a.cols }, () => Array(a.rows).fill(0));
  for (let r = 0; r < a.rows; r++) {
    for (let c = 0; c < a.cols; c++) {
      result[c][r] = a.matrix[r][c];
    }
  }
  return result;
}

function matrixTrace(A) {
  const a = validateMatrix(A);
  if (a.rows !== a.cols) throw new CalcError('ERR_NOT_SQUARE_MATRIX');
  let sum = 0;
  for (let i = 0; i < a.rows; i++) sum += a.matrix[i][i];
  return cleanFloatingPoint(sum);
}

function matrixDeterminant(A) {
  const a = validateMatrix(A);
  if (a.rows !== a.cols) throw new CalcError('ERR_NOT_SQUARE_MATRIX');
  const n = a.rows;
  const M = a.matrix.map(row => [...row]);
  let det = 1;
  let swaps = 0;

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > maxVal) {
        maxVal = Math.abs(M[r][i]);
        pivotRow = r;
      }
    }
    if (maxVal < 1e-12) return 0;
    if (pivotRow !== i) {
      [M[i], M[pivotRow]] = [M[pivotRow], M[i]];
      swaps++;
    }
    det *= M[i][i];
    for (let r = i + 1; r < n; r++) {
      const factor = M[r][i] / M[i][i];
      for (let c = i + 1; c < n; c++) {
        M[r][c] -= factor * M[i][c];
      }
    }
  }
  return cleanFloatingPoint(swaps % 2 === 0 ? det : -det);
}

function matrixInverse(A) {
  const a = validateMatrix(A);
  if (a.rows !== a.cols) throw new CalcError('ERR_NOT_SQUARE_MATRIX');
  const n = a.rows;
  const aug = a.matrix.map((row, r) => [
    ...row,
    ...Array.from({ length: n }, (_, c) => (r === c ? 1 : 0))
  ]);

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let maxVal = Math.abs(aug[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(aug[r][i]) > maxVal) {
        maxVal = Math.abs(aug[r][i]);
        pivotRow = r;
      }
    }
    if (maxVal < 1e-11) throw new CalcError('ERR_SINGULAR_MATRIX');
    if (pivotRow !== i) {
      [aug[i], aug[pivotRow]] = [aug[pivotRow], aug[i]];
    }
    const pivot = aug[i][i];
    for (let c = 0; c < 2 * n; c++) aug[i][c] /= pivot;

    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = aug[r][i];
        for (let c = 0; c < 2 * n; c++) {
          aug[r][c] -= factor * aug[i][c];
        }
      }
    }
  }

  return aug.map(row => row.slice(n, 2 * n).map(cleanFloatingPoint));
}

function solveLinearSystem(A, bVec) {
  const a = validateMatrix(A);
  if (a.rows !== a.cols) throw new CalcError('ERR_NOT_SQUARE_MATRIX');
  const n = a.rows;
  if (!Array.isArray(bVec) || bVec.length !== n) throw new CalcError('ERR_DIM_MISMATCH');

  const aug = a.matrix.map((row, r) => [...row, Number(bVec[r])]);
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(aug[i][n])) throw new CalcError('ERR_INVALID_ARG');
  }

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let maxVal = Math.abs(aug[i][i]);
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(aug[r][i]) > maxVal) {
        maxVal = Math.abs(aug[r][i]);
        pivotRow = r;
      }
    }
    if (maxVal < 1e-11) throw new CalcError('ERR_SINGULAR_MATRIX');
    if (pivotRow !== i) {
      [aug[i], aug[pivotRow]] = [aug[pivotRow], aug[i]];
    }
    for (let r = i + 1; r < n; r++) {
      const factor = aug[r][i] / aug[i][i];
      for (let c = i; c <= n; c++) {
        aug[r][c] -= factor * aug[i][c];
      }
    }
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = cleanFloatingPoint(sum / aug[i][i]);
  }
  return x;
}

export {
  MAX_MATRIX_DIM,
  validateMatrix,
  matrixAdd,
  matrixSub,
  matrixScalar,
  matrixMultiply,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  matrixTrace,
  solveLinearSystem
};
