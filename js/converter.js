import {
  cidrInfo,
  splitSubnets,
  prefixForHosts,
  ipv6Info,
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
} from './tools/it-tools.js';

// --- js/converter.js ---
/**
 * Scientific Calculator Pro — IT Converter view controller.
 * Every tool recalculates live on input; any result card can be clicked to copy its value.
 */

const IT_TOOLS = ['network', 'bases', 'data', 'text', 'time', 'color', 'chmod'];

function initConverter(ctx) {
  const { t, tf, escapeHtml, num, copyText, translateError, getLocale } = ctx;
  const $ = (id) => document.getElementById(id);
  const root = $('scp-converter');
  if (!root) return null;

  let activeTool = 'network';
  let wordWidth = 8;
  let currentValue = 2n;

  const intFmt = (n) => new Intl.NumberFormat(getLocale()).format(n);
  const bigFmt = (s) => {
    try {
      return new Intl.NumberFormat(getLocale()).format(BigInt(s));
    } catch (_) {
      return s;
    }
  };

  // ---------- shared renderers ----------
  function metrics(items, accent = -1) {
    return `<div class="scp-metrics">${items
      .filter(Boolean)
      .map(([label, value, copyValue], i) => {
        const copy = copyValue !== undefined ? copyValue : value;
        return `<button type="button" class="scp-metric scp-copyable${i === accent ? ' accent' : ''}" data-copy="${escapeHtml(copy)}" title="${escapeHtml(t('labels.copy'))}"><span>${escapeHtml(label)}</span><strong class="scp-mono">${escapeHtml(value)}</strong></button>`;
      })
      .join('')}</div>`;
  }

  function errorBox(err) {
    return `<div class="scp-result-card"><div class="scp-result-error">${escapeHtml(translateError(err))}</div></div>`;
  }

  function setHtml(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
  }

  // ---------- 1. NETWORK ----------
  function renderBinaryRow(label, bits, prefix) {
    let idx = 0;
    const cells = bits.split('').map(ch => {
      if (ch === '.') return '<i class="dot">.</i>';
      const cls = idx++ < prefix ? 'net' : 'host';
      return `<i class="${cls}">${ch}</i>`;
    }).join('');
    return `<div class="scp-bin-row"><span>${escapeHtml(label)}</span><code>${cells}</code></div>`;
  }

  function runNetwork() {
    const input = $('it-cidr').value;
    try {
      const info = cidrInfo(input);
      $('it-prefix').value = info.prefix;
      $('it-prefix-label').textContent = `/${info.prefix}`;
      setHtml('it-net-result', metrics([
        [t('it.network.networkAddr'), info.cidr],
        [t('it.network.mask'), info.mask],
        [t('it.network.wildcard'), info.wildcard],
        [t('it.network.broadcast'), info.broadcast],
        [t('it.network.firstHost'), info.firstHost],
        [t('it.network.lastHost'), info.lastHost],
        [t('it.network.usableHosts'), intFmt(info.usableHosts), String(info.usableHosts)],
        [t('it.network.totalAddresses'), intFmt(info.totalAddresses), String(info.totalAddresses)],
        [t('it.network.ipClass'), info.ipClass],
        [t('it.network.scope'), t(`it.scope.${info.scope}`)],
        [t('it.network.ipDecimal'), String(info.ipDecimal)],
        [t('it.network.ipHex'), info.ipHex]
      ], 0));
      setHtml('it-net-binary', `<div class="scp-bin-legend"><span class="net">■ ${escapeHtml(t('it.network.legendNet'))}</span><span class="host">■ ${escapeHtml(t('it.network.legendHost'))}</span></div>
        ${renderBinaryRow('IP', info.binary.ip, info.prefix)}
        ${renderBinaryRow(t('it.network.mask'), info.binary.mask, info.prefix)}
        ${renderBinaryRow(t('it.network.networkAddr'), info.binary.network, info.prefix)}
        ${renderBinaryRow(t('it.network.broadcast'), info.binary.broadcast, info.prefix)}`);
      const split = $('it-split-prefix');
      if (Number(split.value) < info.prefix) split.value = Math.min(info.prefix + 2, 32);
      runSplit();
    } catch (err) {
      setHtml('it-net-result', errorBox(err));
      setHtml('it-net-binary', '');
      setHtml('it-split-result', '');
    }
  }

  function setPrefix(prefix) {
    const input = $('it-cidr');
    const ip = input.value.trim().split(/[\s/]/)[0] || '0.0.0.0';
    input.value = `${ip}/${prefix}`;
    runNetwork();
  }

  function runSplit() {
    try {
      const res = splitSubnets($('it-cidr').value, Number($('it-split-prefix').value), 256);
      const rows = res.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.cidr}</td><td>${r.firstHost}</td><td>${r.lastHost}</td><td>${r.broadcast}</td><td>${intFmt(r.usableHosts)}</td></tr>`).join('');
      setHtml('it-split-result', `<p class="scp-hint">${escapeHtml(tf('it.network.subnetsCount', { count: intFmt(res.count), size: intFmt(res.size) }))}${res.truncated ? ` · ${escapeHtml(tf('it.network.truncated', { limit: 256 }))}` : ''}</p>
        <div class="scp-table-scroll"><table class="scp-data-table scp-mono"><thead><tr><th>#</th><th>${escapeHtml(t('it.network.subnet'))}</th><th>${escapeHtml(t('it.network.firstHost'))}</th><th>${escapeHtml(t('it.network.lastHost'))}</th><th>${escapeHtml(t('it.network.broadcast'))}</th><th>${escapeHtml(t('it.network.usableHosts'))}</th></tr></thead><tbody>${rows}</tbody></table></div>`);
    } catch (err) {
      setHtml('it-split-result', errorBox(err));
    }
  }

  function runHosts() {
    const value = $('it-hosts').value;
    if (!value) return;
    try {
      setPrefix(prefixForHosts(Number(value)));
    } catch (err) {
      setHtml('it-net-result', errorBox(err));
    }
  }

  function runIPv6() {
    try {
      const info = ipv6Info($('it-ipv6').value);
      setHtml('it-ipv6-result', metrics([
        [t('it.network.compressed'), info.compressed],
        [t('it.network.expanded'), info.expanded],
        [t('it.network.networkAddr'), info.network],
        [t('it.network.firstAddress'), info.firstAddress],
        [t('it.network.lastAddress'), info.lastAddress],
        [t('it.network.totalAddresses'), `${info.totalPower} = ${bigFmt(info.totalAddresses)}`, info.totalAddresses],
        [t('it.network.scope'), t(`it.scope.${info.scope}`)]
      ], 0));
    } catch (err) {
      setHtml('it-ipv6-result', errorBox(err));
    }
  }

  // ---------- 2. BASES & WORDS ----------
  function formatInBase(value, base) {
    if (base === 2) return value.toString(2).padStart(wordWidth, '0');
    if (base === 16) return value.toString(16).toUpperCase();
    return value.toString(base);
  }

  function runBases(fromInput = true) {
    const base = Number($('it-num-base').value);
    if (fromInput) {
      try {
        currentValue = parseInteger($('it-num-input').value, base);
      } catch (err) {
        setHtml('it-num-result', errorBox(err));
        setHtml('it-bit-sum', '');
        return;
      }
    }
    const w = wordInfo(currentValue, wordWidth);
    const unsigned = BigInt(w.unsigned);

    // Bit grid, most significant bit first, grouped by byte
    let grid = '';
    for (let byte = wordWidth / 8 - 1; byte >= 0; byte--) {
      let cells = '';
      for (let bit = byte * 8 + 7; bit >= byte * 8; bit--) {
        const on = (unsigned >> BigInt(bit)) & 1n;
        cells += `<button type="button" class="scp-bit${on ? ' on' : ''}" data-bit="${bit}" title="2^${bit} = ${(1n << BigInt(bit)).toString()}"><b>${on}</b><small>${bit}</small></button>`;
      }
      grid += `<div class="scp-bit-byte">${cells}</div>`;
    }
    setHtml('it-bit-grid', grid);

    const binary = `${w.binaryGrouped}₂`;
    const weights = w.setBits.length > 0 && w.setBits.length <= 8
      ? ` = ${w.setBits.map(b => (1n << BigInt(b)).toString()).join(' + ')}`
      : '';
    const powers = w.setBits.length === 0
      ? '0'
      : w.setBits.length <= 12 ? w.setBits.map(b => `2<sup>${b}</sup>`).join(' + ') : `${w.popCount} bits`;
    setHtml('it-bit-sum', `<span>${escapeHtml(binary)}</span><span>= ${powers}${escapeHtml(w.setBits.length > 1 ? weights : '')}</span><strong>= ${escapeHtml(bigFmt(w.unsigned))}</strong>`);

    setHtml('it-num-result', `${w.overflow ? `<p class="scp-warning">${escapeHtml(tf('it.bases.overflow', { width: wordWidth }))}</p>` : ''}${metrics([
      [`DEC (${t('it.bases.unsigned')})`, w.unsigned],
      [`DEC (${t('it.bases.signed')})`, w.signed],
      ['HEX', `0x${w.hex}`],
      ['OCT', `0o${w.octal}`],
      ['BIN', w.binaryGrouped, w.binary],
      [t('it.bases.bigEndian'), w.bytesBigEndian],
      [t('it.bases.littleEndian'), w.bytesLittleEndian],
      [t('it.bases.popCount'), String(w.popCount)],
      [`${w.wordName} ${t('it.bases.rangeUnsigned')}`, `0 … ${w.range.unsignedMax}`],
      [`${w.wordName} ${t('it.bases.rangeSigned')}`, `${w.range.signedMin} … ${w.range.signedMax}`]
    ], 0)}`);
  }

  function toggleBit(bit) {
    const w = wordInfo(currentValue, wordWidth);
    currentValue = BigInt(w.unsigned) ^ (1n << BigInt(bit));
    $('it-num-input').value = formatInBase(currentValue, Number($('it-num-base').value));
    runBases(false);
  }

  function setWordWidth(width) {
    wordWidth = width;
    root.querySelectorAll('[data-word-width]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-word-width')) === width);
    });
    if (Number($('it-num-base').value) === 2) {
      const w = wordInfo(currentValue, wordWidth);
      $('it-num-input').value = formatInBase(BigInt(w.unsigned), 2);
    }
    runBases();
  }

  function renderPowersTable() {
    const names = { 10: '1 KiB', 16: '64 KiB', 20: '1 MiB', 30: '1 GiB', 32: 'IPv4', 40: '1 TiB', 64: 'QWORD' };
    const exps = [...Array(17).keys(), 20, 24, 30, 31, 32, 40, 48, 63, 64];
    const rows = exps.map(e => {
      const v = 1n << BigInt(e);
      return `<tr><td>2^${e}</td><td>${bigFmt(v.toString())}</td><td>0x${v.toString(16).toUpperCase()}</td><td>${names[e] || ''}</td></tr>`;
    }).join('');
    setHtml('it-powers-table', `<div class="scp-table-scroll"><table class="scp-data-table scp-mono"><thead><tr><th>${escapeHtml(t('it.bases.power'))}</th><th>DEC</th><th>HEX</th><th>${escapeHtml(t('it.bases.name'))}</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  // ---------- 3. DATA UNITS ----------
  function populateDataSelects() {
    const fill = (id, selected) => {
      const sel = $(id);
      if (!sel || sel.options.length) return;
      DATA_UNITS.forEach(u => sel.appendChild(new Option(u.key, u.key)));
      sel.value = selected;
    };
    fill('it-data-unit', 'GB');
    fill('it-tx-size-unit', 'GB');
    fill('it-tx-rate-unit', 'Mb');
  }

  function runData() {
    try {
      const unit = $('it-data-unit').value;
      const list = convertData(Number($('it-data-value').value), unit);
      const row = (u) => `<tr class="${u.key === unit ? 'highlight' : ''}"><td>${u.key}</td><td>${num(u.value)}</td></tr>`;
      const isIec = (k) => k.endsWith('iB');
      const si = list.filter(u => !isIec(u.key)).map(row).join('');
      const iec = list.filter(u => isIec(u.key)).map(row).join('');
      setHtml('it-data-result', `<div class="scp-two-col">
        <div><div class="scp-subhead">${escapeHtml(t('it.data.si'))}</div><table class="scp-data-table scp-mono">${si}</table></div>
        <div><div class="scp-subhead">${escapeHtml(t('it.data.iec'))}</div><table class="scp-data-table scp-mono">${iec}</table></div>
      </div><p class="scp-hint">${escapeHtml(t('it.data.note'))}</p>`);
    } catch (err) {
      setHtml('it-data-result', errorBox(err));
    }
  }

  function runTransfer() {
    try {
      const seconds = transferTime(Number($('it-tx-size').value), $('it-tx-size-unit').value, Number($('it-tx-rate').value), $('it-tx-rate-unit').value);
      setHtml('it-tx-result', metrics([
        [t('it.data.duration'), formatDuration(seconds)],
        [t('it.data.seconds'), new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 3 }).format(seconds)]
      ], 0));
    } catch (err) {
      setHtml('it-tx-result', errorBox(err));
    }
  }

  // ---------- 4. TEXT ----------
  function runText() {
    const text = $('it-text-input').value;
    const enc = encodeText(text);
    const rows = [
      ['Hex', enc.hex],
      ['Binary', enc.binary],
      ['Decimal', enc.decimal],
      ['Base64', enc.base64],
      ['URL', enc.url],
      ['Unicode', enc.codePoints]
    ];
    setHtml('it-text-result', `<p class="scp-hint">${escapeHtml(tf('it.text.counts', { chars: enc.charLength, bytes: enc.byteLength }))}</p>${rows.map(([label, value]) =>
      `<button type="button" class="scp-encode-row scp-copyable" data-copy="${escapeHtml(value)}"><span>${label}</span><code>${escapeHtml(value || '—')}</code></button>`).join('')}`);
  }

  function runDecode() {
    try {
      const text = decodeText($('it-decode-input').value, $('it-decode-format').value);
      setHtml('it-decode-result', `<button type="button" class="scp-encode-row scp-copyable scp-decoded" data-copy="${escapeHtml(text)}"><span>${escapeHtml(t('it.text.decoded'))}</span><code>${escapeHtml(text)}</code></button>`);
    } catch (err) {
      setHtml('it-decode-result', errorBox(err));
    }
  }

  // ---------- 5. TIME ----------
  function relativeTime(ms) {
    const diff = (ms - Date.now()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
    for (const [unit, secs] of units) {
      if (Math.abs(diff) >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit);
    }
    return '';
  }

  function runUnix() {
    try {
      const res = unixToDate($('it-unix-input').value);
      const local = res.date.toLocaleString(getLocale(), { dateStyle: 'full', timeStyle: 'long' });
      setHtml('it-unix-result', metrics([
        [t('it.time.local'), local],
        [t('it.time.utc'), res.iso],
        [t('it.time.seconds'), String(res.seconds)],
        [t('it.time.milliseconds'), String(res.ms)],
        [t('it.time.relative'), relativeTime(res.ms)]
      ], 0));
    } catch (err) {
      setHtml('it-unix-result', errorBox(err));
    }
  }

  function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function runDate() {
    const value = $('it-date-input').value;
    if (!value) {
      setHtml('it-date-result', '');
      return;
    }
    try {
      const res = dateToUnix(new Date(value));
      setHtml('it-date-result', metrics([
        [t('it.time.seconds'), String(res.seconds)],
        [t('it.time.milliseconds'), String(res.ms)],
        [t('it.time.utc'), res.iso]
      ], 0));
    } catch (err) {
      setHtml('it-date-result', errorBox(err));
    }
  }

  function setNow() {
    const now = new Date();
    $('it-unix-input').value = String(Math.floor(now.getTime() / 1000));
    $('it-date-input').value = toLocalInputValue(now);
    runUnix();
    runDate();
  }

  // ---------- 6. COLOR ----------
  function runColor(fromPicker = false) {
    const input = $('it-color-input');
    if (fromPicker) input.value = $('it-color-picker').value;
    try {
      const c = parseColor(input.value);
      $('it-color-picker').value = c.hex.toLowerCase();
      const ratio = (v) => `${v.toFixed(2)}:1 · ${v >= 4.5 ? t('it.color.pass') : t('it.color.fail')}`;
      setHtml('it-color-result', `<div class="scp-swatch" style="background:${c.hex}">
          <span style="color:#fff">Aa ${escapeHtml(ratio(c.contrastWhite))}</span>
          <span style="color:#000">Aa ${escapeHtml(ratio(c.contrastBlack))}</span>
        </div>${metrics([
          ['HEX', c.hex],
          ['RGB', c.rgb],
          ['HSL', c.hsl],
          [t('it.color.decimal'), String(c.decimal)],
          [t('it.color.contrastWhite'), `${c.contrastWhite.toFixed(2)}:1`],
          [t('it.color.contrastBlack'), `${c.contrastBlack.toFixed(2)}:1`]
        ], 0)}`);
    } catch (err) {
      setHtml('it-color-result', errorBox(err));
    }
  }

  // ---------- 7. CHMOD ----------
  function runChmod() {
    try {
      const p = parsePermissions($('it-chmod-input').value);
      const who = ['owner', 'group', 'others'];
      setHtml('it-chmod-matrix', p.matrix.map((row, i) => `<tr><th>${escapeHtml(t(`it.chmod.${who[i]}`))}</th>${['read', 'write', 'execute'].map(k =>
        `<td><input type="checkbox" data-perm-row="${i}" data-perm-key="${k}" ${row[k] ? 'checked' : ''} aria-label="${escapeHtml(t(`it.chmod.${who[i]}`))} ${k}" /></td>`).join('')}</tr>`).join(''));
      setHtml('it-chmod-result', metrics([
        [t('it.chmod.octal'), p.octal],
        [t('it.chmod.symbolic'), p.symbolic],
        [t('it.chmod.command'), `${p.command} file`]
      ], 0));
    } catch (err) {
      setHtml('it-chmod-result', errorBox(err));
    }
  }

  function onPermissionToggle() {
    const matrix = [0, 1, 2].map(i => ({
      read: root.querySelector(`[data-perm-row="${i}"][data-perm-key="read"]`).checked,
      write: root.querySelector(`[data-perm-row="${i}"][data-perm-key="write"]`).checked,
      execute: root.querySelector(`[data-perm-row="${i}"][data-perm-key="execute"]`).checked
    }));
    $('it-chmod-input').value = permissionsFromMatrix(matrix);
    runChmod();
  }

  // ---------- navigation & wiring ----------
  function setTool(tool) {
    activeTool = IT_TOOLS.includes(tool) ? tool : 'network';
    root.querySelectorAll('[data-it-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-it-tool') === activeTool);
    });
    root.querySelectorAll('[data-it-section]').forEach(sec => {
      sec.classList.toggle('hidden', sec.getAttribute('data-it-section') !== activeTool);
    });
  }

  function refresh() {
    populateDataSelects();
    runNetwork();
    runIPv6();
    runBases();
    renderPowersTable();
    runData();
    runTransfer();
    runText();
    runDecode();
    runUnix();
    runDate();
    runColor();
    runChmod();
  }

  root.addEventListener('click', (event) => {
    const toolBtn = event.target.closest('[data-it-tool]');
    if (toolBtn) {
      setTool(toolBtn.getAttribute('data-it-tool'));
      if (ctx.onToolChange) ctx.onToolChange(activeTool);
      return;
    }
    const bitBtn = event.target.closest('[data-bit]');
    if (bitBtn) {
      toggleBit(Number(bitBtn.getAttribute('data-bit')));
      return;
    }
    const widthBtn = event.target.closest('[data-word-width]');
    if (widthBtn) {
      setWordWidth(Number(widthBtn.getAttribute('data-word-width')));
      return;
    }
    const copyEl = event.target.closest('[data-copy]');
    if (copyEl) copyText(copyEl.getAttribute('data-copy'));
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-perm-row]')) onPermissionToggle();
  });

  const on = (id, evt, fn) => $(id)?.addEventListener(evt, fn);
  on('it-cidr', 'input', runNetwork);
  on('it-prefix', 'input', () => setPrefix(Number($('it-prefix').value)));
  on('it-hosts', 'input', runHosts);
  on('it-split-prefix', 'input', runSplit);
  on('it-ipv6', 'input', runIPv6);
  on('it-num-input', 'input', () => runBases());
  on('it-num-base', 'change', () => {
    $('it-num-input').value = formatInBase(BigInt(wordInfo(currentValue, wordWidth).unsigned), Number($('it-num-base').value));
    runBases();
  });
  ['it-data-value', 'it-data-unit'].forEach(id => { on(id, 'input', runData); on(id, 'change', runData); });
  ['it-tx-size', 'it-tx-size-unit', 'it-tx-rate', 'it-tx-rate-unit'].forEach(id => { on(id, 'input', runTransfer); on(id, 'change', runTransfer); });
  on('it-text-input', 'input', runText);
  on('it-decode-input', 'input', runDecode);
  on('it-decode-format', 'change', runDecode);
  on('it-unix-input', 'input', runUnix);
  on('it-unix-now', 'click', setNow);
  on('it-date-input', 'input', runDate);
  on('it-color-input', 'input', () => runColor(false));
  on('it-color-picker', 'input', () => runColor(true));
  on('it-chmod-input', 'input', runChmod);

  setNow();
  setTool(activeTool);

  return {
    setTool,
    getTool: () => activeTool,
    refresh,
    setWordWidth
  };
}

export {
  IT_TOOLS,
  initConverter
};
