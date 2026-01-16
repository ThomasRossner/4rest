import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  const errors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.error(`[CONSOLE ERROR]:`, text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]:', error.message);
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({ url: response.url(), status: response.status() });
      console.error(`[HTTP ${response.status()}]:`, response.url());
    }
  });
  
  try {
    console.log('Navigiere zu http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Warte auf Login-Formular...');
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });
    
    console.log('Fülle Login-Daten ein...');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Test123!');
    
    console.log('Klicke auf Submit...');
    await page.click('button[type="submit"]');
    
    console.log('Warte auf Navigation...');
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 }).catch(() => {
      console.log('Navigation zu /dashboard fehlgeschlagen, prüfe aktuelle URL...');
    });
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('\n=== AKTUELLE URL ===');
    console.log(currentUrl);
    
    const authState = await page.evaluate(() => {
      try {
        const storage = localStorage.getItem('auth-storage');
        return storage ? JSON.parse(storage) : null;
      } catch (e) {
        return null;
      }
    });
    
    console.log('\n=== AUTH STATE ===');
    console.log('Eingeloggt:', authState?.state?.isAuthenticated);
    console.log('User:', authState?.state?.user?.email, authState?.state?.user?.role);
    
    const bodyText = await page.textContent('body');
    console.log('\n=== BODY TEXT (erste 500 Zeichen) ===');
    console.log(bodyText?.substring(0, 500));
    
    const reactRoot = await page.locator('#root').innerHTML().catch(() => 'NICHT GEFUNDEN');
    console.log('\n=== REACT ROOT INNER HTML (erste 500 Zeichen) ===');
    console.log(reactRoot?.substring(0, 500));
    
    await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
    console.log('\nScreenshot gespeichert: debug-after-login.png');
    
    console.log('\n=== CONSOLE ERRORS ===');
    logs.filter(l => l.type === 'error').forEach(log => {
      console.error(log.text);
    });
    
    console.log('\n=== PAGE ERRORS ===');
    errors.forEach(error => console.error(error));
    
    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach(err => {
      console.error(`${err.status}: ${err.url}`);
    });
    
    console.log('\n✅ Browser bleibt offen. Drücke Ctrl+C zum Beenden.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('FEHLER:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
    await new Promise(() => {});
  }
})();
