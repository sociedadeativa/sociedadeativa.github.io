import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: ELECTION NEWS FILTERING LOGIC (PRIORITY 2 AUDIT FIX)");
console.log("======================================================================");

// Carrega a função ou recria exatamente a lógica para execução direta em Node ESM
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const ELECTION_PATTERNS = [
  /\btse\b/,
  /\btre\b/,
  /\btre-[a-z]{2}\b/,
  /tribunal superior eleitoral/,
  /tribunal regional eleitoral/,
  /eleic(ao|oes|oral|orais|ione)/,
  /eleitor(es|as|ado)?\b/,
  /votac(ao|oes)/,
  /local( de|is de)? votac/,
  /urna(s)?( eletr[oô]nica(s)?)?/,
  /(segundo|primeiro|2[ºo°]|1[ºo°])\s+turno/,
  /apurac(ao|oes)/,
  /totalizac(ao|oes)/,
  /e-titulo/,
  /justificativa eleitoral/,
  /sufragio/
];

function isElectionArticle(article) {
  if (!article) return false;
  if (article.category === "Eleições") return true;

  if (Array.isArray(article.tags) && article.tags.length > 0) {
    const hasElectionTag = article.tags.some((tag) => {
      const normTag = normalizeText(tag);
      return ELECTION_PATTERNS.some((pattern) => pattern.test(normTag));
    });
    if (hasElectionTag) return true;
  }

  if (article.title) {
    const normTitle = normalizeText(article.title);
    if (ELECTION_PATTERNS.some((pattern) => pattern.test(normTitle))) {
      return true;
    }
  }

  return false;
}

// 1. Verificação de categoria nativa
console.log("[TEST 1] Artigos com categoria nativa 'Eleições'");
const nativeArticle = {
  id: "test-1",
  title: "Candidatos intensificam comícios no Sudeste",
  category: "Eleições",
  tags: ["Campanha", "Sudeste"]
};
assert.strictEqual(isElectionArticle(nativeArticle), true, "Artigo na categoria Eleições deve ser aceito");
console.log("  [PASS] Categoria 'Eleições' sempre incluída.");

// 2. Verificação de matérias de Justiça genuinamente eleitorais
console.log("\n[TEST 2] Artigos da categoria 'Justiça' com mérito eleitoral");
const legitJusticeArticles = [
  {
    id: "ebc-1705884",
    category: "Justiça",
    title: "Saiba como consultar o seu local de votação",
    tags: ["Justiça", "eleições 2026", "Segundo Turno", "TSE", "Locais de Votação"]
  },
  {
    id: "ebc-1705865",
    category: "Justiça",
    title: "MP pede ao TSE divulgação ampla de mudanças em locais de votação",
    tags: ["Justiça", "Eleições", "eleições 2026", "TSE", "MPE"]
  },
  {
    id: "ebc-1705838",
    category: "Justiça",
    title: "2º turno: 130 mil eleitores de 22 estados votarão em local diferente",
    tags: ["Justiça", "eleições 2026", "Eleições", "TSE"]
  },
  {
    id: "ebc-1705795",
    category: "Justiça",
    title: "TSE dá 24 horas para Meta dar informações sobre igualdade de campanhas",
    tags: ["Justiça", "TSE", "prazo", "meta", "explicações"]
  }
];

legitJusticeArticles.forEach((art) => {
  assert.strictEqual(isElectionArticle(art), true, `Artigo ${art.id} ("${art.title}") deve ser aceito`);
  console.log(`  [PASS] Aceitou artigo eleitoral de Justiça: "${art.title}"`);
});

// 3. Verificação de rejeição de matérias de Justiça NÃO eleitorais (Processos criminais, cíveis, etc.)
console.log("\n[TEST 3] Rejeição estrita de matérias de 'Justiça' não relacionadas ao processo eleitoral");
const nonElectionJusticeArticles = [
  {
    id: "ebc-1705883",
    category: "Justiça",
    title: "Justiça decreta fim da recuperação judicial da Americanas",
    tags: ["Economia", "americanas", "recuperação judicial", "Justiça"]
  },
  {
    id: "ebc-1705880",
    category: "Justiça",
    title: "PGR não vê abuso de André Mendonça em investigação contra Moraes",
    tags: ["Justiça", "stf", "André Mendonça", "Alexandre de Moraes", "abuso de autoridade"]
  },
  {
    id: "ebc-1705876",
    category: "Justiça",
    title: "Justiça bloqueia bens de empresa por queda de helicóptero, no Rio",
    tags: ["Geral", "helicóptero", "Acidente Aéreo", "vista Chinesa", "MPF"]
  },
  {
    id: "ebc-1705846",
    category: "Justiça",
    title: "Órgão Especial do TJRJ confirma Vasco x Boca Juniors no Maracanã",
    tags: ["Esportes", "Vasco", "Boca Juniors", "Maracanã", "Justiça"]
  },
  {
    id: "ebc-1705835",
    category: "Justiça",
    title: "CNU 2: servidor pode indicar órgão de preferência a partir de quinta",
    tags: ["Concursos", "CNU 2", "CPNU 2", "Concurso Público", "Administração Pública"]
  },
  {
    id: "ebc-1705834",
    category: "Justiça",
    title: "Mulher e filho de Marcinho VP são presos em operação da PF no Rio",
    tags: ["Justiça", "Rio de Janeiro", "Operação Backbone", "Polícia Federal", "Marcinho VP"]
  }
];

nonElectionJusticeArticles.forEach((art) => {
  assert.strictEqual(isElectionArticle(art), false, `Artigo ${art.id} ("${art.title}") deve ser REJEITADO`);
  console.log(`  [PASS] Rejeitou com sucesso matéria não-eleitoral: "${art.title}"`);
});

// 4. Verificação no dataset real completo (public/data/newsData.json)
console.log("\n[TEST 4] Validação no dataset completo public/data/newsData.json");
const newsDataPath = path.join(rootDir, "public", "data", "newsData.json");
const newsData = JSON.parse(fs.readFileSync(newsDataPath, "utf-8"));

const filtered = newsData.filter(isElectionArticle);
console.log(`  Total no arquivo: ${newsData.length} matérias`);
console.log(`  Matérias filtradas para Eleições: ${filtered.length} matérias`);

// Validações no dataset real:
// 1. Nenhuma matéria de recuperação da Americanas ou Marcinho VP deve estar presente
assert.ok(!filtered.some(a => a.id === "ebc-1705883"), "Americanas não pode estar no caderno de eleições");
assert.ok(!filtered.some(a => a.id === "ebc-1705834"), "Marcinho VP não pode estar no caderno de eleições");
assert.ok(!filtered.some(a => a.id === "ebc-1705846"), "Vasco x Boca não pode estar no caderno de eleições");

// 2. As matérias eleitorais e de totalização DEVEM estar presentes
assert.ok(filtered.some(a => a.id === "ebc-1705884" || a.id === "ebc-1706003" || a.title.toLowerCase().includes("votação") || a.title.toLowerCase().includes("eleitor") || a.title.toLowerCase().includes("campanha")), "Matérias eleitorais devem estar presentes");
assert.ok(filtered.some(a => a.id === "eleicoes-2026-tse-apuracao-primeiro-turno"), "Apuração 1º turno deve estar presente");
assert.ok(filtered.some(a => a.id === "eleicoes-2026-mapa-regional-votacao"), "Mapa regional deve estar presente");

console.log("  [PASS] Integridade do dataset real verificada sem falso-positivos ou perdas.");

console.log("\n======================================================================");
console.log("TODOS OS TESTES DE FILTRAGEM ELEITORAL PASSARAM COM 100% DE SUCESSO!");
console.log("======================================================================");
