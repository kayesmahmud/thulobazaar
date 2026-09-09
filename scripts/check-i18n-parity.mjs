#!/usr/bin/env node
/**
 * Every user-facing English string must ship with its Nepali translation.
 *
 * Compares the key sets of each en/ne pair. Exits 2 (with the offending keys on
 * stderr) when they drift, so the Claude Code Stop hook in .claude/settings.json
 * feeds the failure back and the gap gets closed in the same turn instead of
 * shipping a half-translated screen.
 *
 * Run manually: npm run check:i18n
 */
import { readFileSync } from 'node:fs';

const PAIRS = [
  { name: 'mobile', en: 'apps/mobile/assets/translations/en.json', ne: 'apps/mobile/assets/translations/ne.json' },
  { name: 'web', en: 'apps/web/messages/en.json', ne: 'apps/web/messages/ne.json' },
];

function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, out);
    else out.add(path);
  }
  return out;
}

/**
 * Values that are *supposed* to be identical in both locales:
 * - keys ending in `Latin` — romanized Nepali, for readers who don't read Devanagari
 * - contact details and links — an email address has no translation
 * - phone numbers AND phone input masks (98XXXXXXXX) — a dialling pattern
 *   must match the Latin digits the numeric keypad actually produces
 */
const LOCALE_INVARIANT_KEY = /Latin$/;
const LOCALE_INVARIANT_VALUE = /^(https?:\/\/|[\w.+-]+@[\w-]+\.[\w.]+$|\+?\d[\dXx\s-]*$)/;

/** A value copied verbatim from English is a missing translation wearing a disguise. */
function untranslated(en, ne, prefix = '', out = []) {
  for (const [key, value] of Object.entries(en)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const other = ne?.[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      untranslated(value, other, path, out);
      continue;
    }
    if (typeof value !== 'string' || value !== other) continue;
    if (LOCALE_INVARIANT_KEY.test(key) || LOCALE_INVARIANT_VALUE.test(value.trim())) continue;
    // Require real words: brand names and bare punctuation legitimately match.
    if (/[a-z]{4}/i.test(value)) out.push(path);
  }
  return out;
}

/**
 * `--hook` is the Stop-hook contract: Claude only sees the reason when it comes
 * back as hookSpecificOutput JSON on stdout (a bare exit 2 blocks the turn but
 * shows nothing, which would spin without telling anyone why). Plain runs keep
 * human output + exit 2 so npm and CI behave normally.
 */
const HOOK_MODE = process.argv.includes('--hook');
const problems = [];
const say = (line) => (HOOK_MODE ? problems.push(line) : console.error(line));

let failed = false;

for (const pair of PAIRS) {
  let en, ne;
  try {
    en = JSON.parse(readFileSync(pair.en, 'utf8'));
    ne = JSON.parse(readFileSync(pair.ne, 'utf8'));
  } catch (error) {
    say(`i18n: cannot read ${pair.name} translations — ${error.message}`);
    failed = true;
    continue;
  }

  const enKeys = flatten(en);
  const neKeys = flatten(ne);
  const missing = [...enKeys].filter((k) => !neKeys.has(k)).sort();
  const orphaned = [...neKeys].filter((k) => !enKeys.has(k)).sort();
  const copied = untranslated(en, ne).sort();

  if (missing.length) {
    failed = true;
    say(`i18n [${pair.name}]: ${missing.length} key(s) in en.json with no Nepali in ${pair.ne}:`);
    for (const key of missing.slice(0, 25)) say(`  - ${key}`);
    if (missing.length > 25) say(`  …and ${missing.length - 25} more`);
  }
  if (orphaned.length) {
    failed = true;
    say(`i18n [${pair.name}]: ${orphaned.length} key(s) in ne.json with no English counterpart:`);
    for (const key of orphaned.slice(0, 25)) say(`  - ${key}`);
  }
  if (copied.length) {
    failed = true;
    say(`i18n [${pair.name}]: ${copied.length} Nepali value(s) still identical to the English:`);
    for (const key of copied.slice(0, 25)) say(`  - ${key}`);
    if (copied.length > 25) say(`  …and ${copied.length - 25} more`);
  }
  if (!missing.length && !orphaned.length && !copied.length && !HOOK_MODE) {
    console.log(`i18n [${pair.name}]: ${enKeys.size} keys, en/ne in sync`);
  }
}

if (!failed) process.exit(0);

if (!HOOK_MODE) {
  console.error('\nAdd the Nepali strings before finishing. Both locales ship together.');
  process.exit(2);
}

// Loop guard: if we already blocked once this turn and the gap is still there,
// say so and let the turn end rather than trapping it.
let alreadyBlocked = false;
try {
  // Only read when something is piped in: on a TTY this would block forever.
  const payload = process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
  alreadyBlocked = JSON.parse(payload || '{}').stop_hook_active === true;
} catch {
  /* no payload on stdin — treat as a first pass */
}

const reason =
  'Untranslated user-facing strings. Every English string ships with its Nepali ' +
  'counterpart (mobile: apps/mobile/assets/translations, web: apps/web/messages).\n\n' +
  problems.join('\n') +
  '\n\nAdd the missing Nepali, then finish.';

if (alreadyBlocked) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: `i18n parity is still failing — flag it to the user rather than retrying.\n${problems.join('\n')}`,
    },
  }));
  process.exit(0);
}

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'Stop',
    permissionDecision: 'block',
    permissionDecisionReason: reason,
  },
}));
process.exit(0);
