/**
 * Testes determinísticos e offline da ingestão de dados do Brasileirão Série A
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Garante que:
 * 1. Todos os testes rodem 100% offline com fixtures mockadas (0 consumo de requisições de API).
 * 2. As respostas da API-Football v3 sejam validadas e mapeadas com precisão matemática.
 * 3. Falhas de rede, limites de taxa (rate limits) e respostas corrompidas nunca destruam o cache anterior.
 * 4. A chave da API nunca seja exposta no payload final.
 * 5. Nenhum dado sintético ou placar fabricado seja gerado.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  validateStandingsResponse,
  validateFixturesResponse,
  mapStandingsToStandingRows,
  mapFixturesToMatches,
  makeApiFootballRequest,
  updateFootballSerieAData,
} from "../scripts/update-football-serie-a.mjs";

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: INGESTÃO BRASILEIRÃO SÉRIE A (API-FOOTBALL V3)");
console.log("===========================================================================\n");

// -----------------------------------------------------------------------------
// FIXTURES MOCKADAS DETERMINÍSTICAS (Série A - 20 clubes reais)
// -----------------------------------------------------------------------------
const CLUB_NAMES = [
  "Botafogo", "Palmeiras", "Flamengo", "Fortaleza", "Internacional",
  "São Paulo", "Corinthians", "Bahia", "Cruzeiro", "Vasco da Gama",
  "Vitória", "Atlético-MG", "Fluminense", "Grêmio", "Juventude",
  "Red Bull Bragantino", "Athletico-PR", "Criciúma", "Atlético-GO", "Cuiabá"
];

function createMockStandingsPayload() {
  const standings = CLUB_NAMES.map((club, idx) => {
    const rank = idx + 1;
    const win = 20 - Math.floor(idx * 0.8);
    const draw = 8;
    const lose = 38 - win - draw;
    const points = win * 3 + draw;
    const goalsFor = 50 - idx;
    const goalsAgainst = 25 + idx;

    return {
      rank,
      team: { id: 100 + rank, name: club, logo: `https://media.api-sports.io/football/teams/${100 + rank}.png` },
      points,
      goalsDiff: goalsFor - goalsAgainst,
      group: "Serie A",
      form: "WWDLD",
      status: "same",
      description: rank <= 4 ? "Promotion - Copa Libertadores (Group Stage: )" : rank <= 6 ? "Promotion - Copa Libertadores (Qualification: )" : rank <= 12 ? "Promotion - Copa Sudamericana (Group Stage: )" : rank >= 17 ? "Relegation - Serie B" : null,
      all: {
        played: 38,
        win,
        draw,
        lose,
        goals: { for: goalsFor, against: goalsAgainst },
      },
    };
  });

  return {
    get: "standings",
    parameters: { league: "71", season: "2024" },
    errors: [],
    results: 1,
    response: [
      {
        league: {
          id: 71,
          name: "Serie A",
          country: "Brazil",
          season: 2024,
          standings: [standings],
        },
      },
    ],
  };
}

function createMockFixturesPayload() {
  return {
    get: "fixtures",
    parameters: { league: "71", season: "2024" },
    errors: [],
    results: 2,
    response: [
      {
        fixture: {
          id: 991,
          date: "2024-12-08T19:00:00+00:00",
          status: { short: "FT", long: "Match Finished", elapsed: 90 },
          venue: { name: "Estádio Nilton Santos", city: "Rio de Janeiro" },
        },
        league: { id: 71, name: "Serie A", round: "Regular Season - 38" },
        teams: {
          home: { id: 101, name: "Botafogo", logo: "https://media.api-sports.io/teams/101.png" },
          away: { id: 106, name: "São Paulo", logo: "https://media.api-sports.io/teams/106.png" },
        },
        goals: { home: 2, away: 1 },
      },
      {
        fixture: {
          id: 992,
          date: "2024-12-08T19:00:00+00:00",
          status: { short: "2H", long: "Second Half", elapsed: 72 },
          venue: { name: "Allianz Parque", city: "São Paulo" },
        },
        league: { id: 71, name: "Serie A", round: "Regular Season - 38" },
        teams: {
          home: { id: 102, name: "Palmeiras", logo: "https://media.api-sports.io/teams/102.png" },
          away: { id: 104, name: "Fluminense", logo: "https://media.api-sports.io/teams/104.png" },
        },
        goals: { home: 1, away: 1 },
      },
    ],
  };
}

async function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "football-serie-a-test-"));
  const testOutputPath = path.join(tmpDir, "footballSerieA.json");

  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Validação de Resposta de Classificação e Mapeamento
    // -------------------------------------------------------------------------
    console.log("[TESTE 1] Validação da resposta da API de classificação e mapeamento para StandingRow");
    const validStandingsData = createMockStandingsPayload();
    const validatedList = validateStandingsResponse(validStandingsData);
    assert.strictEqual(validatedList.length, 20, "Devem ser validados exatamente 20 clubes");

    const mappedRows = mapStandingsToStandingRows(validatedList);
    assert.strictEqual(mappedRows.length, 20);
    assert.strictEqual(mappedRows[0].club, "Botafogo");
    assert.strictEqual(mappedRows[0].position, 1);
    assert.strictEqual(mappedRows[0].zone, "libertadores_direta");
    assert.strictEqual(mappedRows[4].zone, "pre_libertadores");
    assert.strictEqual(mappedRows[8].zone, "sulamericana");
    assert.strictEqual(mappedRows[18].zone, "rebaixamento");

    // Verifica conversão do histórico (form): WWDLD -> ["V", "V", "E", "D", "E"]
    assert.deepStrictEqual(mappedRows[0].form, ["V", "V", "E", "D", "E"]);
    console.log("  [PASS] 1. Tabela com 20 clubes validada e zonas da CONMEBOL / Rebaixamento mapeadas.");
    console.log("  [PASS] 2. Histórico de partidas (W/D/L) convertido fielmente para o padrão brasileiro (V/E/D).");

    // -------------------------------------------------------------------------
    // TESTE 2: Validação de Partidas e Conversão para MatchScore
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 2] Validação das partidas e conversão para o formato MatchScore");
    const validFixturesData = createMockFixturesPayload();
    const validatedFixtures = validateFixturesResponse(validFixturesData);
    assert.strictEqual(validatedFixtures.length, 2);

    const mappedMatches = mapFixturesToMatches(validatedFixtures);
    assert.strictEqual(mappedMatches.length, 2);
    assert.strictEqual(mappedMatches[0].status, "encerrado");
    assert.strictEqual(mappedMatches[0].homeTeam.score, 2);
    assert.strictEqual(mappedMatches[0].awayTeam.score, 1);
    assert.strictEqual(mappedMatches[0].tournamentId, "brasileirao-a");
    assert.strictEqual(mappedMatches[0].venue, "Estádio Nilton Santos");

    assert.strictEqual(mappedMatches[1].status, "ao_vivo");
    assert.strictEqual(mappedMatches[1].minute, "72'");
    console.log("  [PASS] 1. Partidas mapeadas com status 'encerrado' e 'ao_vivo' cronometrado.");

    // -------------------------------------------------------------------------
    // TESTE 3: Execução Completa com Mock Fetch e Geração do JSON
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 3] Execução completa do pipeline e geração atômica do footballSerieA.json");
    const mockApiKey = "secret-test-key-abcdef-123456";

    const mockFetch = async (url, options) => {
      // Verifica se o header contém a chave e se não há vazamento na URL
      assert.strictEqual(options.headers["x-apisports-key"], mockApiKey);
      assert.ok(!url.includes(mockApiKey), "A chave de API NUNCA deve ser passada na URL");

      if (url.includes("/standings")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockStandingsPayload(),
        };
      }
      if (url.includes("/fixtures")) {
        return {
          ok: true,
          status: 200,
          json: async () => createMockFixturesPayload(),
        };
      }
      throw new Error(`Endpoint não esperado no mock: ${url}`);
    };

    const runResult = await updateFootballSerieAData({
      apiKey: mockApiKey,
      leagueId: 71,
      season: "2024",
      customFetch: mockFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(runResult.success, true);
    assert.ok(fs.existsSync(testOutputPath), "Arquivo JSON deve ter sido criado");

    const savedContent = fs.readFileSync(testOutputPath, "utf8");
    assert.ok(!savedContent.includes(mockApiKey), "Chave da API NUNCA deve estar contida no arquivo JSON gerado");

    const parsedSaved = JSON.parse(savedContent);
    assert.strictEqual(parsedSaved.isReal, true);
    assert.strictEqual(parsedSaved.leagueId, 71);
    assert.strictEqual(parsedSaved.standings.length, 20);
    assert.strictEqual(parsedSaved.matches.length, 2);
    console.log("  [PASS] 1. Dataset gerado com sucesso sem expor a chave de API.");

    // -------------------------------------------------------------------------
    // TESTE 4: Defesa Ativa e Preservação de Cache em Erro de Quota / Limite
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 4] Tratamento defensivo em caso de erro da API-Football (ex: limite de quota diária)");
    const mockQuotaErrorFetch = async (url) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          get: "standings",
          parameters: {},
          errors: {
            requests: "You have reached the request limit for the day",
          },
          results: 0,
          response: [],
        }),
      };
    };

    const quotaResult = await updateFootballSerieAData({
      apiKey: mockApiKey,
      leagueId: 71,
      season: "2024",
      customFetch: mockQuotaErrorFetch,
      outputPath: testOutputPath,
    });

    assert.strictEqual(quotaResult.success, false, "Deve reportar failure quando a API retorna erro de quota");
    assert.strictEqual(quotaResult.preserved, true, "Deve reportar preserved: true");

    // Verifica que o arquivo existente no disco NÃO foi corrompido ou sobrescrito
    const preservedContent = JSON.parse(fs.readFileSync(testOutputPath, "utf8"));
    assert.strictEqual(preservedContent.standings.length, 20, "Os 20 clubes do cache prévio devem estar preservados");
    console.log("  [PASS] 1. Erro de quota interceptado; dataset anterior preservado sem corrupção.");

    // -------------------------------------------------------------------------
    // TESTE 5: Defesa Ativa em Falha de Rede (Network Error / Offline)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 5] Tratamento defensivo em queda de conexão de rede");
    const mockNetworkFailFetch = async () => {
      throw new Error("fetch failed: ECONNRESET");
    };

    const networkResult = await updateFootballSerieAData({
      apiKey: mockApiKey,
      leagueId: 71,
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
      response: [
        {
          league: {
            id: 71,
            standings: [
              [
                { rank: 1, team: { name: "Botafogo" }, points: 50, all: { played: 20 } },
                { rank: 2, team: { name: "Palmeiras" }, points: 48, all: { played: 20 } },
              ],
            ],
          },
        },
      ],
    };

    assert.throws(
      () => validateStandingsResponse(truncatedPayload),
      /Classificação incompleta do Brasileirão Série A: esperado 20 clubes/
    );
    console.log("  [PASS] 1. Validador rejeita com segurança tabelas com menos de 20 equipes.");

    // -------------------------------------------------------------------------
    // TESTE 7: Rejeição de Execução sem Chave de API
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 7] Rejeição imediata quando a chave de API não está presente");
    await assert.rejects(
      async () => {
        await makeApiFootballRequest("status", "");
      },
      /Chave da API-Football não configurada/
    );
    console.log("  [PASS] 1. Rejeição com erro descritivo quando API_FOOTBALL_KEY não foi informada.");

    console.log("\n===========================================================================");
    console.log("TODOS OS 7 TESTES DA INTEGRAÇÃO DO BRASILEIRÃO SÉRIE A PASSARAM COM SUCESSO!");
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
