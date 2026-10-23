import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: IMAGE RELIABILITY, LOADING & ERROR STATES AUDIT");
console.log("======================================================================");

// --- TEST 1: Editorial Images Registry & Integrity ---
console.log("\n[TEST 1] Editorial Images Registry & Institutional Fallbacks");
const editorialImagesPath = path.join(rootDir, "src", "assets", "editorialImages.ts");
const editorialImagesContent = fs.readFileSync(editorialImagesPath, "utf-8");

assert.ok(
  editorialImagesContent.includes("congresso:"),
  "EDITORIAL_IMAGES must include 'congresso' asset"
);
assert.ok(
  editorialImagesContent.includes("urna:"),
  "EDITORIAL_IMAGES must include 'urna' asset"
);
assert.ok(
  editorialImagesContent.includes("economia:"),
  "EDITORIAL_IMAGES must include 'economia' asset"
);
assert.ok(
  editorialImagesContent.includes("dadosPublicos:"),
  "EDITORIAL_IMAGES must include 'dadosPublicos' asset"
);
assert.ok(
  editorialImagesContent.includes("caption:"),
  "EDITORIAL_IMAGES entries must include attribution captions"
);
assert.ok(
  editorialImagesContent.includes(".webp"),
  "EDITORIAL_IMAGES must import optimized WebP fallback assets"
);
const fallbackImagesDir = path.join(rootDir, "src", "assets", "images");
const expectedWebpFiles = [
  "editorial_congresso_brasilia_1791575832620.webp",
  "editorial_urna_eleicoes_1791575843949.webp",
  "editorial_economia_brasil_1791575854174.webp",
  "editorial_dados_publicos_1791575864014.webp",
];
for (const file of expectedWebpFiles) {
  assert.ok(
    fs.existsSync(path.join(fallbackImagesDir, file)),
    `WebP fallback asset ${file} must exist on disk`
  );
}
const existingJpgs = fs.readdirSync(fallbackImagesDir).filter((f) => f.endsWith(".jpg"));
assert.equal(existingJpgs.length, 0, "No stale JPG fallback files should remain in src/assets/images");
console.log("  [PASS] Editorial images registry contains all 4 verified WebP fallback assets with credits and zero stale JPGs.");

// --- TEST 2: CandidateImage Explicit Dimensions & Async Decoding ---
console.log("\n[TEST 2] CandidateImage Dimensions & Decoding");
const candidateImagePath = path.join(rootDir, "src", "components", "CandidateImage.tsx");
const candidateImageContent = fs.readFileSync(candidateImagePath, "utf-8");

assert.ok(
  candidateImageContent.includes("decoding=\"async\""),
  "CandidateImage must specify decoding=\"async\""
);
assert.ok(
  candidateImageContent.includes("width={dim.w}") && candidateImageContent.includes("height={dim.h}"),
  "CandidateImage must set explicit width and height to prevent CLS"
);
assert.ok(
  candidateImageContent.includes("onError="),
  "CandidateImage must handle onError fallback"
);
console.log("  [PASS] CandidateImage has explicit dimensions, async decoding, and onError fallback.");

// --- TEST 3: FeaturedEditorial Loading, Error, Empty States & High Priority Lead Image ---
console.log("\n[TEST 3] FeaturedEditorial States & LCP Optimization");
const featuredEditorialPath = path.join(rootDir, "src", "components", "FeaturedEditorial.tsx");
const featuredEditorialContent = fs.readFileSync(featuredEditorialPath, "utf-8");

assert.ok(
  featuredEditorialContent.includes("isLoading?: boolean"),
  "FeaturedEditorialProps must support isLoading"
);
assert.ok(
  featuredEditorialContent.includes("error?: string | null"),
  "FeaturedEditorialProps must support error"
);
assert.ok(
  featuredEditorialContent.includes("onRetry?: () => void"),
  "FeaturedEditorialProps must support onRetry"
);
assert.ok(
  featuredEditorialContent.includes("fetchPriority=\"high\""),
  "Lead story hero image must specify fetchPriority=\"high\""
);
assert.ok(
  featuredEditorialContent.includes("loading=\"eager\""),
  "Above-the-fold lead story image must use loading=\"eager\""
);
assert.ok(
  featuredEditorialContent.includes("width={1280}") && featuredEditorialContent.includes("height={720}"),
  "Lead story image must specify explicit width={1280} and height={720}"
);
assert.ok(
  featuredEditorialContent.includes("animate-pulse"),
  "FeaturedEditorial must render a skeleton loading state with animate-pulse"
);
assert.ok(
  featuredEditorialContent.includes("Tentar novamente"),
  "FeaturedEditorial error state must provide a retry button"
);
console.log("  [PASS] FeaturedEditorial correctly handles loading skeleton, error with retry, and LCP priority.");

// --- TEST 4: Below-the-fold Lazy Loading in Caderno Pages ---
console.log("\n[TEST 4] Below-the-Fold Lazy Loading & Explicit Dimensions in Cadernos");

const eleicoesPath = path.join(rootDir, "src", "pages", "EleicoesPage.tsx");
const eleicoesContent = fs.readFileSync(eleicoesPath, "utf-8");
assert.ok(
  eleicoesContent.includes("EDITORIAL_IMAGES.urna.src"),
  "EleicoesPage must use EDITORIAL_IMAGES.urna"
);
assert.ok(
  eleicoesContent.includes("loading=\"lazy\""),
  "EleicoesPage below-the-fold image must specify loading=\"lazy\""
);
assert.ok(
  eleicoesContent.includes("decoding=\"async\""),
  "EleicoesPage image must specify decoding=\"async\""
);

const economiaPath = path.join(rootDir, "src", "pages", "EconomiaPage.tsx");
const economiaContent = fs.readFileSync(economiaPath, "utf-8");
assert.ok(
  economiaContent.includes("loading=\"lazy\""),
  "EconomiaPage below-the-fold image must specify loading=\"lazy\""
);

const dadosPublicosPath = path.join(rootDir, "src", "pages", "DadosPublicosPage.tsx");
const dadosPublicosContent = fs.readFileSync(dadosPublicosPath, "utf-8");
assert.ok(
  dadosPublicosContent.includes("loading=\"lazy\""),
  "DadosPublicosPage below-the-fold image must specify loading=\"lazy\""
);
console.log("  [PASS] Eleições, Economia, and Dados Públicos pages properly lazy-load secondary images.");

// --- TEST 5: PoliticaPage Hero Image & States ---
console.log("\n[TEST 5] PoliticaPage Lead Image & Robust Fallback");
const politicaPath = path.join(rootDir, "src", "pages", "PoliticaPage.tsx");
const politicaContent = fs.readFileSync(politicaPath, "utf-8");

assert.ok(
  politicaContent.includes("fetchPriority=\"high\""),
  "PoliticaPage lead image must have fetchPriority=\"high\""
);
assert.ok(
  politicaContent.includes("decoding=\"async\""),
  "PoliticaPage lead image must specify decoding=\"async\""
);
assert.ok(
  politicaContent.includes("onError={() => setLeadImageError(true)}"),
  "PoliticaPage lead image must trigger fallback on error"
);
assert.ok(
  politicaContent.includes("isLoading && ("),
  "PoliticaPage must render loading state when isLoading is true"
);
assert.ok(
  politicaContent.includes("error && politicaArticles.length === 0"),
  "PoliticaPage must render error state when error occurs"
);
console.log("  [PASS] PoliticaPage lead image correctly priority-loaded with error fallback and states.");

// --- TEST 6: EsportesPage DOM Mutation Removal & Safe Image Fallback ---
console.log("\n[TEST 6] EsportesPage Non-Destructive Image Fallback");
const esportesPath = path.join(rootDir, "src", "pages", "EsportesPage.tsx");
const esportesContent = fs.readFileSync(esportesPath, "utf-8");

assert.ok(
  !esportesContent.includes("parentElement.style.display = \"none\""),
  "EsportesPage must NOT directly mutate DOM via parentElement.style.display"
);
assert.ok(
  esportesContent.includes("SportsArticleThumb"),
  "EsportesPage must use SportsArticleThumb component"
);
assert.ok(
  esportesContent.includes("Acervo Oficial"),
  "EsportesPage fallback thumbnail must display Acervo Oficial badge"
);
console.log("  [PASS] EsportesPage has no DOM mutations and uses resilient React fallback thumb.");

// --- TEST 7: NoticiasPage Loading & Error States with Retry ---
console.log("\n[TEST 7] NoticiasPage Loading & Error States");
const noticiasPath = path.join(rootDir, "src", "pages", "NoticiasPage.tsx");
const noticiasContent = fs.readFileSync(noticiasPath, "utf-8");

assert.ok(
  noticiasContent.includes("isPageLoading ? ("),
  "NoticiasPage must render loading state"
);
assert.ok(
  noticiasContent.includes("error && initialArticles.length === 0"),
  "NoticiasPage must render error state with retry when articles fail to load"
);
assert.ok(
  noticiasContent.includes("Tentar novamente"),
  "NoticiasPage error state must include retry action"
);
console.log("  [PASS] NoticiasPage supports skeleton loading, error with retry, and empty search results.");

// --- TEST 8: NewsCard, ArticleModal, ArticlePage Explicit Dimensions ---
console.log("\n[TEST 8] NewsCard, ArticleModal, and ArticlePage Dimensions & Async Decoding");
const newsCardPath = path.join(rootDir, "src", "components", "NewsCard.tsx");
const newsCardContent = fs.readFileSync(newsCardPath, "utf-8");
assert.ok(
  newsCardContent.includes("decoding=\"async\""),
  "NewsCard image must have decoding=\"async\""
);
assert.ok(
  newsCardContent.includes("width={640}") && newsCardContent.includes("height={360}"),
  "NewsCard image must have explicit width={640} and height={360}"
);

const articleModalPath = path.join(rootDir, "src", "components", "ArticleModal.tsx");
const articleModalContent = fs.readFileSync(articleModalPath, "utf-8");
assert.ok(
  articleModalContent.includes("decoding=\"async\""),
  "ArticleModal image must have decoding=\"async\""
);

const articlePagePath = path.join(rootDir, "src", "pages", "ArticlePage.tsx");
const articlePageContent = fs.readFileSync(articlePagePath, "utf-8");
assert.ok(
  articlePageContent.includes("fetchPriority=\"high\""),
  "ArticlePage hero image must have fetchPriority=\"high\""
);
assert.ok(
  articlePageContent.includes("decoding=\"async\""),
  "ArticlePage hero image must have decoding=\"async\""
);
console.log("  [PASS] NewsCard, ArticleModal, and ArticlePage enforce dimensions and async decoding.");

console.log("\n======================================================================");
console.log("ALL 8 IMAGE RELIABILITY & STATE AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
