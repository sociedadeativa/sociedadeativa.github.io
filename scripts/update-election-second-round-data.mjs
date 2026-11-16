import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const JSON_OUTPUT_PATH = path.join(rootDir, 'public', 'data', 'electionSecondRoundData.json');
export const TS_OUTPUT_PATH = path.join(rootDir, 'src', 'data', 'electionSecondRoundData.ts');

const CANDIDATE_METADATA_MAP = {
  13: {
    color: '#DC2626',
    colorMuted: '#FCA5A5',
    photoUrl: '/assets/candidates/lula.jpg',
    photoAttribution: 'Foto Oficial da Presidência da República / Ricardo Stuckert / PR (CC BY 3.0 BR)',
    photoSourceUrl: 'https://www.gov.br/planalto',
    tseSourceUrl: 'https://divulgacandcontas.tse.jus.br',
    displayName: 'Lula'
  },
  22: {
    color: '#1D4ED8',
    colorMuted: '#93C5FD',
    photoUrl: '/assets/candidates/flavio.jpg',
    photoAttribution: 'Foto Oficial do Senado Federal / Agência Senado / Pedro França (CC BY 2.0)',
    photoSourceUrl: 'https://www.senado.leg.br',
    tseSourceUrl: 'https://divulgacandcontas.tse.jus.br',
    displayName: 'Flávio Bolsonaro'
  }
};

/**
 * Validação rigorosa do arquivo de catálogo geral ele-c.json do TSE.
 * Garante que o ambiente seja oficial ('o'), o ciclo ele2026,
 * o pleito 3221 (25/10/2026) e a eleição 6258 (2º turno federal presidencial).
 */
export function validateElecConfig(configJson) {
  if (!configJson || typeof configJson !== 'object') {
    throw new Error('Configuração ele-c.json inválida ou ausente.');
  }

  if (configJson.f !== 'o') {
    throw new Error(`Ambiente não oficial rejeitado: esperado 'o' (oficial), obtido '${configJson.f}'.`);
  }

  if (!Array.isArray(configJson.pl) || configJson.pl.length === 0) {
    throw new Error('Catálogo ele-c.json sem pleitos válidos registrados.');
  }

  const pleito2Turno = configJson.pl.find(
    (p) => p.cd === '3221' && p.c === 'ele2026' && p.dt === '25/10/2026'
  );

  if (!pleito2Turno) {
    throw new Error('Pleito do 2º Turno (cd: 3221, dt: 25/10/2026) não localizado no catálogo ele-c.json.');
  }

  const eleicaoPresidencial = pleito2Turno.e?.find(
    (e) => e.cd === '6258' && String(e.t) === '2' && String(e.tp) === '8'
  );

  if (!eleicaoPresidencial) {
    throw new Error('Eleição Federal do 2º Turno (cd: 6258, t: 2) não localizada no pleito 3221.');
  }

  const temAbrangenciaNacional = eleicaoPresidencial.abr?.some(
    (a) => a.cd === 'br' && a.cp?.some((c) => String(c.cd) === '1')
  );

  if (!temAbrangenciaNacional) {
    throw new Error('Abrangência nacional com cargo de Presidente (cd: 1) não confirmada no pleito.');
  }

  return {
    valid: true,
    pleito: pleito2Turno.cd,
    ciclo: pleito2Turno.c,
    eleicao: eleicaoPresidencial.cd,
    data: pleito2Turno.dt
  };
}

/**
 * Validação e parsing rigoroso do payload de resultado unificado EA20 (br-c0001-e006258-u.json).
 * Extrai candidatos, totalizações, seções e eleitorado sem dados fictícios.
 */
export function validateAndParseEA20(ea20Json) {
  if (!ea20Json || typeof ea20Json !== 'object') {
    throw new Error('Payload EA20 inválido ou malformado.');
  }

  if (ea20Json.f !== 'o') {
    throw new Error(`Payload EA20 com ambiente não oficial: '${ea20Json.f}'. Rejeitando dados simulados.`);
  }

  if (String(ea20Json.ele) !== '6258') {
    throw new Error(`Código de eleição incorreto no payload EA20: esperado '6258', obtido '${ea20Json.ele}'.`);
  }

  if (String(ea20Json.t) !== '2') {
    throw new Error(`Turno incorreto no payload EA20: esperado '2', obtido '${ea20Json.t}'.`);
  }

  if (ea20Json.tpabr !== 'br' || ea20Json.cdabr !== 'br') {
    throw new Error(`Abrangência incorreta no payload EA20: esperado 'br', obtido '${ea20Json.tpabr}/${ea20Json.cdabr}'.`);
  }

  const cargoPresidente = ea20Json.carg?.find((c) => String(c.cd) === '1');
  if (!cargoPresidente) {
    throw new Error('Cargo de Presidente da República (cd: 1) ausente no payload EA20.');
  }

  if (!Array.isArray(cargoPresidente.agr) || cargoPresidente.agr.length === 0) {
    throw new Error('Nenhum agrupamento partidário/candidato encontrado para Presidente.');
  }

  // Extrai seções e valida
  const sec = ea20Json.s || {};
  const sectionsTotal = parseInt(sec.ts || '0', 10);
  const sectionsCounted = parseInt(sec.st || '0', 10);
  const sectionsRemaining = parseInt(sec.snt || '0', 10);
  const countingProgress = parseFloat(String(sec.pst || '0,00').replace(',', '.')) || 0;

  if (sectionsTotal <= 0) {
    throw new Error('Total de seções eleitorais nulo ou inválido no payload EA20.');
  }

  // Extrai eleitorado
  const el = ea20Json.e || {};
  const electorateTotal = parseInt(el.te || '0', 10);
  const turnout = parseInt(el.c || '0', 10);
  const turnoutPercentage = parseFloat(String(el.pc || '0,00').replace(',', '.')) || 0;
  const abstention = parseInt(el.a || '0', 10);
  const abstentionPercentage = parseFloat(String(el.pa || '0,00').replace(',', '.')) || 0;

  if (electorateTotal <= 0) {
    throw new Error('Eleitorado total nulo ou inválido no payload EA20.');
  }

  // Extrai votos
  const v = ea20Json.v || {};
  const totalVotes = parseInt(v.tv || '0', 10);
  const validVotes = parseInt(v.vv || '0', 10);
  const validVotesPercentage = parseFloat(String(v.pvv || '0,00').replace(',', '.')) || 0;
  const blankVotes = parseInt(v.vb || '0', 10);
  const blankVotesPercentage = parseFloat(String(v.pvb || '0,00').replace(',', '.')) || 0;
  const nullVotes = parseInt(v.vn || '0', 10);
  const nullVotesPercentage = parseFloat(String(v.pvn || '0,00').replace(',', '.')) || 0;

  // Extrai candidatos diretamente da árvore oficial
  const candidates = [];
  for (const agr of cargoPresidente.agr) {
    const coalition = agr.nm || agr.com || '';
    for (const par of agr.par || []) {
      const party = par.sg || '';
      for (const cand of par.cand || []) {
        const ballotNumber = parseInt(cand.n, 10);
        const candidateId = String(cand.sqcand || ballotNumber);
        const name = cand.nm || '';
        const popularName = cand.nmu || name;
        const vice = cand.vs?.[0] || {};
        const seq = parseInt(cand.seq || '0', 10);
        const votes = parseInt(cand.vap || '0', 10);
        const percentage = parseFloat(String(cand.pvap || '0,00').replace(',', '.')) || 0;
        const elected = cand.e === 's';
        const situation = cand.st || '';

        const meta = CANDIDATE_METADATA_MAP[ballotNumber] || {
          color: '#475569',
          colorMuted: '#94A3B8',
          photoUrl: `/assets/candidates/cand_${ballotNumber}.jpg`,
          photoAttribution: 'Tribunal Superior Eleitoral (TSE)',
          photoSourceUrl: 'https://divulgacandcontas.tse.jus.br',
          tseSourceUrl: 'https://divulgacandcontas.tse.jus.br',
          displayName: popularName
        };

        candidates.push({
          ballotNumber,
          candidateId,
          name,
          popularName: meta.displayName || popularName,
          party,
          coalition,
          viceName: vice.nm || '',
          vicePopularName: vice.nmu || vice.nm || '',
          viceParty: vice.sgp || '',
          seq,
          votes,
          percentage,
          elected,
          situation,
          color: meta.color,
          colorMuted: meta.colorMuted,
          photoUrl: meta.photoUrl,
          photoAttribution: meta.photoAttribution,
          photoSourceUrl: meta.photoSourceUrl,
          tseSourceUrl: meta.tseSourceUrl
        });
      }
    }
  }

  // Ordenação de exibição:
  // Se apuração em andamento ou finalizada, ordena por percentual decrescente de votos válidos.
  // Se apuração não iniciada (0 votos), ordena pela sequência oficial do TSE (seq) ou número.
  const countingStarted = sectionsCounted > 0 || totalVotes > 0;
  if (countingStarted) {
    candidates.sort((a, b) => b.votes - a.votes);
  } else {
    candidates.sort((a, b) => a.seq - b.seq || a.ballotNumber - b.ballotNumber);
  }

  const isFinal = ea20Json.tf === 's' || countingProgress >= 100;

  let statusLabel = 'Aguardando apuração oficial';
  if (isFinal) {
    statusLabel = 'Totalização concluída';
  } else if (countingStarted) {
    statusLabel = `Apuração oficial em andamento (${countingProgress.toFixed(2).replace('.', ',')}%)`;
  }

  return {
    electionCode: '6258',
    round: 2,
    environment: ea20Json.f,
    scope: 'br',
    officeCode: '1',
    officeName: cargoPresidente.nmn || 'Presidente',
    generatedDate: ea20Json.dg || '',
    generatedTime: ea20Json.hg || '',
    totalizationDate: ea20Json.dt || '',
    totalizationTime: ea20Json.ht || '',
    isFinal,
    countingStarted,
    countingProgress,
    sectionsTotal,
    sectionsCounted,
    sectionsRemaining,
    electorateTotal,
    turnout,
    turnoutPercentage,
    abstention,
    abstentionPercentage,
    validVotes,
    validVotesPercentage,
    blankVotes,
    blankVotesPercentage,
    nullVotes,
    nullVotesPercentage,
    totalVotes,
    candidates,
    statusLabel,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Atualização oficial do 2º turno desativada.
 * Nenhuma chamada de API ao TSE é realizada e os arquivos consolidados existentes
 * (public/data/electionSecondRoundData.json e src/data/electionSecondRoundData.ts)
 * são preservados integralmente.
 */
export async function updateElectionSecondRoundData() {
  console.log('[Desativado] A atualização oficial de dados do 2º turno está desativada.');
  console.log('[Preservado] Os dados históricos e estruturais existentes foram mantidos sem alterações.');
  return {
    success: false,
    disabled: true,
    preserved: true,
    error: 'Update Official 2nd Round Election Data feature is disabled.'
  };
}

// Execução via CLI encerrada imediatamente sem chamadas externas ou sobrescrita
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await updateElectionSecondRoundData();
  process.exit(0);
}
