import { cleanFloatingPoint } from './expression-parser.js';
import { decimalToFraction } from './calculator-engine.js';

// --- js/formatting.js ---
/**
 * Scientific Calculator Pro — Regional Number Formatting & Expression Display
 * Uses Intl.NumberFormat for all 6 supported languages while keeping canonical math state separate.
 */

const SUPPORTED_LOCALES = ['en', 'es', 'pt-BR', 'it', 'fr', 'de'];

function getLocaleSeparators(locale = 'pt-BR') {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = parts.find(p => p.type === 'group')?.value || ',';
  const decimal = parts.find(p => p.type === 'decimal')?.value || '.';
  return { group, decimal };
}

/**
 * Format a numerical result according to locale and user precision preferences
 */
function formatResult(value, options = {}) {
  const locale = SUPPORTED_LOCALES.includes(options.locale) ? options.locale : 'pt-BR';
  const precisionMode = options.precisionMode || 'auto'; // 'auto' | 'fixed'
  const decimalPlaces = options.decimalPlaces !== undefined ? Number(options.decimalPlaces) : 6;
  const scientificNotation = Boolean(options.scientificNotation);
  const showFraction = Boolean(options.showFraction);

  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞';

  const cleaned = cleanFloatingPoint(Number(value), Math.abs(Number(value)));

  if (showFraction) {
    const frac = decimalToFraction(cleaned);
    if (frac && !frac.isInteger) {
      return frac.str;
    }
  }

  const absVal = Math.abs(cleaned);
  const forceSci = scientificNotation || (absVal > 0 && (absVal >= 1e12 || absVal < 1e-7));

  if (forceSci) {
    const maxDigits = precisionMode === 'fixed' ? decimalPlaces : 6;
    const expStr = cleaned.toExponential(Math.min(Math.max(maxDigits, 1), 12));
    const [mantissa, exponent] = expStr.split('e');
    const { decimal } = getLocaleSeparators(locale);
    const localMantissa = mantissa.replace('.', decimal);
    const cleanExp = exponent.replace('+', '');
    const SUPERSCRIPTS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    const supExp = String(Number(cleanExp)).replace(/[-0-9]/g, (ch) => SUPERSCRIPTS[ch]);
    return `${localMantissa} × 10${supExp}`;
  }

  const fmtOptions = {
    useGrouping: options.useGrouping !== false
  };

  if (precisionMode === 'fixed') {
    fmtOptions.minimumFractionDigits = Math.min(Math.max(decimalPlaces, 0), 12);
    fmtOptions.maximumFractionDigits = Math.min(Math.max(decimalPlaces, 0), 12);
  } else {
    fmtOptions.maximumFractionDigits = Number.isInteger(options.maxFractionDigits) ? options.maxFractionDigits : 10;
  }

  const formatted = new Intl.NumberFormat(locale, fmtOptions).format(cleaned);
  return formatted === '-0' ? '0' : formatted;
}

/**
 * Format a canonical expression string for localized display without altering the underlying canonical string.
 */
function formatExpressionForDisplay(canonicalExpr, locale = 'pt-BR') {
  if (!canonicalExpr) return '0';
  const { decimal } = getLocaleSeparators(locale);
  const argSep = decimal === ',' ? '; ' : ', ';

  let display = String(canonicalExpr)
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/,/g, argSep);

  if (decimal === ',') {
    display = display.replace(/(\d)\.(\d)/g, '$1,$2');
  }

  return display.replace(/\s+/g, ' ').trim();
}

export {
  SUPPORTED_LOCALES,
  getLocaleSeparators,
  formatResult,
  formatExpressionForDisplay
};
