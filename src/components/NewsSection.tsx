import React, { useState, useEffect } from "react";
import { NewsItem, NewsCategory, NEWS_CATEGORIES } from "../types/news";
import { isValidImageUrl, getFullArticleById } from "../services/newsService";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { NewsCard } from "./NewsCard";
import { useNews } from "../hooks/useNews";
import { AdBanner } from "./AdBanner";
import {
  Calendar,
  Clock,
  X,
  Share2,
  Tag,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Filter,
} from "lucide-react";

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
  } = useNews({ initialArticles: articles, skipBackgroundSync: true });

  const [copied, setCopied] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<string[] | null>(null);

  useEffect(() => {
    setModalImageError(false);
    setDynamicContent(activeArticle?.content && activeArticle.content.length > 0 ? activeArticle.content : null);
    if (activeArticle && (!activeArticle.content || activeArticle.content.length === 0)) {
      let isMounted = true;
      getFullArticleById(activeArticle.id)
        .then((full) => {
          if (isMounted && full?.content && full.content.length > 0) {
            setDynamicContent(full.content);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [activeArticle?.id, activeArticle?.imageUrl, activeArticle?.content]);

  const activeContent = dynamicContent || (activeArticle?.content && activeArticle.content.length > 0 ? activeArticle.content : null);

  const categories = ["Todas", ...NEWS_CATEGORIES];

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

  const isSociedadeAtivaAuthor =
    activeArticle?.source?.includes("Sociedade Ativa") ||
    activeArticle?.author?.includes("Sociedade Ativa");

  return (
    <section id="ultimas-noticias" className="py-14 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Editorial da Seção */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5">
              <span>Curadoria & Jornalismo Público</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Últimas Notícias e Análises
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Política, eleições, notícias e dados do Brasil. Acompanhe a cobertura das instituições, apurações oficiais e atos dos Três Poderes.
            </p>
          </div>

          {/* Barra de Busca Rápida de Notícias */}
          <div className="relative w-full sm:w-72 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por assunto, órgão ou palavra-chave..."
              aria-label="Buscar notícias oficiais por assunto ou órgão"
              className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:outline-hidden text-slate-800 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer"
                title="Limpar busca"
                aria-label="Limpar busca de notícias"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Navegação por Categorias Oficiais */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase text-slate-600 mr-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-500" />
            Filtro:
          </span>

          <div role="tablist" aria-label="Categorias oficiais de notícias" className="flex items-center gap-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="news-articles-grid"
                  aria-label={`Filtrar notícias por ${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs shrink-0 flex items-center justify-center ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensagem quando não houver resultados */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">
              Nenhuma notícia encontrada para os critérios selecionados.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Tente redefinir o termo de pesquisa ou escolher outra categoria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("Todas");
                setSearchQuery("");
              }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Ver todas as notícias
            </button>
          </div>
        ) : (
          /* Grade Responsiva de Cartões de Notícias */
          <div id="news-articles-grid" role="region" aria-label="Notícias oficiais filtradas" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, idx) => {
              const isFeatured = idx === 0 && selectedCategory === "Todas" && !searchQuery;

              return (
                <NewsCard
                  key={article.id}
                  article={article}
                  isFeatured={isFeatured}
                  onOpenDetails={(item) => {
                    if (onOpenArticleDetails) {
                      onOpenArticleDetails(item);
                    } else {
                      setActiveArticle(item);
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Nota Editorial sobre Agregação e Atribuição de Fontes */}
        <div className="mt-10 p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-700 font-bold">Transparência e Integridade Editorial:</strong>{" "}
              O portal Sociedade Ativa atua na curadoria e agregação de informações públicas de interesse republicano. Cada notícia externa exibe seu resumo informativo e credita a fonte original com link direto de acesso. A chancela <em>Redação Sociedade Ativa</em> é reservada exclusivamente a estudos, análises e coberturas de dados produzidas internamente.
            </p>
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

              {/* Imagem Editorial Oficial Verificada ou Acervo Institucional */}
              {(activeArticle.imageUrl || modalImageError) && (() => {
                const categoryFallbackMap: Record<string, typeof EDITORIAL_IMAGES.congresso> = {
                  Eleições: EDITORIAL_IMAGES.urna,
                  Economia: EDITORIAL_IMAGES.economia,
                  Brasil: EDITORIAL_IMAGES.dadosPublicos,
                  Congresso: EDITORIAL_IMAGES.congresso,
                  Política: EDITORIAL_IMAGES.congresso,
                  Governo: EDITORIAL_IMAGES.congresso,
                  Justiça: EDITORIAL_IMAGES.congresso,
                  Mundo: EDITORIAL_IMAGES.congresso,
                  Esportes: EDITORIAL_IMAGES.congresso,
                  Tecnologia: EDITORIAL_IMAGES.dadosPublicos,
                };
                const institutionalFallback = categoryFallbackMap[activeArticle.category] || EDITORIAL_IMAGES.congresso;
                const hasValidImage = Boolean(
                  activeArticle.imageUrl && isValidImageUrl(activeArticle.imageUrl) && !modalImageError
                );
                const displayImageSrc = hasValidImage ? activeArticle.imageUrl! : institutionalFallback.src;
                const displayImageAlt = hasValidImage ? (activeArticle.imageAlt || activeArticle.title) : institutionalFallback.alt;
                const displayCaption = hasValidImage ? (activeArticle.imageCaption || activeArticle.title) : institutionalFallback.caption;
                const displayCredit = hasValidImage ? activeArticle.imageCredit : "Acervo Institucional";

                return (
                  <figure className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <div className="w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-slate-100 relative">
                      <img
                        src={displayImageSrc}
                        alt={displayImageAlt}
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() => setModalImageError(true)}
                      />
                      {!hasValidImage && (
                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          Acervo Oficial
                        </span>
                      )}
                    </div>
                    <figcaption className="p-2.5 text-[10px] sm:text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <span>{displayCaption}</span>
                      {displayCredit && (
                        <span className="font-semibold text-slate-700">
                          {displayCredit.startsWith("Foto:") ? displayCredit : `Foto: ${displayCredit}`}
                        </span>
                      )}
                    </figcaption>
                  </figure>
                );
              })()}

              {/* Resumo ou Síntese Factual */}
              <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>
                    {activeContent && activeContent.length > 0
                      ? "Resumo do Fato"
                      : "Nota de Síntese Factual Oficial"}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
                  {activeArticle.summary}
                </p>
              </div>

              {/* Informações de Autoria e Publicação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-4 mb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">
                      Fonte: {activeArticle.source}
                    </span>
                    {isSociedadeAtivaAuthor && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-900 text-white">
                        Oficial
                      </span>
                    )}
                  </div>
                  {activeArticle.author && activeArticle.author !== activeArticle.source && (
                    <span className="text-[11px] text-slate-500 block">
                      Autor / Reportagem: {activeArticle.author}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Publicado: {activeArticle.publishedAt}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{copied ? "Link Copiado!" : "Compartilhar"}</span>
                  </button>
                </div>
              </div>

              {/* Parágrafos do Conteúdo ou Diretriz de Transparência de Súmula */}
              {activeContent && activeContent.length > 0 ? (
                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed mb-6 font-serif">
                  {activeContent.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600 bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 mb-6 leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Diretriz Editorial de Transparência</span>
                  </div>
                  <p>
                    Esta publicação é uma súmula factual oficial distribuída por <strong>{activeArticle.source}</strong>. Para consultar a apuração integral com tabelas, notas técnicas ou anexos documentais, acesse a matéria original pelo link abaixo.
                  </p>
                </div>
              )}

              {/* Botão de Acesso à Fonte Original Externa */}
              <div className="my-5 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-blue-950 block">
                    {isSociedadeAtivaAuthor
                      ? "Conteúdo original produzido por Sociedade Ativa"
                      : `Reportagem completa disponível em ${activeArticle.source}`}
                  </span>
                  <span className="text-[11px] text-blue-800/80 block mt-0.5">
                    Acesse o texto na íntegra no portal oficial da instituição.
                  </span>
                </div>

                <a
                  href={activeArticle.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Leia a notícia original</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Espaço Publicitário Interno do Artigo */}
              <div className="my-5 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                  Publicidade · Google AdSense (Formato Artigo Nativo)
                </span>
                <span className="text-xs text-slate-500">
                  Espaço reservado para unidade de anúncios in-article
                </span>
              </div>

              {/* Tags */}
              {activeArticle.tags && activeArticle.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {activeArticle.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
