// Regenerates the TRANSLATIONS table in js/i18n.js from locales/*.json,
// so the JSON files stay the single source of truth for all six languages.
// Usage: npm run sync-locales
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'es', 'pt-BR', 'it', 'fr', 'de'];

const translations = {};
for (const loc of LOCALES) {
  translations[loc] = JSON.parse(fs.readFileSync(path.join(rootDir, 'locales', `${loc}.json`), 'utf8'));
}

const i18nPath = path.join(rootDir, 'js', 'i18n.js');
const source = fs.readFileSync(i18nPath, 'utf8');
const start = source.indexOf('const TRANSLATIONS = ');
const end = source.indexOf('\n};\n', start);
if (start === -1 || end === -1) {
  throw new Error('Could not locate the TRANSLATIONS literal in js/i18n.js');
}

const literal = 'const TRANSLATIONS = ' + JSON.stringify(translations, null, 2).slice(0, -2) + '\n};\n';
const updated = source.slice(0, start) + literal + source.slice(end + 4);
fs.writeFileSync(i18nPath, updated);
console.log(`js/i18n.js synchronized from ${LOCALES.length} locale files.`);
