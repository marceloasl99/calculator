import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'assets', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-cdp-' + Date.now());

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForWsUrl(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (_) {}
    await sleep(250);
  }
  throw new Error('Could not connect to Chrome debugging port.');
}

async function run() {
  try {
    const wsUrl = await waitForWsUrl();
    console.log('Connected to Chrome CDP:', wsUrl);

    // Get existing target/page or create one
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const page = pages.find((p) => p.type === 'page') || pages[0];
    const pageWsUrl = page.webSocketDebuggerUrl;

    const ws = new WebSocket(pageWsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        callbacks.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:4173' });
    await sleep(2000);

    // 1. Screenshot Desktop Intermediate
    console.log('Capturing Desktop Intermediate screenshot...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-mode-select="intermediate"]').click();
        const input = document.getElementById('calc-expression-input');
        input.value = 'sin(30) + 2^3';
        document.querySelector('[data-calc-action="equals"]').click();
      `
    });
    await sleep(600);
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'calculator-desktop.png'), Buffer.from(shot1.data, 'base64'));

    // 2. Screenshot Desktop Expert (Matrices)
    console.log('Capturing Desktop Expert (Matrices) screenshot...');
    const r2 = await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-mode-select="expert"]').click();
        document.getElementById('tab-btn-expert').click();
        document.querySelector('[data-expert-tab="matrices"]').click();
        document.title;
      `,
      returnByValue: true
    });
    console.log('Evaluate result 2:', JSON.stringify(r2));
    await sleep(600);
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'calculator-expert-matrices.png'), Buffer.from(shot2.data, 'base64'));

    // 3. Screenshot Mobile View
    console.log('Capturing Mobile View screenshot...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 880,
      deviceScaleFactor: 1,
      mobile: true
    });
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-mode-select="simple"]').click();
        const input = document.getElementById('calc-expression-input');
        input.value = '1250 + 15%';
        document.querySelector('[data-calc-action="equals"]').click();
      `
    });
    await sleep(600);
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'calculator-mobile.png'), Buffer.from(shot3.data, 'base64'));

    // 4. Screenshot Automated Tests Modal
    console.log('Capturing Automated Tests Modal screenshot...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Runtime.evaluate', {
      expression: `
        document.querySelector('[data-mode-select="intermediate"]').click();
        document.getElementById('btn-open-tests').click();
        document.getElementById('btn-run-all-tests').click();
      `
    });
    await sleep(800);
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(screenshotsDir, 'calculator-tests-modal.png'), Buffer.from(shot4.data, 'base64'));

    ws.close();
    console.log('All screenshots captured successfully!');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
