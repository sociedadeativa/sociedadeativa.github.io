/**
 * Testes determinísticos e offline da ingestão de dados do Brasileirão Série A
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Fonte: football-data.org v4 API (https://api.football-data.org/v4/)
 * Competição: BSA (Campeonato Brasileiro Série A)
 *
 * Garante que:
 * 1. Todos os testes rodem 100% offline com fixtures mockadas (0 consumo de requisições de API).
 * 2. As respostas da football-data.org v4 sejam validadas e mapeadas com fidelidade.
 * 3. Falhas de rede, limites de taxa (rate limits HTTP 429) e respostas corrompidas nunca destruam o cache anterior.
 * 4. O token da API (FOOTBALL_DATA_TOKEN) seja transmitido via header X-Auth-Token e nunca seja exposto no payload final ou logs.
 * 5. Nenhum dado sintético ou placar fabricado seja gerado.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  validateStandingsResponse,
  validateMatchesResponse,
  validateFixturesResponse,
  mapStandingsToStandingRows,
  mapMatchesToMatchScores,
  mapFixturesToMatches,
  makeFootballDataRequest,
  makeApiFootballRequest,
  resolveSeasonFromApiResponse,
  updateFootballSerieAData,
} from "../scripts/update-football-serie-a.mjs";

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: INGESTÃO BRASILEIRÃO SÉRIE A (FOOTBALL-DATA.ORG V4)");
console.log("===========================================================================\n");

// -----------------------------------------------------------------------------
// FIXTURES MOCKADAS DETERMINÍSTICAS (Série A - 20 clubes reais)
// -----------------------------------------------------------------------------
const CLUB_TEAMS = [
  { id: 1770, name: "Botafogo FR", shortName: "Botafogo", tla: "BOT" },
  { id: 1771, name: "SE Palmeiras", shortName: "Palmeiras", tla: "PAL" },
  { id: 1783, name: "CR Flamengo", shortName: "Flamengo", tla: "FLA" },
  { id: 1780, name: "Fortaleza EC", shortName: "Fortaleza", tla: "FOR" },
  { id: 1775, name: "SC Internacional", shortName: "Internacional", tla: "INT" },
  { id: 1776, name: "São Paulo FC", shortName: "São Paulo", tla: "SPA" },
  { id: 1779, name: "SC Corinthians Paulista", shortName: "Corinthians", tla: "COR" },
  { id: 1782, name: "EC Bahia", shortName: "Bahia", tla: "BAH" },
  { id: 1772, name: "Cruzeiro EC", shortName: "Cruzeiro", tla: "CRU" },
  { id: 1778, name: "CR Vasco da Gama", shortName: "Vasco da Gama", tla: "VAS" },
  { id: 1785, name: "EC Vitória", shortName: "Vitória", tla: "VIT" },
  { id: 1773, name: "Clube Atlético Mineiro", shortName: "Atlético-MG", tla: "CAM" },
  { id: 1774, name: "Fluminense FC", shortName: "Fluminense", tla: "FLU" },
  { id: 1769, name: "Grêmio FBPA", shortName: "Grêmio", tla: "GRE" },
  { id: 1784, name: "EC Juventude", shortName: "Juventude", tla: "JUV" },
  { id: 1777, name: "Red Bull Bragantino", shortName: "Bragantino", tla: "RBB" },
  { id: 1781, name: "Club Athletico Paranaense", shortName: "Athletico-PR", tla: "CAP" },
  { id: 1786, name: "Criciúma EC", shortName: "Criciúma", tla: "CRI" },
  { id: 1787, name: "Atlético Clube Goianiense", shortName: "Atlético-GO", tla: "ACG" },
  { id: 1788, name: "Cuiabá EC", shortName: "Cuiabá", tla: "CUI" },
];

function createMockFootballDataStandingsPayload() {
  const table = CLUB_TEAMS.map((team, idx) => {
    const position = idx + 1;
    const won = 22 - Math.floor(idx * 0.7);
    const draw = 7;
    const lost = 38 - won - draw;
    const points = won * 3 + draw;
    const goalsFor = 55 - idx;
    const goalsAgainst = 24 + idx;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      position,
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        tla: team.tla,
        crest: `https://crests.football-data.org/${team.id}.png`,
      },
      playedGames: 38,
      form: "W,W,D,L,W",
      won,
      draw,
      lost,
      points,
      goalsFor,
      goalsAgainst,
      goalDifference,
    };
  });

  return {
    filters: { season: "2024" },
    area: { id: 2032, name: "Brazil", code: "BRA" },
    competition: {
      id: 2013,
      name: "Campeonato Brasileiro Série A",
      code: "BSA",
      type: "LEAGUE",
      emblem: "https://crests.football-data.org/bsa.png",
    },
    season: {
      id: 1564,
      startDate: "2024-04-13",
      endDate: "2024-12-08",
      currentMatchday: 38,
      winner: null,
    },
    standings: [
      {
        stage: "REGULAR_SEASON",
        type: "TOTAL",
        group: null,
        table,
      },
    ],
  };
}

function createMockFootballDataMatchesPayload() {
  return {
    filters: { season: "2024" },
    resultSet: { count: 2, first: "2024-12-08", last: "2024-12-08", played: 2 },
    competition: {
      id: 2013,
      name: "Campeonato Brasileiro Série A",
      code: "BSA",
      type: "LEAGUE",
    },
    matches: [
      {
        id: 497654,
        utcDate: "2024-12-08T19:00:00Z",
        status: "FINISHED",
        matchday: 38,
        stage: "REGULAR_SEASON",
        homeTeam: {
          id: 1770,
          name: "Botafogo FR",
          shortName: "Botafogo",
          tla: "BOT",
          crest: "https://crests.football-data.org/1770.png",
        },
        awayTeam: {
          id: 1776,
          name: "São Paulo FC",
          shortName: "São Paulo",
          tla: "SPA",
          crest: "https://crests.football-data.org/1776.png",
        },
        score: {
          winner: "HOME_TEAM",
          duration: "REGULAR",
          fullTime: { home: 2, away: 1 },
          halfTime: { home: 1, away: 0 },
        },
      },
      {
        id: 497655,
        utcDate: "2024-12-08T19:00:00Z",
        status: "IN_PLAY",
        matchday: 38,
        stage: "REGULAR_SEASON",
        homeTeam: {
          id: 1771,
          name: "SE Palmeiras",
          shortName: "Palmeiras",
          tla: "PAL",
          crest: "https://crests.football-data.org/1771.png",
        },
        awayTeam: {
          id: 1774,
          name: "Fluminense FC",
          shortName: "Fluminense",
          tla: "FLU",
          crest: "https://crests.football-data.org/1774.png",
        },
        score: {
          winner: null,
          duration: "REGULAR",
          fullTime: { home: 1, away: 1 },
          halfTime: { home: 0, away: 1 },
        },
      },
    ],
  };
}

async function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "football-data-test-"));
  const testOutputPath = path.join(tmpDir, "footballSerieA.json");

  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Validação de Resposta de Classificação (Standings) e Mapeamento
    // -------------------------------------------------------------------------
    console.log("[TESTE 1] Validação da resposta de classificação do football-data.org e mapeamento para StandingRow");
    const validStandingsData = createMockFootballDataStandingsPayload();
    const validatedTable = validateStandingsResponse(validStandingsData);
    assert.strictEqual(validatedTable.length, 20, "Devem ser validados exatamente 20 clubes");

    const mappedRows = mapStandingsToStandingRows(validatedTable);
    assert.strictEqual(mappedRows.length, 20);
    assert.strictEqual(mappedRows[0].club, "Botafogo");
    assert.strictEqual(mappedRows[0].position, 1);
    assert.strictEqual(mappedRows[0].zone, "libertadores_direta");
    assert.strictEqual(mappedRows[4].zone, "pre_libertadores");
    assert.strictEqual(mappedRows[8].zone, "sulamericana");
    assert.strictEqual(mappedRows[14].zone, "meio");
    assert.strictEqual(mappedRows[18].zone, "rebaixamento");

    // Verifica conversão da forma (W,W,D,L,W -> V, V, E, D, V)
    assert.deepStrictEqual(mappedRows[0].form, ["V", "V", "E", "D", "V"]);
    console.log("  [PASS] 1. Tabela com 20 clubes validada e zonas da CONMEBOL / Rebaixamento mapeadas.");
    console.log("  [PASS] 2. Histórico de partidas (W/D/L) convertido fielmente para o padrão brasileiro (V/E/D).");

    // -------------------------------------------------------------------------
    // TESTE 2: Validação de Partidas e Conversão para MatchScore
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 2] Validação das partidas do football-data.org e conversão para o formato MatchScore");
    const validMatchesData = createMockFootballDataMatchesPayload();
    const validatedMatches = validateMatchesResponse(validMatchesData);
    assert.strictEqual(validatedMatches.length, 2);

    // Testa também o alias de compatibilidade validateFixturesResponse
    assert.strictEqual(validateFixturesResponse(validMatchesData).length, 2);

    const mappedScores = mapMatchesToMatchScores(validatedMatches);
    assert.strictEqual(mappedScores.length, 2);
    assert.strictEqual(mappedScores[0].status, "encerrado");
    assert.strictEqual(mappedScores[0].homeTeam.score, 2);
    assert.strictEqual(mappedScores[0].awayTeam.score, 1);
    assert.strictEqual(mappedScores[0].tournamentId, "brasileirao-a");
    assert.strictEqual(mappedScores[0].phase, "38ª Rodada");

    assert.strictEqual(mappedScores[1].status, "ao_vivo");
    assert.strictEqual(mappedScores[1].minute, "Ao vivo");

    // Testa o alias mapFixturesToMatches
    assert.strictEqual(mapFixturesToMatches(validatedMatches).length, 2);
    console.log("  [PASS] 1. Partidas mapeadas com status 'encerrado' e 'ao_vivo' cronometrado.");

    // -------------------------------------------------------------------------
    // TESTE 3: Execução Completa com Mock Fetch e Autenticação X-Auth-Token
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 3] Execução completa do pipeline com header X-Auth-Token e geração atômica");
    const mockToken = "secret-football-data-token-abcdef-123456";

    const mockFetch = async (url, options) => {
      // Verifica se a autenticação é via X-Auth-Token e se a URL NÃO contém a credencial
      assert.strictEqual(options.headers["X-Auth-Token"], mockToken);
      assert.ok(!url.includes(mockToken), "O token NUNCA deve ser passado na URL");

      if (url.includes("/standings")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockFootballDataStandingsPayload(),
        };
      }
      if (url.includes("/matches")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockFootballDataMatchesPayload(),
        };
      }
      throw new Error(`Endpoint não esperado no mock: ${url}`);
    };

    const runResult = await updateFootballSerieAData({
      apiToken: mockToken,
      competitionCode: "BSA",
      season: "2024",
      customFetch: mockFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(runResult.success, true);
    assert.ok(fs.existsSync(testOutputPath), "Arquivo JSON deve ter sido criado");

    const savedContent = fs.readFileSync(testOutputPath, "utf8");
    assert.ok(!savedContent.includes(mockToken), "Token da API NUNCA deve estar contido no arquivo JSON gerado");

    const parsedSaved = JSON.parse(savedContent);
    assert.strictEqual(parsedSaved.isReal, true);
    assert.strictEqual(parsedSaved.competitionCode, "BSA");
    assert.strictEqual(parsedSaved.standings.length, 20);
    assert.strictEqual(parsedSaved.matches.length, 2);
    assert.strictEqual(parsedSaved.source, "football-data.org (v4 API)");
    console.log("  [PASS] 1. Dataset gerado com sucesso sem expor o token de autenticação.");

    // -------------------------------------------------------------------------
    // TESTE 4: Defesa Ativa e Preservação de Cache em Erro de Quota / Limite 429
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 4] Tratamento defensivo em caso de limite de requisições (HTTP 429 - Rate Limit)");
    const mockRateLimitFetch = async () => {
      return {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({
          message: "You reached your request limit. Wait 55 seconds.",
          errorCode: 429,
        }),
      };
    };

    const rateLimitResult = await updateFootballSerieAData({
      apiToken: mockToken,
      competitionCode: "BSA",
      season: "2024",
      customFetch: mockRateLimitFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(rateLimitResult.success, false, "Deve reportar failure quando a API retorna erro 429");
    assert.strictEqual(rateLimitResult.preserved, true, "Deve reportar preserved: true");

    // Verifica que o arquivo existente no disco NÃO foi corrompido ou sobrescrito
    const preservedContent = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
    assert.strictEqual(preservedContent.standings.length, 20, "Os 20 clubes do cache prévio devem estar preservados");
    console.log("  [PASS] 1. Erro de rate limit interceptado; dataset anterior preservado sem corrupção.");

    // -------------------------------------------------------------------------
    // TESTE 5: Defesa Ativa em Falha de Rede (Network Error / Offline)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 5] Tratamento defensivo em queda de conexão de rede");
    const mockNetworkFailFetch = async () => {
      throw new Error("fetch failed: ECONNRESET");
    };

    const networkResult = await updateFootballSerieAData({
      apiToken: mockToken,
      competitionCode: "BSA",
      season: "2024",
      customFetch: mockNetworkFailFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(networkResult.success, false);
    assert.strictEqual(networkResult.preserved, true);
    assert.ok(networkResult.error.includes("ECONNRESET"));

    const networkPreserved = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
    assert.strictEqual(networkPreserved.standings.length, 20);
    console.log("  [PASS] 1. Queda de rede tratada com sucesso; cache defensivo preservado.");

    // -------------------------------------------------------------------------
    // TESTE 6: Rejeição de Dados Incompletos (< 20 Clubes)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 6] Rejeição estrita de classificação truncada ou incompleta");
    const truncatedPayload = {
      standings: [
        {
          type: "TOTAL",
          table: [
            { position: 1, team: { name: "Botafogo" }, points: 50, playedGames: 20 },
            { position: 2, team: { name: "Palmeiras" }, points: 48, playedGames: 20 },
          ],
        },
      ],
    };

    assert.throws(
      () => validateStandingsResponse(truncatedPayload),
      /Classificação incompleta do Brasileirão Série A: esperado 20 clubes/
    );
    console.log("  [PASS] 1. Validador rejeita com segurança tabelas com menos de 20 equipes.");

    // -------------------------------------------------------------------------
    // TESTE 7: Rejeição de Execução sem Token de Autenticação
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 7] Rejeição imediata quando o token da API não está configurado");
    await assert.rejects(
      async () => {
        await makeFootballDataRequest("competitions/BSA/standings", "");
      },
      /Token do football-data.org não configurado/
    );
    // Também testa pelo alias makeApiFootballRequest
    await assert.rejects(
      async () => {
        await makeApiFootballRequest("competitions/BSA/standings", "");
      },
      /Token do football-data.org não configurado/
    );
    console.log("  [PASS] 1. Rejeição com erro descritivo quando FOOTBALL_DATA_TOKEN não foi informado.");

    // -------------------------------------------------------------------------
    // TESTE 8: Resolução Dinâmica da Temporada Padrão (Sem Hardcode '2024')
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 8] Consulta de temporada padrão: API fornece a temporada atual sem forçar ano fixo");
    
    // Testa o utilitário resolveSeasonFromApiResponse
    const mockSeasonPayload = {
      filters: { season: "2025" },
      season: { id: 1600, startDate: "2025-04-12", endDate: "2025-12-07" },
    };
    assert.strictEqual(resolveSeasonFromApiResponse(mockSeasonPayload), "2025");
    assert.strictEqual(resolveSeasonFromApiResponse({ season: { startDate: "2026-04-18" } }), "2026");
    assert.strictEqual(resolveSeasonFromApiResponse(mockSeasonPayload, "2024"), "2024", "Override explícito deve ter precedência");

    const requestedUrlsDefault = [];
    const mockDefaultSeasonFetch = async (url, options) => {
      requestedUrlsDefault.push(url);
      if (url.includes("/standings")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockFootballDataStandingsPayload(),
        };
      }
      if (url.includes("/matches")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockFootballDataMatchesPayload(),
        };
      }
      throw new Error(`Endpoint não esperado: ${url}`);
    };

    // Executa sem especificar temporada (nem options.season, nem FOOTBALL_SEASON)
    const prevEnvSeason = process.env.FOOTBALL_SEASON;
    delete process.env.FOOTBALL_SEASON;
    try {
      const defaultResult = await updateFootballSerieAData({
        apiToken: mockToken,
        competitionCode: "BSA",
        customFetch: mockDefaultSeasonFetch,
        outputPath: testOutputPath,
      });

      assert.strictEqual(defaultResult.success, true);
      // Na consulta padrão, o endpoint de classificação NÃO deve conter parâmetro fixo de temporada
      const standingsUrl = requestedUrlsDefault.find((u) => u.includes("/standings"));
      assert.ok(standingsUrl, "Endpoint de classificação deve ter sido consultado");
      assert.ok(!standingsUrl.includes("?season="), "Consulta de classificação padrão não deve ter ?season= hardcoded");

      // As partidas devem utilizar a temporada informada pela API (2024 no mock)
      const matchesUrl = requestedUrlsDefault.find((u) => u.includes("/matches"));
      assert.ok(matchesUrl.includes("?season=2024"), "Partidas devem ser consultadas para a mesma temporada da classificação");

      const savedDefault = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
      assert.strictEqual(savedDefault.season, "2024");
      console.log("  [PASS] 1. Temporada atual consultada por padrão sem hardcode de ano na requisição.");
      console.log("  [PASS] 2. Temporada extraída dinamicamente dos metadados da API e sincronizada entre classificação e partidas.");
    } finally {
      if (prevEnvSeason !== undefined) {
        process.env.FOOTBALL_SEASON = prevEnvSeason;
      }
    }

    // -------------------------------------------------------------------------
    // TESTE 9: Override Explícito de Temporada (via options.season ou FOOTBALL_SEASON)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 9] Suporte a override explícito de temporada (ex: 2025)");
    const requestedUrlsOverride = [];
    const mockOverrideFetch = async (url) => {
      requestedUrlsOverride.push(url);
      if (url.includes("/standings")) {
        const payload = createMockFootballDataStandingsPayload();
        payload.filters.season = "2025";
        payload.season.startDate = "2025-04-12";
        payload.season.endDate = "2025-12-07";
        return {
          ok: true,
          status: 200,
          json: async () => payload,
        };
      }
      if (url.includes("/matches")) {
        const payload = createMockFootballDataMatchesPayload();
        payload.filters.season = "2025";
        return {
          ok: true,
          status: 200,
          json: async () => payload,
        };
      }
      throw new Error(`Endpoint não esperado: ${url}`);
    };

    const overrideResult = await updateFootballSerieAData({
      apiToken: mockToken,
      competitionCode: "BSA",
      season: "2025",
      customFetch: mockOverrideFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(overrideResult.success, true);
    const standingsOverrideUrl = requestedUrlsOverride.find((u) => u.includes("/standings"));
    assert.ok(standingsOverrideUrl.includes("?season=2025"), "Classificação deve respeitar o override ?season=2025");

    const matchesOverrideUrl = requestedUrlsOverride.find((u) => u.includes("/matches"));
    assert.ok(matchesOverrideUrl.includes("?season=2025"), "Partidas devem respeitar o override ?season=2025");

    const savedOverride = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
    assert.strictEqual(savedOverride.season, "2025");
    console.log("  [PASS] 1. Override explícito de temporada aplicado a ambos os endpoints (standings e matches).");

    // -------------------------------------------------------------------------
    // TESTE 10: Preservação de Cache quando Classificação Histórica é Restrita (Plano Gratuito)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 10] Tratamento de dados históricos indisponíveis no plano gratuito (HTTP 403 - Restricted)");
    const mockHistoricalForbiddenFetch = async (url) => {
      if (url.includes("/standings")) {
        return {
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: async () => ({
            message: "The resource you are looking for is restricted and apparently not in your subscription plan.",
            errorCode: 403,
          }),
        };
      }
      throw new Error(`Endpoint inesperado: ${url}`);
    };

    const historicalResult = await updateFootballSerieAData({
      apiToken: mockToken,
      competitionCode: "BSA",
      season: "2020",
      customFetch: mockHistoricalForbiddenFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(historicalResult.success, false, "Deve falhar explicitamente ao receber 403 para temporada restrita");
    assert.strictEqual(historicalResult.preserved, true, "Deve preservar dataset anterior intacto");

    const preservedAfterHistorical = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
    assert.strictEqual(preservedAfterHistorical.season, "2025", "Dataset anterior mantido sem sobrescrita ou corrupção");
    assert.strictEqual(preservedAfterHistorical.standings.length, 20);
    console.log("  [PASS] 1. Falha por restrição de histórico tratada sem corromper o dataset existente.");

    console.log("\n===========================================================================");
    console.log("TODOS OS 10 TESTES DA INTEGRAÇÃO DO BRASILEIRÃO SÉRIE A PASSARAM COM SUCESSO!");
    console.log("===========================================================================");
  } finally {
    // Limpeza do diretório temporário isolado
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES:", err);
  process.exit(1);
});
