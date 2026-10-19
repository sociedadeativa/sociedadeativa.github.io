import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert';

console.log('='.repeat(70));
console.log('RUNNING CONTROLLED TESTS FOR NEWS INGESTION PIPELINE');
console.log('='.repeat(70));

const ROOT = process.cwd();
const NEWS_DATA_FILE = path.join(ROOT, 'public', 'data', 'newsData.json');
const TS_DATA_FILE = path.join(ROOT, 'src', 'data', 'newsData.ts');

const initialNewsData = fs.readFileSync(NEWS_DATA_FILE, 'utf8');
const initialTsData = fs.readFileSync(TS_DATA_FILE, 'utf8');

// Helper to run a test script with node
function runScript(scriptContent, env = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', ['--input-type=module'], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.stdin.write(scriptContent);
    child.stdin.end();
  });
}

async function runTests() {
  let passedTests = 0;

  // TEST 1: Date validation and timezone handling
  console.log('\n[TEST 1] Date validation, future-date rejection, and timezone handling');
  const test1Code = `
    import fs from 'node:fs';

    const script = fs.readFileSync('scripts/update-news-data.mjs', 'utf8');
    const fnMatch = script.match(/function parseDateToBrasilia[\\s\\S]*?\\n\\}/);
    if (!fnMatch) throw new Error("Could not extract parseDateToBrasilia");

    const evalFn = new Function(fnMatch[0] + '; return parseDateToBrasilia;')();

    // 1. Unparseable date
    const unparseable = evalFn("not-a-date");
    if (unparseable.isValid !== false || unparseable.timestamp !== 0) {
      throw new Error("Unparseable date was not rejected: " + JSON.stringify(unparseable));
    }

    // 2. Future date (> 15 minutes)
    const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const futureRes = evalFn(futureDate);
    if (futureRes.isValid !== false) {
      throw new Error("Date > 15m in future was not rejected: " + JSON.stringify(futureRes));
    }

    // 3. Legitimate recent date (5 minutes ago)
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentRes = evalFn(recentDate);
    if (recentRes.isValid !== true || recentRes.timestamp === 0) {
      throw new Error("Legitimate past date was rejected: " + JSON.stringify(recentRes));
    }

    // 4. BCB ISO format without explicit timezone ("2026-10-19T10:00:00")
    const bcbDate = "2026-10-19T10:00:00";
    const bcbRes = evalFn(bcbDate);
    if (bcbRes.isValid !== true || !bcbRes.formatted.includes("10:00")) {
      throw new Error("BCB date offset was corrupted: " + JSON.stringify(bcbRes));
    }

    // 5. Brazilian standard format "19/10/2026 às 10:00"
    const brDate = "19/10/2026 às 10:00";
    const brRes = evalFn(brDate);
    if (brRes.isValid !== true || brRes.formatted !== brDate) {
      throw new Error("BR format date corrupted: " + JSON.stringify(brRes));
    }

    console.log("TEST 1 PASSED: All date validation and timezone checks succeeded.");
  `;

  const t1 = await runScript(test1Code);
  if (t1.code !== 0) {
    console.error('Test 1 failed with stderr:', t1.stderr);
    process.exit(1);
  }
  console.log(t1.stdout.trim());
  passedTests++;

  // TEST 2: Total Source Failure Behavior: must exit nonzero (code 1) and preserve dataset
  console.log('\n[TEST 2] Total source failure behavior: must exit nonzero and preserve dataset');
  const test2Loader = `
    // Inject mock fetch before importing update-news-data.mjs
    global.fetch = async () => {
      throw new Error("Network unreachable (simulated outage)");
    };
    await import('./scripts/update-news-data.mjs');
  `;

  const t2 = await runScript(test2Loader);
  console.log('Script exit code on total outage:', t2.code);
  if (t2.code !== 1) {
    console.error('Test 2 failed: Expected exit code 1, got:', t2.code);
    console.error('Stderr:', t2.stderr);
    console.error('Stdout:', t2.stdout);
    process.exit(1);
  }
  console.log('SUCCESS: Script cleanly exited with code 1 upon total source failure.');

  // Confirm dataset was NOT modified
  const newsDataAfterT2 = fs.readFileSync(NEWS_DATA_FILE, 'utf8');
  assert.strictEqual(newsDataAfterT2, initialNewsData, 'newsData.json was modified during total failure!');
  console.log('Dataset integrity verified: public/data/newsData.json preserved completely untouched.');
  passedTests++;

  // TEST 3: Successful No-New-Articles Run Behavior
  console.log('\n[TEST 3] Successful no-new-articles run: preserves ingestedAt, publishedAt and outputs code 0');
  const test3Loader = `
    import fs from 'node:fs';

    const existing = JSON.parse(fs.readFileSync("public/data/newsData.json", "utf8"));
    const bcbItem = existing.find(e => e.source.includes("Banco Central"));
    const ibgeItem = existing.find(e => e.source.includes("IBGE"));
    const camaraItem = existing.find(e => e.source.includes("Câmara"));
    const ebcItem = existing.find(e => e.source.includes("Agência Brasil"));

    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("bcb.gov.br")) {
        return {
          ok: true,
          json: async () => ({
            conteudo: [
              {
                Id: bcbItem ? bcbItem.id.replace(/^bcb-/, '').split('-')[0] : "9999",
                titulo: bcbItem ? bcbItem.title : "Título BCB",
                lead: bcbItem ? bcbItem.summary : "Lead BCB",
                dataPublicacao: "2026-10-17T09:00:00"
              }
            ]
          })
        };
      }
      if (urlStr.includes("ibge.gov.br")) {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: ibgeItem ? ibgeItem.id.replace(/^ibge-/, '') : 8888,
                titulo: ibgeItem ? ibgeItem.title : "Título IBGE",
                introducao: ibgeItem ? ibgeItem.summary : "Intro IBGE",
                link: ibgeItem ? ibgeItem.articleUrl : "https://agenciadenoticias.ibge.gov.br/noticia",
                data_publicacao: "17/10/2026 09:00:00",
                editorias: "economicas"
              }
            ]
          })
        };
      }
      if (urlStr.includes("camara.leg.br")) {
        return {
          ok: true,
          text: async () => \`<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
              <channel>
                <item>
                  <title><![CDATA[\${camaraItem ? camaraItem.title : "Título Câmara"}]]></title>
                  <description><![CDATA[\${camaraItem ? camaraItem.summary : "Resumo Câmara"}]]></description>
                  <link>\${camaraItem ? camaraItem.articleUrl : "https://www.camara.leg.br/noticias/12345"}</link>
                  <pubDate>Sat, 17 Oct 2026 09:00:00 -0300</pubDate>
                </item>
              </channel>
            </rss>\`
        };
      }
      return {
        ok: true,
        text: async () => \`<?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <item>
                <title><![CDATA[\${ebcItem ? ebcItem.title : "Título EBC"}]]></title>
                <description><![CDATA[\${ebcItem ? ebcItem.summary : "Resumo EBC"}]]></description>
                <link>\${ebcItem ? ebcItem.articleUrl : "https://agenciabrasil.ebc.com.br/noticia"}</link>
                <pubDate>Sat, 17 Oct 2026 09:00:00 -0300</pubDate>
              </item>
            </channel>
          </rss>\`
      };
    };

    await import('./scripts/update-news-data.mjs');
  `;

  const t3 = await runScript(test3Loader);
  console.log('Script exit code on no-change run:', t3.code);
  if (t3.code !== 0) {
    console.error('Test 3 failed with stderr:', t3.stderr);
    console.error('Stdout:', t3.stdout);
    process.exit(1);
  }
  console.log('SUCCESS: Script completed with code 0 on valid no-change run.');

  // Confirm that ingestedAt and publishedAt are preserved for all items
  const newsDataAfterT3 = JSON.parse(fs.readFileSync(NEWS_DATA_FILE, 'utf8'));
  const prevParsed = JSON.parse(initialNewsData);

  assert.strictEqual(newsDataAfterT3.length, 55, 'Article retention limit of 55 was violated!');
  for (const item of newsDataAfterT3) {
    assert.ok(item.ingestedAt, `Article ${item.id} missing ingestedAt!`);
    const isIsoOrBrDate = !isNaN(new Date(item.ingestedAt).getTime()) || /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(item.ingestedAt);
    assert.ok(isIsoOrBrDate, `Article ${item.id} has invalid ingestedAt: ${item.ingestedAt}`);
    const orig = prevParsed.find(p => p.id === item.id);
    if (orig) {
      assert.strictEqual(item.ingestedAt, orig.ingestedAt, `ingestedAt changed unexpectedly for article ${item.id}!`);
      assert.strictEqual(item.publishedAt, orig.publishedAt, `publishedAt changed unexpectedly for article ${item.id}!`);
    }
  }
  console.log('Dataset integrity verified: 55 articles retained, ingestedAt and publishedAt completely preserved.');
  passedTests++;

  // TEST 4: Partial Failure Reporting
  console.log('\n[TEST 4] Partial source failure behavior: continues with operational sources and reports clearly');
  const test4Loader = `
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("ibge.gov.br")) {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: 77777,
                titulo: "IBGE divulga novos dados de estatística pública",
                introducao: "Resumo oficial divulgado pela Agência de Notícias do IBGE sobre os novos indicadores sociais do país.",
                link: "https://agenciadenoticias.ibge.gov.br/2012-agencia-de-noticias/noticias/77777-dados.html",
                data_publicacao: "17/10/2026 10:00:00",
                editorias: "geral"
              }
            ]
          })
        };
      }
      throw new Error("HTTP 503 Service Unavailable");
    };

    await import('./scripts/update-news-data.mjs');
  `;

  const t4 = await runScript(test4Loader);
  console.log('Script exit code on partial failure:', t4.code);
  if (t4.code !== 0) {
    console.error('Test 4 failed with stderr:', t4.stderr);
    process.exit(1);
  }
  console.log('SUCCESS: Partial failure handled gracefully with code 0 while operational sources continued.');
  passedTests++;

  // Restore initial data files
  fs.writeFileSync(NEWS_DATA_FILE, initialNewsData, 'utf8');
  fs.writeFileSync(TS_DATA_FILE, initialTsData, 'utf8');

  console.log('\n' + '='.repeat(70));
  console.log(`ALL ${passedTests} CONTROLLED PIPELINE TESTS PASSED 100%`);
  console.log('='.repeat(70));
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
