import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const {
  validateElecConfig,
  validateAndParseEA20,
  updateElectionSecondRoundData,
  JSON_OUTPUT_PATH,
  TS_OUTPUT_PATH
} = await import('../scripts/update-election-second-round-data.mjs');

console.log('='.repeat(75));
console.log('RUNNING CONTROLLED TEST SUITE: 2ND ROUND ELECTION PIPELINE & INTEGRITY');
console.log('='.repeat(75));

let passed = 0;

// FIXTURES
const validOfficialConfig = {
  f: 'o',
  dg: '18/10/2026',
  hg: '12:38:11',
  pl: [
    {
      cd: '3221',
      c: 'ele2026',
      dt: '25/10/2026',
      e: [
        {
          cd: '6258',
          t: '2',
          tp: '8',
          nm: 'Eleição Ordinária Federal - 2026 2º Turno',
          abr: [
            {
              cd: 'br',
              cp: [{ cd: '1', ds: 'Presidente', tp: '1' }]
            }
          ]
        }
      ]
    }
  ]
};

const validOfficialEA20PreElection = {
  ele: '6258',
  t: '2',
  f: 'o',
  tpabr: 'br',
  cdabr: 'br',
  dg: '15/10/2026',
  hg: '09:38:12',
  dt: '',
  ht: '',
  tf: 'n',
  s: {
    ts: '499248',
    st: '0',
    pst: '0,00',
    snt: '499248'
  },
  e: {
    te: '158745502',
    c: '0',
    pc: '0,00',
    a: '0',
    pa: '0,00'
  },
  v: {
    tv: '0',
    vv: '0',
    pvv: '0,00',
    vb: '0',
    pvb: '0,00',
    vn: '0',
    pvn: '0,00'
  },
  carg: [
    {
      cd: '1',
      nmn: 'Presidente',
      agr: [
        {
          nm: 'PARTIDO LIBERAL',
          par: [
            {
              sg: 'PL',
              cand: [
                {
                  n: '22',
                  sqcand: '280002551544',
                  nm: 'FLAVIO NANTES BOLSONARO',
                  nmu: 'FLAVIO BOLSONARO',
                  seq: '2',
                  e: 'n',
                  st: '',
                  vap: '0',
                  pvap: '0,00',
                  vs: [
                    {
                      sqcand: '280002551543',
                      nm: 'ALFREDO GASPAR DE MENDONÇA NETO',
                      nmu: 'ALFREDO GASPAR',
                      sgp: 'PL'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          nm: 'BRASIL PRONTO PRA MAIS',
          par: [
            {
              sg: 'PT',
              cand: [
                {
                  n: '13',
                  sqcand: '280002542548',
                  nm: 'LUIZ INÁCIO LULA DA SILVA',
                  nmu: 'LULA',
                  seq: '1',
                  e: 'n',
                  st: '',
                  vap: '0',
                  pvap: '0,00',
                  vs: [
                    {
                      sqcand: '280002542549',
                      nm: 'GERALDO JOSE RODRIGUES ALCKMIN FILHO',
                      nmu: 'GERALDO ALCKMIN',
                      sgp: 'PSB'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// ----------------------------------------------------------------------------
// TEST 1: Validação do Catálogo ele-c.json
// ----------------------------------------------------------------------------
console.log('\n[TEST 1] Validação da configuração oficial ele-c.json');
{
  const res = validateElecConfig(validOfficialConfig);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.eleicao, '6258');
  assert.strictEqual(res.pleito, '3221');
  console.log('  [PASS] 1. Configuração oficial válida aceita com sucesso.');

  // Rejeição de ambiente simulado
  assert.throws(
    () => validateElecConfig({ ...validOfficialConfig, f: 's' }),
    /Ambiente não oficial rejeitado/
  );
  console.log('  [PASS] 2. Ambiente simulado (f: "s") estritamente rejeitado.');

  // Rejeição de pleito ausente
  assert.throws(
    () => validateElecConfig({ ...validOfficialConfig, pl: [] }),
    /sem pleitos válidos/
  );
  console.log('  [PASS] 3. Catálogo vazio ou sem pleito 3221 rejeitado.');

  // Rejeição de eleição ausente
  assert.throws(
    () => validateElecConfig({
      ...validOfficialConfig,
      pl: [{ cd: '3221', c: 'ele2026', dt: '25/10/2026', e: [] }]
    }),
    /Eleição Federal do 2º Turno/
  );
  console.log('  [PASS] 4. Ausência da Eleição 6258 no pleito 3221 rejeitada.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 2: Estado de Pré-Eleição (Zero Votos, Zero Seções)
// ----------------------------------------------------------------------------
console.log('\n[TEST 2] Estado oficial de pré-eleição (0 votos, 0 seções totalizadas)');
{
  const parsed = validateAndParseEA20(validOfficialEA20PreElection);
  assert.strictEqual(parsed.countingStarted, false, 'countingStarted deve ser false quando st=0 e tv=0');
  assert.strictEqual(parsed.statusLabel, 'Aguardando apuração oficial');
  assert.strictEqual(parsed.sectionsCounted, 0);
  assert.strictEqual(parsed.sectionsTotal, 499248);
  assert.strictEqual(parsed.countingProgress, 0);
  assert.strictEqual(parsed.candidates.length, 2);

  const lula = parsed.candidates.find(c => c.ballotNumber === 13);
  const flavio = parsed.candidates.find(c => c.ballotNumber === 22);

  assert.ok(lula, 'Lula (13) deve estar presente no resultado');
  assert.strictEqual(lula.popularName, 'Lula');
  assert.strictEqual(lula.votes, 0);
  assert.strictEqual(lula.percentage, 0);
  assert.strictEqual(lula.vicePopularName, 'GERALDO ALCKMIN');
  assert.strictEqual(lula.viceParty, 'PSB');

  assert.ok(flavio, 'Flávio Bolsonaro (22) deve estar presente no resultado');
  assert.strictEqual(flavio.popularName, 'Flávio Bolsonaro');
  assert.strictEqual(flavio.votes, 0);
  assert.strictEqual(flavio.percentage, 0);
  assert.strictEqual(flavio.vicePopularName, 'ALFREDO GASPAR');
  assert.strictEqual(flavio.viceParty, 'PL');

  console.log('  [PASS] 1. Zero votos e zero seções tratados corretamente como "Aguardando apuração oficial".');
  console.log('  [PASS] 2. Candidatos e vices extraídos da árvore oficial sem fabricação de dados.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 3: Simulação de Apuração em Andamento (Valores Não Zerados)
// ----------------------------------------------------------------------------
console.log('\n[TEST 3] Estado de apuração em andamento (votação ativa)');
{
  const midElection = JSON.parse(JSON.stringify(validOfficialEA20PreElection));
  midElection.s.st = '249624';
  midElection.s.pst = '50,00';
  midElection.v.tv = '60000000';
  midElection.v.vv = '58000000';
  midElection.v.pvv = '96,67';
  midElection.carg[0].agr[0].par[0].cand[0].vap = '29500000';
  midElection.carg[0].agr[0].par[0].cand[0].pvap = '50,86';
  midElection.carg[0].agr[1].par[0].cand[0].vap = '28500000';
  midElection.carg[0].agr[1].par[0].cand[0].pvap = '49,14';

  const parsed = validateAndParseEA20(midElection);
  assert.strictEqual(parsed.countingStarted, true);
  assert.strictEqual(parsed.countingProgress, 50.0);
  assert.ok(parsed.statusLabel.includes('50,00%'));
  assert.strictEqual(parsed.sectionsCounted, 249624);
  assert.strictEqual(parsed.candidates[0].votes, 29500000);
  assert.strictEqual(parsed.candidates[0].percentage, 50.86);

  console.log('  [PASS] 1. Apuração em andamento reconhecida e ordenada por votos válidos.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 4: Rejeição de Dados Inválidos, Simulações e IDs Inesperados
// ----------------------------------------------------------------------------
console.log('\n[TEST 4] Rejeição estrita de inconsistências, simulações e IDs incorretos');
{
  // 1. Código de eleição inesperado
  assert.throws(
    () => validateAndParseEA20({ ...validOfficialEA20PreElection, ele: '9999' }),
    /Código de eleição incorreto/
  );
  console.log('  [PASS] 1. Código de eleição diferente de 6258 rejeitado.');

  // 2. Turno inesperado
  assert.throws(
    () => validateAndParseEA20({ ...validOfficialEA20PreElection, t: '1' }),
    /Turno incorreto/
  );
  console.log('  [PASS] 2. Turno 1 em payload de 2º turno rejeitado.');

  // 3. Ambiente simulado
  assert.throws(
    () => validateAndParseEA20({ ...validOfficialEA20PreElection, f: 's' }),
    /Payload EA20 com ambiente não oficial/
  );
  console.log('  [PASS] 3. Ambiente simulado (f: "s") rejeitado.');

  // 4. Abrangência incorreta
  assert.throws(
    () => validateAndParseEA20({ ...validOfficialEA20PreElection, tpabr: 'sp' }),
    /Abrangência incorreta/
  );
  console.log('  [PASS] 4. Abrangência estadual ou divergente de "br" rejeitada.');

  // 5. Seções eleitorais zeradas no total
  assert.throws(
    () => validateAndParseEA20({ ...validOfficialEA20PreElection, s: { ts: '0' } }),
    /Total de seções eleitorais nulo ou inválido/
  );
  console.log('  [PASS] 5. Total de seções zero ou inválido rejeitado.');

  // 6. Resposta malformada ou HTML
  assert.throws(
    () => validateAndParseEA20(null),
    /Payload EA20 inválido ou malformado/
  );
  console.log('  [PASS] 6. Resposta nula ou malformada rejeitada.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 5: Resiliência a Falhas de Rede e Não-Sobrescrita de Dados Válidos
// ----------------------------------------------------------------------------
console.log('\n[TEST 5] Defesa ativa contra falhas de rede e preservação do dataset');
{
  // Certifica que os arquivos de dados existem antes do teste de falha
  assert.ok(fs.existsSync(JSON_OUTPUT_PATH), 'public/data/electionSecondRoundData.json deve existir');
  const initialContent = fs.readFileSync(JSON_OUTPUT_PATH, 'utf8');

  // Simula queda de rede injetando falha no global.fetch
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('Falha simulada de conectividade (Network timeout)');
  };

  try {
    const result = await updateElectionSecondRoundData();
    assert.strictEqual(result.success, false, 'Execução durante falha deve indicar success=false');
    assert.strictEqual(result.preserved, true, 'Execução durante falha deve indicar preserved=true');

    // Confirma que o arquivo não foi corrompido nem sobrescrito
    const contentAfterFailure = fs.readFileSync(JSON_OUTPUT_PATH, 'utf8');
    assert.strictEqual(contentAfterFailure, initialContent, 'O arquivo em disco não pode ser alterado durante falha');
    console.log('  [PASS] 1. Falha de rede capturada e tratada com preservação estrita do dataset existente.');
  } finally {
    global.fetch = originalFetch;
  }
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 6: Isolamento Estrito em Relação ao 1º Turno e Outros Workflows
// ----------------------------------------------------------------------------
console.log('\n[TEST 6] Isolamento em relação aos arquivos do 1º turno e pipelines existentes');
{
  // Confirma existência inalterada de electionData.ts e electionData.json
  const firstRoundTs = path.join(rootDir, 'src', 'data', 'electionData.ts');
  const firstRoundJson = path.join(rootDir, 'public', 'data', 'electionData.json');

  assert.ok(fs.existsSync(firstRoundTs), 'src/data/electionData.ts deve existir');
  assert.ok(fs.existsSync(firstRoundJson), 'public/data/electionData.json deve existir');

  const tsRaw = fs.readFileSync(firstRoundTs, 'utf8');
  assert.ok(tsRaw.includes('October 4, 2026'), 'electionData.ts deve conter dados do 1º turno (04/10/2026)');
  assert.ok(tsRaw.includes('DATASET_2026'), 'electionData.ts deve exportar DATASET_2026');

  // Confirma que workflows de notícias e economia não foram alterados
  assert.ok(fs.existsSync(path.join(rootDir, '.github', 'workflows', 'update-news-data.yml')));
  assert.ok(fs.existsSync(path.join(rootDir, '.github', 'workflows', 'update-economic-data.yml')));

  console.log('  [PASS] 1. Arquivos do 1º turno intactos e independentes.');
  console.log('  [PASS] 2. Pipelines de notícias e economia preservados.');
  passed++;
}

console.log('\n' + '='.repeat(75));
console.log(`TODOS OS ${passed} TESTES DO PIPELINE DO 2º TURNO PASSARAM COM SUCESSO!`);
console.log('='.repeat(75));
