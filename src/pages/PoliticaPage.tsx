import React, { useState } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { isValidImageUrl } from "../services/newsService";
import { NewsCard } from "../components/NewsCard";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import { Landmark, ArrowRight, ShieldCheck, Scale, FileText, AlertTriangle, RefreshCw, Radio } from "lucide-react";

interface PoliticaPageProps {
  articles: NewsItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const PoliticaPage: React.FC<PoliticaPageProps> = ({
  articles,
  isLoading = false,
  error = null,
  onRetry,
  onOpenArticleDetails,
}) => {
  const [leadImageError, setLeadImageError] = useState(false);

  // Filtra matérias do caderno de política, congresso, governo e justiça
  const politicaArticles = articles.filter((a) =>
    ["Política", "Congresso", "Governo", "Justiça"].includes(a.category)
  );

  const mainArticle =
    politicaArticles.find((a) => a.id === "congresso-bancadas-eleitas-camara-senado") ||
    politicaArticles[0];

  const secondaryArticles = politicaArticles.filter((a) => a.id !== mainArticle?.id);

  const hasValidMainImage = Boolean(
    mainArticle?.imageUrl && isValidImageUrl(mainArticle.imageUrl) && !leadImageError
  );
  const mainImageSrc = hasValidMainImage ? mainArticle.imageUrl! : EDITORIAL_IMAGES.congresso.src;
  const mainImageAlt = hasValidMainImage ? (mainArticle.imageAlt || mainArticle.title) : EDITORIAL_IMAGES.congresso.alt;
  const mainImageCaption = hasValidMainImage
    ? (mainArticle.imageCaption || (mainArticle.imageCredit ? `Foto: ${mainArticle.imageCredit}` : mainArticle.title))
    : EDITORIAL_IMAGES.congresso.caption;

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Política */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
            <Landmark className="w-4 h-4" />
            <span>Caderno Especial · Três Poderes &amp; Congresso Nacional</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Política, Poderes e Atos Oficiais do Brasil
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Acompanhe as deliberações do Congresso Nacional, despachos do Poder Executivo, decisões de impacto institucional do Supremo Tribunal Federal (STF) e articulações partidárias.
          </p>

          {/* Atalhos Rápidos entre Cadernos */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Veja também:</span>
            <PortalLink
              route="eleicoes"
              className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
            >
              Apuração das Eleições 2026 &rarr;
            </PortalLink>
            <PortalLink
              route="dados-publicos"
              className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
            >
              Microdados e Transparência &rarr;
            </PortalLink>
            <PortalLink
              route="economia"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Indicadores Econômicos &rarr;
            </PortalLink>
          </div>
        </div>

        {/* Estado de Carregamento */}
        {isLoading && (
          <div className="space-y-10 mb-10" aria-label="Carregando matérias de política">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden p-6 sm:p-8 animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="aspect-16/9 bg-slate-200 rounded-2xl" />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-4/5" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-9 bg-slate-200 rounded w-36" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Erro */}
        {!isLoading && error && politicaArticles.length === 0 && (
          <div className="mb-10 p-8 bg-white rounded-3xl border border-amber-200 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Não foi possível carregar os despachos de política
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {error || "Erro de conexão com as agências públicas de notícias."}
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
        )}

        {/* Estado Vazio */}
        {!isLoading && !error && politicaArticles.length === 0 && (
          <div className="mb-10 p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <p className="font-heading font-bold text-slate-800 text-base">
              Nenhuma matéria de política disponível no momento.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Novas publicações serão integradas conforme atualização dos diários oficiais.
            </p>
          </div>
        )}

        {/* Destaque Principal do Caderno de Política */}
        {!isLoading && mainArticle && (
          <div className="mb-10 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8 items-center">
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200/80">
                  <img
                    src={mainImageSrc}
                    alt={mainImageAlt}
                    width={1280}
                    height={720}
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                    onError={() => setLeadImageError(true)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
                    {mainImageCaption}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
                  <span>{mainArticle.category}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-500 font-semibold">{mainArticle.source}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-500 font-semibold">{mainArticle.publishedAt}</span>
                </div>

                <h2
                  onClick={() => onOpenArticleDetails(mainArticle)}
                  className="font-heading text-2xl sm:text-3xl font-black text-slate-950 hover:text-blue-900 transition-colors cursor-pointer leading-tight mb-3 text-balance"
                >
                  {mainArticle.title}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {mainArticle.summary}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onOpenArticleDetails(mainArticle)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ler análise detalhada
                  </button>

                  <a
                    href={mainArticle.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Despacho original ({mainArticle.source})
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bloco de Contexto Institucional: Composição dos Três Poderes */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
              <Landmark className="w-4 h-4 text-amber-600" />
              <span>Poder Legislativo</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
              Congresso Nacional
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Câmara dos Deputados (513 parlamentares) e Senado Federal (81 senadores). Deliberação orçamentária, fiscalização de políticas públicas e reformas estruturais.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Poder Executivo</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
              Presidência &amp; Ministérios
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Execução de programas federais, gestão orçamentária anual e edição de medidas provisórias regulamentadas pela Constituição.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-800 mb-2">
              <Scale className="w-4 h-4 text-purple-600" />
              <span>Poder Judiciário</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
              STF &amp; Justiça Eleitoral
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guarda da Carta Magna pelo Supremo Tribunal Federal e organização e fiscalização do sufrágio universal pelo Tribunal Superior Eleitoral.
            </p>
          </div>
        </div>

        {/* Grade de Matérias e Análises de Política */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Cobertura Política em Andamento
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {politicaArticles.length} matérias disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryArticles.map((art) => (
              <NewsCard
                key={art.id}
                article={art}
                onOpenDetails={onOpenArticleDetails}
              />
            ))}
          </div>
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
