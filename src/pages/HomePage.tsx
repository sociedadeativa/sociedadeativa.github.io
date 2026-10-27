import React, { useMemo, useState, useEffect, useRef, Suspense, lazy } from "react";
import { ElectionDataSet } from "../data/electionData";
import { NewsItem } from "../types/news";
import { SECOND_ROUND_DATA } from "../data/electionSecondRoundData";
import { OFFICIAL_ECONOMIC_INDICATORS } from "../data/economyData";
import { FeaturedEditorial } from "../components/FeaturedEditorial";
import { AdBanner } from "../components/AdBanner";
import { PortalLink } from "../components/PortalLink";
import {
  ArrowRight,
  MapPin,
  Clock,
  Landmark,
  Building2,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Globe,
  Trophy,
  Sun,
  ShieldCheck,
  Info,
  Vote,
} from "lucide-react";

// Componentes Secundários Pesados com Carregamento Estritamente Sob Demanda (Code Splitting)
const NationalBanner = lazy(() =>
  import("../components/NationalBanner").then((m) => ({
    default: m.NationalBanner,
  }))
);
const BrazilMap = lazy(() =>
  import("../components/BrazilMap").then((m) => ({ default: m.BrazilMap }))
);
const RegionalCharts = lazy(() =>
  import("../components/RegionalCharts").then((m) => ({
    default: m.RegionalCharts,
  }))
);
const EconomySection = lazy(() =>
  import("../components/EconomySection").then((m) => ({
    default: m.EconomySection,
  }))
);
const BolsaSection = lazy(() =>
  import("../components/BolsaSection").then((m) => ({
    default: m.BolsaSection,
  }))
);
const NewsSection = lazy(() =>
  import("../components/NewsSection").then((m) => ({ default: m.NewsSection }))
);
const StateTable = lazy(() =>
  import("../components/StateTable").then((m) => ({ default: m.StateTable }))
);

// Skeletons de Acessibilidade e Estabilidade Visual (Zero CLS)
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
    className="py-10 bg-slate-50/60 border-t border-slate-200 animate-pulse"
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
    className="py-10 bg-white border-t border-slate-200 animate-pulse"
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

const BrazilMapSkeleton: React.FC<{ onActivate?: () => void }> = ({
  onActivate,
}) => (
  <div
    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[460px] text-center"
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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-blue-600 min-h-[44px]"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        <span>Carregar mapa interativo</span>
      </button>
    )}
  </div>
);

const RegionalChartsSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse"
    aria-busy="true"
    aria-label="Carregando gráficos regionais"
  >
    <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
  </div>
);

const StateTableSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse"
    aria-busy="true"
    aria-label="Carregando tabela de estados"
  >
    <div className="h-80 bg-slate-100 rounded-3xl border border-slate-200" />
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

// Formatação brasileira de números
const formatNumberBR = (num: number): string => {
  return new Intl.NumberFormat("pt-BR").format(num);
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
  // Controle de carregamento estritamente sob demanda para recursos pesados
  const [shouldLoadMap, setShouldLoadMap] = useState<boolean>(() => {
    return Boolean(selectedStateUf || candidateFilter);
  });
  const [showSecondaryExplorer, setShowSecondaryExplorer] = useState<boolean>(() => {
    return Boolean(selectedStateUf || candidateFilter);
  });
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldLoadMap) return;
    if (selectedStateUf || candidateFilter) {
      setShouldLoadMap(true);
      setShowSecondaryExplorer(true);
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

  // Extração dos 3 principais indicadores econômicos oficiais para o resumo inicial
  const keyEconomicIndicators = useMemo(() => {
    const dolar = OFFICIAL_ECONOMIC_INDICATORS.find((i) => i.id === "dolar");
    const selic = OFFICIAL_ECONOMIC_INDICATORS.find((i) => i.id === "selic");
    const ipca = OFFICIAL_ECONOMIC_INDICATORS.find((i) => i.id === "ipca");
    return [
      dolar || {
        id: "dolar",
        shortName: "Dólar Comercial",
        formattedValue: "R$ 5,33",
        source: "Banco Central do Brasil",
        variationPeriod: "PTAX Fechamento",
        variation: -0.1661,
      },
      selic || {
        id: "selic",
        shortName: "Taxa Selic",
        formattedValue: "14,00% a.a.",
        source: "Banco Central do Brasil",
        variationPeriod: "Meta Copom",
        variation: -0.25,
      },
      ipca || {
        id: "ipca",
        shortName: "IPCA",
        formattedValue: "+0,82%",
        source: "IBGE",
        variationPeriod: "Mensal Oficial",
        variation: 1.14,
      },
    ];
  }, []);

  // Dados pós-eleitorais oficiais homologados do 2º Turno (TSE)
  const electionSummary = SECOND_ROUND_DATA;
  const winnerCandidate = electionSummary.candidates.find((c) => c.elected) || electionSummary.candidates[0];
  const runnerUpCandidate = electionSummary.candidates.find((c) => !c.elected) || electionSummary.candidates[1];

  const mainPortalSections = [
    { route: "politica" as const, label: "Política", icon: Landmark },
    { route: "eleicoes" as const, label: "Eleições", icon: Vote },
    { route: "economia" as const, label: "Economia", icon: TrendingUp },
    { route: "estados" as const, label: "Estados", icon: MapPin },
    { route: "dados-publicos" as const, label: "Dados Públicos", icon: Building2 },
    { route: "noticias" as const, label: "Notícias", icon: Layers },
    { route: "tecnologia" as const, label: "Tecnologia", icon: Cpu },
    { route: "esportes" as const, label: "Esportes", icon: Trophy },
    { route: "clima" as const, label: "Clima", icon: Sun },
    { route: "sobre" as const, label: "Sobre", icon: Info },
  ];

  return (
    <div className="space-y-0">
      {/* 1. Barra de Acesso Rápido a Todas as Seções Principais (Acima da Dobra / Fluxo Inicial) */}
      <nav
        aria-label="Seções principais do portal"
        className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1 hidden sm:inline">
            Seções:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {mainPortalSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <PortalLink
                  key={sec.route}
                  route={sec.route}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 min-h-[36px]"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-900" />
                  <span>{sec.label}</span>
                </PortalLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 2. Dobra Editorial Principal: Manchete Líder (LCP), 3 Destaques e Radar Cívico (5 Itens) */}
      <FeaturedEditorial
        articles={articles}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onOpenArticleDetails={onOpenArticleDetails}
      />

      {/* 3. Espaço Publicitário Superior Discreto (Preservado sem shift de layout) */}
      <AdBanner format="leaderboard" />

      {/* 4. Resumo de Indicadores Econômicos Chave (2 a 3 Indicadores Oficiais) */}
      <section
        id="indicadores-chave-economia"
        aria-label="Indicadores Econômicos Oficiais em Destaque"
        className="py-8 bg-slate-50/70 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>Indicadores Econômicos Oficiais</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Termômetro da Economia Brasileira
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Séries oficiais apuradas pelo Banco Central do Brasil e IBGE.
              </p>
            </div>

            <PortalLink
              route="economia"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors shadow-2xs self-start sm:self-auto min-h-[44px]"
            >
              <span>Ver painel econômico completo &amp; B3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </PortalLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {keyEconomicIndicators.map((ind) => (
              <div
                key={ind.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-300 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
                      {ind.shortName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {ind.source}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight mb-1 tabular-nums">
                    {ind.formattedValue}
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] text-slate-600">
                    {ind.variationPeriod}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      ind.variation !== null && ind.variation !== undefined && ind.variation >= 0
                        ? "text-emerald-700"
                        : "text-blue-900"
                    }`}
                  >
                    {ind.variation !== null && ind.variation !== undefined
                      ? ind.variation >= 0
                        ? `+${ind.variation}`
                        : ind.variation
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Resumo Pós-Eleitoral Conciso (Totalização Homologada do 2º Turno TSE) */}
      <section
        id="resumo-pos-eleicoes"
        aria-label="Resumo Pós-Eleitoral Oficial do TSE"
        className="py-8 sm:py-10 bg-white border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <Vote className="w-3 h-3" />
                    <span>Eleições Presidenciais 2026</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Totalização Homologada TSE</span>
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  Resumo Oficial do 2º Turno Presidencial
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Totalização oficial de 100% das seções ({formatNumberBR(electionSummary.sectionsTotal)} urnas apuradas no Brasil e no exterior).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <PortalLink
                  route="eleicoes"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer min-h-[44px]"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Ver apuração completa &amp; mapa</span>
                  <ArrowRight className="w-4 h-4" />
                </PortalLink>
                {onOpenMethodology && (
                  <button
                    type="button"
                    onClick={onOpenMethodology}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>Regras do pleito</span>
                  </button>
                )}
              </div>
            </div>

            {/* Comparativo Conciso dos Dois Candidatos do 2º Turno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Vencedor / Eleito */}
              {winnerCandidate && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-emerald-500/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-heading font-black text-white text-base"
                      style={{ backgroundColor: winnerCandidate.color }}
                    >
                      {winnerCandidate.ballotNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-base truncate">
                          {winnerCandidate.popularName}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          Eleito
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {winnerCandidate.party} · {winnerCandidate.coalition}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                        {formatNumberBR(winnerCandidate.votes)} votos
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-400 tabular-nums">
                      {winnerCandidate.percentage.toFixed(2).replace(".", ",")}%
                    </span>
                  </div>
                </div>
              )}

              {/* Segundo Colocado */}
              {runnerUpCandidate && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-heading font-black text-white text-base"
                      style={{ backgroundColor: runnerUpCandidate.color }}
                    >
                      {runnerUpCandidate.ballotNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-base truncate">
                          {runnerUpCandidate.popularName}
                        </span>
                        <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          2º Lugar
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {runnerUpCandidate.party} · {runnerUpCandidate.coalition}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                        {formatNumberBR(runnerUpCandidate.votes)} votos
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl sm:text-3xl font-heading font-black text-slate-300 tabular-nums">
                      {runnerUpCandidate.percentage.toFixed(2).replace(".", ",")}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Fonte: Tribunal Superior Eleitoral (TSE / EA20 oficial).</span>
              </span>
              <PortalLink
                route="estados"
                className="text-blue-300 hover:text-white transition-colors font-medium inline-flex items-center gap-1 min-h-[32px]"
              >
                <span>Ver votação detalhada por estado</span>
                <ArrowRight className="w-3 h-3" />
              </PortalLink>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Espaço Publicitário In-Feed Discreto */}
      <AdBanner format="in-feed" />

      {/* 7. Diretório de Cadernos & Centrais Temáticas (Links Claros para Rotas Dedicadas) */}
      <section
        id="diretorio-cadernos"
        aria-label="Cadernos Especializados e Centrais Temáticas"
        className="py-10 bg-slate-50/70 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Navegação Temática</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Cadernos Especializados &amp; Centrais de Dados
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Acesse a cobertura aprofundada, séries históricas e análises setoriais em páginas dedicadas otimizadas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PortalLink
              route="politica"
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-900/40 hover:shadow-sm transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                  Política &amp; Poder
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Congresso Nacional, atos do Executivo e decisões do Judiciário.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-900 inline-flex items-center gap-1 pt-3 group-hover:translate-x-0.5 transition-transform">
                <span>Ver caderno</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </PortalLink>

            <PortalLink
              route="economia"
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Economia &amp; B3
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Indicadores BCB, IBGE, cotações da Bolsa e análises financeiras.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1 pt-3 group-hover:translate-x-0.5 transition-transform">
                <span>Ver caderno</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </PortalLink>

            <PortalLink
              route="estados"
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  Estados &amp; Geografia
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Mapa interativo, dados regionais e tabela completa das 27 UFs.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 inline-flex items-center gap-1 pt-3 group-hover:translate-x-0.5 transition-transform">
                <span>Ver caderno</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </PortalLink>

            <PortalLink
              route="dados-publicos"
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-purple-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                  Dados Públicos
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Transparência, estatísticas de Estado e boletins de auditoria.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-800 inline-flex items-center gap-1 pt-3 group-hover:translate-x-0.5 transition-transform">
                <span>Ver central</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </PortalLink>
          </div>
        </div>
      </section>

      {/* 8. Ferramentas Interativas e Arquivo Secundário Sob Demanda (Preservadas via Lazy Loading) */}
      <section
        id="ferramentas-interativas-secundarias"
        aria-label="Ferramentas Interativas Sob Demanda"
        className="py-10 bg-white border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Ferramentas Interativas Sob Demanda</span>
              </div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-slate-900">
                Explorar Mapas, Gráficos e Apuração na Página Inicial
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                Carregue sob demanda o mapa vetorial do Brasil, gráficos regionais, tabela de estados e acervo geral de notícias sem comprometer o tempo de carregamento inicial.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSecondaryExplorer((prev) => !prev);
                setShouldLoadMap(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs min-h-[44px] shrink-0"
              aria-expanded={showSecondaryExplorer}
              aria-controls="painel-ferramentas-sob-demanda"
            >
              <span>{showSecondaryExplorer ? "Ocultar ferramentas" : "Carregar mapa e dados completos"}</span>
              {showSecondaryExplorer ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Painel montado estritamente sob demanda */}
          {showSecondaryExplorer && (
            <div id="painel-ferramentas-sob-demanda" className="mt-8 space-y-10">
              {/* Painel Nacional Homologado do 1º Turno */}
              <div id="eleicoes-nacional">
                <Suspense fallback={<NationalBannerSkeleton />}>
                  <NationalBanner
                    dataset={dataset}
                    onOpenMethodology={onOpenMethodology}
                    selectedCandidateFilter={candidateFilter}
                    onSelectCandidateFilter={onSelectCandidateFilter}
                  />
                </Suspense>
              </div>

              {/* Mapa Interativo de Votação por Estado */}
              <div id="mapa-brasil" className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Geografia Eleitoral · 1º Turno</span>
                    </div>
                    <h3 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      Mapa Interativo de Votação por Estado
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Navegue pelas 27 unidades da federação para conferir o resultado oficial homologado pelo TSE.
                    </p>
                  </div>
                </div>

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

              {/* Gráficos Comparativos Regionais */}
              <Suspense fallback={<RegionalChartsSkeleton />}>
                <RegionalCharts dataset={dataset} />
              </Suspense>

              {/* Tabela de Resultados por Estado */}
              <div id="tabela-apuracao-estados">
                <Suspense fallback={<StateTableSkeleton />}>
                  <StateTable
                    dataset={dataset}
                    selectedStateUf={selectedStateUf}
                    onSelectState={(uf) => onSelectState(uf)}
                  />
                </Suspense>
              </div>

              {/* Cotações da Bolsa B3 Sob Demanda */}
              <Suspense fallback={<BolsaSectionSkeleton />}>
                <BolsaSection />
              </Suspense>

              {/* Indicadores Econômicos Completos Sob Demanda */}
              <Suspense fallback={<EconomySectionSkeleton />}>
                <EconomySection />
              </Suspense>

              {/* Acervo Completo de Notícias Sob Demanda */}
              <div id="cobertura-noticias">
                <Suspense fallback={<NewsSectionSkeleton />}>
                  <NewsSection
                    articles={articles}
                    onOpenArticleDetails={onOpenArticleDetails}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
