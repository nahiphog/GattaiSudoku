import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, '_site');
// Publish only browser assets, never server handlers, SQL, environment files,
// benchmarks, or repository metadata. No package installation is required.
const files = [
  'index.html', 'generate.html', 'verify.html', '404.html',
  'style.css', 'generate.css', 'generate.js', 'verify.js', 'remote-pairs.js', 'walkthrough.js',
  'gattai-logo-minimal.png',
  'gattai-logo-minimal-dark.png', 'robots.txt', 'sitemap.xml',
  ...readdirSync(join(root, 'guides')).filter(name => name.endsWith('.html')).map(name => `guides/${name}`),
];
const base = new URL('https://nahiphog.github.io/GattaiSudoku/');
mkdirSync(output, { recursive: true });
// Refuse unexpected old files instead of silently shipping them on a rebuild.
function checkOutput(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) checkOutput(join(directory, entry.name), path + '/');
    else assert(files.includes(path) || path === '.nojekyll', `Unexpected output file: ${path}`);
  }
}
checkOutput(output);
for (const file of files) {
  const source = join(root, file);
  assert(existsSync(source), `Missing asset: ${file}`);
  if (file.endsWith('.js')) new vm.Script(readFileSync(source, 'utf8'), { filename: file });
  if (file.endsWith('.html')) {
    const html = readFileSync(source, 'utf8');
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      const attributes = Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(([, key, value]) => [key.toLowerCase(), value]));
      if (attributes['http-equiv']?.toLowerCase() !== 'refresh') continue;
      assert.equal(file, 'generate.html', `Unexpected automatic redirect in ${file}`);
      const redirect = attributes.content?.match(/^\s*0\s*;\s*url\s*=\s*(.+?)\s*$/i);
      assert(redirect, `Invalid redirect in ${file}`);
      assert.equal(new URL(redirect[1], new URL(file, base)).href, base.href, `${file} must redirect to the generator within the Pages subpath`);
    }
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(ref, new URL(file, base));
      if (url.origin !== base.origin) continue;
      assert(url.pathname.startsWith(base.pathname), `${file} escapes Pages subpath: ${ref}`);
      const target = url.pathname.slice(base.pathname.length) || 'index.html';
      assert(files.includes(target), `${file} links to unpublished asset: ${ref}`);
    }
    for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      new vm.Script(script, { filename: file });
    }
  }
  const destination = join(output, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}
writeFileSync(join(output, '.nojekyll'), '');
console.log(`Validated and staged ${files.length} public files in _site (plus .nojekyll).`);
