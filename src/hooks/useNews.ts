import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { NewsItem } from "../types/news";
import {
  fetchNewsItems,
  filterNewsItems,
} from "../services/newsService";

interface UseNewsOptions {
  initialArticles?: NewsItem[];
}

export function useNews(options?: UseNewsOptions) {
  // Inicialização O(1) direta a partir dos dados pré-normalizados e ordenados
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

  // Sincroniza apenas se initialArticles for explicitamente alterado após a montagem inicial
  const prevInitialRef = useRef(options?.initialArticles);
  useEffect(() => {
    if (options?.initialArticles && options.initialArticles !== prevInitialRef.current) {
      prevInitialRef.current = options.initialArticles;
      setArticles(options.initialArticles);
    }
  }, [options?.initialArticles]);

  const loadData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchNewsItems(isRefresh);
      if (Array.isArray(items) && items.length > 0) {
        setArticles(items);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível sincronizar as notícias da fonte oficial.");
      // Preserva os artigos existentes em articles para evitar tela em branco
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sincroniza o acervo completo de forma assíncrona sem bloquear a renderização inicial
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
    refreshNews: () => loadData(true),
  };
}

