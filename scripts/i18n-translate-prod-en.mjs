#!/usr/bin/env node
/**
 * Live-DB: Für alle *_i18n-Felder, in denen EN fehlt oder EN === DE (nicht leer),
 * EN per automatischer Übersetzung (Google Translate client=gtx) setzen.
 *
 * Betrifft: tasks (title, description, article_content, quiz_questions, survey_questions),
 * rewards, locations, contests, teams.
 *
 * Nutzung:
 *   node scripts/i18n-translate-prod-en.mjs              # nur SQL nach stdout
 *   node scripts/i18n-translate-prod-en.mjs --apply    # SQL auf Produktion ausführen
 *   node scripts/i18n-translate-prod-en.mjs --cache=./cache.json  # Übersetzungen cachen
 *
 * Env: PROD_SSH_HOST (default root@87.106.86.203), optional PROD_SSH_USER, PROD_SSH
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const CACHE = process.argv.find((a) => a.startsWith('--cache='))?.split('=')[1] || '';
const SSH =
  process.env.PROD_SSH ||
  `${process.env.PROD_SSH_USER || 'root'}@${process.env.PROD_SSH_HOST || '87.106.86.203'}`;
const CHUNK = 3800;
const DELAY_MS = 180;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function needsEn(de, en) {
  const d = (de ?? '').trim();
  const e = (en ?? '').trim();
  if (!d) return false;
  return !e || e === d;
}

function fetchPayload() {
  const sql = readFileSync(join(__dirname, 'i18n-prod-export.sql'), 'utf8');
  const r = spawnSync(
    'ssh',
    [
      '-o',
      'BatchMode=yes',
      '-o',
      'StrictHostKeyChecking=no',
      SSH,
      `DEPLOY_DIR=$( [ -d /root/4rest ] && echo /root/4rest || [ -d /root/roots-of-impact ] && echo /root/roots-of-impact || echo /root/4rest ); cd "$DEPLOY_DIR" && CID=$(docker compose -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null | head -1) && docker exec -i "$CID" psql -U roots_user -d roots_of_impact -t -A`,
    ],
    { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error('SSH/psql export failed');
  }
  const raw = r.stdout.trim();
  const j = JSON.parse(raw);
  return j;
}

const FETCH_MS = 45000;

async function translateChunk(text) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=en&dt=t&q=' +
    encodeURIComponent(text);
  for (let attempt = 0; attempt < 6; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), FETCH_MS);
    try {
      const res = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (!res.ok) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      const data = await res.json();
      if (!data?.[0]?.length) {
        await sleep(500);
        continue;
      }
      return data[0].map((x) => x[0]).join('');
    } catch {
      clearTimeout(t);
      await sleep(800 * (attempt + 1));
    }
  }
  throw new Error('translate failed: ' + text.slice(0, 80));
}

async function translateFull(text) {
  if (!text.trim()) return text;
  const parts = [];
  for (let i = 0; i < text.length; i += CHUNK) {
    let end = Math.min(i + CHUNK, text.length);
    if (end < text.length) {
      const cut = text.lastIndexOf(' ', end);
      if (cut > i + 500) end = cut;
    }
    const chunk = text.slice(i, end);
    parts.push(await translateChunk(chunk));
    await sleep(DELAY_MS);
  }
  return parts.join('');
}

function dollarQuote(s) {
  let tag = 'tr';
  while (s.includes('$' + tag + '$')) tag += 'x';
  return '$' + tag + '$' + s + '$' + tag + '$';
}

function sqlToJsonbText(expr) {
  return `to_jsonb(${expr}::text)`;
}

/** Übersetzt i18n-Objekt: setzt en aus deToEn falls needsEn. */
function translateI18n(i18n, deToEn) {
  if (!i18n || typeof i18n !== 'object') return i18n;
  const de = String(i18n.de ?? '').trim();
  const en = i18n.en;
  if (!needsEn(de, en)) return i18n;
  const enNew = deToEn.get(de);
  if (enNew == null) return i18n;
  return { ...i18n, en: enNew };
}

/** Quiz-Array mit übersetzten prompt_i18n und text_i18n/option_i18n. */
function translateQuizQuestions(quiz, deToEn) {
  if (!Array.isArray(quiz)) return quiz;
  return quiz.map((q) => {
    if (!q || typeof q !== 'object') return q;
    const promptI18n = translateI18n(q.prompt_i18n, deToEn);
    const arr = q.answers ?? q.options ?? [];
    const translated = arr.map((a, idx) => {
      if (typeof a === 'string') {
        const textI18n = translateI18n({ de: a, en: a }, deToEn);
        return { id: `a_${idx + 1}`, text: a, text_i18n: textI18n, option_i18n: textI18n };
      }
      if (!a || typeof a !== 'object') return a;
      const i18n = a.text_i18n ?? a.option_i18n ?? (a.text && { de: a.text, en: a.text }) ?? (a.value && { de: a.value, en: a.value });
      const textI18n = translateI18n(i18n, deToEn);
      return { ...a, text_i18n: textI18n, option_i18n: textI18n };
    });
    const out = { ...q, prompt_i18n: promptI18n };
    if (q.answers) out.answers = translated;
    else if (q.options) out.options = translated;
    return out;
  });
}

/** Survey-Array mit übersetzten question_i18n und option_i18n. */
function translateSurveyQuestions(survey, deToEn) {
  if (!Array.isArray(survey)) return survey;
  return survey.map((s) => {
    if (!s || typeof s !== 'object') return s;
    const questionI18n = translateI18n(s.question_i18n, deToEn);
    const options = (s.options ?? []).map((o) => {
      if (!o || typeof o !== 'object') return o;
      const optionI18n = translateI18n(o.option_i18n, deToEn);
      return { ...o, option_i18n: optionI18n };
    });
    return { ...s, question_i18n: questionI18n, options };
  });
}

function collectWorkloads(payload) {
  /** @type {Map<string, { table: string, id: string, sets: string[] }>} */
  const byRow = new Map();
  /** @type {Set<string>} */
  const toTranslate = new Set();

  function add(table, id, field, i18n) {
    if (!i18n || typeof i18n !== 'object') return;
    const de = i18n.de;
    const en = i18n.en;
    if (!needsEn(de, en)) return;
    const key = `${table}\t${id}`;
    if (!byRow.has(key)) byRow.set(key, { table, id, sets: [] });
    toTranslate.add(String(de).trim());
  }

  for (const row of payload.tasks || []) {
    add('tasks', row.id, 'title_i18n', row.title_i18n);
    add('tasks', row.id, 'description_i18n', row.description_i18n);
    add('tasks', row.id, 'article_content_i18n', row.article_content_i18n);
        // Quiz: prompt_i18n, answers[].text_i18n / option_i18n / text (Legacy)
        const quiz = row.quiz_questions;
        if (Array.isArray(quiz)) {
          for (const q of quiz) {
            if (q && typeof q === 'object') {
              add('tasks', row.id, null, q.prompt_i18n);
              const answers = q.answers ?? q.options ?? [];
              for (const a of answers) {
                if (typeof a === 'string') {
                  add('tasks', row.id, null, { de: a, en: a });
                } else if (a && typeof a === 'object') {
                  const i18n = a.text_i18n ?? a.option_i18n ?? (a.text && { de: a.text, en: a.text }) ?? (a.value && { de: a.value, en: a.value });
                  if (i18n) add('tasks', row.id, null, i18n);
                }
              }
            }
          }
        }
    // Survey: question_i18n, options[].option_i18n
    const survey = row.survey_questions;
    if (Array.isArray(survey)) {
      for (const s of survey) {
        if (s && typeof s === 'object') {
          add('tasks', row.id, null, s.question_i18n);
          for (const o of s.options ?? []) {
            if (o && typeof o === 'object') add('tasks', row.id, null, o.option_i18n);
          }
        }
      }
    }
  }
  for (const row of payload.rewards || []) {
    add('rewards', row.id, 'title_i18n', row.title_i18n);
    add('rewards', row.id, 'description_i18n', row.description_i18n);
  }
  for (const row of payload.locations || []) {
    add('locations', row.id, 'name_i18n', row.name_i18n);
    add('locations', row.id, 'description_i18n', row.description_i18n);
    add('locations', row.id, 'address_i18n', row.address_i18n);
    add('locations', row.id, 'category_description_i18n', row.category_description_i18n);
  }
  for (const row of payload.contests || []) {
    add('contests', row.id, 'name_i18n', row.name_i18n);
  }
  for (const row of payload.teams || []) {
    add('teams', row.id, 'name_i18n', row.name_i18n);
  }

  return { byRow, toTranslate: [...toTranslate] };
}

function buildUpdates(payload, deToEn) {
  const lines = ['BEGIN;', "SET statement_timeout = '600s';"];

  function rowUpdates(table, id, field, i18n) {
    if (!i18n || typeof i18n !== 'object') return;
    const de = String(i18n.de ?? '').trim();
    const en = i18n.en;
    if (!needsEn(de, en)) return;
    const enNew = deToEn.get(de);
    if (enNew == null) return;
    const jsonCol = field;
    const dq = dollarQuote(enNew);
    return `${jsonCol} = jsonb_set(COALESCE(${jsonCol}, '{}'), '{en}', ${sqlToJsonbText(dq)})`;
  }

  const rowKey = (t, id) => `${t}\t${id}`;
  const patch = new Map();

  for (const row of payload.tasks || []) {
    const k = rowKey('tasks', row.id);
    const parts = [];
    for (const f of ['title_i18n', 'description_i18n', 'article_content_i18n']) {
      const s = rowUpdates('tasks', row.id, f, row[f]);
      if (s) parts.push(s);
    }
    // Quiz/Survey: vollständiges JSON ersetzen mit übersetzten Werten
    const quiz = row.quiz_questions;
    if (Array.isArray(quiz) && quiz.length > 0) {
      const translated = translateQuizQuestions(quiz, deToEn);
      const jsonStr = JSON.stringify(translated).replace(/'/g, "''");
      parts.push(`quiz_questions = '${jsonStr}'::jsonb`);
    }
    const survey = row.survey_questions;
    if (Array.isArray(survey) && survey.length > 0) {
      const translated = translateSurveyQuestions(survey, deToEn);
      const jsonStr = JSON.stringify(translated).replace(/'/g, "''");
      parts.push(`survey_questions = '${jsonStr}'::jsonb`);
    }
    if (parts.length) patch.set(k, { table: 'tasks', id: row.id, parts });
  }
  for (const row of payload.rewards || []) {
    const parts = [];
    for (const f of ['title_i18n', 'description_i18n']) {
      const s = rowUpdates('rewards', row.id, f, row[f]);
      if (s) parts.push(s);
    }
    if (parts.length) patch.set(rowKey('rewards', row.id), { table: 'rewards', id: row.id, parts });
  }
  for (const row of payload.locations || []) {
    const parts = [];
    for (const f of ['name_i18n', 'description_i18n', 'address_i18n', 'category_description_i18n']) {
      const s = rowUpdates('locations', row.id, f, row[f]);
      if (s) parts.push(s);
    }
    if (parts.length) patch.set(rowKey('locations', row.id), { table: 'locations', id: row.id, parts });
  }
  for (const row of payload.contests || []) {
    const s = rowUpdates('contests', row.id, 'name_i18n', row.name_i18n);
    if (s) lines.push(`UPDATE contests SET ${s} WHERE id = '${row.id}'::uuid;`);
  }
  for (const row of payload.teams || []) {
    const s = rowUpdates('teams', row.id, 'name_i18n', row.name_i18n);
    if (s) lines.push(`UPDATE teams SET ${s} WHERE id = '${row.id}'::uuid;`);
  }

  for (const { table, id, parts } of patch.values()) {
    lines.push(`UPDATE ${table} SET ${parts.join(', ')} WHERE id = '${id}'::uuid;`);
  }

  // Legacy display: locations.name aus DE
  lines.push(`UPDATE locations SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name) WHERE name_i18n IS NOT NULL AND name_i18n != '{}'::jsonb;`);
  lines.push(`UPDATE contests SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name) WHERE name_i18n IS NOT NULL AND name_i18n != '{}'::jsonb;`);
  lines.push(`UPDATE teams SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name) WHERE name_i18n IS NOT NULL AND name_i18n != '{}'::jsonb;`);

  lines.push('COMMIT;');
  return lines.join('\n');
}

async function main() {
  console.error('Exportiere Live-Daten …');
  const payload = fetchPayload();
  let { toTranslate } = collectWorkloads(payload);
  toTranslate.sort((a, b) => a.length - b.length);
  console.error(`Eindeutige DE-Texte zum Übersetzen: ${toTranslate.length}`);

  const deToEn = new Map();
  if (CACHE && existsSync(CACHE)) {
    try {
      const o = JSON.parse(readFileSync(CACHE, 'utf8'));
      for (const [k, v] of Object.entries(o)) deToEn.set(k, v);
      console.error(`Cache geladen: ${deToEn.size} Einträge`);
    } catch {
      /* ignore */
    }
  }

  let i = 0;
  const todo = toTranslate.filter((de) => !deToEn.has(de));
  for (const de of todo) {
    i++;
    process.stderr.write(
      `\rÜbersetze ${i}/${todo.length} (ca. ${de.length} Zeichen) …                    `
    );
    const en = await translateFull(de);
    deToEn.set(de, en);
    if (CACHE) {
      const o = Object.fromEntries(deToEn);
      writeFileSync(CACHE, JSON.stringify(o), 'utf8');
    }
  }
  console.error('\nGeneriere SQL …');
  const sql = buildUpdates(payload, deToEn);

  if (APPLY) {
    console.error('Wende auf Produktion an …');
    const r = spawnSync(
      'ssh',
      [
        '-o',
        'BatchMode=yes',
        '-o',
        'StrictHostKeyChecking=no',
        SSH,
        `DEPLOY_DIR=$( [ -d /root/4rest ] && echo /root/4rest || [ -d /root/roots-of-impact ] && echo /root/roots-of-impact || echo /root/4rest ); cd "$DEPLOY_DIR" && CID=$(docker compose -f docker-compose.homeserver.yml ps -q postgres 2>/dev/null | head -1) && docker exec -i "$CID" psql -U roots_user -d roots_of_impact -v ON_ERROR_STOP=1`,
      ],
      { input: sql, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
    process.stdout.write(r.stdout);
    process.stderr.write(r.stderr);
    if (r.status !== 0) process.exit(1);
    console.error('Fertig.');
  } else {
    console.log(sql);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
