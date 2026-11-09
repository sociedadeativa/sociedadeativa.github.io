export type NewsCategory =
  | "Política"
  | "Governo"
  | "Congresso"
  | "Justiça"
  | "Economia"
  | "Brasil"
  | "Mundo"
  | "Esportes"
  | "Tecnologia"
  | "Entretenimento"
  | "Eleições";

export const NEWS_CATEGORIES: NewsCategory[] = [
  "Política",
  "Governo",
  "Congresso",
  "Justiça",
  "Economia",
  "Brasil",
  "Esportes",
  "Tecnologia",
  "Entretenimento",
];

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  articleUrl: string;
  publishedAt: string;
  updatedAt?: string;
  ingestedAt?: string;
  category: NewsCategory;
  imageUrl?: string;
  imageCaption?: string;
  imageCredit?: string;
  imageAlt?: string;
  author?: string;
  tags?: string[];
  editorialType?: "analise_propria" | "sumula_oficial" | "reportagem_especial";

  // Campos de compatibilidade editorial
  headline?: string;
  lead?: string;
  readTime?: string;
  content?: string[];
  isOriginalReporting?: boolean;
}

export type NewsArticle = NewsItem;

export interface NewsFilterOptions {
  category?: string;
  searchQuery?: string;
  source?: string;
  tag?: string;
}
