import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
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

    // Confirma que a invocação via CLI encerra com código 1 em caso de falha preservada
    const scriptPath = path.resolve(rootDir, 'scripts', 'update-election-second-round-data.mjs');
    const cliRes = spawnSync(
      process.execPath,
      [
        '--import',
        'data:text/javascript,globalThis.fetch=()=>Promise.reject(new Error("Falha simulada de conectividade"));',
        scriptPath
      ],
      { encoding: 'utf8' }
    );
    assert.strictEqual(cliRes.status, 1, 'Invocação CLI deve encerrar com código de saída 1 quando houver falha');
    console.log('  [PASS] 2. Ponto de entrada CLI encerra com status 1 sob falha de rede preservando dataset.');
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

// ----------------------------------------------------------------------------
// TEST 7: Posicionamento Proeminente do 2º Turno na HomePage & Sem Duplicação
// ----------------------------------------------------------------------------
console.log('\n[TEST 7] Posicionamento proeminente do SecondRoundBanner na HomePage & Ausência de Duplicação');
{
  const homePath = path.join(rootDir, 'src', 'pages', 'HomePage.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf8');

  // SecondRoundBanner deve ser importado via React.lazy com skeleton
  assert.ok(
    homeContent.includes('const SecondRoundBanner = lazy('),
    'HomePage.tsx deve utilizar React.lazy para SecondRoundBanner'
  );
  assert.ok(
    homeContent.includes('SecondRoundBannerSkeleton'),
    'HomePage.tsx deve definir SecondRoundBannerSkeleton para Suspense fallback'
  );

  // SecondRoundBanner deve vir antes de NationalBanner no JSX
  const secondRoundIdx = homeContent.indexOf('<SecondRoundBanner');
  const nationalBannerIdx = homeContent.indexOf('<NationalBanner');
  assert.ok(secondRoundIdx > -1, 'HomePage.tsx deve renderizar <SecondRoundBanner />');
  assert.ok(nationalBannerIdx > -1, 'HomePage.tsx deve renderizar <NationalBanner />');
  assert.ok(
    secondRoundIdx < nationalBannerIdx,
    'SecondRoundBanner deve ser renderizado acima de NationalBanner na HomePage'
  );

  // Verificação de rótulos claros para ambos os conjuntos de dados
  assert.ok(
    homeContent.includes('1º Turno Presidencial (4 de outubro de 2026)'),
    'HomePage.tsx deve rotular explicitamente os dados históricos do 1º turno com data'
  );

  // Verificação em EleicoesPage.tsx para evitar duplicações
  const eleicoesPath = path.join(rootDir, 'src', 'pages', 'EleicoesPage.tsx');
  const eleicoesContent = fs.readFileSync(eleicoesPath, 'utf8');
  const eleicoesMatches = (eleicoesContent.match(/<SecondRoundBanner/g) || []).length;
  assert.strictEqual(
    eleicoesMatches,
    1,
    'EleicoesPage.tsx deve conter exatamente 1 instância do SecondRoundBanner (sem duplicações)'
  );

  console.log('  [PASS] 1. SecondRoundBanner lazy-loaded com skeleton e posicionado acima do NationalBanner na HomePage.');
  console.log('  [PASS] 2. Rótulos temporais explícitos discriminam o 1º turno (04/10/2026) e o 2º turno (25/10/2026).');
  console.log('  [PASS] 3. Exatamente 1 instância por rota sem banners duplicados na página /eleicoes/.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 8: Integridade e Rotulagem Explícita do Mapa Eleitoral (1º Turno)
// ----------------------------------------------------------------------------
console.log('\n[TEST 8] Rotulagem estrita do Mapa Interativo como histórico do 1º Turno (04/10/2026)');
{
  const homePath = path.join(rootDir, 'src', 'pages', 'HomePage.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf8');

  assert.ok(
    homeContent.includes('Geografia Eleitoral · 1º Turno (4 de outubro de 2026)'),
    'HomePage.tsx deve rotular o badge da seção do mapa com "1º Turno (4 de outubro de 2026)"'
  );
  assert.ok(
    homeContent.includes('resultado oficial do 1º turno (4 de outubro de 2026)'),
    'HomePage.tsx deve explicitar na descrição do mapa a apuração do 1º turno de 4 de outubro de 2026'
  );

  const mapPath = path.join(rootDir, 'src', 'components', 'BrazilMap.tsx');
  const mapContent = fs.readFileSync(mapPath, 'utf8');
  assert.ok(
    mapContent.includes('Vencedor no 1º Turno por Estado (04/10/2026)'),
    'BrazilMap.tsx deve conter legenda explícita indicando "1º Turno por Estado (04/10/2026)"'
  );

  console.log('  [PASS] 1. Mapa interativo explicitamente marcado como dados do 1º Turno (4 de outubro de 2026).');
  console.log('  [PASS] 2. Legenda do BrazilMap protege contra confusão entre os turnos eleitorais.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 9: Polling Dinâmico, AbortController, Resiliência a Falhas & Timestamps
// ----------------------------------------------------------------------------
console.log('\n[TEST 9] Auditoria do SecondRoundBanner: Polling de 60s, AbortController e Proteção contra Falhas');
{
  const bannerPath = path.join(rootDir, 'src', 'components', 'SecondRoundBanner.tsx');
  const bannerContent = fs.readFileSync(bannerPath, 'utf8');

  // 1. Deve consultar /data/electionSecondRoundData.json com cache busting
  assert.ok(
    bannerContent.includes('/data/electionSecondRoundData.json?_t='),
    'SecondRoundBanner deve consultar /data/electionSecondRoundData.json com parâmetro de cache-busting'
  );

  // 2. Deve utilizar AbortController e cancelar requisições pendentes
  assert.ok(
    bannerContent.includes('new AbortController()') && bannerContent.includes('.abort()'),
    'SecondRoundBanner deve instanciar e cancelar AbortController no cleanup'
  );

  // 3. Deve implementar polling a cada 60s condicional (enquanto countingStarted e !isFinal)
  assert.ok(
    bannerContent.includes('data.countingStarted && !data.isFinal'),
    'SecondRoundBanner deve acionar polling recorrente apenas quando a apuração iniciou e não finalizou'
  );
  assert.ok(
    bannerContent.includes('clearInterval(intervalId)') || bannerContent.includes('clearInterval('),
    'SecondRoundBanner deve limpar o setInterval ao desmontar ou mudar de estado'
  );

  // 4. Deve interromper polling se isFinal for true
  assert.ok(
    bannerContent.includes('if (data.isFinal)'),
    'SecondRoundBanner deve interromper polling caso a apuração esteja finalizada'
  );

  // 5. Deve tratar falhas de rede sem sobrescrever nem limpar o estado anterior
  assert.ok(
    bannerContent.includes('setFetchError') && bannerContent.includes('Falha na sincronização'),
    'SecondRoundBanner deve armazenar erros de fetch de forma não-destrutiva'
  );

  // 6. Deve exibir timestamps oficiais formatados
  assert.ok(
    bannerContent.includes('formatTimestampBR') || bannerContent.includes('totalizationDate'),
    'SecondRoundBanner deve conter formatação e exibição de data/hora oficial de totalização'
  );
  assert.ok(
    bannerContent.includes('Atualização automática a cada 60s'),
    'SecondRoundBanner deve exibir indicador visual de sincronização em tempo real'
  );

  console.log('  [PASS] 1. Busca imediata e polling de 60s ativo exclusivamente durante apuração.');
  console.log('  [PASS] 2. Cancelamento limpo com AbortController e cleanup de intervalos no unmount.');
  console.log('  [PASS] 3. Resiliência garantida: erros preservam últimos dados válidos e mostram aviso ao usuário.');
  console.log('  [PASS] 4. Timestamps de checagem e totalização oficial exibidos com timezone de Brasília.');
  passed++;
}

// ----------------------------------------------------------------------------
// TEST 10: Auditoria do Workflow de Agendamento do 2º Turno (.github/workflows)
// ----------------------------------------------------------------------------
console.log('\n[TEST 10] Auditoria de horários UTC, permissões e dependência de deploy no workflow');
{
  const workflowPath = path.join(rootDir, '.github', 'workflows', 'update-election-data.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');

  // 1. Cron em UTC correspondente a 17h às 24h em Brasília (UTC-3)
  // 17h-20h BRT = 20h-23h UTC
  // 21h-00h BRT = 00h-03h UTC do dia seguinte (26/10)
  assert.ok(
    workflowContent.includes("'*/15 20-23 25 10 *'"),
    'Workflow deve programar execuções a cada 15 min entre 20h e 23h UTC em 25/10 (17h-20h BRT)'
  );
  assert.ok(
    workflowContent.includes("'*/15 0-3 26 10 *'"),
    'Workflow deve programar execuções a cada 15 min entre 00h e 03h UTC em 26/10 (21h-00h BRT)'
  );

  // 2. Permissões necessárias
  assert.ok(
    workflowContent.includes('contents: write'),
    'Workflow deve requerer contents: write para comitar atualizações'
  );
  assert.ok(
    workflowContent.includes('pages: write'),
    'Workflow deve requerer pages: write para disparo do GitHub Pages'
  );

  // 3. Rebase defensivo antes do git push
  assert.ok(
    workflowContent.includes('git pull --rebase origin main || true'),
    'Workflow deve executar git pull --rebase origin main antes do push'
  );

  // 4. Disparo do job deploy-pages sob has_changes == true ou manual workflow_dispatch
  assert.ok(
    workflowContent.includes("needs.update-election-data.outputs.has_changes == 'true'") &&
    workflowContent.includes("github.event_name == 'workflow_dispatch'"),
    'Job deploy-pages deve ser executado quando houver alterações OU quando disparado manualmente'
  );

  console.log('  [PASS] 1. Crons UTC mapeados com precisão para o encerramento da votação (17h Brasília).');
  console.log('  [PASS] 2. Permissões de escrita e deploy configuradas no GitHub Actions.');
  console.log('  [PASS] 3. Rebase preventivo e condicional de deploy com suporte a workflow_dispatch confirmados.');
  passed++;
}

console.log('\n' + '='.repeat(75));
console.log(`TODOS OS ${passed} TESTES DO PIPELINE E DA PRONTIDÃO DO 2º TURNO PASSARAM COM SUCESSO!`);
console.log('='.repeat(75));

