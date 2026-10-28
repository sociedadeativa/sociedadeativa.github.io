import React, { useState } from "react";
import { NewsItem, NEWS_CATEGORIES } from "../types/news";
import { NewsCard } from "../components/NewsCard";
import { useNews } from "../hooks/useNews";
import { AdBanner } from "../components/AdBanner";
import { PortalLink } from "../components/PortalLink";
import { Newspaper, Search, X, Filter, ExternalLink, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { handleTabKeyDown } from "../utils/a11yTabs";

interface NoticiasPageProps {
  initialArticles: NewsItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const NoticiasPage: React.FC<NoticiasPageProps> = ({
  initialArticles,
  isLoading = false,
  error = null,
  onRetry,
  onOpenArticleDetails,
}) => {
  const {
    filteredArticles,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    sources,
    loading: hookLoading,
  } = useNews({ initialArticles });

  const isPageLoading = isLoading || hookLoading;

  const categories = ["Todas", ...NEWS_CATEGORIES];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Notícias */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            <Newspaper className="w-4 h-4 text-blue-700" />
            <span>Central de Jornalismo &amp; Agências Públicas de Comunicação</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Notícias Oficiais, Atos dos Poderes e Apurações
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Curadoria em tempo real de matérias distribuídas pela Agência Brasil (EBC), Agência Câmara, Agência Senado, Tribunal Superior Eleitoral (TSE), Supremo Tribunal Federal (STF) e IBGE Notícias.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Filtrar por tema:</span>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Política &amp; Congresso &rarr;
            </PortalLink>
            <PortalLink
              route="eleicoes"
              className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
            >
              Eleições 2026 &rarr;
            </PortalLink>
            <PortalLink
              route="economia"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Economia &amp; Finanças &rarr;
            </PortalLink>
          </div>
        </div>

        {/* Barra de Filtros e Busca de Notícias */}
        <div className="mb-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Campo de Pesquisa Textual */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por assunto, palavra-chave ou órgão..."
                aria-label="Pesquisar notícias oficiais por assunto ou órgão"
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:outline-hidden text-slate-800 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer"
                  title="Limpar busca"
                  aria-label="Limpar busca de notícias"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Seletor de Agência / Fonte Oficial */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="select-fonte-oficial-noticias" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Fonte:
              </label>
              <select
                id="select-fonte-oficial-noticias"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                aria-label="Filtrar notícias por fonte ou agência oficial"
                className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-hidden cursor-pointer"
              >
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Abas de Categorias Editoriais (Botões Interativos) */}
          <div
            role="tablist"
            aria-label="Categorias editoriais de notícias"
            onKeyDown={(e) => handleTabKeyDown(e, '[role="tab"]')}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  id={`tab-noticias-${cat}`}
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  aria-controls="panel-noticias-list"
                  aria-label={`${cat}: filtrar notícias pela categoria ${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center justify-center ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listagem de Artigos */}
        <div
          id="panel-noticias-list"
          role="tabpanel"
          aria-labelledby={`tab-noticias-${selectedCategory}`}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900">
              Notícias Encontradas
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {filteredArticles.length} resultados
            </span>
          </div>

          {isPageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" aria-label="Carregando matérias">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4 space-y-3">
                  <div className="aspect-16/9 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : !isPageLoading && error && initialArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-amber-200 p-8 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-heading font-bold text-slate-900 text-base">
                  Não foi possível carregar as notícias
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {error || "Erro de conexão com as agências públicas de comunicação."}
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar novamente</span>
                </button>
              )}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 text-base">
                Nenhuma notícia encontrada com os filtros selecionados.
              </p>
              <p className="text-xs text-slate-500">
                Tente limpar os termos de pesquisa ou selecionar outra categoria oficial.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("Todas");
                  setSearchQuery("");
                  setSelectedSource("Todas");
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onOpenDetails={onOpenArticleDetails}
                />
              ))}
            </div>
          )}
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
