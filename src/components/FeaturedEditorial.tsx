import React, { useMemo, useState, useEffect } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import {
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { PortalLink } from "./PortalLink";
import { sortNewsItems, deduplicateNewsItems, isValidImageUrl } from "../services/newsService";
import { PortalStats } from "./PortalStats";

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
  const [secondaryErrors, setSecondaryErrors] = useState<Record<string, boolean>>({});

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

  // Em Foco: Matéria líder + 2 secundárias ao lado + 3 matérias recentes abaixo
  const secondaryArticles = remainingArticles.slice(0, 2);
  const recentCards = remainingArticles.slice(2, 5);

  // Mais Lidas: Ranking editorial 01 a 05 com dados reais
  const mostReadArticles = useMemo(() => {
    if (!validArticles || validArticles.length === 0) return [];
    return validArticles.slice(0, 5);
  }, [validArticles]);

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
    Esportes: EDITORIAL_IMAGES.congresso,
    Tecnologia: EDITORIAL_IMAGES.dadosPublicos,
    Entretenimento: EDITORIAL_IMAGES.congresso,
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

  // Seções editoriais para a navegação com cores sutis (linhas e textos, sem fundos chamativos)
  const editorialSections = [
    {
      label: "Política",
      route: "politica" as const,
      colorClass: "text-blue-900 hover:text-blue-950",
      borderClass: "border-blue-900",
      dotClass: "bg-blue-900",
      description: "Poderes, eleições e Congresso",
    },
    {
      label: "Economia",
      route: "economia" as const,
      colorClass: "text-emerald-900 hover:text-emerald-950",
      borderClass: "border-emerald-700",
      dotClass: "bg-emerald-700",
      description: "Inflação, Selic e Mercado",
    },
    {
      label: "Justiça",
      route: "politica" as const,
      colorClass: "text-purple-900 hover:text-purple-950",
      borderClass: "border-purple-900",
      dotClass: "bg-purple-900",
      description: "STF, STJ e Tribunais",
    },
    {
      label: "Esportes",
      route: "esportes" as const,
      colorClass: "text-amber-800 hover:text-amber-900",
      borderClass: "border-amber-600",
      dotClass: "bg-amber-600",
      description: "Competições e modalidades",
    },
    {
      label: "Entretenimento",
      route: "entretenimento" as const,
      colorClass: "text-rose-900 hover:text-rose-950",
      borderClass: "border-rose-700",
      dotClass: "bg-rose-700",
      description: "Cultura, streaming e cinema",
    },
    {
      label: "Dados Públicos",
      route: "dados-publicos" as const,
      colorClass: "text-slate-700 hover:text-slate-900",
      borderClass: "border-slate-600",
      dotClass: "bg-slate-600",
      description: "Transparência e estatísticas",
    },
  ];

  return (
    <section className="pt-5 pb-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2. NAVEGAÇÃO EDITORIAL (Imediatamente abaixo do ticker e antes das manchetes) */}
        <div className="pb-3.5 mb-6 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 text-xs whitespace-nowrap min-w-max">
            <span className="font-heading font-black uppercase tracking-wider text-slate-400 text-[11px] mr-1.5 shrink-0">
              Cadernos:
            </span>
            {editorialSections.map((sec) => (
              <PortalLink
                key={sec.label}
                route={sec.route}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold transition-all text-xs ${sec.colorClass} hover:border-slate-400 hover:shadow-2xs`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${sec.dotClass}`} aria-hidden="true" />
                <span>{sec.label}</span>
              </PortalLink>
            ))}
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

        {/* 3. GRADE EDITORIAL DE TRÊS ÁREAS (A: Em Foco, B: Mais Lidas, C: Cadernos) */}
        {leadArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ÁREA A: EM FOCO (Ocupa ~65% da largura principal) */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-900 rounded-xs" />
                  <h2 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900">
                    Em Foco · Cobertura Editorial
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Edição Oficial
                </span>
              </div>

              {/* Bloco Superior: Manchete Principal (~50% da área) + 2 Matérias Secundárias ao lado */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Destaque Principal (Lead Story) */}
                <div className="md:col-span-7 flex flex-col">
                  <article
                    onClick={() => onOpenArticleDetails(leadArticle)}
                    className="group cursor-pointer flex flex-col"
                  >
                    {/* Imagem 16:9 de Alta Resolução com Carregamento Eager e Prioridade Alta */}
                    <div className="relative rounded-2xl overflow-hidden mb-4 bg-slate-100 aspect-[16/9] shadow-xs border border-slate-200">
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

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                      <div className="absolute bottom-0 inset-x-0 p-3 sm:px-4 sm:py-3 text-white flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-[13px] font-medium text-slate-100 line-clamp-1 drop-shadow-sm">
                          {leadImageCaption}
                        </p>
                        <span className="shrink-0 hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs text-white">
                          {isUsingOriginalPhoto ? "Fotojornalismo" : "Arquivo Oficial"}
                        </span>
                      </div>
                    </div>

                    {/* Metadados Editoriais (Zero-Pill) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                      <span className="font-heading font-black uppercase tracking-wider text-blue-900 text-[11px]">
                        {leadArticle.category}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="text-slate-800 font-medium">{leadArticle.source}</span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{leadArticle.publishedAt}</span>
                      </span>
                    </div>

                    {/* Título Principal (H1 Único da HomePage) */}
                    <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 leading-tight group-hover:text-blue-900 transition-colors mb-2.5">
                      {leadArticle.title}
                    </h1>

                    {/* Resumo Editorial Conciso */}
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4">
                      {leadArticle.summary}
                    </p>

                    {/* Ação Clara: Ler matéria */}
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs sm:text-sm transition-all shadow-xs group-hover:bg-blue-800">
                        <span>Ler matéria</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </div>

                {/* Duas Matérias Secundárias ao Lado */}
                <div className="md:col-span-5 flex flex-col space-y-4 md:border-l md:border-slate-200 md:pl-6">
                  {secondaryArticles.map((art) => {
                    const secFallback = categoryFallbackMap[art.category] || EDITORIAL_IMAGES.congresso;
                    const secImgError = secondaryErrors[art.id];
                    const secImgSrc = (art.imageUrl && !secImgError) ? art.imageUrl : secFallback.src;

                    return (
                      <article
                        key={art.id}
                        onClick={() => onOpenArticleDetails(art)}
                        className="group cursor-pointer flex flex-col pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                      >
                        {art.imageUrl && (
                          <div className="rounded-xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-200 aspect-[16/9] relative">
                            <img
                              src={secImgSrc}
                              alt={art.imageAlt || art.title}
                              width={640}
                              height={360}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                              onError={() => setSecondaryErrors((prev) => ({ ...prev, [art.id]: true }))}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                            {art.category}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="text-slate-600 truncate max-w-[120px]">{art.source}</span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className="text-slate-400">{art.publishedAt.split(" às ")[0]}</span>
                        </div>

                        <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors mb-1">
                          {art.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {art.summary}
                        </p>

                        <div className="text-xs font-bold text-blue-800 group-hover:text-blue-950 flex items-center gap-1">
                          <span>Ler matéria</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Três Notícias Recentes Abaixo do Bloco Principal */}
              {recentCards.length > 0 && (
                <div className="pt-6 mt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>Outros Destaques da Edição</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    {recentCards.map((art) => (
                      <article
                        key={`recent-${art.id}`}
                        onClick={() => onOpenArticleDetails(art)}
                        className="group bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mb-1.5">
                            <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                              {art.category}
                            </span>
                            <span className="text-slate-400">
                              {art.publishedAt.split(" às ")[0]}
                            </span>
                          </div>

                          <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2 mb-1.5">
                            {art.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500 truncate max-w-[110px]">
                            {art.source}
                          </span>
                          <span className="font-bold text-blue-800 text-[11px] flex items-center gap-0.5 group-hover:text-blue-950">
                            <span>Ler</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUNA LATERAL: ÁREA B (MAIS LIDAS) + ÁREA C (CADERNOS) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              {/* ÁREA B: MAIS LIDAS (Top 01 a 05 com dados reais) */}
              <aside
                aria-label="Matérias mais lidas do portal"
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-900" />
                    <h3 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900">
                      Mais Lidas
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                    Top 5
                  </span>
                </div>

                <ol className="divide-y divide-slate-200/80">
                  {mostReadArticles.map((article, idx) => {
                    const rankNumber = String(idx + 1).padStart(2, "0");
                    return (
                      <li
                        key={`featured-most-read-${article.id}`}
                        onClick={() => onOpenArticleDetails(article)}
                        className="group py-3.5 first:pt-0 last:pb-0 cursor-pointer flex items-start gap-3.5"
                      >
                        {/* Numeração Editorial Proeminente */}
                        <span className="font-heading font-black text-2xl text-slate-300 group-hover:text-blue-900 transition-colors shrink-0 tabular-nums select-none leading-none mt-0.5">
                          {rankNumber}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                            <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                              {article.category}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">·</span>
                            <span className="text-slate-600 truncate text-[10px]">{article.source}</span>
                          </div>

                          <h4 className="font-heading text-sm font-bold text-slate-950 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">
                            {article.title}
                          </h4>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{article.publishedAt.split(" às ")[0]}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </aside>

              {/* ÁREA C: CADERNOS EDITORIAIS (Links para os cadernos principais) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-700" />
                    <h3 className="font-heading text-sm font-black uppercase tracking-wider text-slate-900">
                      Cadernos Editoriais
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Seções
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {editorialSections.map((sec) => (
                    <PortalLink
                      key={`caderno-${sec.label}`}
                      route={sec.route}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sec.dotClass}`} />
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {sec.label}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {sec.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                    </PortalLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. FAIXA DE ESTATÍSTICAS DO PORTAL (Abaixo da seção editorial principal) */}
        <PortalStats articles={validArticles} />
      </div>
    </section>
  );
};
