/**
 * Testes focados e offline do serviço de futebol do frontend (footballService)
 * Portal Sociedade Ativa — Cobertura Esportiva Oficial
 *
 * Valida:
 * 1. Validação estrita de integridade do payload do Brasileirão Série A (isReal, temporada, 20 clubes).
 * 2. Rejeição de datasets com isReal: false ou dados truncados/sintéticos.
 * 3. Formatação consistente no fuso horário oficial de Brasília (America/Sao_Paulo).
 * 4. Tratamento defensivo de ausência do arquivo (HTTP 404 / não inicializado) sem fabricar dados.
 * 5. Consumo 100% offline com mocks de fetch (0 chamadas reais de rede).
 */

import assert from "node:assert";
import {
  validateFootballSerieAPayload,
  formatBrazilDateTime,
  fetchFootballSerieAData,
  countLiveMatches,
  filterMatchesByStatus,
  filterMatchesByTournament,
  getAvailableRounds,
  getCurrentRound,
  sortMatchesForDisplay,
} from "../src/services/footballService.ts";

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: SERVIÇO FOOTBALL (FRONTEND / VALIDAÇÃO)");
console.log("===========================================================================\n");

const SAMPLE_TEAMS = [
  "Botafogo", "Palmeiras", "Flamengo", "Fortaleza", "Internacional",
  "São Paulo", "Corinthians", "Bahia", "Cruzeiro", "Vasco da Gama",
  "Vitória", "Atlético-MG", "Fluminense", "Grêmio", "Juventude",
  "Bragantino", "Athletico-PR", "Criciúma", "Atlético-GO", "Cuiabá"
];

function createValidPayload() {
  const standings = SAMPLE_TEAMS.map((club, idx) => ({
    position: idx + 1,
    club,
    points: 70 - idx * 2,
    played: 38,
    won: 20 - idx,
    drawn: 10,
    lost: 8 + idx,
    goalsFor: 50,
    goalsAgainst: 30,
    goalDiff: 20,
    percentage: "61.4%",
    form: ["V", "V", "E", "D", "V"],
    zone: idx < 4 ? "libertadores_direta" : idx < 6 ? "pre_libertadores" : idx < 12 ? "sulamericana" : idx >= 16 ? "rebaixamento" : "meio",
  }));

  const matches = [
    {
      id: "footballdata-1",
      tournamentId: "brasileirao-a",
      tournamentName: "Brasileirão Série A",
      phase: "38ª Rodada",
      status: "encerrado",
      homeTeam: { name: "Botafogo", shortName: "Botafogo", score: 2, initials: "BOT", color: "bg-slate-800 text-white" },
      awayTeam: { name: "São Paulo", shortName: "São Paulo", score: 1, initials: "SPA", color: "bg-slate-700 text-white" },
      date: "08/12/2024",
      time: "16:00",
      venue: "Estádio a definir",
      city: "Brasil",
      broadcast: "Transmissão Oficial",
      roundOrLeg: "38ª Rodada",
      disclaimer: "Dados Oficiais football-data.org",
    },
  ];

  return {
    competitionCode: "BSA",
    competitionId: 2013,
    leagueId: 2013,
    leagueName: "Brasileirão Série A",
    season: "2024",
    source: "football-data.org (v4 API)",
    isReal: true,
    lastUpdated: "2024-12-08T21:00:00.000Z",
    standings,
    matches,
  };
}

async function runTests() {
  // ---------------------------------------------------------------------------
  // TESTE 1: Validação de Payload Correto e Completo
  // ---------------------------------------------------------------------------
  console.log("[TESTE 1] Validação de payload íntegro com 20 clubes e metadados oficiais");
  const validData = createValidPayload();
  const validated = validateFootballSerieAPayload(validData);

  assert.strictEqual(validated.isReal, true);
  assert.strictEqual(validated.competitionCode, "BSA");
  assert.strictEqual(validated.season, "2024");
  assert.strictEqual(validated.standings.length, 20);
  assert.strictEqual(validated.matches.length, 1);
  console.log("  [PASS] 1. Payload válido aprovado com 20 clubes e metadados preservados.");

  // ---------------------------------------------------------------------------
  // TESTE 2: Rejeição de Datasets com isReal falso ou ausente
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 2] Rejeição estrita de datasets não-oficiais ou fictícios (isReal !== true)");
  const fakeData = { ...createValidPayload(), isReal: false };
  assert.throws(
    () => validateFootballSerieAPayload(fakeData),
    /Dataset rejeitado: flag 'isReal' ausente ou falso/
  );
  console.log("  [PASS] 1. Datasets com isReal: false são categoricamente rejeitados.");

  // ---------------------------------------------------------------------------
  // TESTE 3: Rejeição de Tabelas Incompletas (< 20 Clubes)
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 3] Rejeição de tabelas incompletas ou truncadas da Série A");
  const truncatedData = {
    ...createValidPayload(),
    standings: createValidPayload().standings.slice(0, 19),
  };
  assert.throws(
    () => validateFootballSerieAPayload(truncatedData),
    /Tabela de classificação incompleta: esperado 20 clubes da Série A/
  );
  console.log("  [PASS] 1. Tabelas com menos de 20 clubes causam erro explícito de integridade.");

  // ---------------------------------------------------------------------------
  // TESTE 4: Rejeição de Timestamp Inválido ou Temporada Ausente
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 4] Validação de temporada e timestamp de atualização");
  assert.throws(
    () => validateFootballSerieAPayload({ ...createValidPayload(), season: "" }),
    /campo 'season' ausente ou vazio/
  );
  assert.throws(
    () => validateFootballSerieAPayload({ ...createValidPayload(), lastUpdated: "data-invalida" }),
    /'lastUpdated' não contém um timestamp ISO válido/
  );
  console.log("  [PASS] 1. Temporada vazia e timestamps malformados são rejeitados.");

  // ---------------------------------------------------------------------------
  // TESTE 5: Formatação de Horário no Fuso de Brasília (America/Sao_Paulo)
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 5] Conversão consistente de data/hora no Horário Oficial de Brasília");
  // 21:00 UTC no fuso UTC-3 (Brasília) corresponde a 18:00
  const formatted = formatBrazilDateTime("2024-12-08T21:00:00.000Z");
  assert.ok(formatted.includes("08/12/2024"), "Deve conter a data no formato pt-BR");
  assert.ok(formatted.includes("18:00"), "21:00 UTC deve ser convertido para 18:00 no horário de Brasília");
  assert.ok(formatted.includes("Horário de Brasília"));

  assert.strictEqual(formatBrazilDateTime(""), "Data não informada");
  assert.strictEqual(formatBrazilDateTime("invalido"), "Data não informada");
  console.log("  [PASS] 1. Timestamps convertidos fielmente para o fuso horário de Brasília.");

  // ---------------------------------------------------------------------------
  // TESTE 6: Comportamento Defensivo quando Dataset Está Ausente (HTTP 404)
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 6] Tratamento de arquivo ausente (HTTP 404 / pré-primeira execução)");
  const mock404Fetch = async () => ({
    ok: false,
    status: 404,
    statusText: "Not Found",
  });

  await assert.rejects(
    async () => fetchFootballSerieAData(mock404Fetch),
    /Dataset oficial do Brasileirão Série A ainda não foi gerado no servidor/
  );
  console.log("  [PASS] 1. Ausência do arquivo JSON gera erro descritivo sem recorrer a dados fabricados.");

  // ---------------------------------------------------------------------------
  // TESTE 7: Carregamento com Sucesso via Mock Fetch
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 7] Carregamento bem-sucedido e resolução de dados oficiais");
  const mockSuccessFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => createValidPayload(),
  });

  const result = await fetchFootballSerieAData(mockSuccessFetch);
  assert.strictEqual(result.isReal, true);
  assert.strictEqual(result.standings.length, 20);
  assert.strictEqual(result.matches[0].homeTeam.name, "Botafogo");
  console.log("  [PASS] 1. Fetch de dados oficiais resolvido com sucesso.");

  // ---------------------------------------------------------------------------
  // TESTE 8: Derivação de Contagem Ao Vivo Exclusivamente por Status Oficial
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 8] Contagem de partidas ao vivo derivada exclusivamente do status 'ao_vivo'");
  const sampleMatches = [
    { id: "m1", tournamentId: "brasileirao-a", status: "encerrado", phase: "31ª Rodada", roundOrLeg: "31ª Rodada" },
    { id: "m2", tournamentId: "brasileirao-a", status: "encerrado", phase: "31ª Rodada", roundOrLeg: "31ª Rodada" },
    { id: "m3", tournamentId: "brasileirao-a", status: "agendado", phase: "32ª Rodada", roundOrLeg: "32ª Rodada" },
    { id: "m4", tournamentId: "brasileirao-a", status: "ao_vivo", phase: "31ª Rodada", roundOrLeg: "31ª Rodada" },
    { id: "m5", tournamentId: "libertadores", status: "ao_vivo", phase: "Semifinal", roundOrLeg: "Ida" },
  ];

  // Partidas sem ao vivo
  const noLiveMatches = sampleMatches.filter((m) => m.status !== "ao_vivo");
  assert.strictEqual(countLiveMatches(noLiveMatches), 0, "Partidas encerradas ou agendadas nunca devem incrementar contagem ao vivo");

  // Partidas com ao vivo
  assert.strictEqual(countLiveMatches(sampleMatches), 2, "Apenas partidas com status 'ao_vivo' devem ser computadas");
  console.log("  [PASS] 1. Partidas encerradas e agendadas não incrementam contagem ao vivo; somente status oficial 'ao_vivo' é contabilizado.");

  // ---------------------------------------------------------------------------
  // TESTE 9: Escopo Contextual de Jogos Ao Vivo por Torneio (Série A sem falsos positivos)
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 9] Escopo contextual de jogos ao vivo por torneio selecionado");
  const mixedMatches = [
    { id: "sa-1", tournamentId: "brasileirao-a", status: "encerrado", phase: "31ª Rodada", roundOrLeg: "31ª Rodada" },
    { id: "sa-2", tournamentId: "brasileirao-a", status: "agendado", phase: "32ª Rodada", roundOrLeg: "32ª Rodada" },
    { id: "lib-1", tournamentId: "libertadores", status: "ao_vivo", phase: "Semifinal", roundOrLeg: "Ida" },
    { id: "cdb-1", tournamentId: "copa-do-brasil", status: "ao_vivo", phase: "Semifinal", roundOrLeg: "Volta" },
  ];

  const serieAMatchesOnly = filterMatchesByTournament(mixedMatches, "brasileirao-a");
  assert.strictEqual(serieAMatchesOnly.length, 2);
  assert.strictEqual(countLiveMatches(serieAMatchesOnly), 0, "Série A deve ter 0 jogos ao vivo quando todos forem encerrados ou agendados");

  const allTournamentLive = countLiveMatches(mixedMatches);
  assert.strictEqual(allTournamentLive, 2, "Em 'todos', a contagem total de ao vivo deve incluir os torneios participantes");
  console.log("  [PASS] 1. Brasileirão Série A não exibe contagem de ao vivo originada de outras competições.");

  // ---------------------------------------------------------------------------
  // TESTE 10: Isolamento Estrito dos Filtros de Status (ao_vivo, encerrado, proximos)
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 10] Isolamento rigoroso dos filtros de status de partidas");
  const testPool = [
    { id: "1", status: "ao_vivo" },
    { id: "2", status: "encerrado" },
    { id: "3", status: "encerrado" },
    { id: "4", status: "agendado" },
    { id: "5", status: "hoje" },
    { id: "6", status: "amanha" },
  ];

  const liveOnly = filterMatchesByStatus(testPool, "ao_vivo");
  assert.strictEqual(liveOnly.length, 1);
  assert.ok(liveOnly.every((m) => m.status === "ao_vivo"));

  const finishedOnly = filterMatchesByStatus(testPool, "encerrado");
  assert.strictEqual(finishedOnly.length, 2);
  assert.ok(finishedOnly.every((m) => m.status === "encerrado"));

  const upcomingOnly = filterMatchesByStatus(testPool, "proximos");
  assert.strictEqual(upcomingOnly.length, 3);
  assert.ok(upcomingOnly.every((m) => m.status === "agendado" || m.status === "hoje" || m.status === "amanha"));

  const allFiltered = filterMatchesByStatus(testPool, "todos");
  assert.strictEqual(allFiltered.length, 6);
  console.log("  [PASS] 1. Cada filtro de status retorna unicamente as partidas correspondentes ao seu estado.");

  // ---------------------------------------------------------------------------
  // TESTE 11: Mapeamento de Rodadas e Determinação da Rodada Atual a Partir dos Dados
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 11] Mapeamento de rodadas e sincronização com jogos disputados da tabela");
  const multiRoundMatches = [
    { id: "r1-1", phase: "1ª Rodada", roundOrLeg: "1ª Rodada", status: "encerrado" },
    { id: "r1-2", phase: "1ª Rodada", roundOrLeg: "1ª Rodada", status: "encerrado" },
    { id: "r31-1", phase: "31ª Rodada", roundOrLeg: "31ª Rodada", status: "encerrado" },
    { id: "r31-2", phase: "31ª Rodada", roundOrLeg: "31ª Rodada", status: "encerrado" },
    { id: "r32-1", phase: "32ª Rodada", roundOrLeg: "32ª Rodada", status: "agendado" },
    { id: "r32-2", phase: "32ª Rodada", roundOrLeg: "32ª Rodada", status: "agendado" },
  ];

  const rounds = getAvailableRounds(multiRoundMatches);
  assert.deepStrictEqual(rounds, ["1ª Rodada", "31ª Rodada", "32ª Rodada"]);

  // Com tabela indicando 31 jogos disputados
  const mockStandings31 = [{ club: "Flamengo", played: 31 }, { club: "Palmeiras", played: 31 }];
  const currentRound = getCurrentRound(multiRoundMatches, mockStandings31);
  assert.strictEqual(currentRound, "31ª Rodada", "Quando a tabela indica 31 jogos disputados, a rodada atual deve ser '31ª Rodada', e não '1ª Rodada'");

  // Ordenação com prioridade para jogos ao vivo
  const unsorted = [
    { id: "fin", status: "encerrado" },
    { id: "live", status: "ao_vivo" },
    { id: "sched", status: "agendado" },
  ];
  const sorted = sortMatchesForDisplay(unsorted);
  assert.strictEqual(sorted[0].id, "live", "Partida ao vivo deve ter prioridade máxima de exibição");
  assert.strictEqual(sorted[1].id, "sched", "Partida agendada deve anteceder partidas encerradas");
  assert.strictEqual(sorted[2].id, "fin", "Partida encerrada deve vir após as partidas em andamento/agendadas");
  console.log("  [PASS] 1. Rodadas mapeadas com fidelidade à API; rodada atual sincronizada com 31 jogos disputados.");

  console.log("\n===========================================================================");
  console.log("TODOS OS 11 TESTES DO SERVIÇO FOOTBALL DO FRONTEND PASSARAM COM SUCESSO!");
  console.log("===========================================================================");
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES:", err);
  process.exit(1);
});

