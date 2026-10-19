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
  const [articles, setArticles] = useState<NewsItem[]>(() => {
    if (options?.initialArticles && options.initialArticles.length > 0) {
      return sortNewsItems(
        deduplicateNewsItems(options.initialArticles.map((a, idx) => normalizeNewsItem(a, idx)))
      );
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("Todas");
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  // Sincroniza sempre que a prop initialArticles mudar (ex: após o fetch do App.tsx)
  useEffect(() => {
    if (options?.initialArticles && options.initialArticles.length > 0) {
      const incoming = sortNewsItems(
        deduplicateNewsItems(options.initialArticles.map((a, idx) => normalizeNewsItem(a, idx)))
      );
      setArticles((prev) => {
        if (
          prev.length === incoming.length &&
          prev[0]?.id === incoming[0]?.id &&
          prev[0]?.publishedAt === incoming[0]?.publishedAt
        ) {
          return prev;
        }
        return incoming;
      });
    }
  }, [options?.initialArticles]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNewsItems();
      if (Array.isArray(items) && items.length > 0) {
        setArticles(items);
      }
    } catch {
      // Falha silenciosa: mantém dados existentes
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
