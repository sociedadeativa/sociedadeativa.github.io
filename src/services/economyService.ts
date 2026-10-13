import {
  EconomicIndicator,
  EconomyCategory,
  EconomyFilterOptions,
  OfficialAgency,
} from "../types/economy";
import { OFFICIAL_ECONOMIC_INDICATORS } from "../data/economyData";
import { getB3MarketStatus } from "../utils/marketHours";

/**
 * Normaliza e valida um indicador econômico, garantindo integridade de tipos
 * e mensagens seguras caso dados venham faltantes ou nulos.
 */
export function normalizeEconomicIndicator(raw: any): EconomicIndicator {
  if (!raw || typeof raw !== "object") {
    throw new Error("Indicador inválido fornecido para normalização");
  }

  const id = String(raw.id || "").trim() || "indicador-desconhecido";
  const name = String(raw.name || "Indicador Econômico").trim();
  const shortName = String(raw.shortName || id.toUpperCase()).trim();
  const unit = String(raw.unit || "").trim();

  // Tratamento do valor: se não houver valor numérico válido, exibe "Dados indisponíveis no momento."
  const hasValidValue =
    typeof raw.value === "number" && !isNaN(raw.value);
  const value = hasValidValue ? Number(raw.value) : null;

  let formattedValue = String(raw.formattedValue || "").trim();
  if (!formattedValue) {
    if (value !== null) {
      if (unit.includes("%")) {
        formattedValue = `${value >= 0 ? "+" : ""}${value.toFixed(2).replace(".", ",")}%`;
      } else if (unit.includes("R$")) {
        formattedValue = `R$ ${value.toFixed(2).replace(".", ",")}`;
      } else if (unit.includes("pontos") || unit.includes("pts")) {
        formattedValue = `${Math.round(value).toLocaleString("pt-BR")} pts`;
      } else {
        formattedValue = `${value.toLocaleString("pt-BR")} ${unit}`.trim();
      }
    } else {
      formattedValue = "Dados indisponíveis no momento.";
    }
  }

  const variation =
    typeof raw.variation === "number" && !isNaN(raw.variation)
      ? Number(raw.variation)
      : null;

  const previousValue =
    typeof raw.previousValue === "number" && !isNaN(raw.previousValue)
      ? Number(raw.previousValue)
      : null;

  const referencePeriod = String(raw.referencePeriod || "Período corrente").trim();
  const source: OfficialAgency =
    raw.source === "Banco Central do Brasil"
      ? "Banco Central do Brasil"
      : raw.source === "B3"
      ? "B3"
      : "IBGE";

  const sourceAgency = String(
    raw.sourceAgency ||
      (source === "IBGE"
        ? "Instituto Brasileiro de Geografia e Estatística (IBGE)"
        : source === "Banco Central do Brasil"
        ? "Banco Central do Brasil (BCB)"
        : "B3 - Brasil, Bolsa, Balcão")
  ).trim();

  const sourceUrl = String(
    raw.sourceUrl ||
      (source === "IBGE"
        ? "https://www.ibge.gov.br"
        : source === "Banco Central do Brasil"
        ? "https://www.bcb.gov.br"
        : "https://b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm")
  ).trim();

  const quotationUrl = raw.quotationUrl
    ? String(raw.quotationUrl).trim()
    : source === "B3"
    ? "https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
    : undefined;

  const updatedAt = String(raw.updatedAt || new Date().toLocaleDateString("pt-BR")).trim();

  const frequency = ["Mensal", "Trimestral", "Diária", "Reunião Copom", "Pregão Diário"].includes(raw.frequency)
    ? raw.frequency
    : "Mensal";

  const validCategories: EconomyCategory[] = [
    "Inflação",
    "Atividade Econômica",
    "Mercado de Trabalho",
    "Juros & Câmbio",
  ];
  const category: EconomyCategory = validCategories.includes(raw.category)
    ? raw.category
    : "Atividade Econômica";

  const description = String(raw.description || "Indicador oficial da economia brasileira.").trim();
  const methodologySummary = String(
    raw.methodologySummary || "Metodologia oficial apurada pelos órgãos estatísticos e bolsas do Brasil."
  ).trim();

  const b3MarketInfo = source === "B3" ? getB3MarketStatus() : null;
  const marketStatus = raw.marketStatus === "aberto" || raw.marketStatus === "fechado"
    ? raw.marketStatus
    : b3MarketInfo?.status;
  const marketStatusText = raw.marketStatusText
    ? String(raw.marketStatusText).trim()
    : b3MarketInfo?.statusDetailedText;
  const isDelayed = typeof raw.isDelayed === "boolean" ? raw.isDelayed : source === "B3";
  const delayNotice = raw.delayNotice
    ? String(raw.delayNotice).trim()
    : b3MarketInfo?.delayNotice || (source === "B3"
        ? "Cotações públicas com defasagem regulatória mínima de 15 minutos (B3). Valores de fechamento não constituem cotação em tempo real."
        : undefined);
  const quoteTimestamp = raw.quoteTimestamp ? String(raw.quoteTimestamp).trim() : undefined;

  const historicalData = Array.isArray(raw.historicalData)
    ? raw.historicalData.map((pt: any) => ({
        period: String(pt.period || ""),
        value: typeof pt.value === "number" ? pt.value : 0,
        formattedValue: pt.formattedValue ? String(pt.formattedValue) : undefined,
        variation: typeof pt.variation === "number" ? pt.variation : undefined,
      }))
    : [];

  return {
    id,
    name,
    shortName,
    value,
    formattedValue,
    unit,
    variation,
    variationPeriod: raw.variationPeriod ? String(raw.variationPeriod).trim() : undefined,
    previousValue,
    formattedPreviousValue: raw.formattedPreviousValue ? String(raw.formattedPreviousValue).trim() : undefined,
    referencePeriod,
    source,
    sourceAgency,
    sourceUrl,
    quotationUrl,
    officialSeriesCode: raw.officialSeriesCode ? String(raw.officialSeriesCode).trim() : undefined,
    updatedAt,
    frequency,
    category,
    description,
    methodologySummary,
    marketStatus,
    marketStatusText,
    isDelayed,
    delayNotice,
    quoteTimestamp,
    historicalData,
  };
}

/**
 * Carrega a lista de indicadores econômicos com fallback resiliente.
 */
export async function fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const candidateUrls = [
    ...(origin ? [`${origin}/data/economyData.json`, `${origin}/data/economicData.json`] : []),
    "/data/economyData.json",
    "../data/economyData.json",
    "./data/economyData.json",
    "data/economyData.json",
    "/data/economicData.json",
    "../data/economicData.json",
    "./data/economicData.json",
    "data/economicData.json",
    "https://sociedadeativa.github.io/data/economyData.json",
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
          if (Array.isArray(json) && json.length > 0) {
            return json.map(normalizeEconomicIndicator);
          }
        } else {
          const text = await res.text();
          if (text.trim().startsWith("[")) {
            const json = JSON.parse(text);
            if (Array.isArray(json) && json.length > 0) {
              return json.map(normalizeEconomicIndicator);
            }
          }
        }
      }
    } catch {
      // Tenta próximo caminho
    }
  }

  return OFFICIAL_ECONOMIC_INDICATORS.map(normalizeEconomicIndicator);
}

/**
 * Filtra a lista de indicadores por categoria, busca textual e fonte oficial.
 */
export function filterEconomicIndicators(
  indicators: EconomicIndicator[],
  options: EconomyFilterOptions
): EconomicIndicator[] {
  const { category, searchQuery, source } = options;

  return indicators.filter((ind) => {
    // Filtro por Categoria
    if (category && category !== "Todas" && ind.category !== category) {
      return false;
    }

    // Filtro por Fonte Oficial
    if (source && source !== "Todas" && ind.source !== source) {
      return false;
    }

    // Filtro por Busca Textual
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = ind.name.toLowerCase().includes(q);
      const matchShort = ind.shortName.toLowerCase().includes(q);
      const matchDesc = ind.description.toLowerCase().includes(q);
      const matchCode = ind.officialSeriesCode?.toLowerCase().includes(q) || false;
      const matchAgency = ind.sourceAgency.toLowerCase().includes(q);

      if (!matchName && !matchShort && !matchDesc && !matchCode && !matchAgency) {
        return false;
      }
    }

    return true;
  });
}
