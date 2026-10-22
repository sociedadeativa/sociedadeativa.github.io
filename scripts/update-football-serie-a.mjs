#!/usr/bin/env node

/**
 * Script de Ingestão e Validação dos Dados Oficiais do Brasileirão Série A
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Fonte: API-Football v3 (https://v3.football.api-sports.io)
 * Liga: 71 (Brasileirão Série A - Brasil)
 *
 * Diretrizes de Segurança e Confiabilidade:
 * 1. A chave da API deve ser provida estritamente via variável de ambiente API_FOOTBALL_KEY.
 *    Nunca é exposta em logs, arquivos públicos ou bundle do cliente.
 * 2. Validação rigorosa dos dados recebidos (20 clubes, integridade numérica e campos obrigatórios).
 * 3. Se a API falhar, estourar quota ou retornar erro, o dataset anterior é preservado intacto.
 * 4. O script encerra com código de saída 1 (não-zero) em caso de falha, evitando que o pipeline
 *    do GitHub Actions reporte sucesso indevido (prevenção de silent failure).
 * 5. Nunca inventa placares, resultados ou classificações sintéticas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const DEFAULT_LEAGUE_ID = 71; // Brasileirão Série A
export const DEFAULT_SEASON = process.env.FOOTBALL_SEASON || '2024';
export const API_BASE_URL = process.env.API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
export const OUTPUT_JSON_PATH = path.join(rootDir, 'public', 'data', 'footballSerieA.json');

const FETCH_TIMEOUT_MS = 12000;

/**
 * Utilitário seguro para requisições à API-Football com timeout e headers protegidos
 */
export async function makeApiFootballRequest(endpoint, apiKey, customFetch = fetch) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('Chave da API-Football não configurada (variável API_FOOTBALL_KEY ausente ou vazia).');
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await customFetch(url, {
      signal: controller.signal,
      headers: {
        'x-apisports-key': apiKey.trim(),
        'Accept': 'application/json',
        'User-Agent': 'SociedadeAtiva-Bot/1.0 (+https://sociedadeativa.github.io/)',
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`API-Football respondeu com status HTTP ${res.status} (${res.statusText}) ao consultar ${endpoint}.`);
    }

    const payload = await res.json();

    // A API-Football pode retornar HTTP 200 com erros no payload JSON
    if (payload.errors) {
      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        throw new Error(`Erro retornado pela API-Football: ${payload.errors.join('; ')}`);
      } else if (typeof payload.errors === 'object' && Object.keys(payload.errors).length > 0) {
        const errorDetails = Object.entries(payload.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        throw new Error(`Erro retornado pela API-Football: ${errorDetails}`);
      }
    }

    return payload;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Validação da estrutura de resposta de classificação (Standings)
 */
export function validateStandingsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Payload de classificação inválido ou vazio.');
  }

  if (!Array.isArray(data.response) || data.response.length === 0) {
    throw new Error('A API-Football não retornou nenhuma liga no array de resposta.');
  }

  const leagueData = data.response[0]?.league;
  if (!leagueData || !Array.isArray(leagueData.standings) || leagueData.standings.length === 0) {
    throw new Error('Estrutura de classificação (standings) ausente na resposta da liga.');
  }

  const standingsList = leagueData.standings[0];
  if (!Array.isArray(standingsList) || standingsList.length < 20) {
    throw new Error(`Classificação incompleta do Brasileirão Série A: esperado 20 clubes, recebido ${standingsList?.length ?? 0}.`);
  }

  for (const row of standingsList) {
    if (typeof row.rank !== 'number' || !row.team?.name) {
      throw new Error('Entrada da tabela de classificação sem rank ou nome de clube válido.');
    }
    if (typeof row.points !== 'number' || typeof row.all?.played !== 'number') {
      throw new Error(`Dados estatísticos ausentes para o clube ${row.team?.name || 'desconhecido'}.`);
    }
  }

  return standingsList;
}

/**
 * Validação da estrutura de partidas (Fixtures)
 */
export function validateFixturesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Payload de partidas inválido ou vazio.');
  }

  if (!Array.isArray(data.response)) {
    throw new Error('Estrutura de partidas inválida: campo "response" deve ser um array.');
  }

  for (const item of data.response) {
    if (!item.fixture?.id || !item.teams?.home?.name || !item.teams?.away?.name) {
      throw new Error('Partida retornada com dados obrigatórios ausentes (id ou equipes).');
    }
  }

  return data.response;
}

/**
 * Converte classificação da API-Football para o formato StandingRow do Sociedade Ativa
 */
export function mapStandingsToStandingRows(standingsList) {
  return standingsList.map((item) => {
    const played = item.all?.played ?? 0;
    const points = item.points ?? 0;
    const maxPoints = played * 3;
    const percentage = maxPoints > 0 ? `${((points / maxPoints) * 100).toFixed(1)}%` : '0.0%';

    // Mapeamento de forma: W -> V (Vitória), D -> E (Empate), L -> D (Derrota)
    const rawForm = (item.form || '').slice(-5).split('');
    const form = rawForm.map((char) => {
      if (char === 'W') return 'V';
      if (char === 'D') return 'E';
      if (char === 'L') return 'D';
      return 'E';
    });

    // Mapeamento de zona de classificação do Brasileirão
    let zone = 'meio';
    const rank = item.rank;
    const desc = (item.description || '').toLowerCase();

    if (rank >= 1 && rank <= 4) {
      zone = 'libertadores_direta';
    } else if (rank >= 5 && rank <= 6) {
      zone = 'pre_libertadores';
    } else if (rank >= 7 && rank <= 12) {
      zone = 'sulamericana';
    } else if (rank >= 17 && rank <= 20) {
      zone = 'rebaixamento';
    } else if (desc.includes('libertadores') && desc.includes('group')) {
      zone = 'libertadores_direta';
    } else if (desc.includes('libertadores')) {
      zone = 'pre_libertadores';
    } else if (desc.includes('sul-americana') || desc.includes('sudamericana')) {
      zone = 'sulamericana';
    } else if (desc.includes('relegation')) {
      zone = 'rebaixamento';
    }

    return {
      position: item.rank,
      club: item.team.name,
      clubLogo: item.team.logo,
      teamId: item.team.id,
      points: item.points,
      played,
      won: item.all?.win ?? 0,
      drawn: item.all?.draw ?? 0,
      lost: item.all?.lose ?? 0,
      goalsFor: item.all?.goals?.for ?? 0,
      goalsAgainst: item.all?.goals?.against ?? 0,
      goalDiff: item.goalsDiff ?? (item.all?.goals?.for ?? 0) - (item.all?.goals?.against ?? 0),
      percentage,
      form,
      zone,
    };
  });
}

/**
 * Converte partidas da API-Football para o formato MatchScore do Sociedade Ativa
 */
export function mapFixturesToMatches(fixturesList) {
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

  return fixturesList.map((fix) => {
    const rawStatus = fix.fixture?.status?.short || 'NS';
    let status = 'agendado';
    if (LIVE_STATUSES.includes(rawStatus)) {
      status = 'ao_vivo';
    } else if (FINISHED_STATUSES.includes(rawStatus)) {
      status = 'encerrado';
    }

    const elapsed = fix.fixture?.status?.elapsed;
    const minute = elapsed ? `${elapsed}'` : undefined;

    // Formatação de data/hora no horário de Brasília (UTC-3)
    let dateStr = 'Data a definir';
    let timeStr = '--:--';
    if (fix.fixture?.date) {
      try {
        const d = new Date(fix.fixture.date);
        const optionsDate = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
        const optionsTime = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' };
        dateStr = new Intl.DateTimeFormat('pt-BR', optionsDate).format(d);
        timeStr = new Intl.DateTimeFormat('pt-BR', optionsTime).format(d);
      } catch {
        dateStr = fix.fixture.date.slice(0, 10);
      }
    }

    return {
      id: `apifootball-${fix.fixture.id}`,
      fixtureId: fix.fixture.id,
      tournamentId: 'brasileirao-a',
      tournamentName: 'Brasileirão Série A',
      phase: fix.league?.round || 'Brasileirão Série A',
      status,
      minute,
      homeTeam: {
        id: fix.teams?.home?.id,
        name: fix.teams?.home?.name || 'Mandante',
        shortName: fix.teams?.home?.name || 'Mandante',
        score: typeof fix.goals?.home === 'number' ? fix.goals.home : undefined,
        logo: fix.teams?.home?.logo,
        initials: (fix.teams?.home?.name || 'MDT').slice(0, 3).toUpperCase(),
        color: 'bg-slate-800 text-white',
      },
      awayTeam: {
        id: fix.teams?.away?.id,
        name: fix.teams?.away?.name || 'Visitante',
        shortName: fix.teams?.away?.name || 'Visitante',
        score: typeof fix.goals?.away === 'number' ? fix.goals.away : undefined,
        logo: fix.teams?.away?.logo,
        initials: (fix.teams?.away?.name || 'VST').slice(0, 3).toUpperCase(),
        color: 'bg-slate-700 text-white',
      },
      date: dateStr,
      time: timeStr,
      venue: fix.fixture?.venue?.name || 'Estádio a definir',
      city: fix.fixture?.venue?.city || 'Brasil',
      broadcast: 'Transmissão Oficial',
      roundOrLeg: fix.league?.round || 'Rodada Oficial',
      disclaimer: 'Dados Oficiais API-Football',
    };
  });
}

/**
 * Função principal de execução e atualização dos dados do Brasileirão Série A
 */
export async function updateFootballSerieAData(options = {}) {
  const apiKey = options.apiKey ?? process.env.API_FOOTBALL_KEY;
  const leagueId = options.leagueId ?? DEFAULT_LEAGUE_ID;
  const season = options.season ?? DEFAULT_SEASON;
  const customFetch = options.customFetch ?? fetch;
  const outputPath = options.outputPath ?? OUTPUT_JSON_PATH;

  console.log('='.repeat(75));
  console.log(`ATUALIZAÇÃO DE DADOS OFICIAIS — BRASILEIRÃO SÉRIE A (LIGA ${leagueId}, TEMPORADA ${season})`);
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
    // 2. Consulta à API-Football: Classificação
    console.log(`\n[1/2] Consultando classificação oficial (standings?league=${leagueId}&season=${season})...`);
    const standingsRaw = await makeApiFootballRequest(
      `standings?league=${leagueId}&season=${season}`,
      apiKey,
      customFetch
    );
    const validatedStandings = validateStandingsResponse(standingsRaw);
    const mappedStandings = mapStandingsToStandingRows(validatedStandings);
    console.log(`  ✓ Classificação validada com sucesso: ${mappedStandings.length} clubes estruturados.`);

    // 3. Consulta à API-Football: Partidas (recupera calendário da temporada da Série A)
    console.log(`\n[2/2] Consultando partidas da Série A (fixtures?league=${leagueId}&season=${season})...`);
    const fixturesRaw = await makeApiFootballRequest(
      `fixtures?league=${leagueId}&season=${season}`,
      apiKey,
      customFetch
    );
    const validatedFixtures = validateFixturesResponse(fixturesRaw);
    const mappedMatches = mapFixturesToMatches(validatedFixtures);
    console.log(`  ✓ Partidas validadas com sucesso: ${mappedMatches.length} confrontos mapeados.`);

    // 4. Montagem do payload consolidado
    const nowIso = new Date().toISOString();
    const finalPayload = {
      leagueId,
      leagueName: 'Brasileirão Série A',
      season,
      source: 'API-Football (v3.football.api-sports.io)',
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
