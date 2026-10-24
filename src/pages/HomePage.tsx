import React, { useMemo, useState, useEffect, useRef, Suspense, lazy } from "react";
import { ElectionDataSet } from "../data/electionData";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { FeaturedEditorial } from "../components/FeaturedEditorial";
import { AdBanner } from "../components/AdBanner";
import { PortalLink } from "../components/PortalLink";
import { ArrowRight, MapPin, Trophy, Clock } from "lucide-react";
import { sortNewsItems, deduplicateNewsItems, isValidImageUrl } from "../services/newsService";

// Componentes Pesados Abaixo da Dobra com Carregamento Sob Demanda (Code Splitting)
const SecondRoundBanner = lazy(() => import("../components/SecondRoundBanner").then((m) => ({ default: m.SecondRoundBanner })));
const NationalBanner = lazy(() => import("../components/NationalBanner").then((m) => ({ default: m.NationalBanner })));
const BrazilMap = lazy(() => import("../components/BrazilMap").then((m) => ({ default: m.BrazilMap })));
const RegionalCharts = lazy(() => import("../components/RegionalCharts").then((m) => ({ default: m.RegionalCharts })));
const EconomySection = lazy(() => import("../components/EconomySection").then((m) => ({ default: m.EconomySection })));
const BolsaSection = lazy(() => import("../components/BolsaSection").then((m) => ({ default: m.BolsaSection })));
const NewsSection = lazy(() => import("../components/NewsSection").then((m) => ({ default: m.NewsSection })));
const StateTable = lazy(() => import("../components/StateTable").then((m) => ({ default: m.StateTable })));

const SecondRoundBannerSkeleton: React.FC = () => (
  <div
    className="mb-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 animate-pulse text-white"
    aria-busy="true"
    aria-label="Carregando cobertura do 2º turno"
  >
    <div className="h-6 w-52 bg-slate-800 rounded-full mb-4" />
    <div className="h-9 w-2/3 max-w-xl bg-slate-800 rounded-lg mb-3" />
    <div className="h-4 w-1/2 max-w-md bg-slate-800 rounded-md mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/80" />
      <div className="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/80" />
    </div>
  </div>
);

const NationalBannerSkeleton: React.FC = () => (
  <div
    className="border-b border-slate-200 bg-white pt-8 pb-10 animate-pulse"
    aria-busy="true"
    aria-label="Carregando painel nacional de apuração"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-5 w-44 bg-slate-200 rounded-md mb-3" />
      <div className="h-9 w-2/3 max-w-xl bg-slate-200 rounded-lg mb-4" />
      <div className="h-4 w-1/2 max-w-md bg-slate-200 rounded-md mb-8" />
      <div className="h-44 bg-slate-100 rounded-2xl mb-8 border border-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
    </div>
  </div>
);

const EconomySectionSkeleton: React.FC = () => (
  <div
    className="py-12 sm:py-16 bg-slate-50/60 border-t border-slate-200 animate-pulse"
    aria-busy="true"
    aria-label="Carregando indicadores econômicos oficiais"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-5 w-48 bg-slate-200 rounded-md mb-3" />
      <div className="h-9 w-2/3 max-w-xl bg-slate-200 rounded-lg mb-4" />
      <div className="h-4 w-1/2 max-w-md bg-slate-200 rounded-md mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
    </div>
  </div>
);

const BolsaSectionSkeleton: React.FC = () => (
  <div
    className="h-36 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse"
    aria-busy="true"
    aria-label="Carregando cotações de mercado e B3"
  />
);

const NewsSectionSkeleton: React.FC = () => (
  <div
    className="py-14 bg-white border-t border-slate-200 animate-pulse"
    aria-busy="true"
    aria-label="Carregando cobertura de notícias"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-5 w-40 bg-slate-200 rounded-md mb-3" />
      <div className="h-9 w-2/3 max-w-xl bg-slate-200 rounded-lg mb-4" />
      <div className="h-4 w-1/2 max-w-md bg-slate-200 rounded-md mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
    </div>
  </div>
);

const BrazilMapSkeleton: React.FC<{ onActivate?: () => void }> = ({ onActivate }) => (
  <div
    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[500px] text-center"
    aria-busy="true"
    aria-label="Carregando mapa interativo oficial"
  >
    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-3 animate-pulse">
      <MapPin className="w-6 h-6" />
    </div>
    <span className="font-heading font-black text-slate-900 text-base mb-1">
      Carregando mapa interativo oficial...
    </span>
    <span className="text-xs text-slate-600 max-w-sm mb-4">
      Carregando geometria vetorial das 27 Unidades da Federação e dados eleitorais.
    </span>
    {onActivate && (
      <button
        type="button"
        onClick={onActivate}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        <span>Carregar mapa interativo</span>
      </button>
    )}
  </div>
);

const RegionalChartsSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-busy="true" aria-label="Carregando gráficos regionais">
    <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
  </div>
);

const StateTableSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-busy="true" aria-label="Carregando tabela de estados">
    <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
  </div>
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
      className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer"
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border bg-emerald-50/80 border-emerald-200/70 text-slate-900">
            {article.category || "Esportes"}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{article.publishedAt}</span>
          </span>
        </div>

        <h3 className="font-heading font-black text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug break-words">
          {article.title}
        </h3>

        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed break-words">
          {article.summary}
        </p>
      </div>

      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
          {article.source}
        </span>
        <span className="font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1">
          <span>Ler notícia</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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

  // Carregamento sob demanda do BrazilMap: não baixa os ~178 kB do bundle até aproximação da viewport ou clique
  const [shouldLoadMap, setShouldLoadMap] = useState<boolean>(() => {
    return Boolean(selectedStateUf || candidateFilter);
  });
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldLoadMap) return;
    if (selectedStateUf || candidateFilter) {
      setShouldLoadMap(true);
      return;
    }

    const target = mapSectionRef.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoadMap, selectedStateUf, candidateFilter]);

  const sportsArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    const filtered = articles.filter(
      (a) =>
        (a.category as string) === "Esportes" ||
        a.tags?.some((t) => ["Esportes", "Futebol"].includes(t))
    );
    return filtered;
  }, [articles]);

  return (
    <div className="space-y-0">
      {/* 1. Destaques Editoriais do Portal (Salience Tier 1 & 2 + Radar Cívico) */}
      <FeaturedEditorial
        articles={articles}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onOpenArticleDetails={onOpenArticleDetails}
      />

      {/* 2. Painel Especial de Apuração do 2º Turno Presidencial 2026 */}
      <section id="apuracao-segundo-turno" aria-label="Apuração do 2º Turno Presidencial" className="bg-[#F8FAFC] pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<SecondRoundBannerSkeleton />}>
            <SecondRoundBanner onOpenMethodology={onOpenMethodology} />
          </Suspense>
        </div>
      </section>

      {/* 3. Painel Nacional das Eleições 2026 (Arquivo Histórico Oficial do 1º Turno) */}
      <div id="eleicoes-nacional">
        <div className="bg-slate-100 border-y border-slate-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-700">
              Arquivo Oficial Homologado · 1º Turno Presidencial (4 de outubro de 2026)
            </span>
            <span className="text-slate-500 hidden sm:inline">
              100% das seções totalizadas no TSE
            </span>
          </div>
        </div>
        <Suspense fallback={<NationalBannerSkeleton />}>
          <NationalBanner
            dataset={dataset}
            onOpenMethodology={onOpenMethodology}
            selectedCandidateFilter={candidateFilter}
            onSelectCandidateFilter={onSelectCandidateFilter}
          />
        </Suspense>
      </div>

      {/* 4. Espaço Publicitário Superior */}
      <AdBanner format="leaderboard" />

      {/* 5. Seção do Mapa Interativo de Votação (Brasil por Estado) */}
      <section id="mapa-brasil" className="py-8 sm:py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geografia Eleitoral · 1º Turno (4 de outubro de 2026)</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Mapa Interativo de Votação por Estado
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
                Navegue pelas unidades da federação para conferir o resultado oficial do 1º turno (4 de outubro de 2026), margem de vitória, votos nominais e comparecimento eleitoral homologados pelo TSE.
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
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <span>Ver página dedicada aos estados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          </div>

          {/* Componente do Mapa SVG com Carregamento Estritamente Sob Demanda */}
          <div ref={mapSectionRef}>
            {shouldLoadMap ? (
              <Suspense fallback={<BrazilMapSkeleton />}>
                <BrazilMap
                  dataset={dataset}
                  selectedStateUf={selectedStateUf}
                  onSelectState={(uf) => onSelectState(uf)}
                  candidateFilter={candidateFilter}
                  onSelectCandidateFilter={onSelectCandidateFilter}
                />
              </Suspense>
            ) : (
              <BrazilMapSkeleton onActivate={() => setShouldLoadMap(true)} />
            )}
          </div>
        </div>
      </section>

      {/* 5. Gráficos Comparativos Regionais e Estados Decisivos (Carregamento Sob Demanda) */}
      <Suspense fallback={<RegionalChartsSkeleton />}>
        <RegionalCharts dataset={dataset} />
      </Suspense>

      {/* 6. Seção de Economia: Indicadores Oficiais IBGE e Banco Central + Bolsa de Valores (B3) */}
      <div id="indicadores-economia">
        <Suspense fallback={<EconomySectionSkeleton />}>
          <EconomySection />
        </Suspense>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12">
          <Suspense fallback={<BolsaSectionSkeleton />}>
            <BolsaSection />
          </Suspense>
        </div>
      </div>

      {/* 7. Espaço Publicitário In-Feed */}
      <AdBanner format="in-feed" />

      {/* 8. Seção de Notícias e Análises Jornalísticas */}
      <div id="cobertura-noticias">
        <Suspense fallback={<NewsSectionSkeleton />}>
          <NewsSection
            articles={articles}
            onOpenArticleDetails={onOpenArticleDetails}
          />
        </Suspense>
      </div>

      {/* 9. Preview do Caderno de Esportes */}
      <section id="esportes-preview" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Caderno de Esportes · Cobertura &amp; Modalidades</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Esportes &amp; Competições Nacionais
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Acompanhe as notícias apuradas do esporte brasileiro pela Agência Brasil e fontes oficiais, com cobertura de modalidades e competições.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <PortalLink
                route="esportes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-100/70 transition-colors shadow-xs"
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
              className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Ir para a Central de Esportes</span>
              <ArrowRight className="w-3 h-3" />
            </PortalLink>
          </div>
        </div>
      </section>

      {/* 10. Tabela Geral de Resultados por Estado (26 Estados + DF - Carregamento Sob Demanda) */}
      <div id="tabela-apuracao-estados">
        <Suspense fallback={<StateTableSkeleton />}>
          <StateTable
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectState={(uf) => onSelectState(uf)}
          />
        </Suspense>
      </div>
    </div>
  );
};
