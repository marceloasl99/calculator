import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('index.html contains all essential UI container IDs', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const requiredIds = [
    'scp-app-shell',
    'scp-app-title',
    'scp-app-subtitle',
    'select-locale',
    'select-theme',
    'select-viewport',
    'badge-active-mode',
    'badge-active-angle',
    'badge-memory-val',
    'badge-ans-val',
    'btn-toggle-fraction',
    'btn-toggle-sci',
    'calc-expression-input',
    'calc-result-display',
    'calc-fraction-badge',
    'calc-error-banner',
    'scp-scientific-keypad',
    'key-decimal-sep',
    'panel-history',
    'panel-expert',
    'tab-btn-history',
    'tab-btn-expert',
    'input-history-search',
    'history-list-container',
    'btn-clear-history',
    'scp-toast',
    'modal-tests',
    'modal-prompt',
    'modal-settings',
    'modal-help'
  ];

  for (const id of requiredIds) {
    assert.ok(
      html.includes(`id="${id}"`),
      `Expected element with id="${id}" in index.html`
    );
  }
});

test('no source JS file uses eval() or new Function() to execute math expressions', () => {
  const jsDir = path.join(rootDir, 'js');
  const files = [];

  function collect(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) collect(full);
      else if (full.endsWith('.js')) files.push(full);
    }
  }

  collect(jsDir);
  assert.ok(files.length >= 10, 'Must have modular JS files');

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    // Ensure no eval(...) or new Function(...)
    assert.ok(!/\beval\s*\(/.test(code), `Forbidden eval() call in ${file}`);
    assert.ok(!/new\s+Function\s*\(/.test(code), `Forbidden new Function() call in ${file}`);
  }
});

test('manifest.json and service-worker.js are valid and offline-ready', () => {
  const manifestPath = path.join(rootDir, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json exists');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'Scientific Calculator Pro');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

  const swPath = path.join(rootDir, 'service-worker.js');
  assert.ok(fs.existsSync(swPath), 'service-worker.js exists');
  const swCode = fs.readFileSync(swPath, 'utf8');
  assert.ok(swCode.includes('PRECACHE_ASSETS'), 'Service worker must specify precache assets');
  assert.ok(swCode.includes('caches.match'), 'Service worker must handle fetch from cache');

  const iconPath = path.join(rootDir, manifest.icons[0].src);
  assert.ok(fs.existsSync(iconPath), `Icon exists at ${iconPath}`);
});

test('all 8 theme selectors exist in css/themes.css', () => {
  const themesCssPath = path.join(rootDir, 'css', 'themes.css');
  assert.ok(fs.existsSync(themesCssPath));
  const css = fs.readFileSync(themesCssPath, 'utf8');

  const themes = ['ocean', 'light', 'dark', 'graphite', 'purple', 'emerald', 'high-contrast', 'auto'];
  for (const theme of themes) {
    assert.ok(css.includes(theme), `css/themes.css must define theme: ${theme}`);
  }
});
