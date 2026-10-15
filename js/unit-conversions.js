import { cleanFloatingPoint, CalcError } from './expression-parser.js';

// --- js/unit-conversions.js ---
/**
 * Scientific Calculator Pro — Expert Module F: 13-Category Unit Converter
 */

const UNIT_CATEGORIES = {
  length: {
    base: 'm',
    units: {
      m: { factor: 1, symbol: 'm' },
      km: { factor: 1000, symbol: 'km' },
      cm: { factor: 0.01, symbol: 'cm' },
      mm: { factor: 0.001, symbol: 'mm' },
      um: { factor: 1e-6, symbol: 'µm' },
      nm: { factor: 1e-9, symbol: 'nm' },
      mi: { factor: 1609.344, symbol: 'mi' },
      yd: { factor: 0.9144, symbol: 'yd' },
      ft: { factor: 0.3048, symbol: 'ft' },
      in: { factor: 0.0254, symbol: 'in' },
      nmi: { factor: 1852, symbol: 'nmi' }
    }
  },
  area: {
    base: 'm2',
    units: {
      m2: { factor: 1, symbol: 'm²' },
      km2: { factor: 1e6, symbol: 'km²' },
      cm2: { factor: 1e-4, symbol: 'cm²' },
      mm2: { factor: 1e-6, symbol: 'mm²' },
      ha: { factor: 10000, symbol: 'ha' },
      acre: { factor: 4046.8564224, symbol: 'ac' },
      ft2: { factor: 0.09290304, symbol: 'ft²' },
      in2: { factor: 0.00064516, symbol: 'in²' }
    }
  },
  volume: {
    base: 'L',
    units: {
      L: { factor: 1, symbol: 'L' },
      mL: { factor: 0.001, symbol: 'mL' },
      m3: { factor: 1000, symbol: 'm³' },
      cm3: { factor: 0.001, symbol: 'cm³' },
      galUS: { factor: 3.785411784, symbol: 'gal (US)' },
      qtUS: { factor: 0.946352946, symbol: 'qt (US)' },
      ptUS: { factor: 0.473176473, symbol: 'pt (US)' },
      flOzUS: { factor: 0.0295735295625, symbol: 'fl oz' }
    }
  },
  mass: {
    base: 'kg',
    units: {
      kg: { factor: 1, symbol: 'kg' },
      g: { factor: 0.001, symbol: 'g' },
      mg: { factor: 1e-6, symbol: 'mg' },
      t: { factor: 1000, symbol: 't' },
      lb: { factor: 0.45359237, symbol: 'lb' },
      oz: { factor: 0.028349523125, symbol: 'oz' }
    }
  },
  time: {
    base: 's',
    units: {
      s: { factor: 1, symbol: 's' },
      ms: { factor: 0.001, symbol: 'ms' },
      us: { factor: 1e-6, symbol: 'µs' },
      min: { factor: 60, symbol: 'min' },
      h: { factor: 3600, symbol: 'h' },
      d: { factor: 86400, symbol: 'd' },
      wk: { factor: 604800, symbol: 'wk' },
      yr: { factor: 31557600, symbol: 'yr' }
    }
  },
  speed: {
    base: 'mps',
    units: {
      mps: { factor: 1, symbol: 'm/s' },
      kmh: { factor: 1 / 3.6, symbol: 'km/h' },
      mph: { factor: 0.44704, symbol: 'mph' },
      kn: { factor: 1852 / 3600, symbol: 'kn' },
      fps: { factor: 0.3048, symbol: 'ft/s' }
    }
  },
  acceleration: {
    base: 'mps2',
    units: {
      mps2: { factor: 1, symbol: 'm/s²' },
      g: { factor: 9.80665, symbol: 'g₀' },
      fps2: { factor: 0.3048, symbol: 'ft/s²' },
      gal: { factor: 0.01, symbol: 'Gal' }
    }
  },
  temperature: {
    base: 'C',
    isTemperature: true,
    units: {
      C: { symbol: '°C' },
      F: { symbol: '°F' },
      K: { symbol: 'K' }
    }
  },
  pressure: {
    base: 'Pa',
    units: {
      Pa: { factor: 1, symbol: 'Pa' },
      kPa: { factor: 1000, symbol: 'kPa' },
      MPa: { factor: 1e6, symbol: 'MPa' },
      bar: { factor: 100000, symbol: 'bar' },
      atm: { factor: 101325, symbol: 'atm' },
      psi: { factor: 6894.757293168, symbol: 'psi' },
      mmHg: { factor: 133.322387415, symbol: 'mmHg' }
    }
  },
  energy: {
    base: 'J',
    units: {
      J: { factor: 1, symbol: 'J' },
      kJ: { factor: 1000, symbol: 'kJ' },
      cal: { factor: 4.184, symbol: 'cal' },
      kcal: { factor: 4184, symbol: 'kcal' },
      Wh: { factor: 3600, symbol: 'Wh' },
      kWh: { factor: 3.6e6, symbol: 'kWh' },
      eV: { factor: 1.602176634e-19, symbol: 'eV' },
      BTU: { factor: 1055.05585262, symbol: 'BTU' }
    }
  },
  power: {
    base: 'W',
    units: {
      W: { factor: 1, symbol: 'W' },
      kW: { factor: 1000, symbol: 'kW' },
      MW: { factor: 1e6, symbol: 'MW' },
      hp: { factor: 745.699872, symbol: 'hp (I)' },
      cv: { factor: 735.49875, symbol: 'cv (M)' }
    }
  },
  frequency: {
    base: 'Hz',
    units: {
      Hz: { factor: 1, symbol: 'Hz' },
      kHz: { factor: 1e3, symbol: 'kHz' },
      MHz: { factor: 1e6, symbol: 'MHz' },
      GHz: { factor: 1e9, symbol: 'GHz' },
      rpm: { factor: 1 / 60, symbol: 'RPM' }
    }
  },
  angle: {
    base: 'deg',
    units: {
      deg: { factor: 1, symbol: '°' },
      rad: { factor: 180 / Math.PI, symbol: 'rad' },
      grad: { factor: 0.9, symbol: 'gon' },
      arcmin: { factor: 1 / 60, symbol: "'" },
      arcsec: { factor: 1 / 3600, symbol: '"' },
      turn: { factor: 360, symbol: 'rev' }
    }
  }
};

function convertUnit(value, categoryKey, fromUnit, toUnit) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new CalcError('ERR_INVALID_ARG');
  const cat = UNIT_CATEGORIES[categoryKey];
  if (!cat) throw new CalcError('ERR_INVALID_ARG');

  if (cat.isTemperature) {
    let celsius;
    if (fromUnit === 'C') celsius = num;
    else if (fromUnit === 'F') celsius = (num - 32) * (5 / 9);
    else if (fromUnit === 'K') celsius = num - 273.15;
    else throw new CalcError('ERR_INVALID_ARG');

    if (celsius < -273.1500001) throw new CalcError('ERR_ABS_ZERO');

    let out;
    if (toUnit === 'C') out = celsius;
    else if (toUnit === 'F') out = celsius * (9 / 5) + 32;
    else if (toUnit === 'K') out = celsius + 273.15;
    else throw new CalcError('ERR_INVALID_ARG');
    return cleanFloatingPoint(out);
  }

  const uFrom = cat.units[fromUnit];
  const uTo = cat.units[toUnit];
  if (!uFrom || !uTo) throw new CalcError('ERR_INVALID_ARG');
  const baseVal = num * uFrom.factor;
  return cleanFloatingPoint(baseVal / uTo.factor);
}

export {
  UNIT_CATEGORIES,
  convertUnit
};
