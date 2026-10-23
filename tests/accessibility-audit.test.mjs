import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: ACCESSIBILITY (A11Y) 4 PRIORITY AUDIT VERIFICATION");
console.log("======================================================================");

// --- TEST 1: Clearly visible keyboard focus styles ---
console.log("\n[TEST 1] Keyboard Focus Styles Verification");
const indexCssPath = path.join(rootDir, "src", "index.css");
const indexCss = fs.readFileSync(indexCssPath, "utf-8");

assert.ok(
  indexCss.includes(":focus-visible"),
  ":focus-visible base styles must be present in src/index.css"
);
assert.ok(
  indexCss.includes("outline: 2px solid #2563eb"),
  "High-contrast 2px blue focus outline must be configured for light backgrounds"
);
assert.ok(
  indexCss.includes("outline: 2px solid #60a5fa"),
  "High-contrast light blue focus outline must be configured for dark surfaces"
);
assert.ok(
  indexCss.includes(".brazil-state-path:focus-visible"),
  "SVG map state paths must have dedicated :focus-visible rules"
);
assert.ok(
  indexCss.includes("g[role=\"button\"]:focus-visible"),
  "SVG map connector buttons must have dedicated :focus-visible rules"
);
console.log("  [PASS] Global and SVG map focus styles verified.");

// --- TEST 2: Accessible names for search fields and filters ---
console.log("\n[TEST 2] Accessible Names for Search Fields and Filters");

// 2.1 NewsSection search input & filters
const newsSectionPath = path.join(rootDir, "src", "components", "NewsSection.tsx");
const newsSectionCode = fs.readFileSync(newsSectionPath, "utf-8");
assert.ok(
  newsSectionCode.includes('aria-label="Buscar notícias oficiais por assunto ou órgão"'),
  "NewsSection search input must have aria-label"
);
assert.ok(
  newsSectionCode.includes('aria-label="Limpar busca de notícias"'),
  "NewsSection clear button must have aria-label"
);
assert.ok(
  newsSectionCode.includes('role="tablist"') && newsSectionCode.includes('role="tab"'),
  "NewsSection category filter must have tablist and tab roles"
);
console.log("  [PASS] NewsSection search and filter accessible names verified.");

// 2.2 BrazilMap search input and controls
const brazilMapPath = path.join(rootDir, "src", "components", "BrazilMap.tsx");
const brazilMapCode = fs.readFileSync(brazilMapPath, "utf-8");
assert.ok(
  brazilMapCode.includes('aria-label="Buscar estado no mapa interativo"'),
  "BrazilMap search input must have aria-label"
);
assert.ok(
  brazilMapCode.includes('aria-label="Filtrar por região do Brasil"'),
  "BrazilMap region select must have aria-label"
);
assert.ok(
  brazilMapCode.includes('aria-label="Aproximar mapa"'),
  "BrazilMap zoom in button must have aria-label"
);
assert.ok(
  brazilMapCode.includes('aria-label="Afastar mapa"'),
  "BrazilMap zoom out button must have aria-label"
);
assert.ok(
  brazilMapCode.includes('aria-label="Redefinir zoom do mapa"'),
  "BrazilMap reset button must have aria-label"
);
assert.ok(
  brazilMapCode.includes('aria-label="Alternar tela cheia"'),
  "BrazilMap fullscreen button must have aria-label"
);
console.log("  [PASS] BrazilMap search and map control accessible names verified.");

// 2.3 StateTable search input and filters
const stateTablePath = path.join(rootDir, "src", "components", "StateTable.tsx");
const stateTableCode = fs.readFileSync(stateTablePath, "utf-8");
assert.ok(
  stateTableCode.includes('aria-label="Filtrar estados por nome ou sigla"'),
  "StateTable search input must have aria-label"
);
assert.ok(
  stateTableCode.includes('aria-label="Filtrar estados por resultado de apuração"'),
  "StateTable winner filter must have accessible role/label"
);
assert.ok(
  stateTableCode.includes('aria-label="Filtrar tabela por região geográfica"'),
  "StateTable region filter must have accessible role/label"
);
console.log("  [PASS] StateTable search and filter accessible names verified.");

// 2.4 EconomySection search and filters
const economySectionPath = path.join(rootDir, "src", "components", "EconomySection.tsx");
const economySectionCode = fs.readFileSync(economySectionPath, "utf-8");
assert.ok(
  economySectionCode.includes('aria-label="Buscar indicador econômico oficial"'),
  "EconomySection search input must have aria-label"
);
assert.ok(
  economySectionCode.includes('aria-label="Filtrar por instituição emissora"'),
  "EconomySection source filter must have accessible label"
);
console.log("  [PASS] EconomySection search and filter accessible names verified.");

// 2.5 SearchModal, CandidateResultsView, ClimaPage, NoticiasPage, TecnologiaPage, EsportesPage
const searchModalPath = path.join(rootDir, "src", "components", "SearchModal.tsx");
const searchModalCode = fs.readFileSync(searchModalPath, "utf-8");
assert.ok(
  searchModalCode.includes('aria-label="Pesquisar notícias, estados, indicadores ou candidatos no portal"'),
  "SearchModal input must have aria-label"
);
assert.ok(
  searchModalCode.includes('aria-label="Fechar janela de busca"'),
  "SearchModal close button must have aria-label"
);

const candResultsPath = path.join(rootDir, "src", "components", "CandidateResultsView.tsx");
const candResultsCode = fs.readFileSync(candResultsPath, "utf-8");
assert.ok(
  candResultsCode.includes('aria-label="Buscar candidato por nome ou número"'),
  "Candidate search input must have aria-label"
);
assert.ok(
  candResultsCode.includes('aria-label="Limpar pesquisa de candidatos"'),
  "Candidate search clear button must have aria-label"
);

const climaPagePath = path.join(rootDir, "src", "pages", "ClimaPage.tsx");
const climaPageCode = fs.readFileSync(climaPagePath, "utf-8");
assert.ok(
  climaPageCode.includes('aria-label="Pesquisar previsão do tempo por cidade ou região"'),
  "ClimaPage search input must have aria-label"
);

const noticiasPagePath = path.join(rootDir, "src", "pages", "NoticiasPage.tsx");
const noticiasPageCode = fs.readFileSync(noticiasPagePath, "utf-8");
assert.ok(
  noticiasPageCode.includes('aria-label="Pesquisar notícias oficiais por assunto ou órgão"'),
  "NoticiasPage search input must have aria-label"
);
assert.ok(
  noticiasPageCode.includes('aria-label="Filtrar notícias por fonte ou agência oficial"'),
  "NoticiasPage source filter must have aria-label"
);

const tecnologiaPagePath = path.join(rootDir, "src", "pages", "TecnologiaPage.tsx");
const tecnologiaPageCode = fs.readFileSync(tecnologiaPagePath, "utf-8");
assert.ok(
  tecnologiaPageCode.includes('aria-label="Buscar termos e notícias em tecnologia"'),
  "TecnologiaPage search input must have aria-label"
);

const esportesPagePath = path.join(rootDir, "src", "pages", "EsportesPage.tsx");
const esportesPageCode = fs.readFileSync(esportesPagePath, "utf-8");
assert.ok(
  esportesPageCode.includes('aria-label="Selecionar rodada do Brasileirão Série A"'),
  "EsportesPage round select must have aria-label"
);

console.log("  [PASS] All modal, page search, and filter accessible names verified.");

// --- TEST 3: Touch Target Sizes (Minimum 24x24px, preferably 44x44px for icon buttons) ---
console.log("\n[TEST 3] Touch Target Sizes Verification");

// 3.1 Header mobile menu and search button
const headerPath = path.join(rootDir, "src", "components", "Header.tsx");
const headerCode = fs.readFileSync(headerPath, "utf-8");
assert.ok(
  headerCode.includes("min-h-[44px] min-w-[44px]") && headerCode.includes("md:hidden"),
  "Header mobile menu toggle must satisfy 44x44px touch target"
);
assert.ok(
  headerCode.includes("min-h-[44px] min-w-[44px] sm:min-w-0"),
  "Header search button must satisfy 44x44px touch target on mobile"
);

// 3.2 BrazilMap zoom, reset, fullscreen, and mobile legend buttons
assert.ok(
  brazilMapCode.includes("min-h-[44px] min-w-[44px] flex items-center justify-center"),
  "BrazilMap map control buttons must satisfy 44x44px touch target"
);
assert.ok(
  brazilMapCode.includes("sm:hidden min-h-[44px] min-w-[44px]"),
  "BrazilMap mobile legend collapse button must satisfy 44x44px touch target"
);

// 3.3 StateDetailPanel controls
const stateDetailPath = path.join(rootDir, "src", "components", "StateDetailPanel.tsx");
const stateDetailCode = fs.readFileSync(stateDetailPath, "utf-8");
assert.ok(
  stateDetailCode.includes("min-h-[44px] min-w-[44px]"),
  "StateDetailPanel navigation and close buttons must satisfy 44x44px touch target"
);

// 3.4 Modals (MethodologyModal, DataInspectorModal, ArticleModal, IndicatorDetailModal)
const methModalPath = path.join(rootDir, "src", "components", "MethodologyModal.tsx");
const methModalCode = fs.readFileSync(methModalPath, "utf-8");
assert.ok(
  methModalCode.includes("min-h-[44px] min-w-[44px]"),
  "MethodologyModal close button must satisfy 44x44px touch target"
);

const dataInspModalPath = path.join(rootDir, "src", "components", "DataInspectorModal.tsx");
const dataInspModalCode = fs.readFileSync(dataInspModalPath, "utf-8");
assert.ok(
  dataInspModalCode.includes("min-h-[44px] min-w-[44px]"),
  "DataInspectorModal close button must satisfy 44x44px touch target"
);

const articleModalPath = path.join(rootDir, "src", "components", "ArticleModal.tsx");
const articleModalCode = fs.readFileSync(articleModalPath, "utf-8");
assert.ok(
  articleModalCode.includes("min-h-[44px] min-w-[44px]"),
  "ArticleModal close button must satisfy 44x44px touch target"
);
assert.ok(
  articleModalCode.includes("min-h-[44px]"),
  "ArticleModal share button must satisfy 44px height touch target"
);

const indModalPath = path.join(rootDir, "src", "components", "IndicatorDetailModal.tsx");
const indModalCode = fs.readFileSync(indModalPath, "utf-8");
assert.ok(
  indModalCode.includes("min-h-[44px] min-w-[44px]"),
  "IndicatorDetailModal close button must satisfy 44x44px touch target"
);

console.log("  [PASS] Interactive control touch target sizes verified.");

// --- TEST 4: Single Primary h1 Per Page Route ---
console.log("\n[TEST 4] Single Primary h1 Heading Hierarchy Verification");

const pageRouteFiles = [
  { route: "politica", file: "src/pages/PoliticaPage.tsx" },
  { route: "eleicoes", file: "src/pages/EleicoesPage.tsx" },
  { route: "economia", file: "src/pages/EconomiaPage.tsx" },
  { route: "estados", file: "src/pages/EstadosPage.tsx" },
  { route: "dados-publicos", file: "src/pages/DadosPublicosPage.tsx" },
  { route: "noticias", file: "src/pages/NoticiasPage.tsx" },
  { route: "esportes", file: "src/pages/EsportesPage.tsx" },
  { route: "tecnologia", file: "src/pages/TecnologiaPage.tsx" },
  { route: "clima", file: "src/pages/ClimaPage.tsx" },
  { route: "sobre", file: "src/pages/SobrePage.tsx" },
  { route: "artigo", file: "src/pages/ArticlePage.tsx" },
];

for (const { route, file } of pageRouteFiles) {
  const content = fs.readFileSync(path.join(rootDir, file), "utf-8");
  const h1Matches = content.match(/<h1[\s>]/g) || [];
  assert.strictEqual(
    h1Matches.length,
    1,
    `Route "${route}" in ${file} must have exactly one <h1> tag. Found: ${h1Matches.length}`
  );
  console.log(`  [PASS] Page route "${route}" has exactly 1 primary <h1>.`);
}

// Check HomePage heading structure
const featEditorialPath = path.join(rootDir, "src", "components", "FeaturedEditorial.tsx");
const featEditorialCode = fs.readFileSync(featEditorialPath, "utf-8");
const featH1Matches = featEditorialCode.match(/<h1[\s>]/g) || [];
assert.ok(
  featH1Matches.length >= 1,
  "FeaturedEditorial must contain the primary <h1> for HomePage"
);

const nationalBannerPath = path.join(rootDir, "src", "components", "NationalBanner.tsx");
const nationalBannerCode = fs.readFileSync(nationalBannerPath, "utf-8");
const natH1Matches = nationalBannerCode.match(/<h1[\s>]/g) || [];
assert.strictEqual(
  natH1Matches.length,
  0,
  "NationalBanner must NOT use <h1> (it is a section component reused in Home and Eleicoes)"
);
assert.ok(
  nationalBannerCode.includes("<h2") && nationalBannerCode.includes("{dataset.title}"),
  "NationalBanner must render dataset.title as <h2>"
);
console.log("  [PASS] NationalBanner renders <h2>, eliminating duplicate <h1> on HomePage and EleicoesPage.");

// --- TEST 5: Tab Controls, Parent Tablists, and ARIA Relationships ---
console.log("\n[TEST 5] Tab Controls, Parent Tablists, and ARIA Relationships Verification");

// 5.1 EconomySection tab controls
assert.ok(
  economySectionCode.includes('role="tablist"') &&
  economySectionCode.includes('aria-label="Categorias de indicadores econômicos"'),
  "EconomySection category filters must have a tablist container with accessible label"
);
assert.ok(
  economySectionCode.includes('role="tab"') &&
  economySectionCode.includes('aria-selected=') &&
  economySectionCode.includes('aria-controls="indicadores-economicos-grid"'),
  "EconomySection category buttons must have role=tab, aria-selected, and aria-controls"
);
assert.ok(
  economySectionCode.includes('id="indicadores-economicos-grid"') &&
  economySectionCode.includes('role="region"'),
  "EconomySection indicators grid must have matching id and role=region"
);
console.log("  [PASS] EconomySection tablist and aria-controls relationships verified.");

// 5.2 BolsaSection tab controls
const bolsaSectionPath = path.join(rootDir, "src", "components", "BolsaSection.tsx");
const bolsaSectionCode = fs.readFileSync(bolsaSectionPath, "utf-8");
assert.ok(
  bolsaSectionCode.includes('role="tablist"') &&
  bolsaSectionCode.includes('aria-label="Rankings de ações da B3"'),
  "BolsaSection rankings must have role=tablist with aria-label"
);
assert.ok(
  bolsaSectionCode.includes('role="tab"') &&
  bolsaSectionCode.includes('aria-controls="painel-rankings-b3"'),
  "BolsaSection ranking tabs must have role=tab and aria-controls='painel-rankings-b3'"
);
assert.ok(
  bolsaSectionCode.includes('id="painel-rankings-b3"') &&
  bolsaSectionCode.includes('role="tabpanel"'),
  "BolsaSection must have container with id='painel-rankings-b3' and role='tabpanel'"
);
console.log("  [PASS] BolsaSection tablist and tabpanel relationships verified.");

// 5.3 CandidateResultsView tab controls
assert.ok(
  candResultsCode.includes('role="tablist"') &&
  candResultsCode.includes('aria-label="Filtrar candidatos por agremiação partidária"'),
  "CandidateResultsView party filters must have role=tablist with aria-label"
);
assert.ok(
  candResultsCode.includes('role="tab"') &&
  candResultsCode.includes('aria-controls="candidatos-cards-grid"'),
  "CandidateResultsView party tabs must have role=tab and aria-controls"
);
assert.ok(
  candResultsCode.includes('id="candidatos-cards-grid"') &&
  candResultsCode.includes('role="region"'),
  "CandidateResultsView candidate cards container must have id='candidatos-cards-grid' and role='region'"
);
console.log("  [PASS] CandidateResultsView tablist and region relationships verified.");

// 5.4 NewsSection tab controls
assert.ok(
  newsSectionCode.includes('role="tablist"') &&
  newsSectionCode.includes('aria-label="Categorias oficiais de notícias"'),
  "NewsSection category filters must have role=tablist with aria-label"
);
assert.ok(
  newsSectionCode.includes('role="tab"') &&
  newsSectionCode.includes('aria-controls="news-articles-grid"'),
  "NewsSection category tabs must have role=tab and aria-controls"
);
assert.ok(
  newsSectionCode.includes('id="news-articles-grid"') &&
  newsSectionCode.includes('role="region"'),
  "NewsSection news grid must have id='news-articles-grid' and role='region'"
);
console.log("  [PASS] NewsSection tablist and region relationships verified.");

// --- TEST 6: Accessible Text Contrast Compliance ---
console.log("\n[TEST 6] Accessible Text Contrast Compliance Verification");

// Check that low-contrast text-slate-400 is not used for primary descriptive labels on light surfaces
assert.ok(
  !featEditorialCode.includes('text-slate-400 line-clamp-2') &&
  !featEditorialCode.includes('text-slate-400 mt-1'),
  "FeaturedEditorial must not use text-slate-400 for article summaries or descriptions"
);
assert.ok(
  featEditorialCode.includes('text-slate-600') || featEditorialCode.includes('text-slate-700'),
  "FeaturedEditorial must use accessible contrast slate tones (text-slate-600/700) for body text"
);

// Check that HomePage subheadings and labels maintain accessible contrast
const homePageCode = fs.readFileSync(path.join(rootDir, "src", "pages", "HomePage.tsx"), "utf-8");
assert.ok(
  homePageCode.includes('text-slate-700 mt-1') || homePageCode.includes('text-slate-600 mt-1'),
  "HomePage section descriptions must use accessible text contrast (text-slate-600/700)"
);
console.log("  [PASS] Text contrast compliance across featured editorial and homepage verified.");

// --- TEST 7: Strict Heading Hierarchy (No Skipped Levels) ---
console.log("\n[TEST 7] Strict Heading Hierarchy Verification");

// 7.1 FeaturedEditorial: h1 (manchete principal) -> h2 (seções) -> h3 (manchetes secundárias)
const featH2Matches = featEditorialCode.match(/<h2[\s>]/g) || [];
const featH3Matches = featEditorialCode.match(/<h3[\s>]/g) || [];
assert.ok(
  featH2Matches.length >= 2,
  `FeaturedEditorial must include <h2> for "Destaques Editoriais" and "Radar Cívico" (found: ${featH2Matches.length})`
);
assert.ok(
  featH3Matches.length >= 1,
  `FeaturedEditorial must include <h3> for secondary news headlines (found: ${featH3Matches.length})`
);
assert.ok(
  !featEditorialCode.includes("<h4"),
  "FeaturedEditorial must not skip to <h4>"
);
console.log("  [PASS] FeaturedEditorial heading hierarchy is strictly h1 -> h2 -> h3.");

// 7.2 NationalBanner: h2 (dataset.title) -> h3 (Segundo Turno & Disputa Presidencial), NO h1, NO h4
const natH4Matches = nationalBannerCode.match(/<h4[\s>]/g) || [];
assert.strictEqual(
  natH4Matches.length,
  0,
  `NationalBanner must not contain <h4> tags (found: ${natH4Matches.length})`
);
const natH3Matches = nationalBannerCode.match(/<h3[\s>]/g) || [];
assert.ok(
  natH3Matches.length >= 2,
  `NationalBanner must use <h3> for sub-headings (found: ${natH3Matches.length})`
);
console.log("  [PASS] NationalBanner heading hierarchy is strictly h2 -> h3 (no <h1>, no <h4>).");

// 7.3 BolsaSection: h2 (Bolsa de Valores) -> h3 (Subseções & Alertas), NO h4
const bolsaH4Matches = bolsaSectionCode.match(/<h4[\s>]/g) || [];
assert.strictEqual(
  bolsaH4Matches.length,
  0,
  `BolsaSection must not contain <h4> tags (found: ${bolsaH4Matches.length})`
);
const bolsaH3Matches = bolsaSectionCode.match(/<h3[\s>]/g) || [];
assert.ok(
  bolsaH3Matches.length >= 2,
  `BolsaSection must use <h3> for sub-headings and alerts (found: ${bolsaH3Matches.length})`
);
console.log("  [PASS] BolsaSection heading hierarchy is strictly h2 -> h3 (no <h4>).");

// --- TEST 8: Deferred BrazilMap Loading & Interactive Fallback on HomePage ---
console.log("\n[TEST 8] Deferred BrazilMap Loading & Interactive Fallback on HomePage Verification");

assert.ok(
  homePageCode.includes("const BrazilMap = lazy("),
  "HomePage must use lazy() for BrazilMap"
);
assert.ok(
  homePageCode.includes("shouldLoadMap") && homePageCode.includes("setShouldLoadMap"),
  "HomePage must control BrazilMap mounting via shouldLoadMap state"
);
assert.ok(
  homePageCode.includes("IntersectionObserver"),
  "HomePage must use IntersectionObserver to defer loading BrazilMap until near viewport"
);
assert.ok(
  homePageCode.includes("Carregar mapa interativo"),
  "BrazilMapSkeleton must contain an interactive button for direct activation"
);

// Verify EstadosPage retains full direct lazy access
const estadosPageCode = fs.readFileSync(path.join(rootDir, "src", "pages", "EstadosPage.tsx"), "utf-8");
assert.ok(
  estadosPageCode.includes("const BrazilMap = lazy("),
  "EstadosPage must also lazy-load BrazilMap with full direct route access"
);
console.log("  [PASS] HomePage conditionally defers BrazilMap bundle; direct access and manual activation preserved.");

// --- TEST 9: Canonical Routes & Generated Article Integrity Validation ---
console.log("\n[TEST 9] Canonical Routes & Generated Article Pages Validation");

const canonicalRoutes = [
  "",
  "politica",
  "eleicoes",
  "economia",
  "estados",
  "dados-publicos",
  "noticias",
  "esportes",
  "tecnologia",
  "clima",
  "sobre",
];

for (const r of canonicalRoutes) {
  const pageFile = r ? path.join(rootDir, "dist", r, "index.html") : path.join(rootDir, "dist", "index.html");
  if (fs.existsSync(pageFile)) {
    const pageHtml = fs.readFileSync(pageFile, "utf-8");
    assert.ok(pageHtml.includes("<title>"), `${pageFile} must contain <title>`);
    assert.ok(pageHtml.includes("canonical"), `${pageFile} must contain canonical link`);
  }
}

const newsDataRaw = JSON.parse(fs.readFileSync(path.join(rootDir, "public", "data", "newsData.json"), "utf-8"));
assert.ok(Array.isArray(newsDataRaw) && newsDataRaw.length >= 10, "newsData.json must have at least 10 articles");
for (const art of newsDataRaw) {
  assert.ok(art.id && art.title && art.source && art.publishedAt, `Article ${art.id} must have required metadata`);
}
console.log(`  [PASS] Canonical routes and ${newsDataRaw.length} dataset articles verified.`);

console.log("\n======================================================================");
console.log("ALL ACCESSIBILITY AUDIT & REGRESSION TESTS VERIFIED SUCCESSFULLY (100% PASS)");
console.log("======================================================================");

