import { CalcError } from '../expression-parser.js';

// --- js/tools/it-tools.js ---
/**
 * Scientific Calculator Pro — IT Converter toolkit
 * IPv4/IPv6 subnetting, integer bases & machine words, data units, text encodings,
 * Unix time, colors and Unix permissions. Pure functions, no DOM.
 */

// ==================== IPv4 / CIDR ====================

function parseIPv4(str) {
  const parts = String(str || '').trim().split('.');
  if (parts.length !== 4) throw new CalcError('ERR_IT_IP');
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) throw new CalcError('ERR_IT_IP');
    const octet = Number(part);
    if (octet > 255) throw new CalcError('ERR_IT_IP');
    value = value * 256 + octet;
  }
  return value >>> 0;
}

function ipv4ToString(n) {
  const v = n >>> 0;
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

function prefixToMask(prefix) {
  return prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
}

function maskToPrefix(maskStr) {
  const mask = parseIPv4(maskStr);
  const inverted = (~mask) >>> 0;
  // A valid mask is a run of 1s followed by 0s, so (inverted + 1) is a power of two
  if ((inverted & (inverted + 1)) !== 0) throw new CalcError('ERR_IT_MASK');
  return 32 - Math.log2(inverted + 1);
}

function ipv4Binary(n) {
  return (n >>> 0).toString(2).padStart(32, '0').replace(/(.{8})(?!$)/g, '$1.');
}

function ipv4Class(ip) {
  const first = ip >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

const IPV4_RANGES = [
  ['0.0.0.0', 8, 'thisNetwork'],
  ['10.0.0.0', 8, 'private'],
  ['100.64.0.0', 10, 'cgnat'],
  ['127.0.0.0', 8, 'loopback'],
  ['169.254.0.0', 16, 'linkLocal'],
  ['172.16.0.0', 12, 'private'],
  ['192.0.2.0', 24, 'documentation'],
  ['192.168.0.0', 16, 'private'],
  ['198.18.0.0', 15, 'benchmark'],
  ['198.51.100.0', 24, 'documentation'],
  ['203.0.113.0', 24, 'documentation'],
  ['224.0.0.0', 4, 'multicast'],
  ['255.255.255.255', 32, 'broadcast'],
  ['240.0.0.0', 4, 'reserved']
];

function ipv4Scope(ip) {
  for (const [base, prefix, scope] of IPV4_RANGES) {
    const mask = prefixToMask(prefix);
    if (((ip & mask) >>> 0) === parseIPv4(base)) return scope;
  }
  return 'public';
}

/**
 * Parse "192.168.1.10/24", "192.168.1.10 255.255.255.0" or a bare address (assumed /32).
 */
function parseCidr(input) {
  const text = String(input || '').trim();
  const match = text.match(/^([\d.]+)\s*(?:\/\s*(\d{1,2})|\s+([\d.]+))?$/);
  if (!match) throw new CalcError('ERR_IT_IP');
  const ip = parseIPv4(match[1]);
  let prefix = 32;
  if (match[2] !== undefined) {
    prefix = Number(match[2]);
    if (prefix > 32) throw new CalcError('ERR_IT_PREFIX');
  } else if (match[3] !== undefined) {
    prefix = maskToPrefix(match[3]);
  }
  return { ip, prefix };
}

function cidrInfo(input, prefixOverride = null) {
  const parsed = parseCidr(input);
  const ip = parsed.ip;
  const prefix = prefixOverride === null ? parsed.prefix : Number(prefixOverride);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new CalcError('ERR_IT_PREFIX');

  const mask = prefixToMask(prefix);
  const wildcard = (~mask) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  let firstHost = network;
  let lastHost = broadcast;
  let usable = total;
  if (prefix <= 30) {
    firstHost = network + 1;
    lastHost = broadcast - 1;
    usable = total - 2;
  }

  return {
    ip: ipv4ToString(ip),
    prefix,
    cidr: `${ipv4ToString(network)}/${prefix}`,
    mask: ipv4ToString(mask),
    wildcard: ipv4ToString(wildcard),
    network: ipv4ToString(network),
    broadcast: ipv4ToString(broadcast),
    firstHost: ipv4ToString(firstHost),
    lastHost: ipv4ToString(lastHost),
    totalAddresses: total,
    usableHosts: usable,
    ipClass: ipv4Class(ip),
    scope: ipv4Scope(ip),
    ipDecimal: ip,
    ipHex: '0x' + ip.toString(16).toUpperCase().padStart(8, '0'),
    binary: {
      ip: ipv4Binary(ip),
      mask: ipv4Binary(mask),
      network: ipv4Binary(network),
      broadcast: ipv4Binary(broadcast)
    }
  };
}

/**
 * Split a network into equal subnets of a longer prefix (limited to the first `limit` rows).
 */
function splitSubnets(input, newPrefix, limit = 256) {
  const { ip, prefix } = parseCidr(input);
  const target = Number(newPrefix);
  if (!Number.isInteger(target) || target < prefix || target > 32) throw new CalcError('ERR_IT_PREFIX');
  const network = (ip & prefixToMask(prefix)) >>> 0;
  const count = 2 ** (target - prefix);
  const size = 2 ** (32 - target);
  const rows = [];
  for (let k = 0; k < Math.min(count, limit); k++) {
    const net = network + k * size;
    const info = cidrInfo(ipv4ToString(net), target);
    rows.push({ cidr: info.cidr, firstHost: info.firstHost, lastHost: info.lastHost, broadcast: info.broadcast, usableHosts: info.usableHosts });
  }
  return { count, size, rows, truncated: count > limit };
}

/**
 * Smallest prefix whose subnet holds at least `hosts` usable addresses.
 */
function prefixForHosts(hosts) {
  const n = Math.ceil(Number(hosts));
  if (!Number.isFinite(n) || n < 1 || n > 2 ** 32 - 2) throw new CalcError('ERR_INVALID_ARG');
  if (n === 1) return 32;
  if (n === 2) return 31;
  return 32 - Math.ceil(Math.log2(n + 2));
}

// ==================== IPv6 ====================

function expandIPv6(str) {
  let text = String(str || '').trim().toLowerCase();
  if (!text || !/^[0-9a-f:.]+$/.test(text)) throw new CalcError('ERR_IT_IPV6');
  // Embedded IPv4 tail, e.g. ::ffff:192.168.0.1
  const v4 = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = parseIPv4(v4[1]);
    text = text.slice(0, -v4[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) throw new CalcError('ERR_IT_IPV6');
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) throw new CalcError('ERR_IT_IPV6');
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  if (groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) throw new CalcError('ERR_IT_IPV6');
  return groups.map(g => g.padStart(4, '0')).join(':');
}

function ipv6ToBigInt(expanded) {
  return BigInt('0x' + expanded.replace(/:/g, ''));
}

function bigIntToIPv6(value) {
  const hex = value.toString(16).padStart(32, '0');
  return hex.match(/.{4}/g).join(':');
}

function compressIPv6(str) {
  const groups = expandIPv6(str).split(':').map(g => g.replace(/^0+(?=.)/, ''));
  // Find the longest run (length ≥ 2) of zero groups — RFC 5952
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] !== '0') continue;
    let j = i;
    while (j < 8 && groups[j] === '0') j++;
    if (j - i > bestLen && j - i >= 2) {
      bestStart = i;
      bestLen = j - i;
    }
    i = j;
  }
  if (bestStart === -1) return groups.join(':');
  const left = groups.slice(0, bestStart).join(':');
  const right = groups.slice(bestStart + bestLen).join(':');
  return `${left}::${right}`;
}

function ipv6Info(input) {
  const [addr, prefixStr] = String(input || '').trim().split('/');
  const prefix = prefixStr === undefined ? 128 : Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) throw new CalcError('ERR_IT_PREFIX');
  const expanded = expandIPv6(addr);
  const value = ipv6ToBigInt(expanded);
  const hostBits = BigInt(128 - prefix);
  const mask = ((1n << 128n) - 1n) ^ ((1n << hostBits) - 1n);
  const network = value & mask;
  const last = network | ((1n << hostBits) - 1n);
  const first16 = Number(value >> 112n);
  let scope = 'global';
  if (value === 0n) scope = 'unspecified';
  else if (value === 1n) scope = 'loopback';
  else if ((first16 & 0xffc0) === 0xfe80) scope = 'linkLocal';
  else if ((first16 & 0xfe00) === 0xfc00) scope = 'uniqueLocal';
  else if ((first16 & 0xff00) === 0xff00) scope = 'multicast';
  else if (first16 === 0x2001 && Number((value >> 96n) & 0xffffn) === 0x0db8) scope = 'documentation';
  return {
    expanded,
    compressed: compressIPv6(expanded),
    prefix,
    network: `${compressIPv6(bigIntToIPv6(network))}/${prefix}`,
    firstAddress: compressIPv6(bigIntToIPv6(network)),
    lastAddress: compressIPv6(bigIntToIPv6(last)),
    totalAddresses: (1n << hostBits).toString(),
    totalPower: `2^${128 - prefix}`,
    scope
  };
}

// ==================== Integer bases & machine words ====================

const WORD_SIZES = { 8: 'BYTE', 16: 'WORD', 32: 'DWORD', 64: 'QWORD' };

/**
 * Parse an integer in base 2, 8, 10 or 16 (prefixes 0b/0o/0x, spaces, underscores and a leading minus allowed).
 */
function parseInteger(text, base = 10) {
  let s = String(text || '').trim().replace(/[\s_]/g, '').toLowerCase();
  if (!s) throw new CalcError('ERR_EMPTY');
  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  const prefixes = { 2: '0b', 8: '0o', 16: '0x' };
  if (prefixes[base] && s.startsWith(prefixes[base])) s = s.slice(2);
  const patterns = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/ };
  if (!patterns[base] || !patterns[base].test(s)) throw new CalcError('ERR_INVALID_BASE_DIGIT');
  const literal = base === 10 ? s : `${prefixes[base]}${s}`;
  const value = BigInt(literal);
  return negative ? -value : value;
}

/**
 * Represent `value` (BigInt) as a machine word of `width` bits (two's complement for negatives).
 */
function wordInfo(value, width = 32) {
  const bits = BigInt(width);
  const modulus = 1n << bits;
  const max = modulus - 1n;
  const signedMin = -(1n << (bits - 1n));
  const signedMax = (1n << (bits - 1n)) - 1n;
  const overflow = value > max || value < signedMin;
  const unsigned = ((value % modulus) + modulus) % modulus;
  const signed = unsigned > signedMax ? unsigned - modulus : unsigned;

  const binary = unsigned.toString(2).padStart(width, '0');
  const hex = unsigned.toString(16).toUpperCase().padStart(width / 4, '0');
  const bytes = hex.match(/.{2}/g);
  const setBits = [];
  for (let i = 0; i < width; i++) {
    if (binary[width - 1 - i] === '1') setBits.push(i);
  }
  setBits.reverse();

  return {
    width,
    wordName: WORD_SIZES[width] || `${width}-bit`,
    unsigned: unsigned.toString(),
    signed: signed.toString(),
    binary,
    binaryGrouped: binary.replace(/(.{4})(?!$)/g, '$1 '),
    octal: unsigned.toString(8),
    hex,
    hexGrouped: bytes.join(' '),
    bytesBigEndian: bytes.join(' '),
    bytesLittleEndian: [...bytes].reverse().join(' '),
    setBits,
    powerSum: setBits.length ? setBits.map(b => `2^${b}`).join(' + ') : '0',
    popCount: setBits.length,
    overflow,
    range: { unsignedMax: max.toString(), signedMin: signedMin.toString(), signedMax: signedMax.toString() }
  };
}

// ==================== Data units ====================

const DATA_UNITS = [
  { key: 'bit', bits: 1 },
  { key: 'B', bits: 8 },
  { key: 'kb', bits: 1e3 },
  { key: 'kB', bits: 8e3 },
  { key: 'KiB', bits: 8 * 1024 },
  { key: 'Mb', bits: 1e6 },
  { key: 'MB', bits: 8e6 },
  { key: 'MiB', bits: 8 * 1024 ** 2 },
  { key: 'Gb', bits: 1e9 },
  { key: 'GB', bits: 8e9 },
  { key: 'GiB', bits: 8 * 1024 ** 3 },
  { key: 'Tb', bits: 1e12 },
  { key: 'TB', bits: 8e12 },
  { key: 'TiB', bits: 8 * 1024 ** 4 },
  { key: 'PB', bits: 8e15 },
  { key: 'PiB', bits: 8 * 1024 ** 5 }
];

function convertData(value, fromKey) {
  const v = Number(value);
  const from = DATA_UNITS.find(u => u.key === fromKey);
  if (!Number.isFinite(v) || v < 0 || !from) throw new CalcError('ERR_INVALID_ARG');
  const bits = v * from.bits;
  return DATA_UNITS.map(u => ({ key: u.key, value: bits / u.bits }));
}

/**
 * Time to transfer `size` (in sizeUnit) over a link of `rate` (in rateUnit per second), in seconds.
 */
function transferTime(size, sizeUnit, rate, rateUnit) {
  const s = DATA_UNITS.find(u => u.key === sizeUnit);
  const r = DATA_UNITS.find(u => u.key === rateUnit);
  const sizeBits = Number(size) * (s ? s.bits : NaN);
  const rateBits = Number(rate) * (r ? r.bits : NaN);
  if (!Number.isFinite(sizeBits) || !Number.isFinite(rateBits) || sizeBits < 0 || rateBits <= 0) throw new CalcError('ERR_INVALID_ARG');
  return sizeBits / rateBits;
}

function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '—';
  if (totalSeconds < 1) return `${(totalSeconds * 1000).toFixed(totalSeconds < 0.01 ? 3 : 1)} ms`;
  let rest = Math.round(totalSeconds);
  const d = Math.floor(rest / 86400); rest %= 86400;
  const h = Math.floor(rest / 3600); rest %= 3600;
  const m = Math.floor(rest / 60);
  const sec = rest % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}min`);
  if (sec || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

// ==================== Text encodings ====================

function utf8Bytes(text) {
  return Array.from(new TextEncoder().encode(String(text)));
}

function bytesToText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch (_) {
    throw new CalcError('ERR_IT_TEXT');
  }
}

function encodeText(text) {
  const bytes = utf8Bytes(text);
  let binaryStr = '';
  bytes.forEach(b => { binaryStr += String.fromCharCode(b); });
  return {
    hex: bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
    binary: bytes.map(b => b.toString(2).padStart(8, '0')).join(' '),
    decimal: bytes.join(' '),
    base64: btoa(binaryStr),
    url: encodeURIComponent(String(text)),
    codePoints: Array.from(String(text)).map(ch => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' '),
    byteLength: bytes.length,
    charLength: Array.from(String(text)).length
  };
}

function decodeText(input, format) {
  const s = String(input || '').trim();
  if (format === 'hex') {
    const clean = s.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
    if (!/^([0-9a-fA-F]{2})*$/.test(clean)) throw new CalcError('ERR_IT_HEX');
    return bytesToText(clean.match(/.{2}/g)?.map(h => parseInt(h, 16)) || []);
  }
  if (format === 'binary') {
    const groups = s.split(/[\s,]+/).filter(Boolean);
    if (groups.some(g => !/^[01]{1,8}$/.test(g))) throw new CalcError('ERR_INVALID_BASE_DIGIT');
    return bytesToText(groups.map(g => parseInt(g, 2)));
  }
  if (format === 'decimal') {
    const groups = s.split(/[\s,]+/).filter(Boolean).map(Number);
    if (groups.some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new CalcError('ERR_INVALID_ARG');
    return bytesToText(groups);
  }
  if (format === 'base64') {
    let raw;
    try {
      raw = atob(s.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/'));
    } catch (_) {
      throw new CalcError('ERR_IT_BASE64');
    }
    return bytesToText(Array.from(raw, ch => ch.charCodeAt(0)));
  }
  if (format === 'url') {
    try {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    } catch (_) {
      throw new CalcError('ERR_IT_TEXT');
    }
  }
  throw new CalcError('ERR_INVALID_ARG');
}

// ==================== Unix time ====================

function unixToDate(input) {
  const n = Number(String(input).trim());
  if (!Number.isFinite(n)) throw new CalcError('ERR_IT_DATE');
  // 13+ digit values are treated as milliseconds
  const ms = Math.abs(n) >= 1e11 ? n : n * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) throw new CalcError('ERR_IT_DATE');
  return { date, ms, seconds: Math.floor(ms / 1000), iso: date.toISOString(), unit: Math.abs(n) >= 1e11 ? 'ms' : 's' };
}

function dateToUnix(input) {
  const date = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(date.getTime())) throw new CalcError('ERR_IT_DATE');
  return { seconds: Math.floor(date.getTime() / 1000), ms: date.getTime(), iso: date.toISOString() };
}

// ==================== Colors ====================

function parseColor(input) {
  const s = String(input || '').trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return colorInfo((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  m = s.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/) || s.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/);
  if (m) {
    const [r, g, b] = m.slice(1, 4).map(Number);
    if ([r, g, b].some(v => v > 255)) throw new CalcError('ERR_IT_COLOR');
    return colorInfo(r, g, b);
  }
  m = s.match(/^hsla?\(\s*(-?[\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/);
  if (m) {
    const [r, g, b] = hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
    return colorInfo(r, g, b);
  }
  throw new CalcError('ERR_IT_COLOR');
}

function hslToRgb(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}

function colorInfo(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    decimal: (r << 16) + (g << 8) + b,
    r, g, b,
    contrastWhite: (1.05 / (luminance + 0.05)),
    contrastBlack: ((luminance + 0.05) / 0.05)
  };
}

// ==================== Unix permissions (chmod) ====================

function parsePermissions(input) {
  const s = String(input || '').trim();
  let octal;
  if (/^[0-7]{3,4}$/.test(s)) {
    octal = s.slice(-3);
  } else {
    const sym = s.length === 10 && /^[-dlcbps]/.test(s) ? s.slice(1) : s; // accepts ls -l style with a type char
    if (!/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(sym)) throw new CalcError('ERR_IT_CHMOD');
    octal = [0, 3, 6].map(i => (sym[i] === 'r' ? 4 : 0) + (sym[i + 1] === 'w' ? 2 : 0) + (sym[i + 2] === 'x' ? 1 : 0)).join('');
  }
  const digits = octal.split('').map(Number);
  const symbolic = digits.map(d => `${d & 4 ? 'r' : '-'}${d & 2 ? 'w' : '-'}${d & 1 ? 'x' : '-'}`).join('');
  const matrix = digits.map(d => ({ read: Boolean(d & 4), write: Boolean(d & 2), execute: Boolean(d & 1) }));
  return { octal, symbolic, command: `chmod ${octal}`, matrix };
}

function permissionsFromMatrix(matrix) {
  return matrix.map(p => (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0)).join('');
}

export {
  parseIPv4,
  ipv4ToString,
  prefixToMask,
  maskToPrefix,
  cidrInfo,
  splitSubnets,
  prefixForHosts,
  expandIPv6,
  compressIPv6,
  ipv6Info,
  WORD_SIZES,
  parseInteger,
  wordInfo,
  DATA_UNITS,
  convertData,
  transferTime,
  formatDuration,
  encodeText,
  decodeText,
  unixToDate,
  dateToUnix,
  parseColor,
  parsePermissions,
  permissionsFromMatrix
};
