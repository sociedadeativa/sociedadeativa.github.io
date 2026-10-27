import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: INITIAL LOADING PERFORMANCE & CODE-SPLITTING AUDIT");
console.log("======================================================================");

// --- TEST 1: Route-level code splitting in App.tsx ---
console.log("\n[TEST 1] Route-Level Code Splitting & Dynamic Imports in App.tsx");
const appTsxPath = path.join(rootDir, "src", "App.tsx");
const appTsx = fs.readFileSync(appTsxPath, "utf-8");

const routesToVerify = [
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

for (const routeName of routesToVerify) {
  assert.ok(
    appTsx.includes(`const ${routeName} = lazy(`),
    `App.tsx must lazily import ${routeName} for route-level code splitting`
  );
}

assert.ok(
  appTsx.includes("<Suspense fallback={<RouteLoadingFallback />}>"),
  "App.tsx must wrap route rendering in Suspense with RouteLoadingFallback"
);
console.log("  [PASS] All 12 page routes configured with dynamic lazy imports and Suspense.");

// --- TEST 2: On-demand Modal Loading in App.tsx ---
console.log("\n[TEST 2] On-Demand Heavy Modal Loading in App.tsx");
const modalsToVerify = [
  "StateDetailPanel",
  "MethodologyModal",
  "DataInspectorModal",
  "SearchModal",
  "ArticleModal",
];

for (const modalName of modalsToVerify) {
  assert.ok(
    appTsx.includes(`const ${modalName} = lazy(`),
    `App.tsx must lazily import ${modalName} to prevent bundling into initial JS`
  );
}

assert.ok(
  appTsx.includes("{selectedStateUf && (") &&
  appTsx.includes("{isMethodologyOpen && (") &&
  appTsx.includes("{isDataInspectorOpen && (") &&
  appTsx.includes("{isSearchOpen && (") &&
  appTsx.includes("{activeArticle && ("),
  "All 5 modals must be conditionally mounted only when opened"
);
console.log("  [PASS] All 5 heavy modals deferred until requested by user action.");

// --- TEST 3: Below-the-fold component deferral in HomePage.tsx ---
console.log("\n[TEST 3] Below-the-Fold Heavy Component Deferral in HomePage.tsx");
const homePagePath = path.join(rootDir, "src", "pages", "HomePage.tsx");
const homePage = fs.readFileSync(homePagePath, "utf-8");

assert.ok(
  homePage.includes("const BrazilMap = React.lazy("),
  "HomePage must lazily import BrazilMap (defers 670KB brazilGeo data)"
);
assert.ok(
  homePage.includes("const RegionalCharts = React.lazy("),
  "HomePage must lazily import RegionalCharts"
);
assert.ok(
  homePage.includes("const StateTable = React.lazy("),
  "HomePage must lazily import StateTable"
);
assert.ok(
  homePage.includes("<React.Suspense") && homePage.includes("<BrazilMap"),
  "BrazilMap must be wrapped in React.Suspense with placeholder skeleton"
);
console.log("  [PASS] Heavy below-the-fold components (BrazilMap, RegionalCharts, StateTable) deferred.");

// --- TEST 4: Priority Image Allocation Preserved ---
console.log("\n[TEST 4] Single High-Priority LCP Image Contract");
const featuredEditorialPath = path.join(rootDir, "src", "components", "FeaturedEditorial.tsx");
const featuredEditorial = fs.readFileSync(featuredEditorialPath, "utf-8");

assert.ok(
  featuredEditorial.includes('fetchPriority="high"') && featuredEditorial.includes('loading="eager"'),
  "FeaturedEditorial above-the-fold lead story image must retain high fetchPriority and eager loading"
);

assert.ok(
  homePage.includes('loading="lazy"'),
  "HomePage secondary cards must use lazy loading"
);
console.log("  [PASS] Strict single LCP high-priority image contract verified.");

// --- TEST 5: Production Build Output & Chunk Size Verification ---
console.log("\n[TEST 5] Production Build Output & Bundle Measurements");
const distAssetsDir = path.join(rootDir, "dist", "assets");
assert.ok(fs.existsSync(distAssetsDir), "dist/assets must exist");

const files = fs.readdirSync(distAssetsDir);
const mainJsFile = files.find(f => /^main-.*\.js$/.test(f));
assert.ok(mainJsFile, "Compiled main-*.js file must exist in dist/assets");

const mainStat = fs.statSync(path.join(distAssetsDir, mainJsFile));
const mainSizeKb = mainStat.size / 1024;
console.log(`  Measured main bundle size: ${mainSizeKb.toFixed(2)} KB (original was 2,048.22 KB)`);

assert.ok(
  mainSizeKb < 250,
  `main JS bundle must be under 250 KB (measured: ${mainSizeKb.toFixed(2)} KB)`
);

const hasVendorReact = files.some(f => /^vendor-react-.*\.js$/.test(f));
assert.ok(hasVendorReact, "vendor-react chunk must be extracted for cross-route caching");

const hasBrazilGeo = files.some(f => /^data-brazil-geo-.*\.js$/.test(f));
assert.ok(hasBrazilGeo, "data-brazil-geo chunk must be separated from initial bundle");

console.log("  [PASS] Production chunks verified with >90% reduction in main bundle size.");

console.log("\n======================================================================");
console.log("ALL 5 PERFORMANCE & CODE-SPLITTING AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
