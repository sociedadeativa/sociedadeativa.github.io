import React, { useState, useEffect, useMemo } from "react";
import { NewsItem, NewsCategory, NEWS_CATEGORIES } from "../types/news";
import { NewsCard } from "./NewsCard";
import { useNews } from "../hooks/useNews";
import { isValidImageUrl } from "../services/newsService";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import {
  Calendar,
  Clock,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Share2,
  Check,
} from "lucide-react";
import { handleTabKeyDown } from "../utils/a11yTabs";

interface NewsSectionProps {
  articles?: NewsItem[];
  onOpenArticleDetails?: (article: NewsItem) => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  articles,
  onOpenArticleDetails,
}) => {
  const {
    filteredArticles,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeArticle,
    setActiveArticle,
  } = useNews({ initialArticles: articles });

  const [copied, setCopied] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);

  useEffect(() => {
    setModalImageError(false);
  }, [activeArticle?.id, activeArticle?.imageUrl]);

  const categories = ["Todas", ...NEWS_CATEGORIES];

  // Artigos "Mais Lidas": Seleciona matérias de grande relevância institucional para o ranking editorial
  const mostReadArticles = useMemo(() => {
    if (!Array.isArray(articles) || articles.length === 0) return [];
    return articles.slice(0, 5);
  }, [articles]);

  const handleOpenArticle = (item: NewsItem) => {
    if (onOpenArticleDetails) {
      onOpenArticleDetails(item);
    } else {
      setActiveArticle(item);
    }
  };

  const handleShare = () => {
    if (!activeArticle) return;
    const shareUrl = activeArticle.articleUrl || window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: activeArticle.title,
          text: activeArticle.summary,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="cobertura-noticias" className="py-10 sm:py-14 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção de Notícias */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              <span>Jornalismo Cívico &amp; Cobertura Oficial</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
              Últimas Notícias e Análises
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Reportagens apuradas, deliberações do Congresso Nacional, decisões do Executivo e do Judiciário e dados oficiais do Brasil.
            </p>
          </div>

          {/* Campo de Busca Rápida Acessível */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por termo ou assunto..."
              aria-label="Buscar notícias oficiais por assunto ou órgão"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer"
                title="Limpar busca"
                aria-label="Limpar busca de notícias"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtro de Categorias (Controles Funcionais Interativos) */}
        <div
          role="tablist"
          aria-label="Filtrar notícias por editoria"
          onKeyDown={(e) =>
            handleTabKeyDown(e, categories, selectedCategory, setSelectedCategory)
          }
          className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 text-xs scrollbar-thin scrollbar-thumb-slate-200"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`tab-news-${cat}`}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                aria-controls="panel-news-list"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 flex items-center justify-center ${
                  isActive
                    ? "bg-[#0B132B] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Layout Dividido Editorial: 1. Últimas Notícias (Grade Principal) + 2. Mais Lidas (Coluna Dedicada) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Seção 1: Últimas Notícias (Grade Responsiva) */}
          <div
            id="panel-news-list"
            role="tabpanel"
            aria-labelledby={`tab-news-${selectedCategory}`}
            className="lg:col-span-8 flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200">
              <h3 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-900 rounded-xs" />
                <span>Feed de Notícias Recentes ({filteredArticles.length})</span>
              </h3>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                >
                  Limpar filtro de busca
                </button>
              )}
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-base font-bold text-slate-800">
                  Nenhuma notícia encontrada para os critérios selecionados.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Tente alterar o termo de pesquisa ou selecionar outra categoria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("Todas");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Ver todas as notícias
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.slice(0, 6).map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    onOpenDetails={handleOpenArticle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Seção 2: "Mais Lidas" — Coluna Claramente Definida com Ranking Editorial */}
          <div className="lg:col-span-4 flex flex-col">
            <aside
              aria-label="Notícias mais lidas do portal"
              className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 sticky top-28"
            >
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
                <h3 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-900" />
                  <span>Mais Lidas</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Top 5
                </span>
              </div>

              {/* Lista Ordenada de 01 a 05 com Tipografia Editorial */}
              <ol className="divide-y divide-slate-200/80">
                {mostReadArticles.map((article, idx) => {
                  const rankNumber = String(idx + 1).padStart(2, "0");
                  return (
                    <li
                      key={`most-read-${article.id}`}
                      onClick={() => handleOpenArticle(article)}
                      className="group py-4 first:pt-0 last:pb-0 cursor-pointer flex items-start gap-4"
                    >
                      {/* Numeração Editorial em Destaque */}
                      <span className="font-heading font-black text-2xl sm:text-3xl text-slate-300 group-hover:text-blue-700 transition-colors shrink-0 tabular-nums select-none leading-none mt-0.5">
                        {rankNumber}
                      </span>

                      {/* Informações da Notícia */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                          <span className="font-bold text-blue-900 uppercase tracking-wider">
                            {article.category}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="text-slate-600 truncate">{article.source}</span>
                        </div>

                        <h4 className="font-heading text-sm sm:text-base font-bold text-slate-950 group-hover:text-blue-800 transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{article.publishedAt.split(" às ")[0]}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Rodapé da Coluna Mais Lidas com Acesso ao Caderno Completo */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Acervo oficial verificado</span>
                <button
                  onClick={() => {
                    setSelectedCategory("Todas");
                    setSearchQuery("");
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explorar todas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Modal de Detalhes e Atribuição do Artigo */}
        {activeArticle && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveArticle(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                title="Fechar resumo"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                  {activeArticle.category}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  {activeArticle.readTime || "Leitura rápida"}
                </span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-tight">
                {activeArticle.title}
              </h2>

              {activeArticle.imageUrl && isValidImageUrl(activeArticle.imageUrl) && (
                <div className="mb-4 rounded-xl overflow-hidden aspect-[16/9] bg-slate-100 border border-slate-200">
                  <img
                    src={modalImageError ? EDITORIAL_IMAGES.congresso.src : activeArticle.imageUrl}
                    alt={activeArticle.imageAlt || activeArticle.title}
                    className="w-full h-full object-cover"
                    onError={() => setModalImageError(true)}
                  />
                </div>
              )}

              <p className="text-base text-slate-700 leading-relaxed mb-6">
                {activeArticle.summary}
              </p>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeArticle.publishedAt}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-slate-800">{activeArticle.source}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copiado!" : "Compartilhar"}</span>
                  </button>

                  {activeArticle.articleUrl && (
                    <a
                      href={activeArticle.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5 font-bold"
                    >
                      <span>Fonte original</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nota Institucional de Integridade Editorial */}
        <div className="mt-12 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-900 font-bold">Critério Editorial e Transparência:</strong>{" "}
              O portal Sociedade Ativa reúne e organiza dados primários, despachos institucionais e coberturas apuradas pelos órgãos públicos e agências oficiais. Cada texto referencia sua autoria e fonte de origem com acesso direto à matéria original.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
