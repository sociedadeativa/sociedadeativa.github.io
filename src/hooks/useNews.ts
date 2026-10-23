import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { NewsItem } from "../types/news";
import {
  fetchNewsItems,
  filterNewsItems,
  getCachedNews,
} from "../services/newsService";

export interface UseNewsOptions {
  initialArticles?: NewsItem[];
  skipBackgroundSync?: boolean;
}

/**
 * Hook para gerenciamento e consumo de notícias do portal.
 *
 * Otimizações de renderização inicial e TBT:
 * 1. Inicialização direta O(1) a partir de initialArticles (sem requisições ou processamento no thread crítico).
 * 2. Sincronização em segundo plano postergada via requestIdleCallback (com fallback para setTimeout),
 *    garantindo que FCP, LCP e TBT da página inicial não sofram contenção de CPU ou largura de banda.
 * 3. Sincronização silenciosa quando há dados prévios: não ativa 'loading: true' desnecessariamente,
 *    evitando re-renderizações e flashes de skeleton.
 * 4. Preservação total de carregamento manual imediato via refreshNews / retries,
 *    acesso sob demanda ao acervo completo e resiliência offline.
 */
export function useNews(options?: UseNewsOptions) {
  const hasInitialArticles = Boolean(
    options?.initialArticles && options.initialArticles.length > 0
  );

  // Inicialização O(1) direta a partir dos dados pré-normalizados e ordenados
  const [articles, setArticles] = useState<NewsItem[]>(() => {
    if (hasInitialArticles) {
      return options!.initialArticles!;
    }
    const cached = getCachedNews();
    if (cached && cached.length > 0) {
      return cached;
    }
    return [];
  });

  // Se já possuímos artigos locais, não iniciamos em estado de loading
  const [loading, setLoading] = useState<boolean>(() => !hasInitialArticles && (!getCachedNews() || getCachedNews()!.length === 0));
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("Todas");
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const isMountedRef = useRef(true);
  const articlesRef = useRef(articles);
  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  // Sincroniza apenas se initialArticles for explicitamente alterado após a montagem inicial
  const prevInitialRef = useRef(options?.initialArticles);
  useEffect(() => {
    if (options?.initialArticles && options.initialArticles !== prevInitialRef.current) {
      prevInitialRef.current = options.initialArticles;
      setArticles(options.initialArticles);
      articlesRef.current = options.initialArticles;
    }
  }, [options?.initialArticles]);

  const loadData = useCallback(async (isRefresh = false) => {
    // Se for uma sincronização em segundo plano com dados já visíveis,
    // não alteramos loading para true para evitar flashes de skeleton e re-renderizações prematuras.
    const isSilentBackgroundSync = !isRefresh && articlesRef.current.length > 0;

    if (!isSilentBackgroundSync) {
      setLoading(true);
      setError(null);
    }

    try {
      const items = await fetchNewsItems(isRefresh);
      if (isMountedRef.current && Array.isArray(items) && items.length > 0) {
        setArticles(items);
        articlesRef.current = items;
        setError(null);
      }
    } catch (err: any) {
      // Se o usuário solicitou refresh explícito ou se não temos nenhum artigo,
      // exibimos a mensagem de erro para possibilitar retry interativo.
      // Em sincronizações automáticas com dados locais já presentes, preservamos os dados silenciosamente.
      if (isMountedRef.current && !isSilentBackgroundSync) {
        setError(err?.message || "Não foi possível sincronizar as notícias da fonte oficial.");
      }
    } finally {
      if (isMountedRef.current && !isSilentBackgroundSync) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelIdleTask: (() => void) | null = null;

    if (options?.skipBackgroundSync) {
      return () => {
        isMountedRef.current = false;
      };
    }

    if (hasInitialArticles || (getCachedNews() && getCachedNews()!.length > 0)) {
      // Dados já presentes: posterga a sincronização para tempo ocioso (idle)
      // evitando competição com a pintura da dobra inicial e hidratação do React
      if (typeof window !== "undefined" && typeof (window as any).requestIdleCallback === "function") {
        const handle = (window as any).requestIdleCallback(
          () => {
            if (isMountedRef.current) {
              loadData(false);
            }
          },
          { timeout: 3500 }
        );
        cancelIdleTask = () => (window as any).cancelIdleCallback(handle);
      } else if (typeof window !== "undefined") {
        // Fallback em browsers sem requestIdleCallback (ex: Safari)
        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            loadData(false);
          }
        }, 1200);
        cancelIdleTask = () => clearTimeout(timer);
      } else {
        // Ambiente não-browser / testes unitários rápidos
        const timer = setTimeout(() => {
          if (isMountedRef.current) {
            loadData(false);
          }
        }, 10);
        cancelIdleTask = () => clearTimeout(timer);
      }
    } else {
      // Sem dados iniciais: busca imediatamente para evitar tela em branco
      loadData(false);
    }

    return () => {
      isMountedRef.current = false;
      if (cancelIdleTask) {
        cancelIdleTask();
      }
    };
  }, [hasInitialArticles, loadData, options?.skipBackgroundSync]);

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


