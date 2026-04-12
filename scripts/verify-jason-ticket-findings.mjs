/**
 * Verifikation der Jason-Tickets (041–056) gegen die Live-App.
 * Login: demo@example.com / Test123! (oder VERIFY_EMAIL / VERIFY_PASSWORD)
 *
 * Nutzung: node scripts/verify-jason-ticket-findings.mjs
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.VERIFY_BASE_URL || 'https://luise.bio';
const DEMO_EMAIL = process.env.VERIFY_EMAIL || 'demo@example.com';
const DEMO_PASSWORD = process.env.VERIFY_PASSWORD || 'Test123!';

const results = [];

function record(id, verified, note) {
  results.push({ id, verified, note });
  const s = verified ? 'VERIFIZIERT' : 'NICHT REPRODUZIERBAR';
  console.log(`[${id}] ${s}: ${note}`);
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    const b = document.body;
    return Math.max(d.scrollWidth, b ? b.scrollWidth : 0) > d.clientWidth + 2;
  });
}

/** @returns {Promise<boolean>} */
async function loginGuest(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.fill('input[id="email"]', DEMO_EMAIL);
  await page.fill('input[id="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 });
    return true;
  } catch {
    const err = await page.locator('.login-error').first().textContent().catch(() => '');
    console.error(`Login fehlgeschlagen: ${(err || '').trim() || 'keine Meldung'}`);
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // --- 042, 041 (login), 048 (ohne Session) ---
  const context = await browser.newContext({
    locale: 'de-DE',
    ...devices['Desktop Chrome'],
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const lang = (await page.locator('html').getAttribute('lang')) || '';
    const textSample = (await page.locator('body').innerText()).slice(0, 400).toLowerCase();
    const looksGerman =
      textSample.includes('passwort') ||
      textSample.includes('password') ||
      textSample.includes('email');
    const mismatch =
      (looksGerman && lang.toLowerCase().startsWith('en')) ||
      (!looksGerman && lang.toLowerCase().startsWith('de'));
    if (mismatch) {
      record('042', true, `lang="${lang}", Body-Text-Heuristik widerspricht lang`);
    } else {
      record('042', false, `lang="${lang}", kein klarer Widerspruch`);
    }
  } catch (e) {
    record('042', false, `Fehler: ${e.message}`);
  }

  let overflowLogin = false;
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 45000 });
    overflowLogin = await hasHorizontalOverflow(page);
  } catch {
    /* ignore */
  }

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.fill('input[id="email"]', 'test@example.co');
    await page.fill('input[id="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);
    const err = (await page.locator('.login-error').first().textContent().catch(() => '')) || '';
    const t = err.trim();
    if (/invalid\s*credentials/i.test(t)) {
      record('048', true, `UI: "${t.slice(0, 80)}"`);
    } else {
      record('048', false, t ? `Andere Meldung: "${t.slice(0, 80)}"` : 'keine .login-error');
    }
  } catch (e) {
    record('048', false, `Fehler: ${e.message}`);
  }

  const loggedIn = await loginGuest(page);
  if (loggedIn) {
    const paths = ['/', '/tasks', '/rewards'];
    let anyOverflow = false;
    for (const p of paths) {
      try {
        await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(800);
        if (await hasHorizontalOverflow(page)) {
          anyOverflow = true;
          break;
        }
      } catch {
        /* skip */
      }
    }
    record(
      '041',
      anyOverflow || overflowLogin,
      anyOverflow || overflowLogin
        ? `Overflow: login=${overflowLogin}, nach Demo=${anyOverflow}`
        : 'kein horiz. Overflow auf /login sowie /, /tasks, /rewards (Demo)'
    );

    // 044: Nav „Roots“ / Start – Farbe vorher/nachher Unterseite
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      const linkSel = 'nav a[href="/"], nav a[href*="/"], [role="navigation"] a';
      const firstNav = page.locator(linkSel).first();
      const colorHome = await firstNav.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { color: s.color, backgroundColor: s.backgroundColor };
      });
      await page.goto(`${BASE}/rewards`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      const colorBack = await firstNav.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { color: s.color, backgroundColor: s.backgroundColor };
      });
      const changed = JSON.stringify(colorHome) !== JSON.stringify(colorBack);
      const greenish = (c) => /rgb\(.*\)/.test(c) && (c.includes('0, 128') || c.includes('34, 197') || c.includes('13, 148'));
      const bug =
        changed &&
        (greenish(colorBack.color) || greenish(colorBack.backgroundColor));
      record('044', bug, `Nav computed home ${JSON.stringify(colorHome)} → nach Zurück ${JSON.stringify(colorBack)}`);
    } catch (e) {
      record('044', false, `Fehler: ${e.message}`);
    }

    // 043: Fokus auf erstem fokussierbarem Element in nav
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return null;
        const s = window.getComputedStyle(a);
        return {
          outlineWidth: s.outlineWidth,
          outlineStyle: s.outlineStyle,
        };
      });
      const thin =
        outline &&
        (outline.outlineStyle === 'none' || parseFloat(outline.outlineWidth || '0') < 1);
      record('043', thin, thin ? `schwacher Fokus ${JSON.stringify(outline)}` : `Fokus ok ${JSON.stringify(outline)}`);
    } catch (e) {
      record('043', false, `Fehler: ${e.message}`);
    }

    // 046: Quiz-Aufgabe öffnen
    try {
      await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
      const quizFilter = page.getByRole('combobox', { name: /typ|type|alle/i }).first();
      if ((await quizFilter.count()) > 0) {
        await quizFilter.click();
        await page.getByRole('option', { name: /quiz/i }).first().click({ timeout: 5000 }).catch(() => {});
      }
      const quizCard = page.locator('a[href*="/tasks/"], [data-task]').filter({ hasText: /quiz/i }).first();
      const opened = await quizCard.count() > 0;
      record('046', false, opened ? 'Quiz-Filter/Karten sichtbar – Falschantwort-Flow nicht beendet' : 'kein Quiz in Liste gefunden');
    } catch (e) {
      record('046', false, `Fehler: ${e.message}`);
    }

    // 047: Dropdown Überlappung – Bounding-Box der ersten Select
    try {
      await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
      const combo = page.locator('select, [role="combobox"]').first();
      if ((await combo.count()) > 0) {
        const box = await combo.boundingBox();
        record('047', false, box ? `Dropdown vorhanden (${Math.round(box.width)}×${Math.round(box.height)}), visuelle Überlagerung nicht automatisch bewertet` : 'kein Dropdown-Box');
      } else {
        record('047', false, 'kein Dropdown gefunden');
      }
    } catch (e) {
      record('047', false, `Fehler: ${e.message}`);
    }

    // 050: Reload Unterseite
    try {
      await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
      const before = page.url();
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
      const after = page.url();
      const lost = new URL(before).pathname !== new URL(after).pathname || !after.includes('/tasks');
      record('050', lost, lost ? `URL ${before} → ${after}` : `Reload behält ${after}`);
    } catch (e) {
      record('050', false, `Fehler: ${e.message}`);
    }

    // 051: Belohnungen einlösen – doppelte Überschriften
    try {
      await page.goto(`${BASE}/rewards`, { waitUntil: 'networkidle', timeout: 30000 });
      const h = await page.locator('h1, h2').allTextContents();
      const dup = h.filter((x, i) => h.indexOf(x) !== i && x.trim().length > 0);
      record('051', dup.length > 0, dup.length ? `Doppelte Überschriften: ${dup.slice(0, 3).join(' | ')}` : 'keine doppelten h1/h2 Texte in Stichprobe');
    } catch (e) {
      record('051', false, `Fehler: ${e.message}`);
    }

    // 055: nav img alt nach Login
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      const imgs = await page.locator('nav img, [role="navigation"] img').all();
      let withAlt = 0;
      for (const img of imgs.slice(0, 15)) {
        const alt = await img.getAttribute('alt');
        if (alt != null && alt.trim().length > 0) withAlt++;
      }
      record('055', withAlt > 0, `${withAlt} Nav-Img mit nicht-leerem alt (max 15)`);
    } catch (e) {
      record('055', false, `Fehler: ${e.message}`);
    }

    // 049: grobe Overflow-Prüfung Teams – oft nicht für Gast
    record('049', false, 'Layout Stichprobe: keine separate Teams-Seite für Gast-Rolle im gleichen Flow geprüft');
  } else {
    record(
      '041',
      overflowLogin,
      overflowLogin ? 'Overflow nur /login' : 'Demo-Login fehlgeschlagen; kein Overflow /login'
    );
    record('044', false, 'kein Login');
    record('043', false, 'kein Login');
    record('046', false, 'kein Login');
    record('047', false, 'kein Login');
    record('050', false, 'kein Login');
    record('051', false, 'kein Login');
    record('055', false, 'kein Login');
    record('049', false, 'kein Login');
  }

  await context.close();

  // Mobile 045
  const mctx = await browser.newContext({ locale: 'de-DE', ...devices['Pixel 5'] });
  const mpage = await mctx.newPage();
  if (await loginGuest(mpage)) {
    try {
      await mpage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
      const nav = mpage.locator('nav').first();
      const navOverflow =
        (await nav.count()) > 0
          ? await nav.evaluate((el) => el.scrollWidth > el.clientWidth + 2)
          : await hasHorizontalOverflow(mpage);
      record('045', navOverflow, navOverflow ? 'Nav overflow Mobile (Demo)' : 'kein Nav overflow Mobile (Demo)');
    } catch (e) {
      record('045', false, `Fehler: ${e.message}`);
    }
  } else {
    record('045', false, 'Mobile Demo-Login fehlgeschlagen');
  }
  await mctx.close();

  // 052 Kamera – nicht automatisierbar
  record('052', false, 'Kamera-Dialog nicht im Headless simuliert');

  // 053 / 054 – API + ggf. Rezeption
  try {
    const res = await fetch(`${BASE}/api/contests`, { headers: { Accept: 'application/json' } });
    const txt = await res.text();
    record('053', /forbidden/i.test(txt) && res.status === 403, `GET /api/contests ohne Auth: ${res.status} ${txt.slice(0, 80)}`);
  } catch (e) {
    record('053', false, `Fehler: ${e.message}`);
  }
  record('054', false, 'Admin-Lösch-Dialog ohne Admin-Session nicht geprüft');

  record('056', false, 'Finding #14 nur Dokumentationsklärung');

  await browser.close();

  console.log('\n--- JSON ---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
