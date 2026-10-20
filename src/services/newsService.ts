import { NewsItem, NewsCategory, NEWS_CATEGORIES, NewsFilterOptions } from "../types/news";
import { OFFICIAL_NEWS_ARTICLES } from "../data/newsData";

/**
 * Mapeia categorias legadas ou genéricas para as 8 categorias oficiais do Sociedade Ativa:
 * Política, Eleições, Governo, Congresso, Justiça, Economia, Brasil, Mundo
 */
export function normalizeCategory(cat: string | undefined): NewsCategory {
  if (!cat) return "Política";
  const trimmed = cat.trim();

  // Caso seja exatamente uma das 8 categorias
  if (NEWS_CATEGORIES.includes(trimmed as NewsCategory)) {
    return trimmed as NewsCategory;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("elei") || lower.includes("tse") || lower.includes("turno") || lower.includes("urna")) {
    return "Eleições";
  }
  if (lower.includes("govern") || lower.includes("presid") || lower.includes("minist")) {
    return "Governo";
  }
  if (lower.includes("congresso") || lower.includes("senado") || lower.includes("camara") || lower.includes("câmara") || lower.includes("deputad")) {
    return "Congresso";
  }
  if (lower.includes("just") || lower.includes("stf") || lower.includes("judic") || lower.includes("tribunal")) {
    return "Justiça";
  }
  if (lower.includes("econ") || lower.includes("fazenda") || lower.includes("banco") || lower.includes("pib") || lower.includes("infla")) {
    return "Economia";
  }
  if (lower.includes("brasil") || lower.includes("estado") || lower.includes("regi") || lower.includes("ibge") || lower.includes("geopolit")) {
    return "Brasil";
  }
  if (lower.includes("mundo") || lower.includes("internac") || lower.includes("global") || lower.includes("diploma")) {
    return "Mundo";
  }
  if (lower.includes("polít") || lower.includes("polit")) {
    return "Política";
  }

  return "Política";
}

/**
 * Formata data de forma segura para o padrão brasileiro: DD/MM/AAAA às HH:mm
 */
export function formatNewsDate(dateStr: string | undefined): string {
  if (!dateStr) return "Data não informada";

  // Se já estiver no padrão legível brasileiro com 'às' ou '/', manter
  if (dateStr.includes("às") || /^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    return dateStr;
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());

    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Valida rigorosamente URLs de imagem aceitas pelo portal
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://") && !trimmed.startsWith("/")) {
    return false;
  }
  if (/\.(aspx|php|html?|jsp)(\?.*)?$/i.test(trimmed)) return false;
  if (/(\.gif|ebc\.png|pixel|beacon|spacer|1x1|tracking)/i.test(trimmed)) return false;
  if (/(logo-agenciabrasil|favicon|banner-default|placeholder)/i.test(trimmed)) return false;

  const isImageExt = /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(trimmed);
  const isKnownImagePath = /(\/thumbnails\/image\/|\/midias\/image\/|\/noticias-img\/|\/images\/agenciadenoticias\/)/i.test(trimmed);

  return isImageExt || isKnownImagePath;
}

/**
 * Normaliza qualquer objeto de notícia bruto aplicando valores padrão seguros e tipagem rígida
 */
export function normalizeNewsItem(raw: any, index: number = 0): NewsItem {
  if (!raw || typeof raw !== "object") {
    return {
      id: `news-fallback-${index}`,
      title: "Notícia em atualização",
      summary: "Informações públicas em processamento pela redação.",
      source: "Redação Sociedade Ativa",
      sourceUrl: "https://sociedadeativa.github.io/",
      articleUrl: "https://sociedadeativa.github.io/",
      publishedAt: "Hoje",
      category: "Política",
      tags: [],
    };
  }

  const title = (raw.title || raw.headline || "Título não informado").trim();
  const summary = (raw.summary || raw.lead || (Array.isArray(raw.content) ? raw.content[0] : "") || "Resumo indisponível.").trim();
  const source = (raw.source || (raw.author?.includes("Sociedade Ativa") ? "Redação Sociedade Ativa" : "Agência Brasil")).trim();
  const category = normalizeCategory(raw.category);
  const publishedAt = formatNewsDate(raw.publishedAt);
  const updatedAt = raw.updatedAt && raw.updatedAt !== raw.publishedAt ? formatNewsDate(raw.updatedAt) : undefined;
  const ingestedAt = raw.ingestedAt ? formatNewsDate(raw.ingestedAt) : undefined;

  // Garantir URLs válidas
  const sourceUrl = raw.sourceUrl || "https://agenciabrasil.ebc.com.br/";
  const articleUrl = raw.articleUrl || sourceUrl;

  const id = raw.id || `noticia-${index}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;

  const tags = Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];

  const imageUrl = typeof raw.imageUrl === "string" && isValidImageUrl(raw.imageUrl) ? raw.imageUrl.trim() : undefined;
  const imageCaption = typeof raw.imageCaption === "string" && raw.imageCaption.trim() ? raw.imageCaption.trim() : undefined;
  const imageCredit = typeof raw.imageCredit === "string" && raw.imageCredit.trim() ? raw.imageCredit.trim() : undefined;
  const imageAlt = typeof raw.imageAlt === "string" && raw.imageAlt.trim() ? raw.imageAlt.trim() : undefined;

  return {
    id,
    title,
    summary,
    source,
    sourceUrl,
    articleUrl,
    publishedAt,
    updatedAt,
    ingestedAt,
    category,
    imageUrl,
    imageCaption,
    imageCredit,
    imageAlt,
    author: raw.author ? String(raw.author).trim() : source,
    tags,
    // Campos legados para compatibilidade
    headline: title,
    lead: summary,
    readTime: raw.readTime || "3 min de leitura",
    content: Array.isArray(raw.content) ? raw.content : [summary],
  };
}

/**
 * Filtra notícias por categoria, busca textual e fonte
 */
export function filterNewsItems(items: NewsItem[], options: NewsFilterOptions): NewsItem[] {
  if (!Array.isArray(items)) return [];

  let result = [...items];

  // Filtro por categoria
  if (options.category && options.category !== "Todas") {
    result = result.filter((item) => item.category === options.category);
  }

  // Filtro por fonte
  if (options.source && options.source !== "Todas") {
    result = result.filter((item) => item.source.toLowerCase() === options.source?.toLowerCase());
  }

  // Filtro por tag
  if (options.tag) {
    const t = options.tag.toLowerCase();
    result = result.filter((item) => item.tags?.some((tag) => tag.toLowerCase() === t));
  }

  // Filtro por busca textual (título, resumo, fonte e tags)
  if (options.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.trim().toLowerCase();
    result = result.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      const matchTags = item.tags?.some((tag) => tag.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchSource || matchTags;
    });
  }

  return result;
}

/**
 * Converte qualquer representação de data (formato brasileiro 'DD/MM/AAAA às HH:mm',
 * 'DD/MM/AAAA HH:mm:ss', ISO 8601, RFC 2822, etc.) em timestamp numérico UTC (em milissegundos).
 * Nunca realiza ordenação lexicográfica de strings de data.
 */
export function parseNewsDateToTimestamp(dateStr: string | undefined | null): number {
  if (!dateStr || typeof dateStr !== "string") return 0;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === "Data não informada" || trimmed === "Hoje") return 0;

  // 1. Padrão brasileiro com "às": DD/MM/AAAA às HH:mm(:ss)?
  const brAsPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+às\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i;
  const matchAs = trimmed.match(brAsPattern);
  if (matchAs) {
    const day = parseInt(matchAs[1], 10);
    const month = parseInt(matchAs[2], 10) - 1;
    const year = parseInt(matchAs[3], 10);
    const hours = matchAs[4] !== undefined ? parseInt(matchAs[4], 10) : 0;
    const minutes = matchAs[5] !== undefined ? parseInt(matchAs[5], 10) : 0;
    const seconds = matchAs[6] !== undefined ? parseInt(matchAs[6], 10) : 0;

    // Horário oficial de Brasília é UTC-3
    return Date.UTC(year, month, day, hours + 3, minutes, seconds);
  }

  // 2. Padrão brasileiro com espaço: DD/MM/AAAA [HH:mm[:ss]]
  const brSpacePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const matchSpace = trimmed.match(brSpacePattern);
  if (matchSpace) {
    const day = parseInt(matchSpace[1], 10);
    const month = parseInt(matchSpace[2], 10) - 1;
    const year = parseInt(matchSpace[3], 10);
    const hours = matchSpace[4] !== undefined ? parseInt(matchSpace[4], 10) : 0;
    const minutes = matchSpace[5] !== undefined ? parseInt(matchSpace[5], 10) : 0;
    const seconds = matchSpace[6] !== undefined ? parseInt(matchSpace[6], 10) : 0;

    return Date.UTC(year, month, day, hours + 3, minutes, seconds);
  }

  // 3. Padrão ISO YYYY-MM-DDTHH:mm:ss... ou YYYY-MM-DD
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/i;
  const matchIso = trimmed.match(isoPattern);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10) - 1;
    const day = parseInt(matchIso[3], 10);
    const hours = matchIso[4] !== undefined ? parseInt(matchIso[4], 10) : 0;
    const minutes = matchIso[5] !== undefined ? parseInt(matchIso[5], 10) : 0;
    const seconds = matchIso[6] !== undefined ? parseInt(matchIso[6], 10) : 0;
    const tz = matchIso[7];

    if (!tz) {
      // Sem fuso explícito em portal brasileiro: assume fuso de Brasília UTC-3
      return Date.UTC(year, month, day, hours + 3, minutes, seconds);
    }
  }

  // 4. Fallback padrão para Date.parse (RFC 2822, ISO com fuso, etc.)
  const parsed = new Date(trimmed);
  const time = parsed.getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Deduplica artigos por ID e por URL canônica (para matérias externas).
 * Preserva artigos institucionais protegidos do Sociedade Ativa.
 */
export function deduplicateNewsItems(items: NewsItem[]): NewsItem[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    if (seenIds.has(item.id)) continue;

    const isInternalGenericUrl =
      !item.articleUrl ||
      item.articleUrl === "https://sociedadeativa.github.io/" ||
      item.articleUrl === "https://sociedadeativa.github.io/noticias/" ||
      item.articleUrl === "https://sociedadeativa.github.io/eleicoes/";

    if (!isInternalGenericUrl && seenUrls.has(item.articleUrl.toLowerCase())) {
      continue;
    }

    seenIds.add(item.id);
    if (!isInternalGenericUrl) {
      seenUrls.add(item.articleUrl.toLowerCase());
    }
    result.push(item);
  }
  return result;
}

/**
 * Ordena os artigos em ordem cronológica decrescente estrita (mais recente primeiro).
 * Converte datas brasileiras e ISO em timestamp para comparação cronológica,
 * evitando qualquer falha decorrente de ordenação lexicográfica.
 */
export function sortNewsItems(items: NewsItem[]): NewsItem[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const timeA = parseNewsDateToTimestamp(a.publishedAt);
    const timeB = parseNewsDateToTimestamp(b.publishedAt);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    // Desempate por ingestedAt se houver
    const ingA = parseNewsDateToTimestamp(a.ingestedAt);
    const ingB = parseNewsDateToTimestamp(b.ingestedAt);
    if (ingB !== ingA) {
      return ingB - ingA;
    }
    return 0;
  });
}

/**
 * Busca de notícias com fallback automático para os dados embutidos.
 * Aplica cache-busting para garantir que novas versões de public/data/newsData.json
 * sejam baixadas imediatamente pelo navegador sem ficar presas no cache HTTP do CDN.
 */
export async function fetchNewsItems(): Promise<NewsItem[]> {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const cacheBuster = `_t=${Date.now()}`;
  const candidateUrls = [
    ...(origin ? [`${origin}/data/newsData.json?${cacheBuster}`] : []),
    `/data/newsData.json?${cacheBuster}`,
    `../../data/newsData.json?${cacheBuster}`,
    `../data/newsData.json?${cacheBuster}`,
    `./data/newsData.json?${cacheBuster}`,
    `data/newsData.json?${cacheBuster}`,
    `https://sociedadeativa.github.io/data/newsData.json?${cacheBuster}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-cache",
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map((item, idx) => normalizeNewsItem(item, idx));
            return sortNewsItems(deduplicateNewsItems(normalized));
          }
        } else {
          const text = await response.text();
          if (text.trim().startsWith("[")) {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) {
              const normalized = data.map((item, idx) => normalizeNewsItem(item, idx));
              return sortNewsItems(deduplicateNewsItems(normalized));
            }
          }
        }
      }
    } catch {
      // Tenta a próxima URL candidata
    }
  }

  // Fallback garantido para dados estáticos compilados
  const fallback = OFFICIAL_NEWS_ARTICLES.map((item, idx) => normalizeNewsItem(item, idx));
  return sortNewsItems(deduplicateNewsItems(fallback));
}
