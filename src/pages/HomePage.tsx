import React, { useMemo, useState } from "react";
import { ElectionDataSet } from "../data/electionData";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { FeaturedEditorial } from "../components/FeaturedEditorial";
import { NationalBanner } from "../components/NationalBanner";
import { NewsSection } from "../components/NewsSection";
import { EconomySection } from "../components/EconomySection";
import { BolsaSection } from "../components/BolsaSection";
import { AdBanner } from "../components/AdBanner";
import { PortalLink } from "../components/PortalLink";
import { ArrowRight, MapPin, Trophy, Clock } from "lucide-react";
import { sortNewsItems, deduplicateNewsItems } from "../services/newsService";

// Componentes Pesados Abaixo da Dobra (Lazy / Deferred Code-Splitting)
const BrazilMap = React.lazy(() =>
  import("../components/BrazilMap").then((m) => ({ default: m.BrazilMap }))
);
const RegionalCharts = React.lazy(() =>
  import("../components/RegionalCharts").then((m) => ({ default: m.RegionalCharts }))
);
const StateTable = React.lazy(() =>
  import("../components/StateTable").then((m) => ({ default: m.StateTable }))
);

interface HomePageProps {
  dataset: ElectionDataSet;
  articles: NewsItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedStateUf: string | null;
  candidateFilter: string | null;
  onSelectState: (uf: string | null) => void;
  onSelectCandidateFilter: (id: string | null) => void;
  onOpenMethodology: () => void;
  onOpenArticleDetails: (article: NewsItem) => void;
}

const SportsNewsCard: React.FC<{
  article: NewsItem;
  onOpenArticleDetails: (article: NewsItem) => void;
}> = ({ article, onOpenArticleDetails }) => {
  const [imageError, setImageError] = useState(false);
  const fallbackSrc = EDITORIAL_IMAGES.congresso.src;
  const isUsingFallback = imageError && Boolean(article.imageUrl);
  const activeSrc = isUsingFallback ? fallbackSrc : article.imageUrl;
  const activeAlt = isUsingFallback ? EDITORIAL_IMAGES.congresso.alt : (article.imageAlt || article.title);

  return (
    <article
      onClick={() => onOpenArticleDetails(article)}
      className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div>
        {article.imageUrl && (
          <div className="mb-3.5 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] relative">
            <img
              src={activeSrc}
              alt={activeAlt}
              width={640}
              height={360}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
            {isUsingFallback && (
              <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                Acervo Oficial
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-800">
            {article.category || "Esportes"}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{article.publishedAt.split(" às ")[0]}</span>
          </span>
        </div>

        <h3 className="font-heading font-black text-lg text-slate-950 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug break-words">
          {article.title}
        </h3>

        <p className="text-sm sm:text-base text-slate-700 mt-2 line-clamp-2 leading-relaxed break-words">
          {article.summary}
        </p>
      </div>

      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-xs font-medium text-slate-500 truncate max-w-[150px]">
          {article.source}
        </span>
        <span className="font-bold text-emerald-800 group-hover:text-emerald-900 flex items-center gap-1">
          <span>Leia mais</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </article>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  dataset,
  articles,
  isLoading = false,
  error = null,
  onRetry,
  selectedStateUf,
  candidateFilter,
  onSelectState,
  onSelectCandidateFilter,
  onOpenMethodology,
  onOpenArticleDetails,
}) => {
  const activeFilteredCandidate = dataset.candidates.find(
    (c) => c.id === candidateFilter
  );

  const sportsArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    const filtered = articles.filter(
      (a) =>
        (a.category as string) === "Esportes" ||
        a.tags?.some((t) => ["Esportes", "Futebol"].includes(t))
    );
    return sortNewsItems(deduplicateNewsItems(filtered));
  }, [articles]);

  return (
    <div className="space-y-0 w-full overflow-x-hidden">
      {/* 1. Destaques Editoriais do Portal (Salience Tier 1 & 2 + Radar Cívico) */}
      <FeaturedEditorial
        articles={articles}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onOpenArticleDetails={onOpenArticleDetails}
      />

      {/* 2. Espaço Publicitário Superior */}
      <AdBanner format="leaderboard" />

      {/* 3. Seção de Notícias e Análises Jornalísticas (com Últimas Notícias e Mais Lidas separadas) */}
      <div id="cobertura-noticias">
        <NewsSection
          articles={articles}
          onOpenArticleDetails={onOpenArticleDetails}
        />
      </div>

      {/* 4. Seção de Economia: Indicadores Oficiais IBGE e Banco Central + Bolsa de Valores (B3) */}
      <div id="indicadores-economia">
        <EconomySection />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12">
          <BolsaSection />
        </div>
      </div>

      {/* 5. Espaço Publicitário In-Feed */}
      <AdBanner format="in-feed" />

      {/* 6. Preview do Caderno de Esportes */}
      <section id="esportes-preview" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Caderno de Esportes · Cobertura &amp; Modalidades</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Esportes &amp; Competições Nacionais
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Acompanhe as notícias apuradas do esporte brasileiro pela Agência Brasil e fontes oficiais, com cobertura de modalidades e competições.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <PortalLink
                route="esportes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors shadow-2xs"
              >
                <span>Ver caderno completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </PortalLink>
            </div>
          </div>

          {sportsArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsArticles.slice(0, 3).map((art) => (
                <SportsNewsCard
                  key={art.id}
                  article={art}
                  onOpenArticleDetails={onOpenArticleDetails}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                Nenhuma notícia esportiva oficial disponível no momento
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
                Novas reportagens esportivas apuradas pela Agência Brasil e fontes oficiais serão exibidas aqui automaticamente assim que publicadas.
              </p>
              <PortalLink
                route="esportes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-colors"
              >
                <span>Acessar Caderno de Esportes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          )}

          {/* Rodapé da Seção com Link Direto */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesse a central com cobertura esportiva, modalidades e caderno dedicado.</span>
            </div>
            <PortalLink
              route="esportes"
              className="shrink-0 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1"
            >
              <span>Ir para a Central de Esportes</span>
              <ArrowRight className="w-3 h-3" />
            </PortalLink>
          </div>
        </div>
      </section>

      {/* 7. Eleições 2026: Painel do Arquivo Nacional (Totalização Oficial Homologada) */}
      <div id="eleicoes-nacional">
        <NationalBanner
          dataset={dataset}
          onOpenMethodology={onOpenMethodology}
          selectedCandidateFilter={candidateFilter}
          onSelectCandidateFilter={onSelectCandidateFilter}
        />
      </div>

      {/* 8. Eleições 2026: Seção do Mapa Interativo de Votação (Brasil por Estado — Arquivo Histórico) */}
      <section id="mapa-brasil" className="py-8 sm:py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-700" />
                <span>Arquivo Eleições 2026 · 26 Estados e Distrito Federal</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Mapa Interativo de Votação por Estado
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Consulte os resultados oficiais e homologados pelo Tribunal Superior Eleitoral (TSE) por unidade da federação, incluindo votos nominais, percentuais e comparecimento eleitoral.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeFilteredCandidate && (
                <div className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span>Filtro ativo:</span>
                  <strong className="font-extrabold text-slate-900">
                    {activeFilteredCandidate.popularName}
                  </strong>
                  <button
                    onClick={() => onSelectCandidateFilter(null)}
                    className="ml-1 min-h-[28px] min-w-[28px] inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors font-black cursor-pointer text-sm"
                    title="Remover filtro"
                    aria-label="Remover filtro de candidato"
                  >
                    &times;
                  </button>
                </div>
              )}

              <PortalLink
                route="estados"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-950 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span>Ver página dedicada aos estados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          </div>

          {/* Componente do Mapa SVG com Controles (Carregamento Sob Demanda) */}
          <React.Suspense
            fallback={
              <div
                className="w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-100 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center p-8 animate-pulse text-slate-400"
                aria-label="Carregando mapa interativo"
              >
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-semibold text-slate-500">
                  Carregando mapa interativo dos 26 estados e Distrito Federal...
                </span>
              </div>
            }
          >
            <BrazilMap
              dataset={dataset}
              selectedStateUf={selectedStateUf}
              onSelectState={(uf) => onSelectState(uf)}
              candidateFilter={candidateFilter}
              onSelectCandidateFilter={onSelectCandidateFilter}
            />
          </React.Suspense>
        </div>
      </section>

      {/* 9. Eleições 2026: Gráficos Comparativos Regionais e Estados Decisivos */}
      <React.Suspense
        fallback={
          <div className="py-12 bg-white border-b border-slate-200 animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
                <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
              </div>
            </div>
          </div>
        }
      >
        <RegionalCharts dataset={dataset} />
      </React.Suspense>

      {/* 10. Eleições 2026: Tabela Geral de Resultados por Estado (26 Estados + DF) */}
      <div id="tabela-apuracao-estados">
        <React.Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
              <div className="h-64 bg-white rounded-2xl border border-slate-200" />
            </div>
          }
        >
          <StateTable
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectState={(uf) => onSelectState(uf)}
          />
        </React.Suspense>
      </div>
    </div>
  );
};
