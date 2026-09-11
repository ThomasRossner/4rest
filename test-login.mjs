import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Langsamer für bessere Sichtbarkeit
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ignoriere SSL-Zertifikatsfehler für lokale Entwicklung
    await context.setHTTPCredentials({ username: '', password: '' });
    
    console.log('Navigiere zu http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000
    });
    
    console.log('Warte auf Login-Formular...');
    // Warte auf die Seite zu laden
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('Network idle timeout, versuche trotzdem weiter...');
    });
    
    // Screenshot für Debugging
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Screenshot gespeichert: login-page.png');
    
    // Prüfe die aktuelle URL
    const currentUrl = page.url();
    console.log('Aktuelle URL:', currentUrl);
    
    // Prüfe den Seiteninhalt
    const bodyText = await page.textContent('body');
    console.log('Body-Text (erste 200 Zeichen):', bodyText?.substring(0, 200));
    
    // Versuche verschiedene Selektoren für E-Mail
    let emailSelector = null;
    const selectors = [
      'input[id="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[name="email"]'
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        emailSelector = selector;
        console.log(`✅ E-Mail-Input gefunden mit Selektor: ${selector}`);
        break;
      } catch (e) {
        // Weiter versuchen
      }
    }
    
    if (!emailSelector) {
      // Liste alle Inputs auf der Seite
      const inputs = await page.$$eval('input', inputs => inputs.map(i => ({
        id: i.id,
        type: i.type,
        name: i.name,
        placeholder: i.placeholder
      })));
      console.log('Gefundene Inputs:', JSON.stringify(inputs, null, 2));
      throw new Error('E-Mail-Input konnte nicht gefunden werden');
    }
    
    console.log('Fülle E-Mail ein: admin@example.com');
    await page.fill(emailSelector, 'admin@example.com');
    
    // Versuche verschiedene Selektoren für Passwort
    let passwordSelector = null;
    const passwordSelectors = [
      'input[id="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[name="password"]'
    ];
    
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        passwordSelector = selector;
        console.log(`✅ Passwort-Input gefunden mit Selektor: ${selector}`);
        break;
      } catch (e) {
        // Weiter versuchen
      }
    }
    
    if (!passwordSelector) {
      throw new Error('Passwort-Input konnte nicht gefunden werden');
    }
    
    console.log('Fülle Passwort ein: Test123!');
    await page.fill(passwordSelector, 'Test123!');
    
    console.log('Klicke auf Submit-Button...');
    await page.click('button[type="submit"]');
    
    console.log('Warte auf Navigation oder Fehlermeldung...');
    
    // Warte entweder auf Erfolg (Navigation) oder Fehler
    await Promise.race([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 }).then(() => {
        console.log('✅ Login erfolgreich! Weiterleitung erfolgt.');
      }),
      page.waitForSelector('.login-error', { timeout: 10000 }).then(async () => {
        const errorText = await page.textContent('.login-error');
        console.log('❌ Login fehlgeschlagen:', errorText);
      })
    ]).catch((err) => {
      console.log('⚠️  Timeout oder unerwarteter Fehler:', err.message);
    });
    
    // Browser offen lassen für Interaktion
    console.log('✅ Browser bleibt offen. Drücke Ctrl+C zum Beenden.');
    console.log('Du kannst jetzt im Browser arbeiten.');
    
    // Warte unbegrenzt, bis der Benutzer den Prozess beendet
    await new Promise(() => {}); // Blockiert für immer
    
  } catch (error) {
    console.error('Fehler beim Login-Test:', error);
    console.log('Browser bleibt trotzdem offen. Drücke Ctrl+C zum Beenden.');
    await new Promise(() => {}); // Blockiert auch bei Fehler
  }
})();
