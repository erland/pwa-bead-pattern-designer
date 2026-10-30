import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const directory = 'dist-single';
let html = await readFile(join(directory, 'index.html'), 'utf8');
const assets = await readdir(join(directory, 'assets'));
for (const filename of assets) {
  if (filename.endsWith('.js')) {
    const content = await readFile(join(directory, 'assets', filename), 'utf8');
    html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*\/assets\/[^"']+\.js["'][^>]*><\/script>/i,
      '<script type="module">' + content.replace(/<\/script/gi, '<\\/script') + '</script>');
  } else if (filename.endsWith('.css')) {
    const content = await readFile(join(directory, 'assets', filename), 'utf8');
    html = html.replace(/<link\b[^>]*\bhref=["'][^"']*\/assets\/[^"']+\.css["'][^>]*>/i,
      '<style>' + content.replaceAll('</style', '<\/style') + '</style>');
  } else {
    throw new Error('Unexpected asset: ' + filename);
  }
}
html = html.replace(/\s*<link\b[^>]*\brel=["'](?:icon|manifest|apple-touch-icon)["'][^>]*>/gi, '');
if (!/<script type="module">[\s\S]+<\/script>/.test(html) || !/<style>[\s\S]+<\/style>/.test(html)) {
  throw new Error('Missing embedded JavaScript or CSS');
}
const markupOnly = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
if (/<(?:script|link)\b[^>]*(?:src|href)=["'][^"']+["']/i.test(markupOnly)) {
  throw new Error('External script or stylesheet dependency remains');
}
if (/url\(\s*["']?(?!data:|#)[^)"']+/.test(html.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '')) {
  throw new Error('External CSS asset remains');
}
await writeFile(join(directory, 'bead-pattern-designer.html'), html);
console.log('Created dist-single/bead-pattern-designer.html');
