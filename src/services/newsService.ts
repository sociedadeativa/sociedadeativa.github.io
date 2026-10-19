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
  const updatedAt = raw.updatedAt ? formatNewsDate(raw.updatedAt) : publishedAt;

  // Garantir URLs válidas
  const sourceUrl = raw.sourceUrl || "https://agenciabrasil.ebc.com.br/";
  const articleUrl = raw.articleUrl || sourceUrl;

  const id = raw.id || `noticia-${index}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;

  const tags = Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];

  const isSociedadeAtiva = source.includes("Sociedade Ativa") || (raw.author && String(raw.author).includes("Sociedade Ativa"));
  const editorialType = raw.editorialType || (isSociedadeAtiva ? "reportagem_especial" : "sumula_oficial");

  return {
    id,
    title,
    summary,
    source,
    sourceUrl,
    articleUrl,
    publishedAt,
    updatedAt,
    ingestedAt: typeof raw.ingestedAt === "string" ? raw.ingestedAt : undefined,
    category,
    imageUrl: typeof raw.imageUrl === "string" && raw.imageUrl.trim().startsWith("https://") ? raw.imageUrl.trim() : undefined,
    imageCaption: typeof raw.imageCaption === "string" ? raw.imageCaption.trim() : undefined,
    imageCredit: typeof raw.imageCredit === "string" ? raw.imageCredit.trim() : undefined,
    imageAlt: typeof raw.imageAlt === "string" ? raw.imageAlt.trim() : title,
    author: raw.author ? String(raw.author).trim() : source,
    tags,
    editorialType,
    // Campos legados para compatibilidade
    headline: title,
    lead: summary,
    readTime: raw.readTime || "3 min de leitura",
    content: Array.isArray(raw.content) && raw.content.length > 0 ? raw.content : undefined,
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
 * Busca de notícias com fallback automático para os dados embutidos
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
        cache: "no-store",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((item, idx) => normalizeNewsItem(item, idx));
          }
        } else {
          const text = await response.text();
          if (text.trim().startsWith("[")) {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) {
              return data.map((item, idx) => normalizeNewsItem(item, idx));
            }
          }
        }
      }
    } catch {
      // Tenta a próxima URL candidata
    }
  }

  // Fallback garantido para dados estáticos compilados
  return OFFICIAL_NEWS_ARTICLES.map((item, idx) => normalizeNewsItem(item, idx));
}
