import React, { useState, useMemo, useEffect } from "react";
import { NewsItem } from "../types/news";
import { PortalLink } from "../components/PortalLink";
import { sortNewsItems, deduplicateNewsItems } from "../services/newsService";
import {
  fetchFootballSerieAData,
  formatBrazilDateTime,
  FootballSerieAPayload,
  countLiveMatches,
  filterMatchesByStatus,
  filterMatchesByTournament,
  getAvailableRounds,
  getCurrentRound,
  sortMatchesForDisplay,
} from "../services/footballService";
import {
  Trophy,
  Calendar,
  Clock,
  Flame,
  Shield,
  Activity,
  Tv,
  Radio,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  Info,
  Medal,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  DEMO_NOTICE,
  TOURNAMENTS,
  MATCHES_DATA,
  STANDINGS_SERIE_A,
  STANDINGS_SERIE_B,
  SPORTS_EDITORIAL_NEWS,
  MatchScore,
} from "../data/sportsData";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";

interface SportsArticleThumbProps {
  src: string;
  alt: string;
}

const SportsArticleThumb: React.FC<SportsArticleThumbProps> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const displaySrc = hasError ? EDITORIAL_IMAGES.congresso.src : src;
  const displayAlt = hasError ? EDITORIAL_IMAGES.congresso.alt : alt;

  return (
    <div className="sm:w-44 sm:h-28 w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 relative group">
      <img
        src={displaySrc}
        alt={displayAlt}
        width={320}
        height={180}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
      {hasError && (
        <span className="absolute bottom-1 right-1 text-[9px] font-semibold bg-slate-900/80 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
          Acervo Oficial
        </span>
      )}
    </div>
  );
};

interface EsportesPageProps {
  articles?: NewsItem[];
  isLoading?: boolean;
  error?: string | null;
  onOpenArticleDetails?: (article: NewsItem) => void;
  onRetry?: () => void;
}

export const EsportesPage: React.FC<EsportesPageProps> = ({
  articles = [],
  isLoading = false,
  error = null,
  onOpenArticleDetails,
  onRetry,
}) => {
  const [selectedTournament, setSelectedTournament] = useState<string>("todos");
  const [matchStatusFilter, setMatchStatusFilter] = useState<"todos" | "ao_vivo" | "encerrado" | "proximos">("todos");
  const [standingsTab, setStandingsTab] = useState<"serie-a" | "serie-b">("serie-a");
  const [selectedRound, setSelectedRound] = useState<string>("");

  // Estado dos dados oficiais do Brasileirão Série A (football-data.org v4)
  const [serieAData, setSerieAData] = useState<FootballSerieAPayload | null>(null);
  const [isSerieALoading, setIsSerieALoading] = useState<boolean>(true);
  const [serieAError, setSerieAError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsSerieALoading(true);
    setSerieAError(null);

    fetchFootballSerieAData()
      .then((data) => {
        if (isMounted) {
          setSerieAData(data);
          setIsSerieALoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSerieAError(
            err instanceof Error
              ? err.message
              : "Dados oficiais do Brasileirão Série A indisponíveis no momento."
          );
          setIsSerieALoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetrySerieA = () => {
    setIsSerieALoading(true);
    setSerieAError(null);
    fetchFootballSerieAData()
      .then((data) => {
        setSerieAData(data);
        setIsSerieALoading(false);
      })
      .catch((err) => {
        setSerieAError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar dados do Brasileirão Série A."
        );
        setIsSerieALoading(false);
      });
  };

  // Lista de rodadas disponíveis da Série A a partir dos dados oficiais da API
  const serieARounds = useMemo(() => {
    return getAvailableRounds(serieAData?.matches || []);
  }, [serieAData]);

  // Rodada atual da temporada obtida a partir da classificação e partidas oficiais
  const currentSeasonRound = useMemo(() => {
    return getCurrentRound(serieAData?.matches || [], serieAData?.standings);
  }, [serieAData]);

  // Inicializa a rodada selecionada com a rodada atual oficial quando os dados forem carregados
  useEffect(() => {
    if (currentSeasonRound && (!selectedRound || !serieARounds.includes(selectedRound))) {
      setSelectedRound(currentSeasonRound);
    }
  }, [currentSeasonRound, serieARounds, selectedRound]);

  const handlePrevRound = () => {
    const currentIndex = serieARounds.indexOf(selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(serieARounds[currentIndex - 1]);
    }
  };

  const handleNextRound = () => {
    const currentIndex = serieARounds.indexOf(selectedRound);
    if (currentIndex >= 0 && currentIndex < serieARounds.length - 1) {
      setSelectedRound(serieARounds[currentIndex + 1]);
    }
  };

  // Filtra e ordena cronologicamente notícias reais do dataset sobre esportes/futebol
  const realSportsArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    const filtered = articles.filter((a) => {
      // 1. Categoria oficial Esportes
      if ((a.category as string) === "Esportes") return true;

      // 2. Tags esportivas
      if (
        a.tags?.some((t) =>
          /esporte|futebol|libertadores|brasileirão|brasileirao|vôlei|volei|ginástica|ginastica|copa/i.test(t)
        )
      ) {
        return true;
      }

      // 3. Termos esportivos no título ou resumo
      const content = `${a.title || ""} ${a.summary || ""}`.toLowerCase();
      if (
        /esporte|futebol|libertadores|fluminense|palmeiras|flamengo|corinthians|brasileirão|brasileirao|vôlei|volei|ginástica|ginastica|mundial de ginástica|campeonato brasileiro/i.test(
          content
        )
      ) {
        return true;
      }

      // 4. URL canônica da editoria de esportes
      if (a.articleUrl && a.articleUrl.toLowerCase().includes("/esportes/")) {
        return true;
      }

      return false;
    });

    return sortNewsItems(deduplicateNewsItems(filtered));
  }, [articles]);

  // Partidas da Série A para a rodada em foco (ou todas se selecionado "todas")
  const activeSerieAMatches = useMemo(() => {
    const all = serieAData?.matches || [];
    if (!selectedRound || selectedRound === "todas") {
      return all;
    }
    return all.filter((m) => m.roundOrLeg === selectedRound || m.phase === selectedRound);
  }, [serieAData, selectedRound]);

  // Lista de partidas disponíveis para o campeonato selecionado
  const availableMatches = useMemo(() => {
    const otherTournamentMatches = MATCHES_DATA.filter((m) => m.tournamentId !== "brasileirao-a");
    const realMatches = serieAData?.matches || [];

    if (selectedTournament === "brasileirao-a") {
      // Quando selecionado especificamente Brasileirão Série A:
      // Exibe apenas as partidas reais da Série A na rodada selecionada
      return activeSerieAMatches;
    }

    if (selectedTournament !== "todos") {
      // Outro campeonato específico (ex: libertadores, copa-do-brasil)
      return otherTournamentMatches.filter((m) => m.tournamentId === selectedTournament);
    }

    // Todas as competições ("todos"):
    // Inclui partidas das outras competições e a rodada atual da Série A
    const serieARoundMatches = currentSeasonRound
      ? realMatches.filter((m) => m.roundOrLeg === currentSeasonRound || m.phase === currentSeasonRound)
      : realMatches.slice(0, 10);

    return [...otherTournamentMatches, ...serieARoundMatches];
  }, [serieAData, selectedTournament, activeSerieAMatches, currentSeasonRound]);

  // Contagem de partidas AO VIVO restrita ao contexto do campeonato ativo
  // Derivada estritamente do status oficial ("ao_vivo")
  const liveCount = useMemo(() => {
    return countLiveMatches(availableMatches);
  }, [availableMatches]);

  // Partidas filtradas pelo status ("todos", "ao_vivo", "encerrado", "proximos")
  // e ordenadas para priorizar partidas em andamento
  const filteredMatches = useMemo(() => {
    const byStatus = filterMatchesByStatus(availableMatches, matchStatusFilter);
    return sortMatchesForDisplay(byStatus);
  }, [availableMatches, matchStatusFilter]);

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Alerta Obrigatório de Demonstração / Dados Fictícios */}
        <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white tracking-wide uppercase">
                  {DEMO_NOTICE}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Estrutura Visual &amp; Protótipo de Cobertura Esportiva
                </span>
                {serieAData && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Brasileirão Série A com Dados Reais
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
                {serieAData ? (
                  <>
                    O <strong>Brasileirão Série A</strong> está conectado a <strong>dados oficiais reais</strong> fornecidos por <strong>{serieAData.source}</strong> (última sincronização em {formatBrazilDateTime(serieAData.lastUpdated)}). As demais competições (Série B, Copa do Brasil, Libertadores, Champions League) e placares simulados permanecem em ambiente de demonstração com dados ilustrativos.
                  </>
                ) : (
                  <>
                    Esta seção é um ambiente demonstrativo da nova editoria de esportes do <strong>Sociedade Ativa</strong>.
                    Todos os <strong>placares ao vivo, resultados, tabelas de classificação, estatísticas e datas</strong> apresentados como demonstração são <strong>dados simulados</strong> para validação de interface e <strong>NÃO</strong> representam resultados oficiais, transmissões em andamento ou eventos esportivos em tempo real.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Cabeçalho Editorial do Caderno de Esportes */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>Caderno de Esportes &amp; Futebol · Sociedade Ativa</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Central de Esportes, Placares e Campeonatos
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Acompanhe a cobertura do futebol brasileiro e internacional: notícias apuradas, jogos de hoje, simulação de placares em tempo real, tabelas completas do Brasileirão Série A e B, Copa do Brasil, Libertadores, Sul-Americana e Champions League.
          </p>

          {/* Atalhos Rápidos */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Navegue por Caderno:</span>
            <PortalLink
              route="home"
              className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            >
              Capa Principal &rarr;
            </PortalLink>
            <PortalLink
              route="noticias"
              className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Últimas Notícias &rarr;
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Política &rarr;
            </PortalLink>
            <PortalLink
              route="economia"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Economia &amp; B3 &rarr;
            </PortalLink>
          </div>
        </div>

        {/* 3. Barra de Seleção de Competições */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar por Competição:</span>
            </div>
            {selectedTournament === "brasileirao-a" ? (
              serieAData ? (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm border border-emerald-200">
                  Dados Reais · football-data.org
                </span>
              ) : isSerieALoading ? (
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm">
                  Carregando Série A...
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-sm border border-rose-200">
                  Dados Indisponíveis
                </span>
              )
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
                {DEMO_NOTICE}
              </span>
            )}
          </div>
          <div role="tablist" aria-label="Competições esportivas" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              role="tab"
              aria-selected={selectedTournament === "todos"}
              aria-label="Exibir todas as competições"
              onClick={() => setSelectedTournament("todos")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center justify-center ${
                selectedTournament === "todos"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Todas as Competições
            </button>
            {TOURNAMENTS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={selectedTournament === t.id}
                aria-label={`Filtrar por competição: ${t.name}`}
                onClick={() => setSelectedTournament(t.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedTournament === t.id
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>{t.name}</span>
                {t.id === "brasileirao-a" && serieAData && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Dados Reais Ativos" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Grade Principal: Placares / Jogos de Hoje & Tabelas de Classificação */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Coluna Esquerda: Placares e Jogos (8 colunas no desktop) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      <span>Jogos &amp; Placares</span>
                    </h2>
                    {selectedTournament === "brasileirao-a" ? (
                      serieAData ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                          Dados Reais · {serieAData.source}
                        </span>
                      ) : isSerieALoading ? (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Carregando Série A...
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
                          Indisponível
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        {DEMO_NOTICE}
                      </span>
                    )}
                    {liveCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                        {liveCount} {liveCount === 1 ? "Jogo Ao Vivo" : "Jogos Ao Vivo"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedTournament === "brasileirao-a"
                      ? serieAData
                        ? `Partidas oficiais do Campeonato Brasileiro Série A. Sincronizado em: ${formatBrazilDateTime(serieAData.lastUpdated)}`
                        : "Partidas oficiais do Campeonato Brasileiro Série A."
                      : "Acompanhamento esportivo com suporte a dados oficiais para a Série A e demonstração para demais competições"}
                  </p>
                </div>

                {/* Filtro de Status das Partidas */}
                <div role="tablist" aria-label="Status das partidas" className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    role="tab"
                    aria-selected={matchStatusFilter === "todos"}
                    aria-label="Filtrar todas as partidas"
                    onClick={() => setMatchStatusFilter("todos")}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors flex items-center justify-center ${
                      matchStatusFilter === "todos" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    role="tab"
                    aria-selected={matchStatusFilter === "ao_vivo"}
                    aria-label="Filtrar partidas ao vivo"
                    onClick={() => setMatchStatusFilter("ao_vivo")}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${
                      matchStatusFilter === "ao_vivo" ? "bg-rose-600 text-white shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
                    Ao Vivo
                  </button>
                  <button
                    role="tab"
                    aria-selected={matchStatusFilter === "encerrado"}
                    aria-label="Filtrar partidas encerradas"
                    onClick={() => setMatchStatusFilter("encerrado")}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors flex items-center justify-center ${
                      matchStatusFilter === "encerrado" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Encerrados
                  </button>
                  <button
                    role="tab"
                    aria-selected={matchStatusFilter === "proximos"}
                    aria-label="Filtrar próximas partidas agendadas"
                    onClick={() => setMatchStatusFilter("proximos")}
                    className={`min-h-[34px] px-2.5 py-1 rounded-md transition-colors flex items-center justify-center ${
                      matchStatusFilter === "proximos" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Próximos
                  </button>
                </div>
              </div>

              {/* Barra de Seleção / Navegação de Rodada da Série A */}
              {selectedTournament === "brasileirao-a" && serieARounds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 mt-3 bg-slate-50 border border-slate-200/90 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Rodada:
                    </span>
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      aria-label="Selecionar rodada do Brasileirão Série A"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      {serieARounds.map((r) => (
                        <option key={r} value={r}>
                          {r} {r === currentSeasonRound ? "· Rodada Atual" : ""}
                        </option>
                      ))}
                      <option value="todas">Todas as 38 Rodadas</option>
                    </select>
                    {selectedRound === currentSeasonRound && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Em Andamento
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevRound}
                      disabled={serieARounds.indexOf(selectedRound) <= 0 || selectedRound === "todas"}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold cursor-pointer"
                      title="Rodada anterior"
                      aria-label="Rodada anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextRound}
                      disabled={
                        serieARounds.indexOf(selectedRound) >= serieARounds.length - 1 ||
                        selectedRound === "todas"
                      }
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold cursor-pointer"
                      title="Próxima rodada"
                      aria-label="Próxima rodada"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Partidas */}
              <div className="divide-y divide-slate-100 mt-2">
                {selectedTournament === "brasileirao-a" && isSerieALoading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-700">Carregando partidas oficiais do Brasileirão Série A...</p>
                    <p className="text-[11px] text-slate-500 mt-1">Consultando dataset sincronizado via football-data.org</p>
                  </div>
                ) : selectedTournament === "brasileirao-a" && (serieAError || !serieAData) ? (
                  <div className="py-10 px-4 text-center bg-rose-50/60 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                    <h3 className="text-sm font-black text-rose-950 mb-1">
                      Partidas do Brasileirão Série A indisponíveis
                    </h3>
                    <p className="text-xs text-rose-800 max-w-md mx-auto mb-3">
                      {serieAError || "O dataset oficial ainda não foi gerado ou está temporariamente inacessível. O portal Sociedade Ativa não apresenta dados simulados para a Série A."}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetrySerieA}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar carregar novamente</span>
                    </button>
                  </div>
                ) : filteredMatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    {matchStatusFilter === "ao_vivo" ? (
                      <div className="max-w-md mx-auto">
                        <p className="font-bold text-slate-800 text-sm mb-1">
                          Nenhum jogo ao vivo no momento
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedTournament === "brasileirao-a"
                            ? "Não há partidas em andamento para o Brasileirão Série A no momento."
                            : "Nenhuma partida em andamento nas competições monitoradas."}
                        </p>
                      </div>
                    ) : matchStatusFilter === "proximos" && selectedTournament === "brasileirao-a" && selectedRound !== "todas" ? (
                      <div className="max-w-md mx-auto">
                        <p className="font-bold text-slate-800 text-sm mb-1">
                          Todas as partidas da {selectedRound} já foram encerradas
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Navegue para a próxima rodada para visualizar os confrontos agendados.
                        </p>
                        {serieARounds.indexOf(selectedRound) < serieARounds.length - 1 && (
                          <button
                            type="button"
                            onClick={handleNextRound}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Ir para a próxima rodada</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p>Nenhuma partida encontrada para os filtros selecionados.</p>
                    )}
                  </div>
                ) : (
                  filteredMatches.map((match) => {
                    const isRealMatch = match.tournamentId === "brasileirao-a" && serieAData?.isReal;

                    return (
                      <div key={match.id} className="py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                        {/* Metadados da Partida */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{match.tournamentName}</span>
                            <span className="text-slate-300">&middot;</span>
                            <span>{match.phase}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isRealMatch ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                                Oficial · football-data.org
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                {match.disclaimer}
                              </span>
                            )}
                            {match.status === "ao_vivo" ? (
                              isRealMatch ? (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                  {match.minute || "Ao vivo"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                  {match.minute || "Simulado"} (Demonstração)
                                </span>
                              )
                            ) : match.status === "encerrado" ? (
                              <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                Encerrado
                              </span>
                            ) : (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                {match.date} &middot; {match.time}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Placar dos Clubes */}
                        <div className="grid grid-cols-12 items-center gap-2 my-2">
                          {/* Mandante */}
                          <div className="col-span-5 flex items-center justify-end gap-2.5">
                            <span className="font-heading font-black text-sm sm:text-base text-slate-900 text-right truncate">
                              {match.homeTeam.name}
                            </span>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs ${match.homeTeam.color || "bg-slate-800 text-white"}`}>
                              {match.homeTeam.initials}
                            </span>
                          </div>

                          {/* Placar Central */}
                          <div className="col-span-2 text-center flex items-center justify-center">
                            {match.status === "ao_vivo" || match.status === "encerrado" ? (
                              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-lg sm:text-xl shadow-2xs">
                                <span>{typeof match.homeTeam.score === "number" ? match.homeTeam.score : "-"}</span>
                                <span className="text-slate-400 font-normal">x</span>
                                <span>{typeof match.awayTeam.score === "number" ? match.awayTeam.score : "-"}</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="font-mono font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                  {match.time}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Visitante */}
                          <div className="col-span-5 flex items-center justify-start gap-2.5">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs ${match.awayTeam.color || "bg-slate-700 text-white"}`}>
                              {match.awayTeam.initials}
                            </span>
                            <span className="font-heading font-black text-sm sm:text-base text-slate-900 truncate">
                              {match.awayTeam.name}
                            </span>
                          </div>
                        </div>

                        {/* Detalhes do Local, Transmissão e Eventos */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{match.venue} ({match.city})</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <Tv className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{match.broadcast}</span>
                          </div>
                        </div>

                        {/* Eventos Chave */}
                        {match.keyEvents && match.keyEvents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {match.keyEvents.map((ev, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                                {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Seção de Notícias e Reportagens de Futebol */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-600" />
                    <span>Notícias &amp; Bastidores do Futebol</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cobertura de clubes, decisões judiciais esportivas, seleção e competições
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {DEMO_NOTICE}
                </span>
              </div>

              {/* Estado 1: Carregamento */}
              {isLoading && realSportsArticles.length === 0 ? (
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
                    <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">Carregando notícias oficiais de esportes...</span>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="animate-pulse flex flex-col sm:flex-row gap-4">
                        <div className="sm:w-44 sm:h-28 w-full h-36 bg-slate-200 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 rounded w-1/4" />
                          <div className="h-5 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 rounded w-full" />
                          <div className="h-3 bg-slate-200 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error && realSportsArticles.length === 0 ? (
                /* Estado 2: Falha na fonte oficial */
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/70 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-rose-950 mb-1">
                    Falha ao carregar notícias esportivas
                  </h3>
                  <p className="text-xs text-rose-800 max-w-md mx-auto mb-3">
                    {error || "Não foi possível obter as reportagens da fonte oficial no momento. Verifique sua conexão."}
                  </p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar novamente</span>
                    </button>
                  )}
                </div>
              ) : realSportsArticles.length > 0 ? (
                /* Estado 3: Sucesso com Notícias Oficiais Apuradas do Acervo */
                <div className="mb-6 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-emerald-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
                      <span>Notícias Oficiais Apuradas · Agência Brasil &amp; Fontes Públicas</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {realSportsArticles.length} {realSportsArticles.length === 1 ? "matéria oficial" : "matérias oficiais"}
                    </span>
                  </div>

                  <div className="space-y-4 divide-y divide-emerald-200/60">
                    {realSportsArticles.map((art, idx) => (
                      <article
                        key={art.id}
                        className={`flex flex-col sm:flex-row items-start justify-between gap-4 ${idx > 0 ? "pt-4" : ""}`}
                      >
                        {/* Imagem Editorial Oficial (quando disponível) */}
                        {art.imageUrl && (
                          <SportsArticleThumb
                            src={art.imageUrl}
                            alt={art.imageAlt || art.title}
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                              {art.category || "Esportes"}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{art.publishedAt}</span>
                            </span>
                          </div>
                          <h3 className="font-heading font-black text-base text-slate-900 hover:text-emerald-700 transition-colors">
                            <button
                              type="button"
                              onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                              className="text-left cursor-pointer hover:underline"
                            >
                              {art.title}
                            </button>
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                            <span><strong>Fonte:</strong> {art.source}</span>
                            {art.articleUrl && (
                              <>
                                <span>&middot;</span>
                                <a
                                  href={art.articleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-medium"
                                >
                                  <span>Ver na fonte original</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            Ler Reportagem &rarr;
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                /* Estado 4: Ausência de Notícias */
                <div className="mb-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-800 mb-1">
                    Nenhuma matéria oficial de esportes no momento
                  </h3>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto mb-2">
                    Novas reportagens esportivas apuradas pela Agência Brasil e fontes públicas serão sincronizadas e listadas aqui automaticamente.
                  </p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Verificar atualizações</span>
                    </button>
                  )}
                </div>
              )}

              {/* Grade de Artigos Demonstrativos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPORTS_EDITORIAL_NEWS.filter((n) => n.id !== "ebc-1705282").map((news) => (
                  <div
                    key={news.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {news.category}
                        </span>
                        <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {news.disclaimer}
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 leading-snug mb-1.5">
                        {news.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                        {news.summary}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{news.source}</span>
                      <span>{news.readTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Tabela de Classificação Interativa (4 colunas no desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h2 className="font-heading text-lg font-black text-slate-950 flex items-center gap-1.5">
                    <Medal className="w-5 h-5 text-amber-600" />
                    <span>Tabela de Classificação</span>
                  </h2>
                  {standingsTab === "serie-a" ? (
                    serieAData ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Dados Reais · {serieAData.season}
                      </span>
                    ) : isSerieALoading ? (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        Carregando...
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded">
                        Indisponível
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {DEMO_NOTICE}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {standingsTab === "serie-a"
                    ? serieAData
                      ? `Classificação oficial do Brasileirão Série A (${serieAData.season}). Fonte: football-data.org · Atualizado: ${formatBrazilDateTime(serieAData.lastUpdated)}`
                      : "Classificação oficial do Campeonato Brasileiro Série A (dados oficiais da API football-data.org)."
                    : "Classificação simulada dos clubes brasileiros na temporada 2026"}
                </p>

                {/* Abas Série A / Série B */}
                <div className="flex items-center gap-1.5 mt-3 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setStandingsTab("serie-a")}
                    className={`flex-1 py-1.5 rounded-md text-center transition-all flex items-center justify-center gap-1.5 ${
                      standingsTab === "serie-a"
                        ? "bg-white text-slate-950 shadow-2xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <span>Brasileirão Série A</span>
                    {serieAData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Dados reais ativos" />
                    )}
                  </button>
                  <button
                    onClick={() => setStandingsTab("serie-b")}
                    className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                      standingsTab === "serie-b"
                        ? "bg-white text-slate-950 shadow-2xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Brasileirão Série B
                  </button>
                </div>
              </div>

              {/* Tabela de Classificação Responsiva */}
              {standingsTab === "serie-a" && isSerieALoading ? (
                <div className="py-12 text-center">
                  <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Carregando classificação oficial da Série A...</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sincronizando tabela oficial via football-data.org</p>
                </div>
              ) : standingsTab === "serie-a" && (serieAError || !serieAData) ? (
                <div className="py-6 px-3 text-center bg-rose-50/60 rounded-xl border border-rose-200 my-2">
                  <AlertTriangle className="w-7 h-7 text-rose-600 mx-auto mb-2" />
                  <h4 className="text-xs font-black text-rose-950 mb-1">
                    Tabela da Série A indisponível
                  </h4>
                  <p className="text-[11px] text-rose-800 mb-3 leading-relaxed">
                    {serieAError || "O dataset oficial ainda não foi gerado ou está temporariamente inacessível. O portal Sociedade Ativa não apresenta dados simulados para a Série A."}
                  </p>
                  <button
                    type="button"
                    onClick={handleRetrySerieA}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar carregar novamente</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        <th className="py-2 px-1 text-center w-6">#</th>
                        <th className="py-2 px-1">Clube</th>
                        <th className="py-2 px-1 text-center font-bold text-slate-900">P</th>
                        <th className="py-2 px-1 text-center">J</th>
                        <th className="py-2 px-1 text-center">V</th>
                        <th className="py-2 px-1 text-center">SG</th>
                        <th className="py-2 px-1 text-center hidden sm:table-cell">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(standingsTab === "serie-a" ? serieAData!.standings : STANDINGS_SERIE_B).map((row) => (
                        <tr key={row.club} className="hover:bg-slate-50 transition-colors">
                          <td className="py-1.5 px-1 text-center font-bold">
                            <span
                              className={`inline-block w-5 h-5 rounded-full text-center leading-5 text-[10px] font-black text-white ${
                                row.zone === "libertadores_direta"
                                  ? "bg-blue-600"
                                  : row.zone === "pre_libertadores"
                                  ? "bg-sky-500"
                                  : row.zone === "sulamericana"
                                  ? "bg-emerald-600"
                                  : row.zone === "acesso"
                                  ? "bg-blue-700"
                                  : row.zone === "rebaixamento"
                                  ? "bg-rose-600"
                                  : "bg-slate-300 text-slate-800"
                              }`}
                            >
                              {row.position}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 font-semibold text-slate-900 truncate max-w-[110px]">
                            {row.club}
                          </td>
                          <td className="py-1.5 px-1 text-center font-black text-slate-950 bg-slate-50/80">
                            {row.points}
                          </td>
                          <td className="py-1.5 px-1 text-center text-slate-600">{row.played}</td>
                          <td className="py-1.5 px-1 text-center text-slate-600">{row.won}</td>
                          <td className="py-1.5 px-1 text-center font-mono text-[11px] text-slate-600">
                            {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono text-[10px] text-slate-500 hidden sm:table-cell">
                            {row.percentage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legenda de Zonas */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-600 space-y-1">
                {standingsTab === "serie-a" ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                      <span>Fase de Grupos da Libertadores (1º ao 4º)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></span>
                      <span>Pré-Libertadores (5º e 6º)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                      <span>Copa Sul-Americana (7º ao 12º)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
                      <span>Zona de Rebaixamento (Z-4)</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-700 shrink-0"></span>
                      <span>Acesso à Série A 2027 (1º ao 4º)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
                      <span>Zona de Rebaixamento à Série C</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Caixa Informativa sobre Direitos de Transmissão e Dados Esportivos */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Transparência Editorial</span>
              </div>
              <h3 className="font-heading font-black text-base text-white mb-2">
                Arquitetura de Cobertura Esportiva
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                O portal <strong>Sociedade Ativa</strong> disponibiliza este caderno com integração de dados oficiais para o <strong>Brasileirão Série A</strong> via API football-data.org v4.
                As demais competições e placares ainda não integrados permanecem como protótipo demonstrativo com dados simulados identificados.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                {serieAData ? (
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Série A Oficial: {formatBrazilDateTime(serieAData.lastUpdated)} (Fonte: {serieAData.source})</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <span className="text-amber-300 font-bold">{DEMO_NOTICE}</span> · Atualização periódica de dados esportivos.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
