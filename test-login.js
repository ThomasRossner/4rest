// Use dynamic import for ES modules
const { chromium } = await import('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Langsamer für bessere Sichtbarkeit
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigiere zu http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    console.log('Warte auf Login-Formular...');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    console.log('Fülle E-Mail ein: admin@example.com');
    await page.fill('input[id="email"]', 'admin@example.com');
    
    console.log('Fülle Passwort ein: Test123!');
    await page.fill('input[id="password"]', 'Test123!');
    
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
    
    // Warte 5 Sekunden, damit der Benutzer das Ergebnis sehen kann
    console.log('Warte 5 Sekunden, damit du das Ergebnis sehen kannst...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Fehler beim Login-Test:', error);
  } finally {
    await browser.close();
  }
})();
