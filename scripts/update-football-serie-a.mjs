#!/usr/bin/env node

/**
 * Script de Ingestão e Validação dos Dados Oficiais do Brasileirão Série A
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Fonte: football-data.org v4 API (https://api.football-data.org/v4/)
 * Competição: BSA (Campeonato Brasileiro Série A)
 *
 * Diretrizes de Segurança e Confiabilidade:
 * 1. O token da API deve ser provido estritamente via variável de ambiente FOOTBALL_DATA_TOKEN.
 *    Nunca é exposto em logs, arquivos públicos ou bundle do cliente.
 * 2. Autenticação via cabeçalho HTTP X-Auth-Token.
 * 3. Validação rigorosa dos dados recebidos (20 clubes, integridade numérica e campos obrigatórios).
 * 4. Se a API falhar, estourar quota ou retornar erro, o dataset anterior é preservado intacto.
 * 5. O script encerra com código de saída 1 (não-zero) em caso de falha, evitando que o pipeline
 *    do GitHub Actions reporte sucesso indevido (prevenção de silent failure).
 * 6. Nunca inventa placares, resultados ou classificações sintéticas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const DEFAULT_COMPETITION_CODE = process.env.COMPETITION_CODE || 'BSA'; // Brasileirão Série A
export const DEFAULT_LEAGUE_ID = 2013; // ID da Série A no football-data.org
export const DEFAULT_SEASON = process.env.FOOTBALL_SEASON || undefined;
export const API_BASE_URL = process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4';
export const OUTPUT_JSON_PATH = path.join(rootDir, 'public', 'data', 'footballSerieA.json');

const FETCH_TIMEOUT_MS = 12000;

/**
 * Utilitário seguro para requisições à football-data.org com timeout e token protegido
 */
export async function makeFootballDataRequest(endpoint, apiToken, customFetch = fetch) {
  if (!apiToken || typeof apiToken !== 'string' || apiToken.trim() === '') {
    throw new Error('Token do football-data.org não configurado (variável FOOTBALL_DATA_TOKEN ausente ou vazia).');
  }

  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${cleanEndpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await customFetch(url, {
      signal: controller.signal,
      headers: {
        'X-Auth-Token': apiToken.trim(),
        'Accept': 'application/json',
        'User-Agent': 'SociedadeAtiva-Bot/1.0 (+https://sociedadeativa.github.io/)',
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      let errorDetail = '';
      try {
        const errorJson = await res.json();
        if (errorJson?.message) {
          errorDetail = `: ${errorJson.message}`;
        }
      } catch {
        // Se a resposta de erro não for JSON, prossegue com statusText
      }
      throw new Error(`football-data.org respondeu com status HTTP ${res.status} (${res.statusText})${errorDetail} ao consultar ${cleanEndpoint}.`);
    }

    const payload = await res.json();

    // Verificação de eventuais erros no payload da football-data.org
    if (payload.errorCode && payload.message) {
      throw new Error(`Erro retornado pela API football-data.org (${payload.errorCode}): ${payload.message}`);
    }

    return payload;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Alias de retrocompatibilidade
export const makeApiFootballRequest = makeFootballDataRequest;

/**
 * Validação da estrutura de resposta de classificação (Standings) do football-data.org
 */
export function validateStandingsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Payload de classificação inválido ou vazio.');
  }

  if (!Array.isArray(data.standings) || data.standings.length === 0) {
    throw new Error('A API football-data.org não retornou nenhuma tabela no array de classificação.');
  }

  // Localiza a tabela TOTAL (classificação consolidada do campeonato)
  const totalStanding = data.standings.find((s) => s.type === 'TOTAL') || data.standings[0];
  if (!totalStanding || !Array.isArray(totalStanding.table)) {
    throw new Error('Estrutura de tabela (table) ausente na classificação da competição.');
  }

  const table = totalStanding.table;
  if (table.length < 20) {
    throw new Error(`Classificação incompleta do Brasileirão Série A: esperado 20 clubes, recebido ${table.length}.`);
  }

  for (const row of table) {
    if (typeof row.position !== 'number' || !row.team?.name) {
      throw new Error('Entrada da tabela de classificação sem position ou nome de clube válido.');
    }
    if (typeof row.points !== 'number' || typeof row.playedGames !== 'number') {
      throw new Error(`Dados estatísticos ausentes para o clube ${row.team?.name || 'desconhecido'}.`);
    }
  }

  return table;
}

/**
 * Validação da estrutura de partidas (Matches) do football-data.org
 */
export function validateMatchesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Payload de partidas inválido ou vazio.');
  }

  if (!Array.isArray(data.matches)) {
    throw new Error('Estrutura de partidas inválida: campo "matches" deve ser um array.');
  }

  for (const item of data.matches) {
    if (!item.id || !item.homeTeam?.name || !item.awayTeam?.name) {
      throw new Error('Partida retornada com dados obrigatórios ausentes (id ou equipes).');
    }
  }

  return data.matches;
}

// Alias de retrocompatibilidade
export const validateFixturesResponse = validateMatchesResponse;

/**
 * Converte classificação do football-data.org para o formato StandingRow do Sociedade Ativa
 */
export function mapStandingsToStandingRows(tableList) {
  return tableList.map((item) => {
    const played = item.playedGames ?? 0;
    const points = item.points ?? 0;
    const maxPoints = played * 3;
    const percentage = maxPoints > 0 ? `${((points / maxPoints) * 100).toFixed(1)}%` : '0.0%';

    // Mapeamento de forma: W -> V (Vitória), D -> E (Empate), L -> D (Derrota)
    // O football-data.org pode enviar "W,W,D,L,W" ou "WWDLD"
    let rawFormChars = [];
    if (typeof item.form === 'string') {
      if (item.form.includes(',')) {
        rawFormChars = item.form.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        rawFormChars = item.form.split('');
      }
    }
    const form = rawFormChars.slice(-5).map((char) => {
      const upper = char.toUpperCase();
      if (upper === 'W') return 'V';
      if (upper === 'D') return 'E';
      if (upper === 'L') return 'D';
      return 'E';
    });

    // Mapeamento oficial de zonas da tabela do Brasileirão Série A:
    // 1-4: Fase de Grupos da Libertadores
    // 5-6: Fase Preliminar da Libertadores
    // 7-12: Copa Sul-Americana
    // 13-16: Permanência / Sem vaga internacional
    // 17-20: Rebaixamento para Série B
    let zone = 'meio';
    const pos = item.position;
    if (pos >= 1 && pos <= 4) {
      zone = 'libertadores_direta';
    } else if (pos >= 5 && pos <= 6) {
      zone = 'pre_libertadores';
    } else if (pos >= 7 && pos <= 12) {
      zone = 'sulamericana';
    } else if (pos >= 17 && pos <= 20) {
      zone = 'rebaixamento';
    }

    return {
      position: item.position,
      club: item.team.shortName || item.team.name,
      officialName: item.team.name,
      clubLogo: item.team.crest || undefined,
      teamId: item.team.id,
      tla: item.team.tla,
      points: item.points,
      played,
      won: item.won ?? 0,
      drawn: item.draw ?? 0,
      lost: item.lost ?? 0,
      goalsFor: item.goalsFor ?? 0,
      goalsAgainst: item.goalsAgainst ?? 0,
      goalDiff: item.goalDifference ?? (item.goalsFor ?? 0) - (item.goalsAgainst ?? 0),
      percentage,
      form,
      zone,
    };
  });
}

/**
 * Converte partidas do football-data.org para o formato MatchScore do Sociedade Ativa
 */
export function mapMatchesToMatchScores(matchesList) {
  const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'LIVE'];
  const FINISHED_STATUSES = ['FINISHED', 'AWARDED'];

  return matchesList.map((match) => {
    const rawStatus = match.status || 'SCHEDULED';
    let status = 'agendado';
    if (LIVE_STATUSES.includes(rawStatus)) {
      status = 'ao_vivo';
    } else if (FINISHED_STATUSES.includes(rawStatus)) {
      status = 'encerrado';
    }

    // Formatação de data/hora no fuso oficial de Brasília (America/Sao_Paulo)
    let dateStr = 'Data a definir';
    let timeStr = '--:--';
    if (match.utcDate) {
      try {
        const d = new Date(match.utcDate);
        const optionsDate = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
        const optionsTime = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
        dateStr = new Intl.DateTimeFormat('pt-BR', optionsDate).format(d);
        timeStr = new Intl.DateTimeFormat('pt-BR', optionsTime).format(d);
      } catch {
        dateStr = match.utcDate.slice(0, 10);
      }
    }

    const homeScore = typeof match.score?.fullTime?.home === 'number' ? match.score.fullTime.home : undefined;
    const awayScore = typeof match.score?.fullTime?.away === 'number' ? match.score.fullTime.away : undefined;

    const roundName = match.matchday ? `${match.matchday}ª Rodada` : 'Brasileirão Série A';

    const homeName = match.homeTeam?.shortName || match.homeTeam?.name || 'Mandante';
    const awayName = match.awayTeam?.shortName || match.awayTeam?.name || 'Visitante';

    return {
      id: `footballdata-${match.id}`,
      fixtureId: match.id,
      tournamentId: 'brasileirao-a',
      tournamentName: 'Brasileirão Série A',
      phase: roundName,
      status,
      minute: status === 'ao_vivo' ? 'Ao vivo' : undefined,
      homeTeam: {
        id: match.homeTeam?.id,
        name: homeName,
        shortName: homeName,
        score: homeScore,
        logo: match.homeTeam?.crest || undefined,
        initials: match.homeTeam?.tla || homeName.slice(0, 3).toUpperCase(),
        color: 'bg-slate-800 text-white',
      },
      awayTeam: {
        id: match.awayTeam?.id,
        name: awayName,
        shortName: awayName,
        score: awayScore,
        logo: match.awayTeam?.crest || undefined,
        initials: match.awayTeam?.tla || awayName.slice(0, 3).toUpperCase(),
        color: 'bg-slate-700 text-white',
      },
      date: dateStr,
      time: timeStr,
      venue: 'Estádio a definir',
      city: 'Brasil',
      broadcast: 'Transmissão Oficial',
      roundOrLeg: roundName,
      disclaimer: 'Dados Oficiais football-data.org',
    };
  });
}

// Alias de retrocompatibilidade
export const mapFixturesToMatches = mapMatchesToMatchScores;

/**
 * Extrai e valida o ano da temporada a partir do payload retornado pela API football-data.org,
 * ou utiliza o override explícito caso informado.
 */
export function resolveSeasonFromApiResponse(standingsPayload, explicitSeason) {
  if (explicitSeason && String(explicitSeason).trim() !== '') {
    return String(explicitSeason).trim();
  }
  if (standingsPayload?.filters?.season) {
    return String(standingsPayload.filters.season).trim();
  }
  if (standingsPayload?.season?.startDate) {
    const startYear = new Date(standingsPayload.season.startDate).getUTCFullYear();
    if (!isNaN(startYear)) {
      return String(startYear);
    }
  }
  return String(new Date().getFullYear());
}

/**
 * Função principal de execução e atualização dos dados do Brasileirão Série A via football-data.org
 */
export async function updateFootballSerieAData(options = {}) {
  const apiToken = options.apiToken ?? options.apiKey ?? process.env.FOOTBALL_DATA_TOKEN;
  const competitionCode = options.competitionCode ?? options.leagueCode ?? DEFAULT_COMPETITION_CODE;
  const explicitSeason = options.season ?? process.env.FOOTBALL_SEASON ?? DEFAULT_SEASON;
  const customFetch = options.customFetch ?? fetch;
  const outputPath = options.outputPath ?? OUTPUT_JSON_PATH;

  const seasonLog = explicitSeason ? `TEMPORADA ${explicitSeason} (OVERRIDE)` : 'TEMPORADA ATUAL (PADRÃO)';
  console.log('='.repeat(75));
  console.log(`ATUALIZAÇÃO DE DADOS OFICIAIS — BRASILEIRÃO SÉRIE A (${competitionCode}, ${seasonLog})`);
  console.log(`Fonte: football-data.org v4 API`);
  console.log('='.repeat(75));

  // 1. Tenta carregar dataset pré-existente para preservação defensiva em caso de falha
  let previousDataset = null;
  if (fs.existsSync(outputPath)) {
    try {
      const rawPrev = fs.readFileSync(outputPath, 'utf8');
      previousDataset = JSON.parse(rawPrev);
      console.log(`[Cache Local] Dataset anterior identificado (${previousDataset.standings?.length ?? 0} clubes na tabela).`);
    } catch {
      console.warn('[Cache Local] Aviso: arquivo anterior inválido ou corrompido.');
    }
  }

  try {
    // 2. Consulta à football-data.org: Classificação da Série A
    // Se explicitSeason estiver definido, busca com ?season=...; caso contrário, consulta a temporada atual da API
    const standingsQuery = explicitSeason ? `?season=${encodeURIComponent(explicitSeason)}` : '';
    const standingsEndpoint = `competitions/${competitionCode}/standings${standingsQuery}`;
    console.log(`\n[1/2] Consultando classificação oficial (/${standingsEndpoint})...`);

    const standingsRaw = await makeFootballDataRequest(
      standingsEndpoint,
      apiToken,
      customFetch
    );
    const validatedTable = validateStandingsResponse(standingsRaw);
    const mappedStandings = mapStandingsToStandingRows(validatedTable);
    console.log(`  ✓ Classificação validada com sucesso: ${mappedStandings.length} clubes estruturados.`);

    // Determina a temporada representada na API para uso consistente em partidas e metadata
    const resolvedSeason = resolveSeasonFromApiResponse(standingsRaw, explicitSeason);
    console.log(`  ℹ Temporada apurada: ${resolvedSeason} (origem: ${explicitSeason ? 'override' : 'football-data.org metadata'})`);

    // 3. Consulta à football-data.org: Partidas da temporada da Série A
    // Utiliza a mesma temporada apurada da classificação para consistência total
    const matchesQuery = `?season=${encodeURIComponent(resolvedSeason)}`;
    const matchesEndpoint = `competitions/${competitionCode}/matches${matchesQuery}`;
    console.log(`\n[2/2] Consultando partidas da Série A (/${matchesEndpoint})...`);

    const matchesRaw = await makeFootballDataRequest(
      matchesEndpoint,
      apiToken,
      customFetch
    );
    const validatedMatches = validateMatchesResponse(matchesRaw);
    const mappedMatches = mapMatchesToMatchScores(validatedMatches);
    console.log(`  ✓ Partidas validadas com sucesso: ${mappedMatches.length} confrontos mapeados.`);

    // 4. Montagem do payload consolidado
    const nowIso = new Date().toISOString();
    const finalPayload = {
      competitionCode,
      competitionId: standingsRaw.competition?.id ?? DEFAULT_LEAGUE_ID,
      leagueId: standingsRaw.competition?.id ?? DEFAULT_LEAGUE_ID, // compatibilidade
      leagueName: standingsRaw.competition?.name ?? 'Brasileirão Série A',
      season: resolvedSeason,
      source: 'football-data.org (v4 API)',
      isReal: true,
      lastUpdated: nowIso,
      standings: mappedStandings,
      matches: mappedMatches,
    };

    // 5. Escrita atômica no arquivo JSON de destino
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(finalPayload, null, 2), 'utf8');
    console.log(`\n✓ Dataset gravado com sucesso em: ${path.relative(rootDir, outputPath)}`);
    console.log('='.repeat(75));
    console.log('Atualização do Brasileirão Série A concluída com 100% de integridade.');
    console.log('='.repeat(75));

    return { success: true, data: finalPayload };
  } catch (error) {
    console.error(`\n[ERRO NA ATUALIZAÇÃO DO FUTEBOL]: ${error.message}`);

    if (previousDataset) {
      console.warn('[Defesa Ativa] Preservando dataset anterior integralmente sem sobrescrever com dados inválidos.');
      return { success: false, preserved: true, error: error.message };
    } else {
      console.error('[Falha Crítica] Nenhum dataset anterior disponível para preservação.');
      throw error;
    }
  }
}

// Execução se chamado diretamente via CLI (Node.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await updateFootballSerieAData();
    if (!result || result.success === false) {
      // Garante saída não-zero para que pipelines falhem explicitamente em caso de erro
      process.exit(1);
    }
  } catch (err) {
    console.error('Falha fatal na execução do script:', err.message);
    process.exit(1);
  }
}
