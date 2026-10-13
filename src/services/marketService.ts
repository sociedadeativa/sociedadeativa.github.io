import { B3MarketRankings } from "../types/market";
import { OFFICIAL_B3_MARKET_DATA } from "../data/marketData";
import { getB3MarketStatus } from "../utils/marketHours";

/**
 * Normaliza e enriquece os rankings do mercado financeiro da B3,
 * recalculando o status do pregão e defasagem em tempo real de Brasília.
 */
export function normalizeMarketRankings(raw: any): B3MarketRankings {
  if (!raw || typeof raw !== "object") {
    throw new Error("Dados de mercado inválidos para normalização");
  }

  const b3MarketInfo = getB3MarketStatus();

  const isDelayed = typeof raw.isDelayed === "boolean" ? raw.isDelayed : true;
  const delayNotice =
    raw.delayNotice ||
    b3MarketInfo.delayNotice ||
    "Cotações públicas com defasagem mínima de 15 minutos (B3). Fora do horário de negociação, exibe o último fechamento consolidado.";

  // O status é dinâmico: se o pregão estiver aberto agora, exibe como aberto; caso contrário, fechado.
  const marketStatus = b3MarketInfo.status;
  const marketStatusText = b3MarketInfo.statusDetailedText;

  const rawIbov = raw.ibov || {};
  const ibovPoints =
    typeof rawIbov.points === "number" && !isNaN(rawIbov.points) ? rawIbov.points : 209067;
  const ibovChange =
    typeof rawIbov.changePercent === "number" && !isNaN(rawIbov.changePercent)
      ? rawIbov.changePercent
      : 1.38;

  const ibov = {
    indexName: String(rawIbov.indexName || "Ibovespa (IBOV)"),
    ticker: "IBOV",
    points: ibovPoints,
    formattedPoints: `${Math.round(ibovPoints).toLocaleString("pt-BR")} pts`,
    changePercent: ibovChange,
    formattedChangePercent: `${ibovChange >= 0 ? "+" : ""}${ibovChange.toFixed(2).replace(".", ",")}%`,
    previousClosePoints: rawIbov.previousClosePoints || 206220,
    formattedPreviousClose: rawIbov.formattedPreviousClose || "206.220 pts",
    tradingSession: String(rawIbov.tradingSession || raw.tradingSession || "09/10/2026"),
    timestamp: String(rawIbov.timestamp || raw.timestamp || "09/10/2026 18:00"),
    marketStatus,
    marketStatusText,
    isDelayed,
    delayNotice,
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
      tradingSession: String(item.tradingSession || raw.tradingSession || "09/10/2026"),
      timestamp: String(item.timestamp || raw.timestamp || "09/10/2026 18:00"),
      source: "B3",
    }));
  };

  return {
    tradingSession: String(raw.tradingSession || "09/10/2026"),
    timestamp: String(raw.timestamp || "09/10/2026 18:00"),
    marketStatus,
    marketStatusText,
    isDelayed,
    delayNotice,
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

/**
 * Carrega rankings de mercado com fallback resiliente e verificação de JSON válido.
 */
export async function fetchMarketRankings(): Promise<B3MarketRankings> {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const candidateUrls = [
    ...(origin ? [`${origin}/data/marketData.json`] : []),
    "/data/marketData.json",
    "../data/marketData.json",
    "./data/marketData.json",
    "data/marketData.json",
    "https://sociedadeativa.github.io/data/marketData.json",
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "default",
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json") || contentType.includes("text/json")) {
          const json = await res.json();
          if (json && typeof json === "object" && json.ibov) {
            return normalizeMarketRankings(json);
          }
        } else {
          // Trata caso de resposta com Content-Type omitido mas corpo JSON válido
          const text = await res.text();
          if (text.trim().startsWith("{")) {
            const json = JSON.parse(text);
            if (json && typeof json === "object" && json.ibov) {
              return normalizeMarketRankings(json);
            }
          }
        }
      }
    } catch {
      // Continua para o próximo caminho na lista de tentativas
    }
  }

  // Fallback imediato, auditado e consistente para a base oficial compilada
  return normalizeMarketRankings(OFFICIAL_B3_MARKET_DATA);
}
