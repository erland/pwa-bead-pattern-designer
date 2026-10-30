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
  // End-to-end workflow: create, draw, undo, redo, autosave, reload.
  await page.getByRole('button', { name: 'New Pattern', exact: true }).click();
  await page.getByRole('textbox', { name: 'Pattern name:' }).fill('Chromium persistence check');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.waitForURL(/#\/editor\/[^/]+$/);
  const patternId = decodeURIComponent(new URL(page.url()).hash.split('/').pop());
  const readGrid = () => page.evaluate((id) => {
    const snapshot = localStorage.getItem('bead-pattern-designer.file-state.v1');
    return snapshot ? JSON.parse(snapshot).patterns[id]?.grid ?? null : null;
  }, patternId);
  const hasBead = (grid) => Array.isArray(grid) && grid.some((row) => row.some((color) => color !== null));
  await page.locator('.pattern-editor__canvas canvas').waitFor();
  await page.getByRole('button', { name: /Fill/ }).click();
  await page.locator('.pattern-editor__canvas canvas').click({ position: { x: 80, y: 80 } });
  await page.waitForFunction((id) => {
    const raw = localStorage.getItem('bead-pattern-designer.file-state.v1');
    if (!raw) return false;
    const grid = JSON.parse(raw).patterns[id]?.grid;
    return Array.isArray(grid) && grid.some((row) => row.some((color) => color !== null));
  }, patternId, { timeout: 10000 });
  assert.ok(hasBead(await readGrid()), 'Drawing did not persist');
  await page.getByRole('button', { name: /Undo/ }).click();
  await page.waitForFunction((id) => {
    const raw = localStorage.getItem('bead-pattern-designer.file-state.v1');
    const grid = raw && JSON.parse(raw).patterns[id]?.grid;
    return Array.isArray(grid) && grid.every((row) => row.every((color) => color === null));
  }, patternId, { timeout: 10000 });
  await page.getByRole('button', { name: /Redo/ }).click();
  await page.waitForFunction((id) => {
    const raw = localStorage.getItem('bead-pattern-designer.file-state.v1');
    const grid = raw && JSON.parse(raw).patterns[id]?.grid;
    return Array.isArray(grid) && grid.some((row) => row.some((color) => color !== null));
  }, patternId, { timeout: 10000 });
  await page.reload();
  await page.getByRole('button', { name: /Undo/ }).waitFor();
  assert.ok(hasBead(await readGrid()), 'Edited pattern was not restored after reload');
  console.log('PASS: create pattern, draw, undo, redo, autosave, reload');
  assert.deepEqual(errors, [], 'Browser runtime exceptions');
  console.log('PASS: file:// startup, hash navigation, localStorage reload, no page errors');
} finally {
  await browser.close();
}
