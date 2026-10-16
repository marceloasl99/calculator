// Captures the README screenshots with headless Chrome over the DevTools Protocol.
// Starts the local server itself, fails on any page error, and writes PNGs to assets/screenshots/.
// Usage: npm run screenshots   (set CHROME_PATH if Chrome is not in a default location)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const screenshotsDir = path.join(rootDir, 'assets', 'screenshots');
const PORT = 4180;
const CDP_PORT = 9333;
const BASE = `http://localhost:${PORT}/index.html`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Seeds a realistic history so the gallery does not show empty panels.
const SEED_HISTORY = `
  ['1250 + 15%', 'r = 2.5', 'π r^2', '√(3^2 + 4^2)', 'nCr(10; 3)', 'log10(2^64)', 'sin(30) + 2^3']
    .forEach(e => { scpApp.setExpression(e); scpApp.calculate(); });
`;

const SCENES = [
  {
    file: 'v2-desktop-hero.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=intermediate&theme=ocean&lang=pt-BR',
    setup: `${SEED_HISTORY} scpApp.setExpression('2π r + 3!'); document.getElementById('calc-expression-input').dispatchEvent(new Event('input'));`
  },
  {
    file: 'v2-graph-lab.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=expert&theme=ocean&lang=en&expertTab=graph',
    setup: `
      document.getElementById('graph-fn-1').value = 'sin(x) * 3';
      document.getElementById('graph-fn-2').value = 'x^2/8 - 3';
      document.getElementById('graph-fn-3').value = '2cos(x/2) + 1';
      scpApp.setExpression('nthRoot(27; 3) × e'); scpApp.calculate();
      scpApp.runGraphTool();`,
    hover: { selector: '#graph-canvas', x: 0.62, y: 0.42 }
  },
  {
    file: 'v2-finance-lab.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=expert&theme=aurora&lang=pt-BR&expertTab=finance',
    setup: `
      document.getElementById('fin-principal').value = 250000;
      document.getElementById('fin-rate').value = 0.85;
      document.getElementById('fin-periods').value = 120;
      scpApp.setExpression('250000 × 0,85%'); scpApp.calculate();
      scpApp.runFinanceTool('price');`
  },
  {
    file: 'v2-statistics-light.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=expert&theme=light&lang=en&expertTab=statistics',
    setup: `
      document.getElementById('stats-input-x').value = '12, 15, 15, 18, 19, 21, 21, 21, 24, 26, 27, 30, 31, 33, 38';
      document.getElementById('stats-input-y').value = '30, 34, 36, 40, 41, 45, 44, 47, 52, 55, 57, 60, 63, 66, 74';
      document.getElementById('btn-run-stats').click();
      scpApp.setExpression('mean = 23.4'); scpApp.calculate();`
  },
  {
    file: 'v2-constants-sunset.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=intermediate&theme=sunset&lang=en&tab=library',
    setup: `
      ['m = 0.145', 'v = 40', 'E = m v^2 / 2', 'lambda = h / (m v)'].forEach(e => { scpApp.setExpression(e); scpApp.calculate(); });
      scpApp.setExpression('E / qe'); document.getElementById('calc-expression-input').dispatchEvent(new Event('input'));
      scpApp.setSideTab('library');`
  },
  {
    file: 'v2-mobile-calculator.png',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
    query: 'mode=intermediate&theme=purple&lang=pt-BR',
    setup: `${SEED_HISTORY} scpApp.setExpression('sin(45)^2 + cos(45)^2'); scpApp.calculate();`
  },
  {
    file: 'v2-mobile-graph.png',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
    query: 'mode=expert&theme=emerald&lang=en&expertTab=graph&view=expert',
    setup: `
      document.getElementById('graph-fn-1').value = 'x^3/10 - x';
      document.getElementById('graph-fn-2').value = 'tanh(x) * 2';
      document.getElementById('graph-fn-3').value = '';
      scpApp.setMobileView('expert');
      scpApp.runGraphTool();`
  },
  {
    file: 'v2-tests-modal.png',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
    query: 'mode=intermediate&theme=dark&lang=en&tests=1',
    setup: ''
  }
];

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Google Chrome not found. Set CHROME_PATH to its executable.');
  return found;
}

async function waitFor(url, retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function run() {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const server = spawn(process.execPath, [path.join(rootDir, 'serve.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scp-capture-'));
  const chrome = spawn(findChrome(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    'about:blank'
  ]);

  const pageErrors = [];
  try {
    await waitFor(`http://localhost:${PORT}/index.html`);
    await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const pages = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = pages.find((p) => p.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let nextId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        pageErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)/.test(msg.params.entry.url || '')) {
        pageErrors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      return res.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    for (const scene of SCENES) {
      console.log(`Capturing ${scene.file} ...`);
      await send('Emulation.setDeviceMetricsOverride', scene.viewport);
      await send('Emulation.setTouchEmulationEnabled', { enabled: scene.viewport.mobile });
      // Fresh state for every scene
      await send('Page.navigate', { url: `${BASE}?reset=1` });
      await sleep(400);
      await evaluate('localStorage.clear(); true');
      await send('Page.navigate', { url: `${BASE}?${scene.query}` });
      await sleep(900);
      await evaluate('document.fonts.ready.then(() => true)');
      if (scene.setup) await evaluate(`(() => { ${scene.setup}; return true; })()`);
      await evaluate("document.activeElement && document.activeElement.blur(); document.getElementById('scp-toast').classList.add('hidden'); window.scrollTo(0, 0); true");
      await sleep(500);
      if (scene.hover) {
        const box = await evaluate(`(() => { const r = document.querySelector('${scene.hover.selector}').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + box.w * scene.hover.x, y: box.y + box.h * scene.hover.y });
        await sleep(250);
      }
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(screenshotsDir, scene.file), Buffer.from(shot.data, 'base64'));
    }

    ws.close();
    if (pageErrors.length) {
      throw new Error(`Page reported errors:\n${pageErrors.join('\n')}`);
    }
    console.log(`Captured ${SCENES.length} screenshots into assets/screenshots/`);
  } finally {
    chrome.kill('SIGKILL');
    server.kill();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err.message || err);
  process.exit(1);
});
