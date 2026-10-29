import React, { useMemo, useState, useEffect } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { Clock, Calendar, ArrowRight, Sparkles, AlertTriangle, RefreshCw, Radio } from "lucide-react";
import { PortalLink } from "./PortalLink";
import { sortNewsItems, deduplicateNewsItems, isValidImageUrl } from "../services/newsService";

interface FeaturedEditorialProps {
  articles: NewsItem[];
  onOpenArticleDetails: (article: NewsItem) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const FeaturedEditorial: React.FC<FeaturedEditorialProps> = ({
  articles,
  onOpenArticleDetails,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const PINNED_LEAD_ARTICLE_ID: string | null = null;
  const [leadImageError, setLeadImageError] = useState(false);

  // Ordenação cronológica decrescente estrita sem duplicatas
  const validArticles = useMemo(() => {
    return sortNewsItems(deduplicateNewsItems(Array.isArray(articles) ? articles : []));
  }, [articles]);

  const pinnedArticle = PINNED_LEAD_ARTICLE_ID
    ? validArticles.find((a) => a.id === PINNED_LEAD_ARTICLE_ID)
    : null;
  const leadArticle = pinnedArticle || validArticles[0] || null;

  useEffect(() => {
    setLeadImageError(false);
  }, [leadArticle?.id, leadArticle?.imageUrl]);

  const remainingArticles = leadArticle
    ? validArticles.filter((a) => a.id !== leadArticle.id)
    : validArticles;

  // Destaques secundários (3 matérias) e Radar de Despachos Oficiais (4 matérias)
  const secondaryArticles = remainingArticles.slice(0, 3);
  const civicWireArticles = remainingArticles.slice(3, 7);

  const hasValidArticleImage = Boolean(
    leadArticle?.imageUrl && isValidImageUrl(leadArticle.imageUrl)
  );

  const categoryFallbackMap: Record<string, typeof EDITORIAL_IMAGES.congresso> = {
    Eleições: EDITORIAL_IMAGES.urna,
    Economia: EDITORIAL_IMAGES.economia,
    Brasil: EDITORIAL_IMAGES.dadosPublicos,
    Congresso: EDITORIAL_IMAGES.congresso,
    Política: EDITORIAL_IMAGES.congresso,
    Governo: EDITORIAL_IMAGES.congresso,
    Justiça: EDITORIAL_IMAGES.congresso,
    Mundo: EDITORIAL_IMAGES.congresso,
  };
  const institutionalFallback = categoryFallbackMap[leadArticle?.category || ""] || EDITORIAL_IMAGES.congresso;

  const isUsingOriginalPhoto = Boolean(hasValidArticleImage && !leadImageError);
  const leadImageSrc = isUsingOriginalPhoto ? leadArticle!.imageUrl! : institutionalFallback.src;
  const leadImageAlt = isUsingOriginalPhoto ? (leadArticle!.imageAlt || leadArticle!.title) : institutionalFallback.alt;

  let leadImageCaption = institutionalFallback.caption;
  if (isUsingOriginalPhoto && leadArticle) {
    if (leadArticle.imageCaption && leadArticle.imageCredit) {
      leadImageCaption = `${leadArticle.imageCaption} (${leadArticle.imageCredit})`;
    } else if (leadArticle.imageCaption) {
      leadImageCaption = leadArticle.imageCaption;
    } else if (leadArticle.imageCredit) {
      leadImageCaption = `Foto: ${leadArticle.imageCredit}`;
    } else {
      leadImageCaption = leadArticle.title || institutionalFallback.caption;
    }
  }

  return (
    <section className="py-6 sm:py-8 lg:py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tópicos em Foco / Faixa Editorial Cívica */}
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100 overflow-x-auto scrollbar-none text-xs">
          <span className="font-heading font-black uppercase tracking-wider text-slate-500 text-[11px] shrink-0 mr-1">
            Em Foco:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <PortalLink
              route="economia"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-colors"
            >
              Consumo nos Lares &amp; Inflação
            </PortalLink>
            <PortalLink
              route="eleicoes"
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 transition-colors"
            >
              Arquivo Eleições 2026
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-colors"
            >
              Comissões da Câmara &amp; Senado
            </PortalLink>
            <PortalLink
              route="estados"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-colors"
            >
              Indicadores Regionais dos Estados
            </PortalLink>
            <PortalLink
              route="dados-publicos"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-colors"
            >
              Painéis &amp; Bases Públicas
            </PortalLink>
          </div>
        </div>

        {/* Estado 1: Carregamento */}
        {isLoading && !leadArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse" aria-busy="true">
            <div className="lg:col-span-8 flex flex-col space-y-4">
              <div className="rounded-2xl bg-slate-200 aspect-[16/9] w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-8 bg-slate-200 rounded w-11/12" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
            </div>
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-32 bg-slate-100 rounded-xl" />
              <div className="h-32 bg-slate-100 rounded-xl" />
            </div>
          </div>
        )}

        {/* Estado 2: Erro */}
        {error && !leadArticle && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8 text-center my-4">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h2 className="font-heading text-lg sm:text-xl font-black text-rose-950 mb-1">
              Não foi possível carregar os destaques editoriais
            </h2>
            <p className="text-sm text-rose-900 max-w-lg mx-auto leading-relaxed mb-4">
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            )}
          </div>
        )}

        {/* Grade Editorial: Notícia Principal (Lead) + Coluna de Destaques e Radar */}
        {leadArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Coluna Principal: Matéria Líder Proeminente */}
            <div className="lg:col-span-8 flex flex-col">
              <article
                onClick={() => onOpenArticleDetails(leadArticle)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Imagem de Alta Qualidade com Enquadramento 16:9 */}
                <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-5 bg-slate-100 aspect-[16/9] shadow-sm border border-slate-200">
                  <img
                    src={leadImageSrc}
                    alt={leadImageAlt}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setLeadImageError(true)}
                  />

                  {/* Gradiente suave na parte inferior da foto para leitura da legenda */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Legenda Oficial e Crédito */}
                  <div className="absolute bottom-0 inset-x-0 p-3 sm:px-5 sm:py-3.5 text-white flex items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-1 drop-shadow-sm">
                      {leadImageCaption}
                    </p>
                    <span className="shrink-0 hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs text-white">
                      {isUsingOriginalPhoto ? "Fotojornalismo" : "Arquivo Oficial"}
                    </span>
                  </div>
                </div>

                {/* Metadados Editoriais (Zero-Pill: texto limpo com separadores) */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                  <span className="font-heading font-black uppercase tracking-wider text-blue-900">
                    {leadArticle.category}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-800 font-medium">{leadArticle.source}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{leadArticle.publishedAt}</span>
                  </span>
                  {leadArticle.readTime && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="text-slate-500">{leadArticle.readTime}</span>
                    </>
                  )}
                </div>

                {/* Manchete Principal de Alto Impacto */}
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 leading-tight group-hover:text-blue-900 transition-colors mb-3">
                  {leadArticle.title}
                </h1>

                {/* Resumo Editorial Conciso (Corpo $\ge$ 16px) */}
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-5">
                  {leadArticle.summary}
                </p>

                {/* Ação Proeminente "Leia mais" */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all shadow-xs group-hover:bg-blue-800">
                    <span>Leia mais</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            </div>

            {/* Coluna Secundária: Matérias de Apoio + Radar Cívico */}
            <div className="lg:col-span-4 flex flex-col space-y-6 pt-6 lg:pt-0 lg:pl-6 lg:border-l lg:border-slate-200">
              {/* Bloco de Notícias Secundárias */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <h2 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-900 rounded-xs" />
                    <span>Destaques Oficiais</span>
                  </h2>
                  <PortalLink
                    route="noticias"
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    Ver todas &rarr;
                  </PortalLink>
                </div>

                <div className="divide-y divide-slate-100">
                  {secondaryArticles.map((art) => (
                    <article
                      key={art.id}
                      onClick={() => onOpenArticleDetails(art)}
                      className="group cursor-pointer py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                          {art.category}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-slate-600 truncate max-w-[140px]">{art.source}</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-slate-400">{art.publishedAt.split(" às ")[0]}</span>
                      </div>

                      <h3 className="font-heading text-base font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors mb-1.5">
                        {art.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>

                      <div className="mt-2 text-xs font-bold text-blue-700 group-hover:text-blue-900 flex items-center gap-1">
                        <span>Leia mais</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Radar Cívico / Despachos Oficiais */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200">
                  <h3 className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                    <span>Radar Cívico · Despachos</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    Hoje
                  </span>
                </div>

                {civicWireArticles.length > 0 ? (
                  <ol className="relative ml-0.5 space-y-0">
                    {civicWireArticles.map((item, idx) => {
                      const isLast = idx === civicWireArticles.length - 1;
                      const timeString = item.publishedAt.includes(" às ")
                        ? item.publishedAt.split(" às ")[1]
                        : item.publishedAt;

                      return (
                        <li
                          key={item.id}
                          onClick={() => onOpenArticleDetails(item)}
                          className="group relative pl-5 pb-3.5 last:pb-0 cursor-pointer"
                        >
                          {!isLast && (
                            <div
                              className="absolute left-[3px] top-2.5 bottom-0 w-px bg-slate-200 group-hover:bg-blue-300 transition-colors"
                              aria-hidden="true"
                            />
                          )}

                          <div
                            className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-slate-300 ring-2 ring-slate-50 group-hover:bg-blue-900 group-hover:ring-blue-100 transition-all"
                            aria-hidden="true"
                          />

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-0.5">
                            <span className="font-bold text-slate-700 tabular-nums">
                              {timeString}
                            </span>
                            <span className="text-slate-300 font-sans" aria-hidden="true">·</span>
                            <span className="font-medium text-slate-600 font-sans truncate">
                              {item.source}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-slate-800 group-hover:text-blue-900 leading-snug line-clamp-2 transition-colors">
                            {item.title}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-500 py-2 text-center">
                    Nenhum despacho recente registrado no momento.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
