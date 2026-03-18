import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const projectRoot = path.resolve(process.cwd());
const inputHtml = path.join(projectRoot, 'docs', '4rest-funktionsbeschreibung.html');
const outputPdf = path.join(projectRoot, 'docs', '4rest-funktionsbeschreibung.pdf');

const url = pathToFileURL(inputHtml).toString();

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: 'load' });
// Ensure fonts/layout settle before printing
await page.waitForTimeout(250);

await page.pdf({
  path: outputPdf,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF written: ${outputPdf}`);

