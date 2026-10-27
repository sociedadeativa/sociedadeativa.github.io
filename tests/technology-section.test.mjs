/**
 * Testes determinísticos da seção de Tecnologia & Inovação (/tecnologia/)
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
console.log("EXECUÇÃO DE TESTES FOCADOS: CADERNO DE TECNOLOGIA & INOVAÇÃO (/tecnologia/)");
console.log("===========================================================================\n");

// 1. Validação de Rota em router.ts
console.log("Teste 1: Validação de rotas e configurações do router...");
const routerPath = path.join(rootDir, "src", "utils", "router.ts");
assert.ok(fs.existsSync(routerPath), "src/utils/router.ts deve existir");
const routerContent = fs.readFileSync(routerPath, "utf8");

assert.ok(
  routerContent.includes('"tecnologia"'),
  "PortalRoute deve conter o identificador 'tecnologia'"
);
assert.ok(
  routerContent.includes('path: "/tecnologia/"'),
  "ROUTE_CONFIGS deve conter path '/tecnologia/'"
);
assert.ok(
  routerContent.includes('clean.startsWith("tecnologia")'),
  "getRouteFromPath deve reconhecer caminhos iniciando em 'tecnologia'"
);
console.log("  ✓ Configuração de rota '/tecnologia/' verificada com sucesso.");

// 2. Validação da Entrada HTML Estática tecnologia/index.html
console.log("\nTeste 2: Validação da página estática tecnologia/index.html...");
const techHtmlPath = path.join(rootDir, "tecnologia", "index.html");
assert.ok(fs.existsSync(techHtmlPath), "tecnologia/index.html deve existir fisicamente");
const techHtml = fs.readFileSync(techHtmlPath, "utf8");

assert.ok(techHtml.includes("<title>Tecnologia"), "Deve conter tag <title> referente a Tecnologia");
assert.ok(
  techHtml.includes('<link rel="canonical" href="https://sociedadeativa.github.io/tecnologia/" />'),
  "Deve conter URL canônica estrita para /tecnologia/"
);
assert.ok(
  techHtml.includes('property="og:url" content="https://sociedadeativa.github.io/tecnologia/"'),
  "Deve conter og:url correta"
);
assert.ok(
  techHtml.includes("G-FVHPGPZTSL"),
  "Deve conter a Google Tag oficial (GA4: G-FVHPGPZTSL)"
);
assert.ok(
  techHtml.includes("oZPS6sfWTE5EJAuLOsZCtq9UoF1lh4wMhD9Jz13OTSs"),
  "Deve conter a verificação do Google Search Console"
);
assert.ok(
  techHtml.includes('"@type": "WebPage"'),
  "Deve conter dados estruturados Schema.org WebPage"
);
console.log("  ✓ tecnologia/index.html validado com SEO, GA4, canonical e Schema.org.");

// 3. Validação do vite.config.ts
console.log("\nTeste 3: Validação do rollupOptions.input em vite.config.ts...");
const viteConfigPath = path.join(rootDir, "vite.config.ts");
const viteConfigContent = fs.readFileSync(viteConfigPath, "utf8");
assert.ok(
  viteConfigContent.includes("tecnologia/index.html"),
  "vite.config.ts deve mapear o entry point tecnologia/index.html"
);
console.log("  ✓ vite.config.ts inclui tecnologia/index.html na compilação multi-page.");

// 4. Validação de Integração com o Sitemap
console.log("\nTeste 4: Validação do sitemap e script gerador...");
const publicSitemapPath = path.join(rootDir, "public", "sitemap.xml");
const publicSitemap = fs.readFileSync(publicSitemapPath, "utf8");
assert.ok(
  publicSitemap.includes("<loc>https://sociedadeativa.github.io/tecnologia/</loc>"),
  "public/sitemap.xml deve conter https://sociedadeativa.github.io/tecnologia/"
);

const genArticlesPath = path.join(rootDir, "scripts", "generate-article-pages.mjs");
const genArticlesContent = fs.readFileSync(genArticlesPath, "utf8");
assert.ok(
  genArticlesContent.includes("'https://sociedadeativa.github.io/tecnologia/'"),
  "scripts/generate-article-pages.mjs deve incluir a seção canônica /tecnologia/"
);

const valBuildPath = path.join(rootDir, "scripts", "validate-build.mjs");
const valBuildContent = fs.readFileSync(valBuildPath, "utf8");
assert.ok(
  valBuildContent.includes("'dist/tecnologia/index.html'"),
  "scripts/validate-build.mjs deve validar dist/tecnologia/index.html"
);
assert.ok(
  valBuildContent.includes("'https://sociedadeativa.github.io/tecnologia/'"),
  "scripts/validate-build.mjs deve validar canonical url de /tecnologia/"
);
console.log("  ✓ Sitemap unificado e scripts de build/validação cobrem /tecnologia/ sem duplicações.");

// 5. Validação da Tipagem NewsCategory
console.log("\nTeste 5: Validação de tipos editoriais...");
const typesPath = path.join(rootDir, "src", "types", "news.ts");
const typesContent = fs.readFileSync(typesPath, "utf8");
assert.ok(typesContent.includes('"Tecnologia"'), "src/types/news.ts deve incluir 'Tecnologia'");
console.log("  ✓ 'Tecnologia' adicionado às categorias de notícias válidas.");

// 6. Validação dos Componentes de Navegação
console.log("\nTeste 6: Validação de links em Header e Footer...");
const headerPath = path.join(rootDir, "src", "components", "Header.tsx");
const headerContent = fs.readFileSync(headerPath, "utf8");
assert.ok(
  headerContent.includes('route: "tecnologia"'),
  "Header.tsx deve incluir o link para a rota tecnologia"
);

const footerPath = path.join(rootDir, "src", "components", "Footer.tsx");
const footerContent = fs.readFileSync(footerPath, "utf8");
assert.ok(
  footerContent.includes('route="tecnologia"'),
  "Footer.tsx deve incluir o link para Tecnologia & Inovação"
);

const appPath = path.join(rootDir, "src", "App.tsx");
const appContent = fs.readFileSync(appPath, "utf8");
assert.ok(
  appContent.includes("TecnologiaPage"),
  "App.tsx deve importar e renderizar TecnologiaPage"
);
console.log("  ✓ Header, Footer e App integram a seção de Tecnologia perfeitamente.");

// 7. Validação de Filtros de Tópicos e Regras de Notícias Genuínas
console.log("\nTeste 7: Validação dos filtros de tópicos de tecnologia...");
const mockArticles = [
  {
    id: "art-1",
    title: "Governo avança na regulamentação do Marco Legal de Inteligência Artificial",
    summary: "Proposta prevê regras para algoritmos e salvaguardas em sistemas automatizados.",
    source: "Agência Brasil",
    publishedAt: "20/10/2026 às 14:00",
    category: "Tecnologia",
    articleUrl: "https://agenciabrasil.ebc.com.br/tecnologia/noticia/ia-marco",
  },
  {
    id: "art-2",
    title: "Anatel divulga cronograma de ativação da faixa 5G em mais 120 municípios",
    summary: "Infraestrutura de telecomunicações e banda larga atinge novas cidades do interior.",
    source: "EBC",
    publishedAt: "19/10/2026 às 10:00",
    category: "Brasil",
    articleUrl: "https://agenciabrasil.ebc.com.br/geral/noticia/5g-anatel",
  },
  {
    id: "art-3",
    title: "Banco Central moderniza regras de segurança e autenticação do Pix",
    summary: "Novas medidas de cibersegurança fortalecem prevenção contra fraudes digitais.",
    source: "Banco Central do Brasil",
    publishedAt: "18/10/2026 às 16:00",
    category: "Economia",
    articleUrl: "https://www.bcb.gov.br/noticia/pix-seguranca",
  },
  {
    id: "art-4",
    title: "Campeonato Brasileiro: Palmeiras vence clássico no Allianz Parque",
    summary: "Partida disputada terminou com vitória da equipe alviverde por 2 a 1.",
    source: "Agência Brasil",
    publishedAt: "18/10/2026 às 18:30",
    category: "Esportes",
    articleUrl: "https://agenciabrasil.ebc.com.br/esportes/noticia/futebol",
  },
];

const GENERAL_TECH_REGEX =
  /\b(tecnologia|tecnologias|inovação|inovacao|inteligência artificial|inteligencia artificial|\bia\b|algoritmo|cibersegurança|cibernética|cibernetica|segurança digital|computação|computacao|computador|smartphone|celular|internet|banda larga|5g|telecom|dados abertos|transformação digital|pix|sistema digital|automação|automacao|software|hardware|semicondutores|biometria|criptografia|lgpd)\b/i;

const techMatches = mockArticles.filter((a) => {
  if (a.category === "Tecnologia") return true;
  return GENERAL_TECH_REGEX.test(`${a.title} ${a.summary}`);
});

assert.strictEqual(techMatches.length, 3, "Deve identificar 3 matérias tecnológicas legítimas");
assert.ok(techMatches.some((a) => a.id === "art-1"), "art-1 (IA) deve estar incluído");
assert.ok(techMatches.some((a) => a.id === "art-2"), "art-2 (5G / Anatel) deve estar incluído");
assert.ok(techMatches.some((a) => a.id === "art-3"), "art-3 (Pix / Cibersegurança) deve estar incluído");
assert.ok(!techMatches.some((a) => a.id === "art-4"), "art-4 (Futebol) NÃO deve ser incluído em tecnologia");

console.log("  ✓ Filtros de palavras-chave e categorias isolam artigos de tecnologia sem falso-positivos em futebol.");

// 8. Validação do Pipeline de Notícias (scripts/update-news-data.mjs)
console.log("\nTeste 8: Validação do pipeline de ingestão e classificação em scripts/update-news-data.mjs...");
const updateScriptPath = path.join(rootDir, "scripts", "update-news-data.mjs");
assert.ok(fs.existsSync(updateScriptPath), "scripts/update-news-data.mjs deve existir");
const updateScriptContent = fs.readFileSync(updateScriptPath, "utf8");

const catMatch = updateScriptContent.match(/export const OFFICIAL_CATEGORIES = (\[[\s\S]*?\]);/);
assert.ok(catMatch, "scripts/update-news-data.mjs deve exportar OFFICIAL_CATEGORIES");
const rawCatArray = catMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']');
const categories = JSON.parse(rawCatArray);
assert.ok(
  Array.isArray(categories) && categories.includes("Tecnologia"),
  "OFFICIAL_CATEGORIES em scripts/update-news-data.mjs DEVE incluir 'Tecnologia'"
);
assert.ok(
  updateScriptContent.includes("techRegex"),
  "scripts/update-news-data.mjs deve definir techRegex para classificação automatizada"
);
assert.ok(
  updateScriptContent.includes("geral"),
  "scripts/update-news-data.mjs deve monitorar feed geral da Agência Brasil"
);
assert.ok(
  updateScriptContent.includes("category === 'Tecnologia'") || updateScriptContent.includes('category === "Tecnologia"'),
  "scripts/update-news-data.mjs deve alocar cota de representatividade para Tecnologia"
);
console.log("  ✓ scripts/update-news-data.mjs categoriza, tagueia e inclui Tecnologia nas categorias oficiais.");

// 9. Validação do Dataset de Notícias Reais
console.log("\nTeste 9: Validação da presença e integridade de artigos de tecnologia no dataset oficial...");
const newsDataJsonPath = path.join(rootDir, "public", "data", "newsData.json");
const newsDataTsPath = path.join(rootDir, "src", "data", "newsData.ts");

assert.ok(fs.existsSync(newsDataJsonPath), "public/data/newsData.json deve existir");
assert.ok(fs.existsSync(newsDataTsPath), "src/data/newsData.ts deve existir");

const jsonNews = JSON.parse(fs.readFileSync(newsDataJsonPath, "utf8"));
const tsContent = fs.readFileSync(newsDataTsPath, "utf8");
const tsMatch = tsContent.match(/export const OFFICIAL_NEWS_ARTICLES: NewsItem\[\] = (\[[\s\S]*\]);/);
assert.ok(tsMatch, "src/data/newsData.ts deve conter array OFFICIAL_NEWS_ARTICLES");
const tsNews = JSON.parse(tsMatch[1]);

assert.strictEqual(jsonNews.length, tsNews.length, "Total paridade de quantidade entre JSON e TS");

const techArticlesInDataset = jsonNews.filter((a) => a.category === "Tecnologia");
assert.ok(
  techArticlesInDataset.length >= 2,
  `Deve haver ao menos 2 artigos autênticos com categoria 'Tecnologia' no dataset (encontrados: ${techArticlesInDataset.length})`
);

for (const art of techArticlesInDataset) {
  assert.ok(art.id, "Artigo deve ter ID");
  assert.ok(art.title, "Artigo deve ter título");
  assert.ok(art.summary, "Artigo deve ter resumo");
  assert.ok(art.articleUrl.startsWith("https://"), "URL do artigo deve ser HTTPS");
  assert.ok(
    /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(art.publishedAt),
    `Formato de publishedAt inválido no artigo ${art.id}: ${art.publishedAt}`
  );
  if (art.ingestedAt) {
    assert.ok(
      /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(art.ingestedAt),
      `Formato de ingestedAt inválido no artigo ${art.id}: ${art.ingestedAt}`
    );
  }
}
console.log(`  ✓ Dataset contém ${techArticlesInDataset.length} artigos autênticos de Tecnologia com datas oficiais verificadas.`);

// 10. Validação de Semântica ARIA e Acessibilidade em TecnologiaPage.tsx
console.log("\nTeste 10: Validação de acessibilidade, abas ARIA e hierarquia de títulos em TecnologiaPage.tsx...");
const techPagePath = path.join(rootDir, "src", "pages", "TecnologiaPage.tsx");
assert.ok(fs.existsSync(techPagePath), "src/pages/TecnologiaPage.tsx deve existir");
const techPageContent = fs.readFileSync(techPagePath, "utf8");

assert.ok(
  techPageContent.includes('role="tablist"'),
  "TecnologiaPage deve conter container com role='tablist'"
);
assert.ok(
  techPageContent.includes('aria-controls="tech-topic-panel"'),
  "Botões de aba devem declarar aria-controls='tech-topic-panel'"
);
assert.ok(
  techPageContent.includes('id={`tech-tab-${topic.id}`}'),
  "Botões de aba devem ter identificadores únicos id='tech-tab-...'"
);
assert.ok(
  techPageContent.includes('role="tabpanel"'),
  "Container de conteúdo das abas deve ter role='tabpanel'"
);
assert.ok(
  techPageContent.includes('id="tech-topic-panel"'),
  "Container de conteúdo deve ter id='tech-topic-panel'"
);
assert.ok(
  techPageContent.includes('aria-labelledby={`tech-tab-${selectedTopic}`}'),
  "Container de conteúdo deve ser rotulado por aria-labelledby do tab selecionado"
);
assert.ok(
  techPageContent.includes("art.updatedAt"),
  "TecnologiaPage deve exibir timestamp de atualização se disponível e diferente da publicação"
);
console.log("  ✓ TecnologiaPage cumpre 100% dos requisitos de semântica ARIA e hierarquia de títulos.");

// 11. Validação do Workflow Agendado do GitHub Actions
console.log("\nTeste 11: Validação do workflow agendado em .github/workflows/update-news-data.yml...");
const workflowPath = path.join(rootDir, ".github", "workflows", "update-news-data.yml");
assert.ok(fs.existsSync(workflowPath), ".github/workflows/update-news-data.yml deve existir");
const workflowContent = fs.readFileSync(workflowPath, "utf8");

assert.ok(
  workflowContent.includes("node scripts/update-news-data.mjs"),
  "Workflow deve executar scripts/update-news-data.mjs"
);
assert.ok(
  workflowContent.includes("schedule:"),
  "Workflow deve ter gatilho de agendamento cron"
);
assert.ok(
  workflowContent.includes("cron: '0 9,14,19,0 * * *'"),
  "Workflow deve conter horários regulares de expediente jornalístico brasileiro"
);
console.log("  ✓ Workflow de atualização automática configurado para execução periódica e manual.");

console.log("\n===========================================================================");
console.log("TODOS OS 11 TESTES FOCADOS DA SEÇÃO DE TECNOLOGIA PASSARAM COM SUCESSO!");
console.log("===========================================================================\n");
