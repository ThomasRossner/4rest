import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  
  // Sammle Console-Logs und Fehler
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]:', error.message);
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`[HTTP ${response.status()}]:`, response.url());
    }
  });
  
  try {
    console.log('Navigiere zu http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000
    });
    
    console.log('Warte 3 Sekunden auf vollständiges Laden...');
    await page.waitForTimeout(3000);
    
    // Prüfe die aktuelle URL
    const currentUrl = page.url();
    console.log('Aktuelle URL:', currentUrl);
    
    // Prüfe ob User eingeloggt ist
    const authState = await page.evaluate(() => {
      try {
        const storage = localStorage.getItem('auth-storage');
        return storage ? JSON.parse(storage) : null;
      } catch (e) {
        return null;
      }
    });
    console.log('Auth State:', authState?.state?.isAuthenticated ? 'Eingeloggt' : 'Nicht eingeloggt');
    console.log('User Role:', authState?.state?.user?.role);
    
    // Screenshot
    await page.screenshot({ path: 'browser-state.png', fullPage: true });
    console.log('Screenshot gespeichert: browser-state.png');
    
    // Prüfe ob React gerendert wurde
    const reactRoot = await page.locator('#root').count();
    console.log('React Root gefunden:', reactRoot > 0);
    
    // Prüfe den Body-Text
    const bodyText = await page.textContent('body');
    console.log('Body-Text (erste 300 Zeichen):', bodyText?.substring(0, 300));
    
    // Prüfe auf Fehler-Elemente
    const errorElements = await page.locator('.error, [role="alert"], .login-error').count();
    console.log('Fehler-Elemente gefunden:', errorElements);
    
    console.log('\n=== Console Logs ===');
    logs.forEach(log => {
      if (log.type === 'error') {
        console.error(`[${log.type}]:`, log.text);
      }
    });
    
    console.log('\n=== Page Errors ===');
    errors.forEach(error => {
      console.error(error);
    });
    
    console.log('\n✅ Browser bleibt offen. Drücke Ctrl+C zum Beenden.');
    await new Promise(() => {}); // Blockiert für immer
    
  } catch (error) {
    console.error('Fehler:', error);
    await page.screenshot({ path: 'browser-error.png', fullPage: true });
    console.log('Fehler-Screenshot gespeichert: browser-error.png');
    await new Promise(() => {}); // Blockiert auch bei Fehler
  }
})();
