import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

console.log("======================================================================");
console.log("TEST SUITE: MOBILE PERFORMANCE — DEFERRED GA4 & EARLY STYLESHEET DISCOVERY");
console.log("======================================================================");

assert.ok(fs.existsSync(distDir), "dist/ directory must exist (run build first)");

const canonicalFiles = [
  "dist/index.html",
  "dist/politica/index.html",
  "dist/eleicoes/index.html",
  "dist/economia/index.html",
  "dist/estados/index.html",
  "dist/dados-publicos/index.html",
  "dist/noticias/index.html",
  "dist/esportes/index.html",
  "dist/tecnologia/index.html",
  "dist/clima/index.html",
  "dist/sobre/index.html",
  "dist/404.html",
];

// --- TEST 1: Early Stylesheet Discovery in HTML Head ---
console.log("\n[TEST 1] Primary Stylesheet Early Discovery across all canonical and article pages");

// Encontra o arquivo CSS principal emitido pelo Vite
const assetsDir = path.join(distDir, "assets");
const assetFiles = fs.readdirSync(assetsDir);
const mainCssFile = assetFiles.find((f) => f.startsWith("main-") && f.endsWith(".css"));
assert.ok(mainCssFile, `Primary CSS bundle (main-*.css) must exist in dist/assets, found: ${assetFiles.filter(f => f.endsWith('.css')).join(', ')}`);
console.log(`  [INFO] Primary stylesheet identified: dist/assets/${mainCssFile}`);

// Coleta páginas de notícias individuais em dist/noticias/*/index.html
const articleHtmlFiles = [];
if (fs.existsSync(path.join(distDir, "noticias"))) {
  const dirs = fs.readdirSync(path.join(distDir, "noticias"));
  for (const dir of dirs) {
    const articleHtml = path.join(distDir, "noticias", dir, "index.html");
    if (fs.existsSync(articleHtml) && fs.statSync(articleHtml).isFile()) {
      articleHtmlFiles.push(path.relative(rootDir, articleHtml));
    }
  }
}
console.log(`  [INFO] Verifying ${canonicalFiles.length} canonical pages + ${articleHtmlFiles.length} generated article pages`);

const allHtmlFiles = [...canonicalFiles, ...articleHtmlFiles];

for (const relPath of allHtmlFiles) {
  const absPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(absPath), `${relPath} must exist`);
  const html = fs.readFileSync(absPath, "utf8");

  // 404.html usa estilos inline propositais para auto-suficiência e redirecionamento SPA
  if (relPath === "dist/404.html") {
    continue;
  }

  // Verifica que o stylesheet existe no <head>
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  assert.ok(headMatch, `${relPath} must contain a <head> section`);
  const head = headMatch[0];

  // Regex para localizar a folha de estilo principal
  const cssMatch = head.match(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  assert.ok(cssMatch, `${relPath} must contain a <link rel="stylesheet"> in <head>`);
  const cssHref = cssMatch[1];
  assert.ok(
    cssHref.includes("assets/main-") && cssHref.endsWith(".css"),
    `${relPath} stylesheet href must point to assets/main-*.css, got: ${cssHref}`
  );

  // Verifica que o stylesheet aparece imediatamente após a tag <meta name="viewport">
  const viewportIndex = head.search(/<meta\s+name=["']viewport["']/i);
  const stylesheetIndex = head.indexOf(cssMatch[0]);

  assert.ok(viewportIndex !== -1, `${relPath} must have a viewport meta tag`);
  assert.ok(stylesheetIndex > viewportIndex, `${relPath} stylesheet must come after viewport`);

  // O trecho entre viewport e stylesheet não deve conter outros recursos pesados ou scripts de terceiros
  const snippetBetween = head.slice(viewportIndex, stylesheetIndex);
  assert.ok(
    !snippetBetween.includes("googletagmanager.com"),
    `${relPath} should not have GA script before the primary stylesheet`
  );
  assert.ok(
    !snippetBetween.includes("<script"),
    `${relPath} should not have any <script> tags between viewport and stylesheet`
  );
}
console.log(`  [PASS] Early stylesheet discovery verified across all ${allHtmlFiles.length} HTML files.`);

// --- TEST 2: Deferred Google Analytics 4 (GA4) Loading ---
console.log("\n[TEST 2] Verify Deferred Google Analytics 4 (GA4) without Blocking Render");

for (const relPath of allHtmlFiles) {
  const absPath = path.join(rootDir, relPath);
  const html = fs.readFileSync(absPath, "utf8");

  // 1. Não deve haver script síncrono ou direto no topo do head
  const blockingScriptRegex = /<head>\s*<script[^>]*googletagmanager\.com/i;
  assert.ok(
    !blockingScriptRegex.test(html),
    `${relPath} must not have blocking GA script right after <head>`
  );

  // 2. Deve conter exatamente 1 menção ao script de carregamento do GA4
  const gaScriptOccurrences = (html.match(/googletagmanager\.com\/gtag\/js\?id=G-FVHPGPZTSL/g) || []).length;
  assert.equal(
    gaScriptOccurrences,
    1,
    `${relPath} must contain exactly 1 occurrence of googletagmanager.com/gtag/js?id=G-FVHPGPZTSL, found: ${gaScriptOccurrences}`
  );

  // 3. Deve conter exatamente 1 configuração gtag('config', 'G-FVHPGPZTSL')
  const gaConfigOccurrences = (html.match(/gtag\(['"]config['"],\s*['"]G-FVHPGPZTSL['"]\)/g) || []).length;
  assert.equal(
    gaConfigOccurrences,
    1,
    `${relPath} must contain exactly 1 occurrence of gtag('config', 'G-FVHPGPZTSL'), found: ${gaConfigOccurrences}`
  );

  // 4. Deve conter a implementação de carregamento diferido com requestIdleCallback e fallback
  assert.ok(
    html.includes("requestIdleCallback"),
    `${relPath} must utilize requestIdleCallback for deferred loading`
  );
  assert.ok(
    html.includes("__ga4Loaded") && html.includes("__ga4Loading"),
    `${relPath} must guard against duplicate GA4 initialization via flags`
  );
  assert.ok(
    html.includes("interactionEvents"),
    `${relPath} must listen to user interaction events (scroll, touch, click, keydown)`
  );
}
console.log(`  [PASS] Deferred GA4 loader verified in all ${allHtmlFiles.length} HTML files.`);

// --- TEST 3: Client-side Analytics Utilities (Queueing, Events & Deduplication) ---
console.log("\n[TEST 3] Client-side Analytics Utilities Unit Verification");

// Cria um mock de ambiente de navegador para simular a fila dataLayer e gtag
const mockWindow = {
  location: {
    pathname: "/politica/",
    search: "",
    href: "https://sociedadeativa.github.io/politica/",
  },
  dataLayer: undefined,
  gtag: undefined,
};

globalThis.window = mockWindow;
globalThis.document = { title: "Política — Sociedade Ativa" };

// Importa dinamicamente utilitários compilados ou testa lógica de fila
const { GA_MEASUREMENT_ID, trackPageView, trackEvent } = await import("../src/utils/analytics.ts");

assert.equal(GA_MEASUREMENT_ID, "G-FVHPGPZTSL", "Measurement ID must be G-FVHPGPZTSL");

// Testa envio de evento antes do script do GA4 ter carregado
trackEvent("share_click", { method: "whatsapp", article_id: "test-123" });

assert.ok(Array.isArray(window.dataLayer), "window.dataLayer must be automatically initialized");
assert.equal(window.dataLayer.length, 1, "One event should be queued in dataLayer");
const queuedEvent = window.dataLayer[0];
assert.equal(queuedEvent[0], "event");
assert.equal(queuedEvent[1], "share_click");
assert.equal(queuedEvent[2].send_to, "G-FVHPGPZTSL");
assert.equal(queuedEvent[2].method, "whatsapp");

// Testa navegação de página para nova rota
trackPageView("/economia/", "Economia — Sociedade Ativa");
assert.equal(window.dataLayer.length, 2, "Second event (page_view) should be queued");
const queuedPageView = window.dataLayer[1];
assert.equal(queuedPageView[0], "event");
assert.equal(queuedPageView[1], "page_view");
assert.equal(queuedPageView[2].page_path, "/economia/");
assert.equal(queuedPageView[2].send_to, "G-FVHPGPZTSL");

// Testa deduplicação da mesma rota
trackPageView("/economia/", "Economia — Sociedade Ativa");
assert.equal(
  window.dataLayer.length,
  2,
  "Calling trackPageView with the same route consecutively must not queue duplicate events"
);

console.log("  [PASS] Analytics event queueing before script load & page_view deduplication verified.");

// --- TEST 4: Dynamic LCP Preload Match, High Priority & Referrer Policy ---
console.log("\n[TEST 4] Dynamic LCP Preload Match, High Priority & Referrer Policy");

const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const rawArticles = JSON.parse(fs.readFileSync(path.join(rootDir, "public", "data", "newsData.json"), "utf8"));
const { getLeadArticleImageUrl } = await import("../scripts/generate-article-pages.mjs");
const expectedLeadImageUrl = getLeadArticleImageUrl(rawArticles, distDir);

assert.ok(expectedLeadImageUrl, "Expected lead article image URL must resolve");
assert.ok(
  indexHtml.includes(expectedLeadImageUrl),
  `dist/index.html preload must contain the exact current lead image URL: ${expectedLeadImageUrl}`
);
assert.ok(
  indexHtml.includes('fetchpriority="high"'),
  "LCP image preload must maintain fetchpriority='high'"
);
assert.ok(
  indexHtml.includes('referrerpolicy="no-referrer"'),
  "LCP image preload must contain referrerpolicy='no-referrer' matching FeaturedEditorial.tsx"
);
console.log(`  [PASS] dist/index.html preload matches current lead image and includes referrerpolicy="no-referrer"`);

// Limpeza de globais simulados
delete globalThis.window;
delete globalThis.document;

console.log("\n======================================================================");
console.log("ALL MOBILE PERFORMANCE (GA DEFERRAL & CSS DISCOVERY) TESTS PASSED!");
console.log("======================================================================\n");
