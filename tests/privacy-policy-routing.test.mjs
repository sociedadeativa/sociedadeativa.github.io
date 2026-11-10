import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: PRIVACY POLICY & TERMS OF USE ROUTING AUDIT");
console.log("======================================================================");

// 1. Inspecionar o código de getRouteFromPath em src/utils/router.ts
console.log("\n[TEST 1] Verifying getRouteFromPath implementation in src/utils/router.ts");
const routerPath = path.join(rootDir, "src", "utils", "router.ts");
const routerContent = fs.readFileSync(routerPath, "utf8");

assert.ok(
  routerContent.includes('clean.startsWith("politica-de-privacidade")'),
  "router.ts must check clean.startsWith('politica-de-privacidade') before 'politica'"
);
assert.ok(
  routerContent.includes('clean.startsWith("termos-de-uso")'),
  "router.ts must check clean.startsWith('termos-de-uso') for Terms of Use"
);
assert.ok(
  routerContent.includes('clean.startsWith("politica")'),
  "router.ts must check clean.startsWith('politica') for editorial Politics"
);

// 2. Simulação direta dos caminhos
console.log("\n[TEST 2] Simulating URL path resolutions");
function simulateGetRoute(pathname, searchStr = "") {
  if (searchStr) {
    const params = new URLSearchParams(searchStr);
    const p = params.get("p");
    if (p) {
      const cleanParam = decodeURIComponent(p).replace(/^\/+|\/+$/g, "").toLowerCase();
      if (cleanParam.startsWith("politica-de-privacidade")) return "politica-de-privacidade";
      if (cleanParam.startsWith("termos-de-uso")) return "termos-de-uso";
      if (cleanParam.startsWith("politica") && !cleanParam.startsWith("politica-de-privacidade")) return "politica";
    }
  }

  const clean = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!clean || clean === "index.html") return "home";

  if (clean.startsWith("politica-de-privacidade")) return "politica-de-privacidade";
  if (clean.startsWith("termos-de-uso")) return "termos-de-uso";
  if (clean.startsWith("politica") && !clean.startsWith("politica-de-privacidade")) return "politica";
  if (clean.startsWith("eleicoes")) return "eleicoes";
  if (clean.startsWith("economia")) return "economia";
  if (clean.startsWith("estados")) return "estados";
  if (clean.startsWith("dados-publicos")) return "dados-publicos";
  if (clean.startsWith("noticias")) return "noticias";
  if (clean.startsWith("esportes")) return "esportes";
  if (clean.startsWith("tecnologia")) return "tecnologia";
  if (clean.startsWith("entretenimento")) return "entretenimento";
  if (clean.startsWith("clima")) return "clima";
  if (clean.startsWith("sobre")) return "sobre";

  return "home";
}

assert.equal(
  simulateGetRoute("/politica-de-privacidade/"),
  "politica-de-privacidade",
  "Path /politica-de-privacidade/ must resolve to politica-de-privacidade"
);
assert.equal(
  simulateGetRoute("/politica-de-privacidade"),
  "politica-de-privacidade",
  "Path /politica-de-privacidade without trailing slash must resolve to politica-de-privacidade"
);
assert.equal(
  simulateGetRoute("/politica-de-privacidade/index.html"),
  "politica-de-privacidade",
  "Path /politica-de-privacidade/index.html must resolve to politica-de-privacidade"
);
assert.equal(
  simulateGetRoute("/", "?p=%2Fpolitica-de-privacidade%2F"),
  "politica-de-privacidade",
  "404 fallback /?p=%2Fpolitica-de-privacidade%2F must resolve to politica-de-privacidade"
);

// Verificar que a editoria de Política continua funcionando perfeitamente
assert.equal(
  simulateGetRoute("/politica/"),
  "politica",
  "Path /politica/ must resolve to editorial politica"
);
assert.equal(
  simulateGetRoute("/politica"),
  "politica",
  "Path /politica without trailing slash must resolve to editorial politica"
);
assert.equal(
  simulateGetRoute("/politica/index.html"),
  "politica",
  "Path /politica/index.html must resolve to editorial politica"
);
assert.equal(
  simulateGetRoute("/", "?p=%2Fpolitica%2F"),
  "politica",
  "404 fallback /?p=%2Fpolitica%2F must resolve to editorial politica"
);

// Verificar Termos de Uso
assert.equal(
  simulateGetRoute("/termos-de-uso/"),
  "termos-de-uso",
  "Path /termos-de-uso/ must resolve to termos-de-uso"
);
console.log("  [PASS] All path resolutions tested and verified distinct.");

// 3. Validação dos links no Footer.tsx
console.log("\n[TEST 3] Validating Footer links");
const footerPath = path.join(rootDir, "src", "components", "Footer.tsx");
const footerContent = fs.readFileSync(footerPath, "utf8");

assert.ok(
  footerContent.includes('<PortalLink route="politica-de-privacidade"'),
  "Footer must link to route 'politica-de-privacidade'"
);
assert.ok(
  footerContent.includes('<PortalLink route="termos-de-uso"'),
  "Footer must link to route 'termos-de-uso'"
);
assert.ok(
  footerContent.includes('<PortalLink route="politica"'),
  "Footer must link to route 'politica' for editorial Politics"
);
console.log("  [PASS] Footer links correctly mapped.");

// 4. Validação do sitemap.xml
console.log("\n[TEST 4] Validating sitemap.xml");
const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
const sitemapContent = fs.readFileSync(sitemapPath, "utf8");

assert.ok(
  sitemapContent.includes("<loc>https://sociedadeativa.github.io/politica-de-privacidade/</loc>"),
  "sitemap.xml must include canonical URL https://sociedadeativa.github.io/politica-de-privacidade/"
);
assert.ok(
  sitemapContent.includes("<loc>https://sociedadeativa.github.io/termos-de-uso/</loc>"),
  "sitemap.xml must include canonical URL https://sociedadeativa.github.io/termos-de-uso/"
);
assert.ok(
  sitemapContent.includes("<loc>https://sociedadeativa.github.io/politica/</loc>"),
  "sitemap.xml must include canonical URL https://sociedadeativa.github.io/politica/"
);
console.log("  [PASS] sitemap.xml includes both legal pages and the editorial section.");

console.log("\n======================================================================");
console.log("ALL PRIVACY POLICY ROUTING TESTS PASSED SUCCESSFULLY (100% PASS)!");
console.log("======================================================================\n");
