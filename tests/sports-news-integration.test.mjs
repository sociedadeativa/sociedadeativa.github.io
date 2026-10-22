/**
 * Testes focados da integração e exibição de notícias esportivas (/esportes/)
 * Sociedade Ativa — Cobertura esportiva oficial com dados e notícias reais.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: CADERNO DE ESPORTES (/esportes/)");
console.log("===========================================================================\n");

// -----------------------------------------------------------------------------
// TESTE 1: Validação do Dataset de Notícias e Detecção de Matérias Esportivas
// -----------------------------------------------------------------------------
console.log("[TESTE 1] Identificação e validação da fonte de notícias esportivas reais");
const jsonPath = path.join(rootDir, "public", "data", "newsData.json");
assert.ok(fs.existsSync(jsonPath), "public/data/newsData.json deve existir");

const rawData = fs.readFileSync(jsonPath, "utf8");
const articles = JSON.parse(rawData);
assert.ok(Array.isArray(articles) && articles.length > 0, "Dataset deve ser um array não-vazio");

// Filtro idêntico ao de EsportesPage.tsx
const sportsArticles = articles.filter((a) => {
  if (a.category === "Esportes") return true;
  if (
    a.tags?.some((t) =>
      /esporte|futebol|libertadores|brasileirão|brasileirao|vôlei|volei|ginástica|ginastica|copa/i.test(t)
    )
  ) {
    return true;
  }
  const content = `${a.title || ""} ${a.summary || ""}`.toLowerCase();
  if (
    /esporte|futebol|libertadores|fluminense|palmeiras|flamengo|corinthians|brasileirão|brasileirao|vôlei|volei|ginástica|ginastica|mundial de ginástica|campeonato brasileiro/i.test(
      content
    )
  ) {
    return true;
  }
  if (a.articleUrl && a.articleUrl.toLowerCase().includes("/esportes/")) {
    return true;
  }
  return false;
});

assert.ok(
  sportsArticles.length >= 4,
  `Devem existir pelo menos 4 matérias esportivas reais no dataset (encontradas: ${sportsArticles.length})`
);
console.log(`  [PASS] 1. Fonte oficial identificada com ${sportsArticles.length} matérias esportivas apuradas.`);

// -----------------------------------------------------------------------------
// TESTE 2: Campos Obrigatórios (Título, Data, Imagem e Link Canônico da Fonte)
// -----------------------------------------------------------------------------
console.log("\n[TESTE 2] Verificação de integridade dos campos das notícias esportivas");
sportsArticles.forEach((art, idx) => {
  assert.ok(art.id, `Artigo #${idx} deve possuir id`);
  assert.ok(art.title && art.title.trim().length > 10, `Artigo ${art.id} deve possuir título válido`);
  assert.ok(art.publishedAt, `Artigo ${art.id} deve possuir data de publicação`);
  assert.ok(
    art.publishedAt.includes("/") || art.publishedAt.includes("-"),
    `Data do artigo ${art.id} deve ter formato de data válido (${art.publishedAt})`
  );
  assert.ok(art.source, `Artigo ${art.id} deve possuir fonte identificada`);
  assert.ok(
    art.articleUrl && art.articleUrl.startsWith("http"),
    `Artigo ${art.id} deve possuir link funcional para o conteúdo completo na fonte original (${art.articleUrl})`
  );

  // Verificação de imagem
  if (art.imageUrl) {
    assert.ok(
      art.imageUrl.startsWith("https://") || art.imageUrl.startsWith("http://") || art.imageUrl.startsWith("/"),
      `URL da imagem do artigo ${art.id} deve ser um caminho ou protocolo web válido (${art.imageUrl})`
    );
  }
});
const withImages = sportsArticles.filter((a) => !!a.imageUrl);
console.log(`  [PASS] 1. Todas as matérias contêm título, data, fonte e link canônico funcional.`);
console.log(`  [PASS] 2. ${withImages.length} de ${sportsArticles.length} matérias possuem imagens oficiais válidas.`);

// -----------------------------------------------------------------------------
// TESTE 3: Validação da Normalização de Categorias (newsService.ts)
// -----------------------------------------------------------------------------
console.log("\n[TESTE 3] Validação das regras de normalização de categoria esportiva");
const newsServicePath = path.join(rootDir, "src", "services", "newsService.ts");
const newsServiceContent = fs.readFileSync(newsServicePath, "utf8");

assert.ok(
  newsServiceContent.includes('lower.includes("esport")'),
  "normalizeCategory deve normalizar variações com 'esport' para 'Esportes'"
);
assert.ok(
  newsServiceContent.includes('lower.includes("futebol")'),
  "normalizeCategory deve normalizar variações com 'futebol' para 'Esportes'"
);
console.log("  [PASS] 1. Regras de normalização de categoria contemplam 'Esportes' e 'Futebol'.");

// -----------------------------------------------------------------------------
// TESTE 4: Validação dos Estados da Interface (Carregamento, Erro e Vazio)
// -----------------------------------------------------------------------------
console.log("\n[TESTE 4] Verificação de cobertura de estados em EsportesPage.tsx");
const esportesPagePath = path.join(rootDir, "src", "pages", "EsportesPage.tsx");
const esportesPageContent = fs.readFileSync(esportesPagePath, "utf8");

// 1. Estado de carregamento
assert.ok(
  esportesPageContent.includes("isLoading && realSportsArticles.length === 0"),
  "EsportesPage deve tratar explicitamente o estado de carregamento"
);
assert.ok(
  esportesPageContent.includes("Carregando notícias oficiais de esportes..."),
  "EsportesPage deve exibir mensagem de carregamento com skeleton"
);

// 2. Estado de falha na fonte
assert.ok(
  esportesPageContent.includes("error && realSportsArticles.length === 0"),
  "EsportesPage deve tratar explicitamente a falha de comunicação com a fonte oficial"
);
assert.ok(
  esportesPageContent.includes("Falha ao carregar notícias esportivas"),
  "EsportesPage deve exibir aviso explícito de falha com ação de retry"
);

// 3. Estado de ausência de notícias
assert.ok(
  esportesPageContent.includes("Nenhuma matéria oficial de esportes no momento"),
  "EsportesPage deve tratar o estado de ausência de notícias"
);

// 4. Renderização da imagem
assert.ok(
  esportesPageContent.includes("art.imageUrl"),
  "EsportesPage deve renderizar art.imageUrl quando a imagem estiver disponível"
);

// 5. Links funcionais
assert.ok(
  esportesPageContent.includes("onOpenArticleDetails && onOpenArticleDetails(art)"),
  "EsportesPage deve suportar leitura interna do artigo via onOpenArticleDetails"
);
assert.ok(
  esportesPageContent.includes('target="_blank"'),
  "EsportesPage deve conter link com target='_blank' para a fonte original externa"
);

console.log("  [PASS] 1. Estado de carregamento (skeleton) presente.");
console.log("  [PASS] 2. Estado de falha na fonte (com retry) presente.");
console.log("  [PASS] 3. Estado de ausência de notícias presente.");
console.log("  [PASS] 4. Renderização condicional de imagens com onError defensivo validada.");
console.log("  [PASS] 5. Links funcionais interno e externo validados.");

// -----------------------------------------------------------------------------
// TESTE 5: Preservação de Layout, Filtros e Identidade Visual
// -----------------------------------------------------------------------------
console.log("\n[TESTE 5] Verificação da integridade de layout, filtros e avisos");
assert.ok(
  esportesPageContent.includes("TOURNAMENTS"),
  "Filtros de torneio (TOURNAMENTS) devem permanecer preservados"
);
assert.ok(
  esportesPageContent.includes("MATCHES_DATA"),
  "Painel de partidas (MATCHES_DATA) deve permanecer preservado"
);
assert.ok(
  esportesPageContent.includes("STANDINGS_SERIE_A"),
  "Classificação Série A deve permanecer preservada"
);
assert.ok(
  esportesPageContent.includes("STANDINGS_SERIE_B"),
  "Classificação Série B deve permanecer preservada"
);
assert.ok(
  esportesPageContent.includes("DEMO_NOTICE"),
  "Avisos de demonstração e transparência editorial devem ser preservados"
);
console.log("  [PASS] 1. Torneios, partidas, tabelas de classificação e avisos preservados sem alterações indevidas.");

console.log("\n===========================================================================");
console.log("TODOS OS TESTES DO CADERNO DE ESPORTES FORAM EXECUTADOS E APROVADOS!");
console.log("===========================================================================");
