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
console.log("\n[TEST 1] Route-Level Code Splitting in App.tsx");
const appPath = path.join(rootDir, "src", "App.tsx");
const appContent = fs.readFileSync(appPath, "utf-8");

assert.ok(
  appContent.includes("lazy(") && appContent.includes("Suspense"),
  "App.tsx must use React.lazy and Suspense for route code splitting"
);

const expectedLazyPages = [
  "HomePage",
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
console.log(`  [PASS] All ${expectedLazyPages.length} portal pages are code-split using React.lazy and Suspense.`);

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
  homeContent.includes("const BrazilMap = lazy(") && homeContent.includes("BrazilMapSkeleton"),
  "HomePage.tsx must lazy-load BrazilMap with BrazilMapSkeleton"
);
assert.ok(
  homeContent.includes("const RegionalCharts = lazy(") && homeContent.includes("RegionalChartsSkeleton"),
  "HomePage.tsx must lazy-load RegionalCharts with RegionalChartsSkeleton"
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
console.log("  [PASS] Heavy map geometries, regional charts, and large tables are deferred below the fold.");

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

// The un-split baseline was 2,052 kB. It should now be well under 150 kB!
assert.ok(
  mainBundleSizeKb < 150,
  `Main entry bundle must be under 150 kB (measured ${mainBundleSizeKb.toFixed(2)} kB, baseline was 2052 kB)`
);

// Verify isolated BrazilMap chunk exists
const mapChunk = assetFiles.find((f) => f.startsWith("BrazilMap-") && f.endsWith(".js"));
assert.ok(mapChunk, "BrazilMap should be code-split into an isolated chunk");

// Verify vendor-react chunk exists
const reactChunk = assetFiles.find((f) => f.startsWith("vendor-react-") && f.endsWith(".js"));
assert.ok(reactChunk, "vendor-react should be separated for optimal browser caching");

console.log(`  [PASS] Main bundle size reduced from 2,052.03 kB to ${mainBundleSizeKb.toFixed(2)} kB (>95% reduction).`);
console.log("\n======================================================================");
console.log("ALL 5 PERFORMANCE & CODE SPLITTING AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
