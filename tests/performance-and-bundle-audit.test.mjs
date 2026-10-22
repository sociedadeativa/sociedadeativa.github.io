import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: PERFORMANCE, CODE SPLITTING & BUNDLE SIZE AUDIT");
console.log("======================================================================");

// --- TEST 1: Route-Level Code Splitting in App.tsx ---
console.log("\n[TEST 1] Route-Level Code Splitting & Critical LCP Path in App.tsx");
const appPath = path.join(rootDir, "src", "App.tsx");
const appContent = fs.readFileSync(appPath, "utf-8");

assert.ok(
  appContent.includes("lazy(") && appContent.includes("Suspense"),
  "App.tsx must use React.lazy and Suspense for route code splitting"
);

// HomePage must be imported directly to eliminate LCP waterfall
assert.ok(
  appContent.includes('import { HomePage } from "./pages/HomePage";'),
  "App.tsx must import HomePage directly to ensure zero waterfall delay for the LCP viewport"
);

// All 11 secondary routes must be code-split and lazy-loaded
const expectedLazyPages = [
  "PoliticaPage",
  "EleicoesPage",
  "EconomiaPage",
  "EstadosPage",
  "DadosPublicosPage",
  "NoticiasPage",
  "EsportesPage",
  "TecnologiaPage",
  "ClimaPage",
  "SobrePage",
  "ArticlePage",
];

for (const page of expectedLazyPages) {
  assert.ok(
    appContent.includes(`const ${page} = lazy(`),
    `App.tsx must lazy-load ${page}`
  );
}
assert.ok(
  appContent.includes("<Suspense fallback="),
  "App.tsx main content must be wrapped in Suspense with accessible fallback"
);
console.log(`  [PASS] HomePage is eagerly mounted for instant LCP while all ${expectedLazyPages.length} secondary pages are code-split.`);

// --- TEST 2: On-Demand Modals and Inspectors ---
console.log("\n[TEST 2] On-Demand Loading for Modals & Heavy Panels");
const expectedLazyModals = [
  "StateDetailPanel",
  "MethodologyModal",
  "DataInspectorModal",
  "SearchModal",
  "ArticleModal",
];

for (const modal of expectedLazyModals) {
  assert.ok(
    appContent.includes(`const ${modal} = lazy(`),
    `App.tsx must lazy-load ${modal}`
  );
}
console.log(`  [PASS] All ${expectedLazyModals.length} modals and panels are deferred until opened.`);

// --- TEST 3: Below-the-Fold Heavy Component Deferral ---
console.log("\n[TEST 3] Below-the-Fold Heavy Component Deferral");
const homePath = path.join(rootDir, "src", "pages", "HomePage.tsx");
const homeContent = fs.readFileSync(homePath, "utf-8");

assert.ok(
  homeContent.includes("const NationalBanner = lazy(") && homeContent.includes("NationalBannerSkeleton"),
  "HomePage.tsx must lazy-load NationalBanner with NationalBannerSkeleton"
);
assert.ok(
  homeContent.includes("const BrazilMap = lazy(") && homeContent.includes("BrazilMapSkeleton"),
  "HomePage.tsx must lazy-load BrazilMap with BrazilMapSkeleton"
);
assert.ok(
  homeContent.includes("const RegionalCharts = lazy(") && homeContent.includes("RegionalChartsSkeleton"),
  "HomePage.tsx must lazy-load RegionalCharts with RegionalChartsSkeleton"
);
assert.ok(
  homeContent.includes("const EconomySection = lazy(") && homeContent.includes("EconomySectionSkeleton"),
  "HomePage.tsx must lazy-load EconomySection with EconomySectionSkeleton"
);
assert.ok(
  homeContent.includes("const BolsaSection = lazy(") && homeContent.includes("BolsaSectionSkeleton"),
  "HomePage.tsx must lazy-load BolsaSection with BolsaSectionSkeleton"
);
assert.ok(
  homeContent.includes("const NewsSection = lazy(") && homeContent.includes("NewsSectionSkeleton"),
  "HomePage.tsx must lazy-load NewsSection with NewsSectionSkeleton"
);
assert.ok(
  homeContent.includes("const StateTable = lazy(") && homeContent.includes("StateTableSkeleton"),
  "HomePage.tsx must lazy-load StateTable with StateTableSkeleton"
);

const estadosPath = path.join(rootDir, "src", "pages", "EstadosPage.tsx");
const estadosContent = fs.readFileSync(estadosPath, "utf-8");
assert.ok(
  estadosContent.includes("const BrazilMap = lazy(") && estadosContent.includes("const StateTable = lazy("),
  "EstadosPage.tsx must lazy-load BrazilMap and StateTable"
);
console.log("  [PASS] Below-the-fold sections (NationalBanner, BrazilMap, RegionalCharts, EconomySection, BolsaSection, NewsSection, StateTable) are deferred.");

// --- TEST 4: Editorial Image Priority Integrity ---
console.log("\n[TEST 4] Editorial Image Priority & Low Priority on Non-Critical Images");
const featuredEditorialPath = path.join(rootDir, "src", "components", "FeaturedEditorial.tsx");
const featuredEditorialContent = fs.readFileSync(featuredEditorialPath, "utf-8");

assert.ok(
  featuredEditorialContent.includes('fetchPriority="high"') &&
  featuredEditorialContent.includes('loading="eager"'),
  "FeaturedEditorial must preserve fetchPriority='high' and loading='eager' on the LCP lead story"
);

// Verify no secondary images have fetchPriority="high" in news cards or below fold
const newsCardPath = path.join(rootDir, "src", "components", "NewsCard.tsx");
const newsCardContent = fs.readFileSync(newsCardPath, "utf-8");
assert.ok(
  !newsCardContent.includes('fetchPriority="high"') && newsCardContent.includes('loading="lazy"'),
  "NewsCard must NOT use high fetchPriority and must use loading='lazy'"
);
console.log("  [PASS] Main editorial image preserves LCP priority without non-critical images competing.");

// --- TEST 4B: Critical Resource Discovery Path & Asset Optimization ---
console.log("\n[TEST 4B] index.html Critical Discovery & Asset Compression");
const indexHtmlPath = path.join(rootDir, "index.html");
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");

// Must preconnect to verified LCP image origin
assert.ok(
  indexHtmlContent.includes('rel="preconnect"') && indexHtmlContent.includes('https://imagens.ebc.com.br'),
  "index.html must preconnect to active LCP image domain (https://imagens.ebc.com.br)"
);

// Must not retain obsolete Câmara image preload
assert.ok(
  !indexHtmlContent.includes('img20230424110822774'),
  "index.html must not contain obsolete Câmara image preload"
);

assert.ok(
  indexHtmlContent.includes('media="print" onload="this.media=\'all\'"') || indexHtmlContent.includes('rel="preload" as="style"'),
  "index.html must load Google Fonts without blocking initial render"
);
assert.ok(
  indexHtmlContent.includes('crossorigin') && indexHtmlContent.includes('fonts.gstatic.com'),
  "index.html preconnect to fonts.gstatic.com must include crossorigin attribute"
);

// Check that the 4 fallback images are compressed (< 250 kB each)
const imagesDir = path.join(rootDir, "src", "assets", "images");
const fallbackFiles = [
  "editorial_congresso_brasilia_1791575832620.jpg",
  "editorial_urna_eleicoes_1791575843949.jpg",
  "editorial_economia_brasil_1791575854174.jpg",
  "editorial_dados_publicos_1791575864014.jpg",
];
for (const imgName of fallbackFiles) {
  const stat = fs.statSync(path.join(imagesDir, imgName));
  const sizeKb = stat.size / 1024;
  assert.ok(
    sizeKb < 250,
    `Fallback image ${imgName} must be under 250 kB (measured ${sizeKb.toFixed(1)} kB)`
  );
}
console.log("  [PASS] index.html active LCP preconnect, non-blocking fonts, and compressed assets verified.");

// --- TEST 5: Production Bundle Measurements & Chunks ---
console.log("\n[TEST 5] Production Bundle & Chunks Audit");
const distAssetsDir = path.join(rootDir, "dist", "assets");
assert.ok(fs.existsSync(distAssetsDir), "dist/assets must exist");

const assetFiles = fs.readdirSync(distAssetsDir);
const mainBundle = assetFiles.find((f) => f.startsWith("main-") && f.endsWith(".js"));
assert.ok(mainBundle, "Main JS entry bundle must exist in dist/assets");

const mainBundleStat = fs.statSync(path.join(distAssetsDir, mainBundle));
const mainBundleSizeKb = mainBundleStat.size / 1024;

console.log(`  Measured main entry bundle: ${mainBundle} = ${mainBundleSizeKb.toFixed(2)} kB`);

// The un-split baseline was 2,052 kB. It should now be well under 200 kB!
assert.ok(
  mainBundleSizeKb < 200,
  `Main entry bundle must be under 200 kB (measured ${mainBundleSizeKb.toFixed(2)} kB, baseline was 2052 kB)`
);

// Verify isolated BrazilMap chunk exists
const mapChunk = assetFiles.find((f) => f.startsWith("BrazilMap-") && f.endsWith(".js"));
assert.ok(mapChunk, "BrazilMap should be code-split into an isolated chunk");

// Verify vendor-react chunk exists
const reactChunk = assetFiles.find((f) => f.startsWith("vendor-react-") && f.endsWith(".js"));
assert.ok(reactChunk, "vendor-react should be separated for optimal browser caching");

console.log(`  [PASS] Main bundle size reduced from 2,052.03 kB to ${mainBundleSizeKb.toFixed(2)} kB (>90% reduction).`);
console.log("\n======================================================================");
console.log("ALL 5 PERFORMANCE & CODE SPLITTING AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
