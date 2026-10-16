import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseIPv4,
  maskToPrefix,
  cidrInfo,
  splitSubnets,
  prefixForHosts,
  expandIPv6,
  compressIPv6,
  ipv6Info,
  parseInteger,
  wordInfo,
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
} from '../js/tools/it-tools.js';

const code = (expected) => (err) => err.code === expected;

test('IT: IPv4 parsing and mask validation', () => {
  assert.equal(parseIPv4('192.168.1.10'), 3232235786);
  assert.throws(() => parseIPv4('256.1.1.1'), code('ERR_IT_IP'));
  assert.throws(() => parseIPv4('10.0.0'), code('ERR_IT_IP'));
  assert.equal(maskToPrefix('255.255.255.0'), 24);
  assert.equal(maskToPrefix('255.255.240.0'), 20);
  assert.equal(maskToPrefix('0.0.0.0'), 0);
  assert.throws(() => maskToPrefix('255.0.255.0'), code('ERR_IT_MASK'));
});

test('IT: CIDR subnet calculation (/24, /26, /31, /32 and mask notation)', () => {
  const c24 = cidrInfo('192.168.1.10/24');
  assert.equal(c24.network, '192.168.1.0');
  assert.equal(c24.broadcast, '192.168.1.255');
  assert.equal(c24.mask, '255.255.255.0');
  assert.equal(c24.wildcard, '0.0.0.255');
  assert.equal(c24.firstHost, '192.168.1.1');
  assert.equal(c24.lastHost, '192.168.1.254');
  assert.equal(c24.usableHosts, 254);
  assert.equal(c24.ipClass, 'C');
  assert.equal(c24.scope, 'private');
  assert.equal(c24.binary.mask, '11111111.11111111.11111111.00000000');

  const c26 = cidrInfo('10.20.30.77 255.255.255.192');
  assert.equal(c26.cidr, '10.20.30.64/26');
  assert.equal(c26.broadcast, '10.20.30.127');
  assert.equal(c26.usableHosts, 62);

  assert.equal(cidrInfo('203.0.113.4/31').usableHosts, 2);
  assert.equal(cidrInfo('8.8.8.8').usableHosts, 1);
  assert.equal(cidrInfo('8.8.8.8').scope, 'public');
  assert.equal(cidrInfo('100.64.1.1/10').scope, 'cgnat');
  assert.equal(cidrInfo('0.0.0.0/0').totalAddresses, 4294967296);
  assert.throws(() => cidrInfo('10.0.0.1/33'), code('ERR_IT_PREFIX'));
});

test('IT: subnet splitting and sizing by host count', () => {
  const split = splitSubnets('192.168.0.0/24', 26);
  assert.equal(split.count, 4);
  assert.deepEqual(split.rows.map(r => r.cidr), ['192.168.0.0/26', '192.168.0.64/26', '192.168.0.128/26', '192.168.0.192/26']);
  assert.equal(split.rows[1].lastHost, '192.168.0.126');
  assert.equal(splitSubnets('10.0.0.0/8', 24, 10).truncated, true);
  assert.equal(prefixForHosts(50), 26);
  assert.equal(prefixForHosts(254), 24);
  assert.equal(prefixForHosts(255), 23);
});

test('IT: IPv6 expand, compress and prefix information', () => {
  assert.equal(expandIPv6('2001:db8::1'), '2001:0db8:0000:0000:0000:0000:0000:0001');
  assert.equal(compressIPv6('2001:0db8:0000:0000:0001:0000:0000:0001'), '2001:db8::1:0:0:1');
  assert.equal(compressIPv6('::'), '::');
  assert.equal(compressIPv6('::ffff:192.168.0.1'), '::ffff:c0a8:1');
  assert.throws(() => expandIPv6('2001::db8::1'), code('ERR_IT_IPV6'));
  const info = ipv6Info('2001:db8:abcd:12::99/64');
  assert.equal(info.network, '2001:db8:abcd:12::/64');
  assert.equal(info.lastAddress, '2001:db8:abcd:12:ffff:ffff:ffff:ffff');
  assert.equal(info.totalAddresses, '18446744073709551616');
  assert.equal(info.scope, 'documentation');
  assert.equal(ipv6Info('fe80::1').scope, 'linkLocal');
});

test('IT: bases, bit weights and machine words', () => {
  assert.equal(parseInteger('0xFF', 16), 255n);
  assert.equal(parseInteger('1010 0001', 2), 161n);
  assert.throws(() => parseInteger('12', 2), code('ERR_INVALID_BASE_DIGIT'));

  const one = wordInfo(1n, 8);
  assert.equal(one.binary, '00000001');
  assert.equal(one.powerSum, '2^0');
  const two = wordInfo(2n, 8);
  assert.equal(two.binary, '00000010');
  assert.equal(two.powerSum, '2^1');

  const w = wordInfo(130n, 8);
  assert.equal(w.powerSum, '2^7 + 2^1');
  assert.equal(w.signed, '-126');
  assert.equal(w.hex, '82');

  const neg = wordInfo(-1n, 16);
  assert.equal(neg.unsigned, '65535');
  assert.equal(neg.hex, 'FFFF');
  assert.equal(neg.wordName, 'WORD');

  const dword = wordInfo(0x12345678n, 32);
  assert.equal(dword.bytesBigEndian, '12 34 56 78');
  assert.equal(dword.bytesLittleEndian, '78 56 34 12');
  assert.equal(wordInfo(300n, 8).overflow, true);
  assert.equal(wordInfo(2n ** 64n - 1n, 64).signed, '-1');
});

test('IT: data units (SI vs IEC) and transfer time', () => {
  const fromGiB = Object.fromEntries(convertData(1, 'GiB').map(u => [u.key, u.value]));
  assert.equal(fromGiB.B, 1073741824);
  assert.equal(fromGiB.MiB, 1024);
  assert.equal(fromGiB.bit, 8589934592);
  const fromByte = Object.fromEntries(convertData(1, 'B').map(u => [u.key, u.value]));
  assert.equal(fromByte.bit, 8);
  // 1 GB over 100 Mb/s = 80 s
  assert.equal(transferTime(1, 'GB', 100, 'Mb'), 80);
  assert.equal(formatDuration(3725), '1h 2min 5s');
  assert.equal(formatDuration(0.5), '500.0 ms');
});

test('IT: text encodings round-trip (UTF-8, hex, binary, Base64, URL)', () => {
  const enc = encodeText('Olá!');
  assert.equal(enc.hex, '4F 6C C3 A1 21');
  assert.equal(enc.base64, 'T2zDoSE=');
  assert.equal(enc.byteLength, 5);
  assert.equal(enc.charLength, 4);
  assert.equal(decodeText('4F 6C C3 A1 21', 'hex'), 'Olá!');
  assert.equal(decodeText(enc.binary, 'binary'), 'Olá!');
  assert.equal(decodeText('T2zDoSE=', 'base64'), 'Olá!');
  assert.equal(decodeText('a%20b%26c', 'url'), 'a b&c');
  assert.equal(decodeText('72 105', 'decimal'), 'Hi');
  assert.throws(() => decodeText('ZZ', 'hex'), code('ERR_IT_HEX'));
});

test('IT: Unix timestamps in seconds and milliseconds', () => {
  assert.equal(unixToDate(0).iso, '1970-01-01T00:00:00.000Z');
  assert.equal(unixToDate(1700000000).iso, '2023-11-14T22:13:20.000Z');
  assert.equal(unixToDate('1700000000000').unit, 'ms');
  assert.equal(dateToUnix('2023-11-14T22:13:20Z').seconds, 1700000000);
  assert.throws(() => dateToUnix('not a date'), code('ERR_IT_DATE'));
});

test('IT: color conversions HEX / RGB / HSL', () => {
  const c = parseColor('#38bdf8');
  assert.equal(c.rgb, 'rgb(56, 189, 248)');
  assert.equal(c.hsl, 'hsl(198, 93%, 60%)');
  assert.equal(parseColor('rgb(255, 0, 0)').hex, '#FF0000');
  assert.equal(parseColor('hsl(120, 100%, 50%)').hex, '#00FF00');
  assert.equal(parseColor('fff').decimal, 16777215);
  assert.throws(() => parseColor('blue-ish'), code('ERR_IT_COLOR'));
});

test('IT: Unix permissions octal <-> symbolic', () => {
  assert.equal(parsePermissions('755').symbolic, 'rwxr-xr-x');
  assert.equal(parsePermissions('rw-r--r--').octal, '644');
  assert.equal(parsePermissions('-rwxr-x---').octal, '750');
  assert.equal(permissionsFromMatrix(parsePermissions('640').matrix), '640');
  assert.throws(() => parsePermissions('rwz'), code('ERR_IT_CHMOD'));
});
