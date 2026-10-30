import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE);
const url = pathToFileURL(resolve('dist-single/bead-pattern-designer.html')).href;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('link', { name: 'Patterns' }).waitFor({ timeout: 8000 }).catch(async () => {
    console.error('Page errors:', errors);
    console.error('Body:', (await page.locator('body').innerText()).slice(0, 1500));
    throw new Error('Standalone application did not render navigation');
  });
  await page.getByRole('link', { name: 'Convert Image' }).click();
  await page.waitForURL(/#\/convert$/);
  await page.getByRole('link', { name: 'Patterns' }).click();
  await page.waitForURL(/#\/$/);
  const storageResult = await page.evaluate(() => {
    try {
      localStorage.setItem('standalone-smoke-key', 'roundtrip');
      return localStorage.getItem('standalone-smoke-key');
    } catch (error) {
      return 'UNAVAILABLE: ' + String(error);
    }
  });
  assert.equal(storageResult, 'roundtrip', 'file:// localStorage unavailable');
  await page.reload();
  await page.getByRole('link', { name: 'Convert Image' }).waitFor();
  const afterReload = await page.evaluate(() => localStorage.getItem('standalone-smoke-key'));
  assert.equal(afterReload, 'roundtrip', 'file:// localStorage did not survive reload');
  assert.deepEqual(errors, [], 'Browser runtime exceptions');
  console.log('PASS: file:// startup, hash navigation, localStorage reload, no page errors');
} finally {
  await browser.close();
}
