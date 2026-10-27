import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getLeadArticleImageUrl,
  injectHomepageLcpPreload,
  parseNewsDateToTimestamp,
  sortNewsItems,
  deduplicateNewsItems,
  isValidImageUrl,
} from "../scripts/generate-article-pages.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDataFile = path.join(rootDir, "public", "data", "newsData.json");

console.log("======================================================================");
console.log("TEST SUITE: DYNAMIC LCP IMAGE PRELOAD AUDIT FOR HOMEPAGE");
console.log("======================================================================");

// Carrega dataset oficial de notícias
assert.ok(fs.existsSync(publicDataFile), "public/data/newsData.json must exist");
const rawArticles = JSON.parse(fs.readFileSync(publicDataFile, "utf8"));
assert.ok(Array.isArray(rawArticles) && rawArticles.length > 0, "Articles dataset must be non-empty");

// --- TEST 1: Identificação exata da matéria líder e URL da imagem ---
console.log("\n[TEST 1] Lead Article Selection & URL Parity with FeaturedEditorial");
const validArticles = sortNewsItems(deduplicateNewsItems(rawArticles));
const expectedLead = validArticles[0];
assert.ok(expectedLead, "Must determine a valid lead article");
assert.ok(expectedLead.id, "Lead article must have an ID");

const leadImageUrl = getLeadArticleImageUrl(rawArticles, distDir);
assert.ok(leadImageUrl, "Lead article image URL must be resolved");
assert.equal(
  leadImageUrl,
  expectedLead.imageUrl.trim(),
  "Resolved image URL must exactly match the lead article imageUrl"
);
if (expectedLead.imageUrl.includes("?")) {
  assert.ok(
    leadImageUrl.includes("?"),
    "Image URL parameters (e.g. ?itok=...) must be preserved character-for-character"
  );
}
console.log(`  [PASS] Lead article identified: "${expectedLead.id}" with image URL "${leadImageUrl}"`);

// --- TEST 2: Presença do Preload em dist/index.html com fetchpriority="high" ---
console.log("\n[TEST 2] Verify dist/index.html Preload Tag & Single Occurrence");
const indexHtmlPath = path.join(distDir, "index.html");
assert.ok(fs.existsSync(indexHtmlPath), "dist/index.html must exist");
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf8");

// Deve conter exatamente uma tag de preload de imagem
const preloadMatches = [
  ...indexHtmlContent.matchAll(/<link\s+rel=["']preload["']\s+as=["']image["'][^>]*>/gi),
];
assert.equal(
  preloadMatches.length,
  1,
  `dist/index.html must contain exactly one <link rel="preload" as="image"> tag (found ${preloadMatches.length})`
);

const preloadTag = preloadMatches[0][0];
assert.ok(
  preloadTag.includes(`href="${leadImageUrl}"`),
  `Preload tag href must match lead image URL (${leadImageUrl})`
);
assert.ok(
  preloadTag.includes('fetchpriority="high"'),
  'Preload tag must include fetchpriority="high"'
);
assert.ok(
  preloadTag.includes('referrerpolicy="no-referrer"'),
  'Preload tag must include referrerpolicy="no-referrer" to match FeaturedEditorial.tsx'
);
console.log(`  [PASS] dist/index.html contains exact single preload: ${preloadTag.trim()}`);

// --- TEST 3: Prevenção de Duplicatas em Re-execuções Sucessivas ---
console.log("\n[TEST 3] Idempotence & Duplicate Prevention");
// Executa injeção 3 vezes seguidas no mesmo arquivo
injectHomepageLcpPreload(rawArticles, distDir);
injectHomepageLcpPreload(rawArticles, distDir);
injectHomepageLcpPreload(rawArticles, distDir);

const recheckedHtml = fs.readFileSync(indexHtmlPath, "utf8");
const recheckedMatches = [
  ...recheckedHtml.matchAll(/<link\s+rel=["']preload["']\s+as=["']image["'][^>]*>/gi),
];
assert.equal(
  recheckedMatches.length,
  1,
  "Successive executions must never duplicate preload tags"
);
console.log("  [PASS] Multiple runs remain strictly idempotent with exactly 1 preload tag.");

// --- TEST 4: Prevenção de URLs Obsoletas (Stale URLs) ao Mudar Notícia Líder ---
console.log("\n[TEST 4] Dynamic Update & Stale URL Elimination");
// Cria cópia temporária do HTML para teste de mutação de dataset
const tempHtmlPath = path.join(distDir, "test-temp-index.html");
fs.writeFileSync(tempHtmlPath, indexHtmlContent, "utf8");

const mockOldImageUrl = "https://imagens.ebc.com.br/old-stale-image-sample.jpg?itok=old123";
const mockNewImageUrl = "https://imagens.ebc.com.br/new-lead-image-fresh.jpg?itok=new456";

// 1. Simula dataset com notícia antiga
const mockDatasetOld = [
  {
    id: "art-mock-old",
    title: "Notícia Anterior",
    publishedAt: "22/10/2026 às 10:00",
    category: "Eleições",
    imageUrl: mockOldImageUrl,
  },
];

// Injeta a notícia antiga em diretório temporário simulado
const tempDir = path.join(rootDir, "dist-temp-test");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(path.join(tempDir, "index.html"), indexHtmlContent, "utf8");

injectHomepageLcpPreload(mockDatasetOld, tempDir);
let tempHtml = fs.readFileSync(path.join(tempDir, "index.html"), "utf8");
assert.ok(
  tempHtml.includes(mockOldImageUrl),
  "Temporary HTML must have old image preload initially"
);

// 2. Simula publicação de nova matéria mais recente (timestamp posterior)
const mockDatasetNew = [
  {
    id: "art-mock-new",
    title: "Nova Notícia Mais Recente",
    publishedAt: "22/10/2026 às 15:30",
    category: "Eleições",
    imageUrl: mockNewImageUrl,
  },
  ...mockDatasetOld,
];

injectHomepageLcpPreload(mockDatasetNew, tempDir);
tempHtml = fs.readFileSync(path.join(tempDir, "index.html"), "utf8");

// A URL antiga NUNCA deve persistir
assert.ok(
  !tempHtml.includes(mockOldImageUrl),
  "Stale image URL must be completely purged when new lead article arrives"
);
assert.ok(
  tempHtml.includes(mockNewImageUrl),
  "New image URL must be injected into the preload tag"
);

// Limpeza do diretório temporário de teste
fs.rmSync(tempDir, { recursive: true, force: true });
console.log("  [PASS] Stale image URLs are strictly removed when newer lead articles are published.");

// --- TEST 5: Fallback Gracioso para Imagens Ausentes ou Inválidas ---
console.log("\n[TEST 5] Safe Handling of Missing or Invalid Image URLs");
const mockDatasetNoImage = [
  {
    id: "art-no-img",
    title: "Matéria sem foto",
    publishedAt: "22/10/2026 às 16:00",
    category: "Economia",
    imageUrl: null,
  },
];

const fallbackUrl = getLeadArticleImageUrl(mockDatasetNoImage, distDir);
assert.ok(
  fallbackUrl && fallbackUrl.includes("editorial_economia_brasil"),
  `Must fallback to institutional economy asset (got ${fallbackUrl})`
);

const mockEmptyDataset = [];
const emptyFallback = getLeadArticleImageUrl(mockEmptyDataset, distDir);
assert.equal(emptyFallback, null, "Empty dataset must safely return null without throwing");

console.log("  [PASS] Missing and invalid image URLs safely fallback or omit preload gracefully.");

// --- TEST 6: Preservação do SPA Root, Scripts e SEO na Homepage ---
console.log("\n[TEST 6] Preservation of SPA Root, React Mounting and SEO");
assert.ok(
  indexHtmlContent.includes('<div id="root"></div>'),
  "dist/index.html must keep an empty <div id=\"root\"></div> for React SPA mounting"
);
assert.ok(
  indexHtmlContent.includes('oZPS6sfWTE5EJAuLOsZCtq9UoF1lh4wMhD9Jz13OTSs'),
  "dist/index.html must preserve Google Site Verification"
);
assert.ok(
  indexHtmlContent.includes('rel="canonical"'),
  "dist/index.html must preserve canonical link"
);
assert.ok(
  indexHtmlContent.includes('type="module"'),
  "dist/index.html must preserve Vite module scripts"
);
console.log("  [PASS] SPA root, React scripts, and SEO metadata are 100% preserved.");

console.log("\n======================================================================");
console.log("ALL 6 DYNAMIC LCP PRELOAD AUDIT TESTS PASSED WITH 100% SUCCESS!");
console.log("======================================================================");
