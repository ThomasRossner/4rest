import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const logs = [];
  const errors = [];
  
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
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 }).catch(() => {
      console.log('Navigation zu /dashboard fehlgeschlagen, prüfe aktuelle URL...');
    });
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('\n=== AKTUELLE URL ===');
    console.log(currentUrl);
    
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 100;
    
    console.log('\n=== SEITEN-STATUS ===');
    console.log('Hat Inhalt:', hasContent);
    console.log('Body-Länge:', bodyText?.length || 0);
    
    await page.screenshot({ path: 'test-after-login.png', fullPage: true });
    console.log('\nScreenshot gespeichert: test-after-login.png');
    
    if (errors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      errors.forEach(error => console.error(error));
    }
    
    const criticalErrors = logs.filter(l => l.type === 'error' && 
      !l.text.includes('baseline-browser-mapping') &&
      !l.text.includes('Consider adding an error boundary'));
    
    if (criticalErrors.length > 0) {
      console.log('\n=== CRITICAL CONSOLE ERRORS ===');
      criticalErrors.forEach(log => console.error(log.text));
    } else {
      console.log('\n✅ Keine kritischen Fehler gefunden!');
    }
    
    console.log('\n✅ Browser bleibt offen. Drücke Ctrl+C zum Beenden.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('FEHLER:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    await new Promise(() => {});
  }
})();
