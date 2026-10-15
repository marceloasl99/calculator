import { cleanFloatingPoint, toRadians, fromRadians, CalcError } from '../expression-parser.js';

// --- js/tools/complex.js ---
/**
 * Scientific Calculator Pro — Expert Module A: Complex Numbers (a + bi)
 */

class Complex {
  constructor(re = 0, im = 0) {
    this.re = cleanFloatingPoint(Number(re) || 0);
    this.im = cleanFloatingPoint(Number(im) || 0);
  }

  static add(z1, z2) {
    return new Complex(z1.re + z2.re, z1.im + z2.im);
  }

  static sub(z1, z2) {
    return new Complex(z1.re - z2.re, z1.im - z2.im);
  }

  static mul(z1, z2) {
    return new Complex(
      z1.re * z2.re - z1.im * z2.im,
      z1.re * z2.im + z1.im * z2.re
    );
  }

  static div(z1, z2) {
    const denom = z2.re * z2.re + z2.im * z2.im;
    if (denom === 0) throw new CalcError('ERR_DIV_ZERO');
    return new Complex(
      (z1.re * z2.re + z1.im * z2.im) / denom,
      (z1.im * z2.re - z1.re * z2.im) / denom
    );
  }

  conjugate() {
    return new Complex(this.re, -this.im);
  }

  modulus() {
    return cleanFloatingPoint(Math.hypot(this.re, this.im));
  }

  argument(angleMode = 'DEG') {
    if (this.re === 0 && this.im === 0) throw new CalcError('ERR_COMPLEX_ZERO_ARG');
    const rad = Math.atan2(this.im, this.re);
    return cleanFloatingPoint(fromRadians(rad, angleMode));
  }

  toPolar(angleMode = 'DEG') {
    const r = this.modulus();
    const theta = (this.re === 0 && this.im === 0) ? 0 : this.argument(angleMode);
    return { r, theta, angleMode };
  }

  static fromPolar(r, theta, angleMode = 'DEG') {
    const rad = toRadians(Number(theta), angleMode);
    const radius = Number(r);
    return new Complex(radius * Math.cos(rad), radius * Math.sin(rad));
  }

  pow(n) {
    const exp = Number(n);
    if (!Number.isFinite(exp)) throw new CalcError('ERR_INVALID_ARG');
    const r = this.modulus();
    if (r === 0) {
      if (exp <= 0) throw new CalcError('ERR_DIV_ZERO');
      return new Complex(0, 0);
    }
    const theta = Math.atan2(this.im, this.re);
    const nr = Math.pow(r, exp);
    const nTheta = exp * theta;
    return new Complex(nr * Math.cos(nTheta), nr * Math.sin(nTheta));
  }

  nthRoots(n, angleMode = 'DEG') {
    const kMax = Math.round(Number(n));
    if (kMax < 1 || kMax > 12) throw new CalcError('ERR_INVALID_ARG');
    const r = this.modulus();
    if (r === 0) return [new Complex(0, 0)];
    const theta = Math.atan2(this.im, this.re);
    const rootR = Math.pow(r, 1 / kMax);
    const roots = [];
    for (let k = 0; k < kMax; k++) {
      const ang = (theta + 2 * Math.PI * k) / kMax;
      const c = new Complex(rootR * Math.cos(ang), rootR * Math.sin(ang));
      roots.push({
        index: k,
        re: c.re,
        im: c.im,
        formatted: c.format(),
        polarAngle: cleanFloatingPoint(fromRadians(ang, angleMode))
      });
    }
    return roots;
  }

  format(decimals = 6) {
    const r = Number(this.re.toFixed(decimals));
    const i = Number(this.im.toFixed(decimals));
    if (i === 0) return `${r}`;
    if (r === 0) return i === 1 ? 'i' : i === -1 ? '-i' : `${i}i`;
    const sign = i >= 0 ? '+' : '-';
    const absI = Math.abs(i);
    const iPart = absI === 1 ? 'i' : `${absI}i`;
    return `${r} ${sign} ${iPart}`;
  }
}

export {
  Complex
};
