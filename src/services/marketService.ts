import { B3MarketRankings } from "../types/market";
import { OFFICIAL_B3_MARKET_DATA } from "../data/marketData";
import { getB3MarketStatus } from "../utils/marketHours";

export interface NormalizeMarketOptions {
  clientSyncTimestamp?: string;
  isNetworkFresh?: boolean;
}

/**
 * Normaliza e enriquece os rankings do mercado financeiro da B3,
 * recalculando o status do pregão e defasagem em tempo real de Brasília.
 */
export function normalizeMarketRankings(
  raw: any,
  options?: NormalizeMarketOptions
): B3MarketRankings {
  if (!raw || typeof raw !== "object") {
    throw new Error("Dados de mercado inválidos para normalização");
  }

  const defaultSession = raw.tradingSession || raw.ibov?.tradingSession || OFFICIAL_B3_MARKET_DATA.tradingSession;
  const defaultTimestamp = raw.timestamp || raw.ibov?.timestamp || OFFICIAL_B3_MARKET_DATA.timestamp;

  const b3MarketInfo = getB3MarketStatus(new Date(), {
    tradingSession: String(defaultSession),
    timestamp: String(defaultTimestamp),
    marketStatus: raw.marketStatus || raw.ibov?.marketStatus,
  });

  const isDelayed = typeof raw.isDelayed === "boolean" ? raw.isDelayed : true;
  const delayNotice =
    raw.delayNotice ||
    b3MarketInfo.delayNotice ||
    "Cotações públicas com defasagem mínima de 15 minutos (B3). Fora do horário de negociação, exibe o último fechamento consolidado.";

  const marketStatus = b3MarketInfo.status;
  const marketStatusText = b3MarketInfo.statusDetailedText;

  const isStale = Boolean(raw.isStale);
  const staleReason = raw.staleReason ? String(raw.staleReason).trim() : undefined;
  const staleNotice =
    raw.staleNotice ||
    (isStale
      ? "Aviso de dados preservados: Exibindo último fechamento oficial consolidado. O serviço em tempo real da B3 está temporariamente indisponível."
      : undefined);

  // Distinção segura entre carimbo do dataset no servidor e sincronização real do cliente
  const serverDatasetTimestamp = String(raw.lastSuccessfulUpdate || defaultTimestamp);
  const lastSuccessfulUpdate = options?.clientSyncTimestamp || serverDatasetTimestamp;
  const lastFetchAttempt = options?.clientSyncTimestamp || String(raw.lastFetchAttempt || lastSuccessfulUpdate);
  const quoteTimestamp =
    raw.quoteTimestamp || raw.ibov?.quoteTimestamp || defaultTimestamp;

  const rawIbov = raw.ibov || {};
  const ibovPoints =
    typeof rawIbov.points === "number" && !isNaN(rawIbov.points) ? rawIbov.points : OFFICIAL_B3_MARKET_DATA.ibov.points;
  const ibovChange =
    typeof rawIbov.changePercent === "number" && !isNaN(rawIbov.changePercent)
      ? rawIbov.changePercent
      : OFFICIAL_B3_MARKET_DATA.ibov.changePercent;

  const ibov = {
    indexName: String(rawIbov.indexName || "Ibovespa (IBOV)"),
    ticker: "IBOV",
    points: ibovPoints,
    formattedPoints: `${Math.round(ibovPoints).toLocaleString("pt-BR")} pts`,
    changePercent: ibovChange,
    formattedChangePercent: `${ibovChange >= 0 ? "+" : ""}${ibovChange.toFixed(2).replace(".", ",")}%`,
    previousClosePoints: rawIbov.previousClosePoints || OFFICIAL_B3_MARKET_DATA.ibov.previousClosePoints,
    formattedPreviousClose: rawIbov.formattedPreviousClose || OFFICIAL_B3_MARKET_DATA.ibov.formattedPreviousClose,
    tradingSession: String(rawIbov.tradingSession || defaultSession),
    timestamp: String(rawIbov.timestamp || defaultTimestamp),
    quoteTimestamp: String(rawIbov.quoteTimestamp || quoteTimestamp),
    lastSuccessfulUpdate: String(rawIbov.lastSuccessfulUpdate || lastSuccessfulUpdate),
    serverDatasetTimestamp,
    marketStatus,
    marketStatusText,
    isDelayed,
    delayNotice,
    isStale,
    staleReason,
    staleNotice,
    source: "B3 - Brasil, Bolsa, Balcão",
    sourceUrl:
      "https://b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm",
    quotationUrl:
      "https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/",
  };

  const mapList = (arr: any[]) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => ({
      ticker: String(item.ticker || "").toUpperCase(),
      companyName: String(item.companyName || item.ticker),
      sector: item.sector ? String(item.sector) : undefined,
      price: typeof item.price === "number" ? item.price : 0,
      formattedPrice: `R$ ${(typeof item.price === "number" ? item.price : 0).toFixed(2).replace(".", ",")}`,
      change: typeof item.change === "number" ? item.change : 0,
      changePercent: typeof item.changePercent === "number" ? item.changePercent : 0,
      formattedChangePercent: `${(item.changePercent || 0) >= 0 ? "+" : ""}${(item.changePercent || 0).toFixed(2).replace(".", ",")}%`,
      financialVolume: typeof item.financialVolume === "number" ? item.financialVolume : 0,
      formattedFinancialVolume:
        item.formattedFinancialVolume ||
        (item.financialVolume >= 1_000_000_000
          ? `R$ ${(item.financialVolume / 1_000_000_000).toFixed(2).replace(".", ",")} bi`
          : `R$ ${(item.financialVolume / 1_000_000).toFixed(1).replace(".", ",")} mi`),
      shareVolume: typeof item.shareVolume === "number" ? item.shareVolume : undefined,
      tradingSession: String(item.tradingSession || defaultSession),
      timestamp: String(item.timestamp || defaultTimestamp),
      source: "B3",
    }));
  };

  return {
    tradingSession: String(defaultSession),
    timestamp: String(defaultTimestamp),
    quoteTimestamp: String(quoteTimestamp),
    lastSuccessfulUpdate: String(lastSuccessfulUpdate),
    serverDatasetTimestamp,
    lastFetchAttempt: String(lastFetchAttempt),
    marketStatus,
    marketStatusText,
    isDelayed,
    delayNotice,
    isStale,
    staleReason,
    staleNotice,
    rankingMethodology: {
      mostTradedMetric:
        "Volume financeiro total negociado em moeda corrente (R$), calculado pelo produto do preço unitário de fechamento pela quantidade de títulos transacionados no pregão. Não se confunde com quantidade de papéis.",
      gainersMetric:
        "Variação percentual diária positiva em relação ao preço de fechamento do pregão imediatamente anterior (D-1), ordenada em ordem decrescente.",
      declinersMetric:
        "Variação percentual diária em relação ao preço de fechamento do pregão imediatamente anterior (D-1), ordenada da menor variação (ou maior desvalorização) para a maior.",
    },
    source: "B3 - Brasil, Bolsa, Balcão",
    sourceUrl:
      "https://b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm",
    quotationUrl:
      "https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/",
    ibov,
    mostTraded: mapList(raw.mostTraded),
    gainers: mapList(raw.gainers),
    decliners: mapList(raw.decliners),
  };
}

import { dedupeInFlightRequest } from "../utils/inFlightRequests";

export interface FetchMarketOptions {
  throwOnError?: boolean;
}

/**
 * Carrega rankings de mercado com URLs canônicas estáveis, suporte a revalidação condicional (ETag),
 * deduplicação de requisições simultâneas em voo e tratamento transparente de erros e defasagem regulatória da B3.
 */
export async function fetchMarketRankings(
  options: FetchMarketOptions = {}
): Promise<B3MarketRankings> {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  const candidateUrls: string[] = [];

  if (origin) {
    // 1. Caminho absoluto pela origem atual
    candidateUrls.push(`${origin}/data/marketData.json`);
  }

  // 2. Se houver subcaminho (ex: GitHub Pages em repositório de usuário)
  if (origin && pathname && pathname !== "/" && pathname !== "") {
    const segments = pathname.split("/").filter(Boolean);
    const knownSections = [
      "economia",
      "politica",
      "eleicoes",
      "estados",
      "dados-publicos",
      "noticias",
      "esportes",
      "clima",
      "sobre",
    ];
    if (segments.length > 0 && knownSections.includes(segments[segments.length - 1])) {
      segments.pop();
    }
    if (segments.length > 0) {
      const subpath = "/" + segments.join("/");
      candidateUrls.push(`${origin}${subpath}/data/marketData.json`);
    }
  }

  // 3. Caminhos relativos e raiz
  candidateUrls.push(`/data/marketData.json`);
  candidateUrls.push(`./data/marketData.json`);
  candidateUrls.push(`../data/marketData.json`);
  candidateUrls.push(`data/marketData.json`);

  // 4. URL canônica em produção como salvaguarda
  candidateUrls.push(`https://sociedadeativa.github.io/data/marketData.json`);

  const uniqueUrls = Array.from(new Set(candidateUrls));
  const errors: string[] = [];

  for (const url of uniqueUrls) {
    try {
      // Requisição deduplicada em voo com suporte a ETag e validação de corpo JSON
      const json = await dedupeInFlightRequest(url, async () => {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json, text/plain, */*",
          },
          cache: "no-cache",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type") || "";
        // Descarta páginas HTML de 404 / SPA index
        if (contentType.includes("text/html")) {
          throw new Error("Retornou HTML em vez de JSON");
        }

        const text = await res.text();
        const trimmed = text.trim();
        if (!trimmed.startsWith("{")) {
          throw new Error("Resposta não contém JSON válido");
        }

        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== "object" || !parsed.ibov) {
          throw new Error("JSON sem nó 'ibov' requerido");
        }

        return parsed;
      });

      // Sincronização real confirmada: grava o carimbo no horário oficial de Brasília
      const clientSyncTimestamp = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      return normalizeMarketRankings(json, {
        clientSyncTimestamp,
        isNetworkFresh: true,
      });
    } catch (err: any) {
      errors.push(`${url} (${err?.message || String(err)})`);
    }
  }

  const errorSummary = errors.join("; ");
  console.warn(`[marketService] Aviso de conectividade: endpoints remotos temporariamente inacessíveis (${errorSummary}). Aplicando base auditada de salvaguarda.`);

  if (options.throwOnError) {
    throw new Error(`Não foi possível sincronizar com o feed de dados da B3: ${errorSummary}`);
  }

  // Fallback seguro auditado marcado como não atualizado
  const fallback = normalizeMarketRankings(OFFICIAL_B3_MARKET_DATA);
  fallback.isStale = true;
  fallback.staleReason = `Falha na requisição de rede: ${errorSummary}`;
  fallback.staleNotice =
    "Aviso de dados preservados: Exibindo cotações da base compilada local. O feed de atualização automática da B3 não respondeu.";
  return fallback;
}

