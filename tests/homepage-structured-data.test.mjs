import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== TEST SUITE: Homepage Structured Data & NewsArticle Separation Audit ===\n');

// 1. Verify index.html and dist/index.html structured data
console.log('[TEST 1] Homepage JSON-LD Structure (WebSite & NewsMediaOrganization)');

const checkHomepageHtml = (htmlPath, label) => {
  assert.ok(fs.existsSync(htmlPath), `${label} (${htmlPath}) must exist`);
  const html = fs.readFileSync(htmlPath, 'utf8');

  const jsonLdMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  assert.strictEqual(jsonLdMatches.length, 1, `${label} must contain exactly one JSON-LD script block`);

  const rawJson = jsonLdMatches[0][1];
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    assert.fail(`${label} JSON-LD failed to parse: ${err.message}`);
  }

  assert.strictEqual(parsed['@context'], 'https://schema.org', `${label} @context must be https://schema.org`);
  assert.ok(Array.isArray(parsed['@graph']), `${label} must use an @graph array`);

  // WebSite Entity Verification
  const webSite = parsed['@graph'].find((e) => e['@type'] === 'WebSite');
  assert.ok(webSite, `${label} must contain a WebSite entity`);
  assert.strictEqual(webSite['@id'], 'https://sociedadeativa.github.io/#website', 'WebSite @id must match canonical site URL');
  assert.strictEqual(webSite.url, 'https://sociedadeativa.github.io/', 'WebSite url must match canonical URL');
  assert.strictEqual(webSite.name, 'Sociedade Ativa', 'WebSite name must be "Sociedade Ativa"');
  assert.strictEqual(webSite.inLanguage, 'pt-BR', 'WebSite language must be pt-BR');
  assert.ok(webSite.publisher, 'WebSite must specify a publisher');

  // NewsMediaOrganization Entity Verification
  const org = parsed['@graph'].find((e) => e['@type'] === 'NewsMediaOrganization');
  assert.ok(org, `${label} must contain a NewsMediaOrganization entity`);
  assert.strictEqual(org['@id'], 'https://sociedadeativa.github.io/#organization', 'Organization @id must match canonical organization ID');
  assert.strictEqual(org.name, 'Sociedade Ativa', 'Organization name must be "Sociedade Ativa"');
  assert.strictEqual(org.url, 'https://sociedadeativa.github.io/', 'Organization URL must match canonical URL');

  // Validate Logo URL
  assert.ok(org.logo, `${label} NewsMediaOrganization must specify a logo`);
  const logoUrl = typeof org.logo === 'string' ? org.logo : org.logo.url;
  assert.ok(logoUrl && typeof logoUrl === 'string', `${label} Organization logo must have a valid URL`);
  assert.ok(
    logoUrl.startsWith('https://sociedadeativa.github.io/'),
    `${label} Organization logo must use a canonical public URL`
  );

  // Verify the referenced logo file physically exists in public
  const relativeLogoPath = logoUrl.replace('https://sociedadeativa.github.io/', '');
  const physicalLogoPath = path.join(rootDir, 'public', relativeLogoPath);
  assert.ok(fs.existsSync(physicalLogoPath), `Referenced logo file must exist at ${physicalLogoPath}`);

  // 2. Verify No Stale NewsArticle on Homepage
  const staleHeadline = 'TSE homologa 100% da totalização do 1º turno com Flávio Bolsonaro e Lula no 2º turno';
  assert.ok(
    !html.includes(staleHeadline),
    `${label} must not contain stale NewsArticle headline ("${staleHeadline}")`
  );
  assert.ok(
    !rawJson.includes('article-apuracao'),
    `${label} JSON-LD must not contain stale article-apuracao ID`
  );

  const newsArticle = parsed['@graph'].find((e) => e['@type'] === 'NewsArticle');
  if (newsArticle) {
    // If a NewsArticle is ever dynamically placed on the homepage, it must not conflict with canonical URLs
    assert.notStrictEqual(
      newsArticle.headline,
      staleHeadline,
      `${label} NewsArticle headline must not be the stale placeholder`
    );
    assert.ok(newsArticle.datePublished, `${label} NewsArticle must have valid datePublished`);
    assert.ok(!isNaN(new Date(newsArticle.datePublished).getTime()), `${label} datePublished must be ISO 8601`);
  } else {
    console.log(`  [PASS] ${label} cleanly delegates NewsArticle exclusively to individual article pages.`);
  }

  // Canonical URL Check
  assert.ok(
    html.includes('<link rel="canonical" href="https://sociedadeativa.github.io/" />'),
    `${label} must have exact homepage canonical link`
  );
};

checkHomepageHtml(path.join(rootDir, 'index.html'), 'index.html (source)');
if (fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
  checkHomepageHtml(path.join(rootDir, 'dist', 'index.html'), 'dist/index.html (build)');
}
console.log('  [PASS] Homepage structured data verified with WebSite + NewsMediaOrganization and valid logo.');

// 3. Verify Article Pages Retain Their Own Distinct NewsArticle JSON-LD
console.log('\n[TEST 2] Article Pages NewsArticle Structured Data Retention');
const newsDataPath = path.join(rootDir, 'public', 'data', 'newsData.json');
assert.ok(fs.existsSync(newsDataPath), 'public/data/newsData.json must exist');
const newsData = JSON.parse(fs.readFileSync(newsDataPath, 'utf8'));

// Test first 5 and last 5 articles
const sampleArticles = [
  ...newsData.slice(0, 5),
  ...newsData.slice(-5),
];

for (const article of sampleArticles) {
  const articleHtmlPath = path.join(rootDir, 'dist', 'noticias', article.id, 'index.html');
  if (fs.existsSync(articleHtmlPath)) {
    const articleHtml = fs.readFileSync(articleHtmlPath, 'utf8');
    const match = articleHtml.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    assert.ok(match, `Article page ${article.id} must contain JSON-LD block`);

    const ld = JSON.parse(match[1]);
    assert.strictEqual(ld['@context'], 'https://schema.org', `Article ${article.id} @context must be schema.org`);
    assert.strictEqual(ld['@type'], 'NewsArticle', `Article ${article.id} @type must be NewsArticle`);
    assert.strictEqual(ld.headline, article.title, `Article ${article.id} headline must match article.title`);
    assert.ok(ld.datePublished, `Article ${article.id} must have datePublished`);
    assert.ok(!isNaN(new Date(ld.datePublished).getTime()), `Article ${article.id} datePublished must be valid ISO date`);
    assert.strictEqual(
      ld.mainEntityOfPage?.['@id'],
      `https://sociedadeativa.github.io/noticias/${article.id}/`,
      `Article ${article.id} mainEntityOfPage must point to its own canonical URL`
    );
    assert.strictEqual(
      ld.publisher?.name,
      'Sociedade Ativa',
      `Article ${article.id} publisher must be Sociedade Ativa`
    );
  }
}
console.log(`  [PASS] Sampled article pages retain individual canonical NewsArticle structured data.`);

// 4. Verify No Conflicting Canonical URLs between Homepage and Articles
console.log('\n[TEST 3] Absence of Conflicting Canonical URLs or Duplicate Entities');
const homepageDistPath = path.join(rootDir, 'dist', 'index.html');
if (fs.existsSync(homepageDistPath)) {
  const homepageHtml = fs.readFileSync(homepageDistPath, 'utf8');
  assert.ok(
    !homepageHtml.includes('https://sociedadeativa.github.io/noticias/'),
    'Homepage JSON-LD or canonical tag must not claim an article page canonical URL'
  );
  console.log('  [PASS] No conflicting canonical URLs or cross-page entity leaks detected.');
}

console.log('\n=== ALL HOMEPAGE STRUCTURED DATA TESTS PASSED ===\n');
