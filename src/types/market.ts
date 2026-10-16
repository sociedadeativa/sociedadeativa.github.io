/**
 * Tipos e Interfaces para o Painel da Bolsa de Valores (B3)
 * Sociedade Ativa — Política, eleições, notícias e dados do Brasil.
 */

export interface StockQuote {
  ticker: string;
  companyName: string;
  sector?: string;
  price: number;
  formattedPrice: string;
  change: number;
  changePercent: number;
  formattedChangePercent: string;
  financialVolume: number; // Volume Financeiro em Reais (R$)
  formattedFinancialVolume: string; // Ex: "R$ 2,79 bi"
  shareVolume?: number; // Quantidade de ações negociadas
  tradingSession: string; // Ex: "09/10/2026"
  timestamp: string; // Ex: "09/10/2026 18:00"
  source: string;
}

export interface IbovespaMarketData {
  indexName: string;
  ticker: string;
  points: number;
  formattedPoints: string;
  changePercent: number;
  formattedChangePercent: string;
  previousClosePoints: number;
  formattedPreviousClose: string;
  tradingSession: string;
  timestamp: string;
  quoteTimestamp?: string;
  lastSuccessfulUpdate?: string;
  serverDatasetTimestamp?: string;
  marketStatus: "aberto" | "fechado";
  marketStatusText: string;
  isDelayed: boolean;
  delayNotice: string;
  isStale?: boolean;
  staleReason?: string;
  staleNotice?: string;
  source: string;
  sourceUrl: string;
  quotationUrl: string;
}

export interface B3MarketRankings {
  tradingSession: string; // Ex: "14/10/2026"
  timestamp: string;
  quoteTimestamp?: string;
  lastSuccessfulUpdate?: string;
  serverDatasetTimestamp?: string;
  lastFetchAttempt?: string;
  marketStatus: "aberto" | "fechado";
  marketStatusText: string;
  isDelayed: boolean;
  delayNotice: string;
  isStale?: boolean;
  staleReason?: string;
  staleNotice?: string;
  rankingMethodology: {
    mostTradedMetric: string;
    gainersMetric: string;
    declinersMetric: string;
  };
  source: string;
  sourceUrl: string;
  quotationUrl: string;
  ibov: IbovespaMarketData;
  mostTraded: StockQuote[];
  gainers: StockQuote[];
  decliners: StockQuote[];
}

