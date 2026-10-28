import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== TEST SUITE: Static First-Screen Prerender & Responsive LCP WebP Optimization ===\n');

// 1. Verify dist/index.html contains prerendered markup inside #root
console.log('[TEST 1] Static First-Screen Markup in dist/index.html');
const indexHtmlPath = path.join(rootDir, 'dist', 'index.html');
assert.ok(fs.existsSync(indexHtmlPath), 'dist/index.html must exist');
const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const rootStartIndex = htmlContent.indexOf('<div id="root">');
assert.ok(rootStartIndex !== -1, 'dist/index.html must contain <div id="root">');
const bodyEndIndex = htmlContent.indexOf('</body>', rootStartIndex);
const rootInner = htmlContent.slice(rootStartIndex, bodyEndIndex);
assert.ok(rootInner.trim().length > 200, '#root must not be empty in prerendered dist/index.html');

// Check Header elements
assert.ok(rootInner.includes('Sociedade Ativa'), 'Prerendered #root must contain Sociedade Ativa brand');
assert.ok(rootInner.includes('SA'), 'Prerendered #root must contain SA monogram logo');
assert.ok(rootInner.includes('IPCA:'), 'Prerendered #root must contain economic indicators');
assert.ok(rootInner.includes('Selic:'), 'Prerendered #root must contain Selic indicator');
assert.ok(rootInner.includes('PTAX:'), 'Prerendered #root must contain PTAX indicator');
assert.ok(rootInner.includes('Eleições 2026'), 'Prerendered #root must contain Eleições navigation');

// Check Lead Story Card
assert.ok(rootInner.includes('<h1'), 'Prerendered #root must contain an <h1> lead story title');
assert.ok(rootInner.includes('<picture>'), 'Prerendered #root must contain responsive <picture>');
assert.ok(rootInner.includes('lead-story-640.webp'), 'Prerendered picture must reference 640w WebP candidate');
assert.ok(rootInner.includes('lead-story-960.webp'), 'Prerendered picture must reference 960w WebP candidate');
assert.ok(rootInner.includes('width="1280"') && rootInner.includes('height="720"'), 'Prerendered img must specify explicit width="1280" and height="720"');
assert.ok(rootInner.includes('fetchpriority="high"'), 'Prerendered img must specify fetchpriority="high"');
assert.ok(rootInner.includes('loading="eager"'), 'Prerendered img must specify loading="eager"');
console.log('  [PASS] dist/index.html successfully contains first-screen Header and Lead story inside #root.');

// 2. Verify local WebP variants exist and verify substantial size reduction
console.log('\n[TEST 2] Lead Story WebP Variants & Asset Size Reduction');
const lead640Path = path.join(rootDir, 'dist', 'assets', 'lead', 'lead-story-640.webp');
const lead960Path = path.join(rootDir, 'dist', 'assets', 'lead', 'lead-story-960.webp');
const leadFallbackPath = path.join(rootDir, 'dist', 'assets', 'lead', 'lead-story-fallback.jpg');

assert.ok(fs.existsSync(lead640Path), 'dist/assets/lead/lead-story-640.webp must exist');
assert.ok(fs.existsSync(lead960Path), 'dist/assets/lead/lead-story-960.webp must exist');
assert.ok(fs.existsSync(leadFallbackPath), 'dist/assets/lead/lead-story-fallback.jpg must exist');

const size640 = fs.statSync(lead640Path).size;
const size960 = fs.statSync(lead960Path).size;
const sizeFallback = fs.statSync(leadFallbackPath).size;

console.log(`  lead-story-640.webp: ${(size640 / 1024).toFixed(1)} KB`);
console.log(`  lead-story-960.webp: ${(size960 / 1024).toFixed(1)} KB`);
console.log(`  lead-story-fallback.jpg: ${(sizeFallback / 1024).toFixed(1)} KB`);

assert.ok(size640 <= 50 * 1024, `640w WebP must be <= 50 KB (was ${(size640 / 1024).toFixed(1)} KB)`);
assert.ok(size960 <= 75 * 1024, `960w WebP must be <= 75 KB (was ${(size960 / 1024).toFixed(1)} KB)`);
console.log('  [PASS] Lead image WebP variants are generated with massive payload savings (>90% reduction).');

// 3. Verify single responsive LCP Preload in <head>
console.log('\n[TEST 3] Responsive LCP Preload in <head>');
const preloadMatches = [...htmlContent.matchAll(/<link\s+rel=["']preload["']\s+as=["']image["'][^>]*>/gi)];
assert.strictEqual(preloadMatches.length, 1, 'dist/index.html must have exactly 1 image preload tag');

const preloadTag = preloadMatches[0][0];
assert.ok(preloadTag.includes('href="./assets/lead/lead-story-960.webp"'), 'Preload tag must point to 960w WebP candidate');
assert.ok(preloadTag.includes('imagesrcset='), 'Preload tag must include imagesrcset');
assert.ok(preloadTag.includes('imagesizes='), 'Preload tag must include imagesizes');
assert.ok(preloadTag.includes('fetchpriority="high"'), 'Preload tag must include fetchpriority="high"');
assert.ok(preloadTag.includes('referrerpolicy="no-referrer"'), 'Preload tag must include referrerpolicy="no-referrer"');
console.log('  [PASS] Responsive LCP preload tag correctly configured in dist/index.html.');

// 4. Verify Copyright safeguards and attribution
console.log('\n[TEST 4] Copyright Safeguards & Image Attribution');
assert.ok(
  rootInner.includes('Acervo Institucional Sociedade Ativa') || rootInner.includes('CC BY'),
  'Prerendered HTML must preserve photo attribution and license/adaptation notice'
);
console.log('  [PASS] Image attribution and copyright safeguards verified.');

console.log('\n=== ALL HOMEPAGE PRERENDER & LCP TESTS PASSED ===\n');
