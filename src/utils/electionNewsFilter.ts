import { NewsItem } from "../types/news";

/**
 * Normaliza uma string removendo diacríticos/acentos e convertendo para minúsculas.
 */
function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Padrões canônicos estritos para identificar matérias de cobertura eleitoral genuína.
 * Evita capturar processos judiciais, crimes ou matérias administrativas genéricas
 * categorizadas como "Justiça" ou "Congresso".
 */
const ELECTION_PATTERNS: RegExp[] = [
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

/**
 * Determina com precisão jornalística e técnica se um artigo pertence
 * à cobertura especial de Eleições.
 *
 * Regras:
 * 1. Categoria nativa "Eleições" é automaticamente incluída.
 * 2. Artigos de outras editorias (especialmente "Justiça", "Política" e "Congresso")
 *    são incluídos APENAS se suas tags ou títulos contiverem termos eleitorais estritos
 *    (TSE, TRE, urnas eletrônicas, apuração, locais de votação, 2º turno, etc.).
 * 3. Notícias de processos judiciais cíveis/criminais, recuperação judicial de empresas
 *    ou concursos públicos são estritamente excluídas.
 */
export function isElectionArticle(article: NewsItem): boolean {
  if (!article) return false;

  // 1. Categoria nativa de eleições
  if (article.category === "Eleições") {
    return true;
  }

  // 2. Análise estrita de tags cadastradas
  if (Array.isArray(article.tags) && article.tags.length > 0) {
    const hasElectionTag = article.tags.some((tag) => {
      const normTag = normalizeText(tag);
      return ELECTION_PATTERNS.some((pattern) => pattern.test(normTag));
    });
    if (hasElectionTag) {
      return true;
    }
  }

  // 3. Análise estrita do título da matéria
  if (article.title) {
    const normTitle = normalizeText(article.title);
    if (ELECTION_PATTERNS.some((pattern) => pattern.test(normTitle))) {
      return true;
    }
  }

  return false;
}
