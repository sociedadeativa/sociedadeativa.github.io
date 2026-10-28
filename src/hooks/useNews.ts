import { useState, useEffect, useMemo, useCallback } from "react";
import { NewsItem } from "../types/news";
import {
  fetchNewsItems,
  filterNewsItems,
  normalizeNewsItem,
  sortNewsItems,
  deduplicateNewsItems,
} from "../services/newsService";

interface UseNewsOptions {
  initialArticles?: NewsItem[];
}

export function useNews(options?: UseNewsOptions) {
  // Inicialização direta com os artigos iniciais (snapshot já ordenado e saneado),
  // eliminando normalizações, ordenações e deduplicações redundantes durante a montagem inicial.
  const [articles, setArticles] = useState<NewsItem[]>(() => {
    if (options?.initialArticles && options.initialArticles.length > 0) {
      return options.initialArticles;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("Todas");
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  // Sincroniza caso a prop initialArticles seja atualizada externamente
  useEffect(() => {
    if (options?.initialArticles && options.initialArticles.length > 0) {
      setArticles((prev) => {
        if (
          prev.length === options.initialArticles!.length &&
          prev[0]?.id === options.initialArticles![0]?.id &&
          prev[0]?.publishedAt === options.initialArticles![0]?.publishedAt
        ) {
          return prev;
        }
        return options.initialArticles!;
      });
    }
  }, [options?.initialArticles]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchNewsItems();
      if (Array.isArray(items) && items.length > 0) {
        setArticles(items);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível sincronizar as notícias da fonte oficial.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sincroniza sempre o acervo completo de artigos a partir de data/newsData.json
    loadData();
  }, [loadData]);

  // Lista única de fontes disponíveis
  const sources = useMemo(() => {
    const list = Array.from(new Set(articles.map((a) => a.source).filter(Boolean)));
    return ["Todas", ...list];
  }, [articles]);

  // Artigos filtrados
  const filteredArticles = useMemo(() => {
    return filterNewsItems(articles, {
      category: selectedCategory,
      searchQuery,
      source: selectedSource,
    });
  }, [articles, selectedCategory, searchQuery, selectedSource]);

  return {
    articles,
    filteredArticles,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    sources,
    activeArticle,
    setActiveArticle,
    refreshNews: loadData,
  };
}
