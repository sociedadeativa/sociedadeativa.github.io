/**
 * Serviço de Integração dos Dados Oficiais do Brasileirão Série A
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Responsável por carregar, validar rigorosamente e disponibilizar
 * o dataset oficial em public/data/footballSerieA.json (gerado via football-data.org v4 API).
 *
 * Diretrizes de Integridade:
 * 1. Exige isReal === true, código de competição 'BSA' (ou leagueId 2013) e 20 clubes na tabela.
 * 2. Valida timestamp de atualização e integridade de partidas.
 * 3. Se o arquivo estiver ausente, corrompido ou inválido, falha explicitamente sem criar dados fictícios.
 * 4. Trata datas no fuso horário oficial de Brasília (America/Sao_Paulo).
 */

import type { StandingRow, MatchScore } from "../data/sportsData";

export interface FootballSerieAPayload {
  competitionCode: string;
  competitionId?: number;
  leagueId?: number;
  leagueName: string;
  season: string;
  source: string;
  isReal: boolean;
  lastUpdated: string;
  standings: StandingRow[];
  matches: MatchScore[];
}

/**
 * Formata um timestamp ISO no fuso oficial de Brasília (America/Sao_Paulo)
 */
export function formatBrazilDateTime(isoString: string): string {
  if (!isoString) return "Data não informada";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Data não informada";
    }
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateFormatter.format(date)} às ${timeFormatter.format(date)} (Horário de Brasília)`;
  } catch {
    return isoString;
  }
}

/**
 * Validação estrita do payload do Brasileirão Série A
 */
export function validateFootballSerieAPayload(data: unknown): FootballSerieAPayload {
  if (!data || typeof data !== "object") {
    throw new Error("Dataset da Série A inválido ou vazio.");
  }

  const payload = data as Partial<FootballSerieAPayload>;

  if (payload.isReal !== true) {
    throw new Error("Dataset rejeitado: flag 'isReal' ausente ou falso. Apenas dados oficiais são permitidos.");
  }

  const isBsa = payload.competitionCode === "BSA" || payload.competitionId === 2013 || payload.leagueId === 2013;
  if (!isBsa) {
    throw new Error(`Dataset incompatível: esperado competição 'BSA' (Brasileirão Série A), recebido '${payload.competitionCode}'.`);
  }

  if (typeof payload.season !== "string" || payload.season.trim() === "") {
    throw new Error("Dataset inválido: campo 'season' ausente ou vazio.");
  }

  if (typeof payload.lastUpdated !== "string" || isNaN(Date.parse(payload.lastUpdated))) {
    throw new Error("Dataset inválido: 'lastUpdated' não contém um timestamp ISO válido.");
  }

  // Validação da tabela de classificação (deve conter 20 clubes)
  if (!Array.isArray(payload.standings) || payload.standings.length < 20) {
    throw new Error(
      `Tabela de classificação incompleta: esperado 20 clubes da Série A, recebido ${payload.standings?.length ?? 0}.`
    );
  }

  for (const row of payload.standings) {
    if (typeof row.position !== "number" || typeof row.club !== "string" || row.club.trim() === "") {
      throw new Error("Linha da tabela com posição ou nome de clube inválido.");
    }
    if (
      typeof row.points !== "number" ||
      typeof row.played !== "number" ||
      typeof row.won !== "number" ||
      typeof row.drawn !== "number" ||
      typeof row.lost !== "number"
    ) {
      throw new Error(`Estatísticas numéricas incompletas para o clube '${row.club}'.`);
    }
    if (typeof row.goalDiff !== "number" || typeof row.percentage !== "string" || !Array.isArray(row.form)) {
      throw new Error(`Saldo de gols, aproveitamento ou histórico ausente para '${row.club}'.`);
    }
    if (typeof row.zone !== "string") {
      throw new Error(`Zona de classificação ausente para '${row.club}'.`);
    }
  }

  // Validação das partidas
  if (!Array.isArray(payload.matches)) {
    throw new Error("Estrutura de partidas inválida: campo 'matches' deve ser um array.");
  }

  for (const match of payload.matches) {
    if (!match.id || !match.tournamentId || !match.homeTeam?.name || !match.awayTeam?.name) {
      throw new Error("Partida da Série A com campos obrigatórios ausentes.");
    }
    if (!match.status || !match.date || !match.time) {
      throw new Error(`Partida '${match.id}' com status ou horário ausente.`);
    }
  }

  return {
    competitionCode: payload.competitionCode || "BSA",
    competitionId: payload.competitionId ?? 2013,
    leagueId: payload.leagueId ?? 2013,
    leagueName: payload.leagueName || "Brasileirão Série A",
    season: payload.season,
    source: payload.source || "football-data.org (v4 API)",
    isReal: true,
    lastUpdated: payload.lastUpdated,
    standings: payload.standings as StandingRow[],
    matches: payload.matches as MatchScore[],
  };
}

/**
 * Carrega e valida os dados oficiais do Brasileirão Série A a partir do JSON estático
 */
export async function fetchFootballSerieAData(
  customFetch: typeof fetch = fetch
): Promise<FootballSerieAPayload> {
  const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  const jsonUrl = `${baseUrl}data/footballSerieA.json`.replace(/\/{2,}/g, "/");

  const response = await customFetch(jsonUrl, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-cache",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Dataset oficial do Brasileirão Série A ainda não foi gerado no servidor. O pipeline do GitHub Actions deve executar para obter os dados da API football-data.org."
      );
    }
    throw new Error(
      `Falha ao obter dados do Brasileirão Série A: servidor respondeu com status HTTP ${response.status} (${response.statusText}).`
    );
  }

  const rawJson = await response.json();
  return validateFootballSerieAPayload(rawJson);
}

/**
 * Contabiliza partidas genuinamente ao vivo a partir do status oficial da API.
 * Não infere status a partir de horário de início nem dados sintéticos.
 */
export function countLiveMatches(matches: MatchScore[]): number {
  if (!Array.isArray(matches)) return 0;
  return matches.filter((m) => m && m.status === "ao_vivo").length;
}

/**
 * Filtra partidas estritamente pelo status selecionado:
 * - "ao_vivo": apenas partidas com status === "ao_vivo"
 * - "encerrado": apenas partidas com status === "encerrado"
 * - "proximos": apenas partidas com status === "agendado" | "hoje" | "amanha"
 * - "todos": todas as partidas
 */
export function filterMatchesByStatus(
  matches: MatchScore[],
  statusFilter: "todos" | "ao_vivo" | "encerrado" | "proximos"
): MatchScore[] {
  if (!Array.isArray(matches)) return [];
  switch (statusFilter) {
    case "ao_vivo":
      return matches.filter((m) => m && m.status === "ao_vivo");
    case "encerrado":
      return matches.filter((m) => m && m.status === "encerrado");
    case "proximos":
      return matches.filter(
        (m) => m && (m.status === "agendado" || m.status === "hoje" || m.status === "amanha")
      );
    case "todos":
    default:
      return matches;
  }
}

/**
 * Filtra partidas por identificador de torneio
 */
export function filterMatchesByTournament(
  matches: MatchScore[],
  tournamentId: string
): MatchScore[] {
  if (!Array.isArray(matches)) return [];
  if (!tournamentId || tournamentId === "todos") return matches;
  return matches.filter((m) => m && m.tournamentId === tournamentId);
}

/**
 * Extrai a lista ordenada de rodadas presentes nas partidas (sem duplicações).
 * Preserva o texto exato fornecido pela API.
 */
export function getAvailableRounds(matches: MatchScore[]): string[] {
  if (!Array.isArray(matches)) return [];
  const seen = new Set<string>();
  const rounds: string[] = [];
  for (const m of matches) {
    const roundName = m.roundOrLeg || m.phase;
    if (roundName && !seen.has(roundName)) {
      seen.add(roundName);
      rounds.push(roundName);
    }
  }
  return rounds;
}

/**
 * Determina a rodada atual ou mais relevante do campeonato a partir dos dados oficiais.
 * Não inventa rodadas: utiliza estritamente os campos e status fornecidos pela API.
 */
export function getCurrentRound(
  matches: MatchScore[],
  standings?: StandingRow[]
): string {
  if (!Array.isArray(matches) || matches.length === 0) return "";

  // 1. Se houver partida ao vivo, a rodada dela é a rodada ativa
  const liveMatch = matches.find((m) => m && m.status === "ao_vivo");
  if (liveMatch) {
    const r = liveMatch.roundOrLeg || liveMatch.phase;
    if (r) return r;
  }

  // 2. Se houver tabela de classificação oficial com contagem de jogos disputados
  if (Array.isArray(standings) && standings.length > 0) {
    const maxPlayed = Math.max(...standings.map((s) => s.played || 0));
    if (maxPlayed > 0) {
      const candidateRound = `${maxPlayed}ª Rodada`;
      const exists = matches.some(
        (m) => m && (m.roundOrLeg === candidateRound || m.phase === candidateRound)
      );
      if (exists) return candidateRound;
    }
  }

  // 3. Caso contrário, localiza a rodada da última partida encerrada
  const finished = matches.filter((m) => m && m.status === "encerrado");
  if (finished.length > 0) {
    const lastFinished = finished[finished.length - 1];
    const r = lastFinished.roundOrLeg || lastFinished.phase;
    if (r) return r;
  }

  // 4. Ou a rodada da primeira partida agendada
  const scheduled = matches.filter(
    (m) => m && (m.status === "agendado" || m.status === "hoje" || m.status === "amanha")
  );
  if (scheduled.length > 0) {
    const firstScheduled = scheduled[0];
    const r = firstScheduled.roundOrLeg || firstScheduled.phase;
    if (r) return r;
  }

  return matches[0]?.roundOrLeg || matches[0]?.phase || "";
}

/**
 * Ordena partidas para exibição intuitiva:
 * 1. Partidas ao vivo (status === "ao_vivo")
 * 2. Partidas de hoje / amanhã / agendadas
 * 3. Partidas encerradas
 */
export function sortMatchesForDisplay(matches: MatchScore[]): MatchScore[] {
  if (!Array.isArray(matches)) return [];
  const getPriority = (status?: string) => {
    if (status === "ao_vivo") return 0;
    if (status === "hoje") return 1;
    if (status === "amanha") return 2;
    if (status === "agendado") return 3;
    if (status === "encerrado") return 4;
    return 5;
  };
  return [...matches].sort((a, b) => getPriority(a.status) - getPriority(b.status));
}
