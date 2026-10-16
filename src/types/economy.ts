export type EconomyCategory =
  | "Inflação"
  | "Atividade Econômica"
  | "Mercado de Trabalho"
  | "Juros & Câmbio";

export const ECONOMY_CATEGORIES: EconomyCategory[] = [
  "Inflação",
  "Atividade Econômica",
  "Mercado de Trabalho",
  "Juros & Câmbio",
];

export interface HistoricalDataPoint {
  period: string; // Ex: "05/2024", "2T24"
  value: number;
  formattedValue?: string;
  variation?: number | null;
}

export type OfficialAgency = "IBGE" | "Banco Central do Brasil" | "B3";

export interface EconomicIndicator {
  id: string;
  name: string;
  shortName: string;
  value: number | null;
  formattedValue: string;
  unit: string;
  variation: number | null;
  variationPeriod?: string;
  previousValue: number | null;
  formattedPreviousValue?: string;
  referencePeriod: string;
  source: OfficialAgency;
  sourceAgency: string;
  sourceUrl: string;
  quotationUrl?: string;
  officialSeriesCode?: string;
  updatedAt: string;
  frequency: "Mensal" | "Trimestral" | "Diária" | "Reunião Copom" | "Pregão Diário";
  category: EconomyCategory;
  description: string;
  methodologySummary: string;
  marketStatus?: "aberto" | "fechado";
  marketStatusText?: string;
  isDelayed?: boolean;
  delayNotice?: string;
  quoteTimestamp?: string;
  sessionDate?: string;
  isStale?: boolean;
  staleNotice?: string;
  staleReason?: string;
  historicalData: HistoricalDataPoint[];
}

export interface EconomyFilterOptions {
  category?: EconomyCategory | "Todas";
  searchQuery?: string;
  source?: OfficialAgency | "Todas";
}
