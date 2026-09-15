import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP = path.join(ROOT, 'app');
const MIN_PX = 12;

// Legacy CSS files are centrally overridden by accessibility.css/admin-accessibility.css.
// This list is an explicit migration register, not a blanket exemption. New CSS files are checked.
// Remove entries as their internal pixel values are migrated to shared type tokens.
const LEGACY_CSS_ALLOWLIST = new Set([
  'app/globals.css',
  'app/books.css',
  'app/admin/admin.module.css',
  'app/workspace/tools.module.css',
  'app/workspace/[section]/section.module.css',
  'app/workspace/_components/pathway-workspace.module.css',
  'app/resources/resources.module.css',
  'app/workspace/appointments/appointments.module.css',
  'app/workspace/housing/housing.module.css',
  'app/workspace/messages/messages.module.css',
  'app/workspace/plan/plan.module.css',
  'app/workspace/whenua/whenua.module.css',
]);

const sourceExtensions = new Set(['.tsx', '.ts', '.jsx', '.js', '.css']);
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (sourceExtensions.has(path.extname(entry.name))) inspect(full);
  }
}

function inspect(file) {
  const relative = path.relative(ROOT, file).replaceAll('\\', '/');
  const extension = path.extname(file);
  if (extension === '.css' && LEGACY_CSS_ALLOWLIST.has(relative)) return;

  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const checks = [
      ...line.matchAll(/fontSize\s*:\s*(\d+(?:\.\d+)?)/g),
      ...line.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi),
    ];
    for (const match of checks) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value < MIN_PX) {
        failures.push(`${relative}:${index + 1} uses ${value}px text`);
      }
    }
  });
}

walk(APP);

if (failures.length) {
  console.error(`\nTypography governance check failed. UI text must not be smaller than ${MIN_PX}px.\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nUse the shared typography tokens in app/accessibility.css, or document a reviewed exception.\n');
  process.exit(1);
}

console.log(`Typography governance check passed: no unapproved source UI text below ${MIN_PX}px.`);
