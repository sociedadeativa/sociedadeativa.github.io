/**
 * Testes determinísticos da seção de Entretenimento & Cultura (/entretenimento/)
 * e da integração editorial de Eleições no Caderno de Política.
 * Sociedade Ativa — Jornalismo cívico e dados abertos do Brasil.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: ENTRETENIMENTO & MERGE ELEIÇÕES -> POLÍTICA");
console.log("===========================================================================\n");

// 1. Validação de Rota em router.ts
console.log("Teste 1: Validação de rotas e configurações do router...");
const routerPath = path.join(rootDir, "src", "utils", "router.ts");
assert.ok(fs.existsSync(routerPath), "src/utils/router.ts deve existir");
const routerContent = fs.readFileSync(routerPath, "utf8");

assert.ok(
  routerContent.includes('"entretenimento"'),
  "PortalRoute deve conter o identificador 'entretenimento'"
);
assert.ok(
  routerContent.includes('path: "/entretenimento/"'),
  "ROUTE_CONFIGS deve conter path '/entretenimento/'"
);
assert.ok(
  routerContent.includes('clean.startsWith("entretenimento")'),
  "getRouteFromPath deve reconhecer caminhos iniciando em 'entretenimento'"
);
console.log("  ✓ Configuração de rota '/entretenimento/' verificada com sucesso.");

// 2. Validação da Entrada HTML Estática entretenimento/index.html
console.log("\nTeste 2: Validação da página estática entretenimento/index.html...");
const entHtmlPath = path.join(rootDir, "entretenimento", "index.html");
assert.ok(fs.existsSync(entHtmlPath), "entretenimento/index.html deve existir fisicamente");
const entHtml = fs.readFileSync(entHtmlPath, "utf8");

assert.ok(entHtml.includes("<title>Entretenimento"), "Deve conter tag <title> referente a Entretenimento");
assert.ok(
  entHtml.includes('<link rel="canonical" href="https://sociedadeativa.github.io/entretenimento/" />'),
  "Deve conter URL canônica estrita para /entretenimento/"
);
assert.ok(
  entHtml.includes('property="og:url" content="https://sociedadeativa.github.io/entretenimento/"'),
  "Deve conter og:url correta"
);
assert.ok(
  entHtml.includes("G-FVHPGPZTSL"),
  "Deve conter a Google Tag oficial (GA4: G-FVHPGPZTSL)"
);
assert.ok(
  entHtml.includes("oZPS6sfWTE5EJAuLOsZCtq9UoF1lh4wMhD9Jz13OTSs"),
  "Deve conter a verificação do Google Search Console"
);
assert.ok(
  entHtml.includes('"@type": "WebPage"'),
  "Deve conter dados estruturados Schema.org WebPage"
);
console.log("  ✓ entretenimento/index.html validado com SEO, GA4, canonical e Schema.org.");

// 3. Validação do vite.config.ts
console.log("\nTeste 3: Validação do rollupOptions.input em vite.config.ts...");
const viteConfigPath = path.join(rootDir, "vite.config.ts");
const viteConfigContent = fs.readFileSync(viteConfigPath, "utf8");
assert.ok(
  viteConfigContent.includes("entretenimento/index.html"),
  "vite.config.ts deve mapear o entry point entretenimento/index.html"
);
console.log("  ✓ vite.config.ts inclui entretenimento/index.html na compilação multi-page.");

// 4. Validação de Integração com o Sitemap e Scripts
console.log("\nTeste 4: Validação do sitemap e scripts de build...");
const publicSitemapPath = path.join(rootDir, "public", "sitemap.xml");
const publicSitemap = fs.readFileSync(publicSitemapPath, "utf8");
assert.ok(
  publicSitemap.includes("<loc>https://sociedadeativa.github.io/entretenimento/</loc>"),
  "public/sitemap.xml deve conter https://sociedadeativa.github.io/entretenimento/"
);

const genArticlesPath = path.join(rootDir, "scripts", "generate-article-pages.mjs");
const genArticlesContent = fs.readFileSync(genArticlesPath, "utf8");
assert.ok(
  genArticlesContent.includes("'https://sociedadeativa.github.io/entretenimento/'"),
  "scripts/generate-article-pages.mjs deve incluir a seção canônica /entretenimento/"
);

const valBuildPath = path.join(rootDir, "scripts", "validate-build.mjs");
const valBuildContent = fs.readFileSync(valBuildPath, "utf8");
assert.ok(
  valBuildContent.includes("'dist/entretenimento/index.html'"),
  "scripts/validate-build.mjs deve validar dist/entretenimento/index.html"
);
assert.ok(
  valBuildContent.includes("'https://sociedadeativa.github.io/entretenimento/'"),
  "scripts/validate-build.mjs deve validar canonical url de /entretenimento/"
);
console.log("  ✓ Sitemap unificado e scripts de build cobrem /entretenimento/.");

// 5. Validação da Nova Ordem de Navegação Editorial em Header.tsx
console.log("\nTeste 5: Validação da nova ordem de navegação editorial no Header...");
const headerPath = path.join(rootDir, "src", "components", "Header.tsx");
const headerContent = fs.readFileSync(headerPath, "utf8");

const expectedLabels = [
  "Política",
  "Governo",
  "Congresso",
  "Justiça",
  "Economia",
  "Brasil",
  "Esportes",
  "Tecnologia",
  "Entretenimento",
  "Dados Públicos",
  "Clima",
];

// Confere que 'Eleições 2026' não é item independente da barra horizontal principal
const navBlockMatch = headerContent.match(/const horizontalNavItems:[\s\S]*?=\s*\[([\s\S]*?)\];/);
assert.ok(navBlockMatch, "horizontalNavItems deve estar definido");
const navBlock = navBlockMatch[1];

assert.ok(
  !navBlock.includes('label: "Eleições 2026"'),
  "Eleições 2026 não pode mais ser uma categoria independente no horizontalNavItems"
);

for (const label of expectedLabels) {
  assert.ok(
    navBlock.includes(`label: "${label}"`),
    `horizontalNavItems deve conter a seção editorial '${label}'`
  );
}

// Verifica a ordem sequencial exata dos itens
let lastIndex = -1;
for (const label of expectedLabels) {
  const currentIndex = navBlock.indexOf(`label: "${label}"`);
  assert.ok(currentIndex > lastIndex, `A seção '${label}' deve estar após a anterior na ordem solicitada`);
  lastIndex = currentIndex;
}
console.log("  ✓ Nova ordem de 11 seções editoriais rigorosamente validada no Header.");

// 6. Validação do Merge de Eleições dentro da Política (PoliticaPage.tsx)
console.log("\nTeste 6: Validação do merge de Eleições no Caderno de Política...");
const politicaPath = path.join(rootDir, "src", "pages", "PoliticaPage.tsx");
const politicaContent = fs.readFileSync(politicaPath, "utf8");

assert.ok(
  politicaContent.includes("BrazilMap"),
  "PoliticaPage deve integrar o mapa eleitoral (BrazilMap)"
);
assert.ok(
  politicaContent.includes("CandidateResultsView"),
  "PoliticaPage deve integrar o comparativo de candidatos"
);
assert.ok(
  politicaContent.includes("SecondRoundBanner"),
  "PoliticaPage deve integrar o banner do 2º turno homologado"
);
assert.ok(
  politicaContent.includes("RegionalCharts"),
  "PoliticaPage deve integrar gráficos regionais de eleições"
);
assert.ok(
  politicaContent.includes("StateTable"),
  "PoliticaPage deve integrar a tabela por estado das eleições"
);
assert.ok(
  politicaContent.includes('"eleicoes"'),
  "PoliticaPage deve suportar a subcategoria/filtro 'eleicoes'"
);
console.log("  ✓ Caderno de Política integra todas as ferramentas, mapas e dados das Eleições 2026.");

// 7. Validação do Componente EntretenimentoPage.tsx
console.log("\nTeste 7: Validação de EntretenimentoPage.tsx e ausência de notícias falsas...");
const entPagePath = path.join(rootDir, "src", "pages", "EntretenimentoPage.tsx");
assert.ok(fs.existsSync(entPagePath), "EntretenimentoPage.tsx deve existir");
const entPageContent = fs.readFileSync(entPagePath, "utf8");

assert.ok(
  entPageContent.includes("Caderno de Entretenimento") && entPageContent.includes("em Estruturação"),
  "EntretenimentoPage deve exibir estado vazio limpo e transparente sem reportagens fabricadas"
);
assert.ok(
  entPageContent.includes("ENTERTAINMENT_TOPICS"),
  "EntretenimentoPage deve estruturar tópicos editoriais para futuras coberturas"
);
console.log("  ✓ EntretenimentoPage validada com estado limpo e sem artigos fictícios.");

console.log("\n===========================================================================");
console.log("TODOS OS TESTES DE ENTRETENIMENTO E MERGE EDITORIAL PASSARAM COM SUCESSO!");
console.log("===========================================================================");
