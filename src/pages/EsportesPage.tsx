import React, { useState } from "react";
import { NewsItem } from "../types/news";
import { PortalLink } from "../components/PortalLink";
import {
  Trophy,
  Calendar,
  Clock,
  Flame,
  Shield,
  Activity,
  Tv,
  Radio,
  ChevronRight,
  Filter,
  AlertTriangle,
  Info,
  Medal,
  ExternalLink,
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

interface EsportesPageProps {
  articles?: NewsItem[];
  onOpenArticleDetails?: (article: NewsItem) => void;
}

export const EsportesPage: React.FC<EsportesPageProps> = ({
  articles = [],
  onOpenArticleDetails,
}) => {
  const [selectedTournament, setSelectedTournament] = useState<string>("todos");
  const [matchStatusFilter, setMatchStatusFilter] = useState<"todos" | "ao_vivo" | "encerrado" | "proximos">("todos");
  const [standingsTab, setStandingsTab] = useState<"serie-a" | "serie-b">("serie-a");

  // Filtra notícias reais do dataset sobre esportes/futebol
  const realSportsArticles = articles.filter(
    (a) =>
      (a.category as string) === "Esportes" ||
      a.tags?.some((t) => ["Esportes", "Futebol", "Copa Libertadores", "Fluminense", "Palmeiras"].includes(t)) ||
      a.title.toLowerCase().includes("libertadores") ||
      a.title.toLowerCase().includes("fluminense") ||
      a.title.toLowerCase().includes("futebol")
  );

  // Filtro de partidas
  const filteredMatches = MATCHES_DATA.filter((m) => {
    if (selectedTournament !== "todos" && m.tournamentId !== selectedTournament) {
      return false;
    }
    if (matchStatusFilter === "ao_vivo") return m.status === "ao_vivo";
    if (matchStatusFilter === "encerrado") return m.status === "encerrado";
    if (matchStatusFilter === "proximos") return m.status === "hoje" || m.status === "amanha" || m.status === "agendado";
    return true;
  });

  const liveCount = MATCHES_DATA.filter((m) => m.status === "ao_vivo").length;

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Alerta Obrigatório de Demonstração / Dados Fictícios */}
        <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white tracking-wide uppercase">
                  {DEMO_NOTICE}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Estrutura Visual &amp; Protótipo de Cobertura Esportiva
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
                Esta seção é um ambiente demonstrativo da nova editoria de esportes do <strong>Sociedade Ativa</strong>.
                Todos os <strong>placares ao vivo, resultados, tabelas de classificação, estatísticas e datas</strong> apresentados como demonstração são <strong>dados simulados</strong> para validação de interface e <strong>NÃO</strong> representam resultados oficiais, transmissões em andamento ou eventos esportivos em tempo real.
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
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
              {DEMO_NOTICE}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedTournament("todos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
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
                onClick={() => setSelectedTournament(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedTournament === t.id
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span>{t.name}</span>
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
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      <span>Jogos &amp; Placares</span>
                    </h2>
                    {liveCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {liveCount} AO VIVO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Acompanhamento de partidas do futebol brasileiro e internacional
                  </p>
                </div>

                {/* Filtro de Status das Partidas */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setMatchStatusFilter("todos")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      matchStatusFilter === "todos" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setMatchStatusFilter("ao_vivo")}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                      matchStatusFilter === "ao_vivo" ? "bg-rose-600 text-white shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300"></span>
                    Ao Vivo
                  </button>
                  <button
                    onClick={() => setMatchStatusFilter("encerrado")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      matchStatusFilter === "encerrado" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Encerrados
                  </button>
                  <button
                    onClick={() => setMatchStatusFilter("proximos")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      matchStatusFilter === "proximos" ? "bg-white text-slate-950 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Próximos
                  </button>
                </div>
              </div>

              {/* Lista de Partidas */}
              <div className="divide-y divide-slate-100 mt-2">
                {filteredMatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Nenhuma partida simulada encontrada para os filtros selecionados.
                  </div>
                ) : (
                  filteredMatches.map((match) => (
                    <div key={match.id} className="py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                      {/* Metadados da Partida */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{match.tournamentName}</span>
                          <span className="text-slate-300">&middot;</span>
                          <span>{match.phase}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {match.disclaimer}
                          </span>
                          {match.status === "ao_vivo" ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                              {match.minute || "Ao Vivo"}
                            </span>
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
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs ${match.homeTeam.color}`}>
                            {match.homeTeam.initials}
                          </span>
                        </div>

                        {/* Placar Central */}
                        <div className="col-span-2 text-center flex items-center justify-center">
                          {match.status === "ao_vivo" || match.status === "encerrado" ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-lg sm:text-xl shadow-2xs">
                              <span>{match.homeTeam.score ?? 0}</span>
                              <span className="text-slate-400 font-normal">x</span>
                              <span>{match.awayTeam.score ?? 0}</span>
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
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs ${match.awayTeam.color}`}>
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

                      {/* Eventos Chave Simulados */}
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
                  ))
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

              {/* Se houver notícia real de esporte no acervo oficial */}
              {realSportsArticles.length > 0 && (
                <div className="mb-6 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2">
                    <Radio className="w-4 h-4 text-emerald-700" />
                    <span>Matéria Oficial do Acervo Sociedade Ativa</span>
                  </div>
                  {realSportsArticles.map((art) => (
                    <div key={art.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-black text-base text-slate-900 hover:text-emerald-700 transition-colors">
                          <button
                            onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                            className="text-left cursor-pointer hover:underline"
                          >
                            {art.title}
                          </button>
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{art.summary}</p>
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-2">
                          <span><strong>Fonte:</strong> {art.source}</span>
                          <span>&middot;</span>
                          <span>{art.publishedAt}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
                      >
                        Ler Reportagem &rarr;
                      </button>
                    </div>
                  ))}
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
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    {DEMO_NOTICE}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Classificação simulada dos clubes brasileiros na temporada 2026
                </p>

                {/* Abas Série A / Série B */}
                <div className="flex items-center gap-1.5 mt-3 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setStandingsTab("serie-a")}
                    className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                      standingsTab === "serie-a"
                        ? "bg-white text-slate-950 shadow-2xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Brasileirão Série A
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
                    {(standingsTab === "serie-a" ? STANDINGS_SERIE_A : STANDINGS_SERIE_B).map((row) => (
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
                O portal <strong>Sociedade Ativa</strong> disponibiliza este caderno como demonstração funcional de dados desportivos.
                A cobertura completa contemplará integrações com feeds de futebol do Brasileirão Série A/B, CBF, CONMEBOL e federações estaduais.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="text-amber-300 font-bold">{DEMO_NOTICE}</span> · Atualização periódica de dados simulados.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
