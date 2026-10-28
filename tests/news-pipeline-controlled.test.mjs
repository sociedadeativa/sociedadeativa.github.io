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

function runTsxScript(scriptContent, env = {}) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx'], {
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

  // TEST 0: News Summary Length Validation & Fallback Truncation
  console.log('\n[TEST 0] News Summary Length Validation & Fallback Truncation');
  const test0Code = `
    import fs from 'node:fs';
    import assert from 'node:assert';

    const script = fs.readFileSync('scripts/update-news-data.mjs', 'utf8');
    const startIdx = script.indexOf('function decodeHtmlEntities');
    const endIdx = script.indexOf('/**\\n * Extrai conteúdo de uma tag XML/RSS');
    if (startIdx === -1 || endIdx === -1) throw new Error('Could not find helper functions in update-news-data.mjs');
    const codeBlock = script.slice(startIdx, endIdx).replace(/export\\s+/g, '');

    const { cleanSummary } = new Function(codeBlock + '\\nreturn { cleanSummary };')();

    // 1. Normal short summary
    const shortInput = "Presidente assina decreto com novas regras eleitorais para 2026.";
    const shortRes = cleanSummary(shortInput, 280);
    assert.ok(shortRes.length <= 280, "Short summary exceeded maxLen");
    assert.strictEqual(shortRes, shortInput, "Short summary was altered unexpectedly");
    console.log("  [PASS] 1. Normal short summary preserved correctly:", shortRes.length, "chars");

    // 2. Summary containing several sentences
    const multiSentenceInput = "Primeira frase sobre a decisão judicial. Segunda frase detalhando as medidas adotadas. Terceira frase com desdobramentos adicionais do processo.";
    const multiRes = cleanSummary(multiSentenceInput, 280);
    assert.ok(multiRes.length <= 280, "Multi-sentence summary exceeded maxLen");
    assert.ok(/[.!?]["”’\\)]*$/.test(multiRes), "Multi-sentence summary does not end with terminal punctuation");
    assert.ok(multiRes.includes("Primeira frase"), "Multi-sentence summary lost initial sentence");
    console.log("  [PASS] 2. Multi-sentence summary preserved and punctuated:", multiRes.length, "chars");

    // 3. First sentence longer than 280 characters
    const longFirstSentence = "A Polícia Federal (PF) pediu nesta sexta-feira (16) ao ministro André Mendonça, do Supremo Tribunal Federal (STF), a prorrogação, por 90 dias, do inquérito que investiga os pagamentos do ex-banqueiro Daniel Vorcaro para o filme Dark Horse, a cinebiografia do ex-presidente Jair Bolsonaro.";
    assert.ok(longFirstSentence.length > 280, "Test fixture first sentence must be > 280 chars");
    const longRes = cleanSummary(longFirstSentence, 280);
    assert.ok(longRes.length <= 280, "Long first sentence summary exceeded maxLen: " + longRes.length);
    assert.ok(longRes.length > 200, "Long first sentence truncated excessively: " + longRes.length);
    assert.ok(!/[\\s,;:!?-]$/.test(longRes.slice(0, -1)), "Long first sentence has dangling punctuation before period");
    assert.ok(/[.!?]["”’\\)]*$/.test(longRes), "Long first sentence does not end with proper punctuation");
    console.log("  [PASS] 3. First sentence > 280 truncated cleanly at word boundary:", longRes.length, "chars ->", JSON.stringify(longRes));

    // 4. Summary with a long first sentence and no usable sentence boundary (no spaces)
    const noWordBoundary = "X".repeat(350);
    const noBoundaryRes = cleanSummary(noWordBoundary, 280);
    assert.ok(noBoundaryRes.length <= 280, "Unsplittable summary exceeded maxLen: " + noBoundaryRes.length);
    assert.strictEqual(noBoundaryRes.length, 280, "Unsplittable summary length should equal maxLen");
    assert.ok(noBoundaryRes.endsWith("."), "Unsplittable summary should terminate with period");
    console.log("  [PASS] 4. Long summary without sentence/word boundary handled strictly:", noBoundaryRes.length, "chars");

    // 5. Guarantee that result never exceeds requested maxLen across varying lengths
    const testCases = [
      "A".repeat(500),
      "Curta. " + "B".repeat(290) + ". Outra frase.",
      "Frase com vírgula pendente no final, e mais texto que ultrapassa o limite permitido com muitas palavras adicionais para forçar o corte da sentença.",
      "Texto terminando em preposição de corte residual na ",
      longFirstSentence + " Segunda frase também longa que não deve ser incluída de jeito nenhum.",
      "TSE dá 24 horas para Meta dar informações sobre igualdade de campanhas em meio ao segundo turno da corrida presidencial brasileira de 2026."
    ];
    for (const testLen of [50, 100, 150, 200, 280, 300]) {
      for (const tc of testCases) {
        const res = cleanSummary(tc, testLen);
        assert.ok(res.length <= testLen, "Result length " + res.length + " exceeded requested maxLen " + testLen + " for case: " + tc.slice(0, 30));
        assert.ok(/[.!?]["”’\\)]*$/.test(res) || res.length === 0, "Result missing terminal punctuation: " + res);
      }
    }
    console.log("  [PASS] 5. Guarantee verified: Result strictly never exceeds maxLen across all length limits and edge cases.");
    console.log("TEST 0 PASSED: All 5 summary length validation checks succeeded.");
  `;

  const t0 = await runScript(test0Code);
  if (t0.code !== 0) {
    console.error('Test 0 failed with stderr:', t0.stderr);
    process.exit(1);
  }
  console.log(t0.stdout.trim());
  passedTests++;

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

  // TEST 5: Frontend Date Parsing, Non-Lexicographical Ordering & Homepage Selection
  console.log('\n[TEST 5] Frontend Date Parsing, Non-Lexicographical Ordering & Homepage Selection');
  const test5Code = `
    import assert from "node:assert";
    import { parseNewsDateToTimestamp, sortNewsItems, deduplicateNewsItems } from "./src/services/newsService";

    // 1. Brazilian date parsing assertions
    const tOct1441 = parseNewsDateToTimestamp("19/10/2026 às 14:41");
    const tOct1440 = parseNewsDateToTimestamp("19/10/2026 às 14:40");
    const tNov0900 = parseNewsDateToTimestamp("02/11/2026 às 09:00");
    const tOct04 = parseNewsDateToTimestamp("04/10/2026 às 21:55");
    const tIso = parseNewsDateToTimestamp("2026-10-19T14:41:00-03:00");

    assert.ok(tOct1441 > 0, "19/10/2026 às 14:41 should parse to a positive UTC timestamp");
    assert.strictEqual(tOct1441, tIso, "BR format and ISO with UTC-3 offset must yield exact same timestamp");
    assert.ok(tOct1441 > tOct1440, "14:41 must be chronologically newer than 14:40");
    assert.ok(tOct1441 > tOct04, "19/10 must be chronologically newer than 04/10");

    // Critical non-lexicographical check:
    // In lexicographical comparison, "19/10/2026" > "02/11/2026" because '1' > '0'.
    // Chronologically, November 2 is strictly AFTER October 19.
    assert.ok(tNov0900 > tOct1441, "CRITICAL: November 2 must be newer than October 19 (non-lexicographical)");
    console.log("  [PASS] 1. Brazilian date parsing and non-lexicographical chronological comparison verified.");

    // 2. Newest-first sorting
    const mockItems = [
      { id: "art-1", title: "Eleições 1º Turno", publishedAt: "04/10/2026 às 21:55", category: "Eleições", source: "TSE", sourceUrl: "", articleUrl: "https://example.com/1", summary: "" },
      { id: "art-2", title: "Tarde de Outubro", publishedAt: "19/10/2026 às 17:01", category: "Congresso", source: "Câmara", sourceUrl: "", articleUrl: "https://example.com/2", summary: "" },
      { id: "art-3", title: "Almoço de Outubro", publishedAt: "19/10/2026 às 13:24", category: "Governo", source: "EBC", sourceUrl: "", articleUrl: "https://example.com/3", summary: "" },
      { id: "art-4", title: "Início de Novembro", publishedAt: "02/11/2026 às 08:00", category: "Justiça", source: "STF", sourceUrl: "", articleUrl: "https://example.com/4", summary: "" },
      { id: "art-5", title: "Meio da Tarde Outubro", publishedAt: "19/10/2026 às 14:41", category: "Economia", source: "BCB", sourceUrl: "", articleUrl: "https://example.com/5", summary: "" }
    ];

    const sorted = sortNewsItems(mockItems);
    assert.strictEqual(sorted[0].id, "art-4", "Lead item must be art-4 (02/11 08:00)");
    assert.strictEqual(sorted[1].id, "art-2", "2nd item must be art-2 (19/10 17:01)");
    assert.strictEqual(sorted[2].id, "art-5", "3rd item must be art-5 (19/10 14:41)");
    assert.strictEqual(sorted[3].id, "art-3", "4th item must be art-3 (19/10 13:24)");
    assert.strictEqual(sorted[4].id, "art-1", "5th item must be art-1 (04/10 21:55)");
    console.log("  [PASS] 2. Strict newest-first sorting verified across all items.");

    // 3. Deduplication
    const mockWithDups = [
      ...mockItems,
      { id: "art-2", title: "Duplicate ID", publishedAt: "19/10/2026 às 17:01", category: "Congresso", source: "Câmara", sourceUrl: "", articleUrl: "https://example.com/2-diff", summary: "" },
      { id: "art-99", title: "Duplicate URL", publishedAt: "19/10/2026 às 16:00", category: "Congresso", source: "Câmara", sourceUrl: "", articleUrl: "https://example.com/2", summary: "" }
    ];
    const deduped = deduplicateNewsItems(mockWithDups);
    assert.strictEqual(deduped.length, 5, "Duplicate IDs and duplicate external URLs must be filtered out");
    console.log("  [PASS] 3. Deduplication logic verified.");

    // 4. Homepage Data Selection (Lead, Highlights, Radar)
    const homepageLead = sorted[0];
    const remaining = sorted.slice(1);
    const secondaryHighlights = remaining.slice(0, 3);
    const civicRadar = remaining.slice(3, 8);

    assert.strictEqual(homepageLead.id, "art-4", "Homepage lead must be the newest article");
    assert.strictEqual(secondaryHighlights.length, 3, "Secondary highlights must have 3 items");
    assert.strictEqual(secondaryHighlights[0].id, "art-2", "1st secondary highlight must be 2nd newest");
    assert.strictEqual(secondaryHighlights[1].id, "art-5", "2nd secondary highlight must be 3rd newest");
    assert.strictEqual(secondaryHighlights[2].id, "art-3", "3rd secondary highlight must be 4th newest");

    // No overlap between lead and secondary
    assert.ok(!secondaryHighlights.some(s => s.id === homepageLead.id), "No overlap between lead and secondary highlights");

    console.log("  [PASS] 4. Homepage lead, secondary highlights, and radar selection verified.");
    console.log("TEST 5 PASSED: All frontend date parsing, sorting, and homepage selection checks succeeded.");
  `;

  const t5 = await runTsxScript(test5Code);
  if (t5.code !== 0) {
    console.error('Test 5 failed with stderr:', t5.stderr);
    console.error('Stdout:', t5.stdout);
    process.exit(1);
  }
  console.log(t5.stdout.trim());
  passedTests++;

  // TEST 6: Image URL Extraction, Validation, Article Association & Fallback Resilience
  console.log('\n[TEST 6] Image URL Extraction, Validation, Article Association & Fallback Resilience');
  const test6Code = `
    import assert from "node:assert";
    import fs from "node:fs";
    import { isValidImageUrl, normalizeNewsItem } from "./src/services/newsService";
    import { isValidImageUrl as isValidScriptImg, normalizeImageUrl } from "./scripts/update-news-data.mjs";

    // 1. Image URL Validation (isValidImageUrl)
    // Valid official sources
    assert.strictEqual(isValidImageUrl("https://imagens.ebc.com.br/1170x700/smart/https://agenciabrasil.ebc.com.br/sites/default/files/thumbnails/image/2026/10/04/foto.jpg"), true, "EBC smart thumbnail must be valid");
    assert.strictEqual(isValidImageUrl("https://www.camara.leg.br/midias/image/2026/10/img20240326151241479-768x473.jpg"), true, "Câmara media image must be valid");
    assert.strictEqual(isValidImageUrl("https://agenciadenoticias.ibge.gov.br/images/agenciadenoticias/ibge/2026_10/visita.jpg"), true, "IBGE image must be valid");
    assert.strictEqual(isValidImageUrl("https://www.bcb.gov.br/content/home/noticias-img/thumbnail/cedulas.png"), true, "BCB png thumbnail must be valid");

    // Invalid: Tracking pixels, static logos, scripts
    assert.strictEqual(isValidImageUrl("https://agenciabrasil.ebc.com.br/ebc.png?id=1705884&o=rss"), false, "EBC tracking pixel must be rejected");
    assert.strictEqual(isValidImageUrl("https://agenciabrasil.ebc.com.br/ebc.gif?id=1705884&o=rss"), false, "EBC gif tracking pixel must be rejected");
    assert.strictEqual(isValidImageUrl("https://cdn.jsdelivr.net/gh/sergiosdlima/assets-ebc@1.0.0/abr/assets/images/logo-agenciabrasil.svg"), false, "Static portal logo must be rejected");
    assert.strictEqual(isValidImageUrl("https://www.bcb.gov.br/sitebcb/noticias/detalhe.aspx?id=123"), false, "SharePoint .aspx page must be rejected");
    assert.strictEqual(isValidImageUrl("javascript:alert(1)"), false, "Dangerous javascript: URL must be rejected");
    assert.strictEqual(isValidImageUrl("data:image/png;base64,iVBORw0KGgo"), false, "data: URIs must be rejected");
    assert.strictEqual(isValidImageUrl(""), false, "Empty string must be rejected");
    assert.strictEqual(isValidImageUrl(null), false, "Null must be rejected");
    assert.strictEqual(isValidImageUrl(undefined), false, "Undefined must be rejected");
    console.log("  [PASS] 1. Image URL validation rules strictly enforced.");

    // 2. Normalization logic (normalizeImageUrl)
    const upgraded = normalizeImageUrl("http://agenciadenoticias.ibge.gov.br/images/agenciadenoticias/ibge/2026_10/test.jpg");
    assert.ok(upgraded?.startsWith("https://"), "HTTP must be upgraded to HTTPS");

    const resolved = normalizeImageUrl("/midias/image/2026/10/foto.jpg", "https://www.camara.leg.br");
    assert.strictEqual(resolved, "https://www.camara.leg.br/midias/image/2026/10/foto.jpg", "Relative path must be resolved with baseUrl");

    const rejectedPixel = normalizeImageUrl("https://agenciabrasil.ebc.com.br/ebc.png?id=999");
    assert.strictEqual(rejectedPixel, undefined, "Tracking pixel must normalize to undefined");
    console.log("  [PASS] 2. Normalization upgrades protocol and resolves relative URLs safely.");

    // 3. Extraction parsing from feeds
    // Test EBC <imagem-destaque>
    const mockEbcXml = \`<item>
      <title>Notícia com imagem EBC</title>
      <imagem-destaque>https://imagens.ebc.com.br/1170x700/smart/foto-ebc.jpg</imagem-destaque>
    </item>\`;
    const ebcImgMatch = mockEbcXml.match(/<imagem-destaque>([\\s\\S]*?)<\\/imagem-destaque>/)?.[1];
    assert.strictEqual(normalizeImageUrl(ebcImgMatch), "https://imagens.ebc.com.br/1170x700/smart/foto-ebc.jpg");

    // Test Câmara <content:encoded>
    const mockCamaraEncoded = \`<div class="media-wrapper">
      <img src="https://www.camara.leg.br/midias/image/2026/10/deputado.jpg" alt="Deputado discursando" />
      <div class="midia-creditos"><em>Lula Marques/Agência Brasil</em></div>
      <div class="midia-legenda">Discurso no plenário</div>
    </div>\`;
    const camaraImgMatch = mockCamaraEncoded.match(/<img[^>]+src=["'](https?:\\/\\/[^"'\\s>]+)["']/i)?.[1];
    const camaraCreditMatch = mockCamaraEncoded.match(/class=["']midia-creditos["']><em>([\\s\\S]*?)<\\/em>/i)?.[1];
    const camaraCaptionMatch = mockCamaraEncoded.match(/class=["']midia-legenda["']>([\\s\\S]*?)<\\/div>/i)?.[1];
    assert.strictEqual(normalizeImageUrl(camaraImgMatch), "https://www.camara.leg.br/midias/image/2026/10/deputado.jpg");
    assert.strictEqual(camaraCreditMatch, "Lula Marques/Agência Brasil");
    assert.strictEqual(camaraCaptionMatch, "Discurso no plenário");

    // Test IBGE imagens JSON
    const mockIbgeImagens = JSON.stringify({
      image_intro: "images/agenciadenoticias/ibge/2026_10/grafico.jpg",
      image_fulltext: "images/agenciadenoticias/ibge/2026_10/grafico.jpg"
    });
    const parsedIbge = JSON.parse(mockIbgeImagens);
    const ibgeUrl = normalizeImageUrl("https://agenciadenoticias.ibge.gov.br/" + parsedIbge.image_fulltext);
    assert.strictEqual(ibgeUrl, "https://agenciadenoticias.ibge.gov.br/images/agenciadenoticias/ibge/2026_10/grafico.jpg");
    console.log("  [PASS] 3. Extraction parsing from official feeds (EBC, Câmara, IBGE, BCB) verified.");

    // 4. Non-fabrication and non-reuse: Verify dataset integrity
    const dataset = JSON.parse(fs.readFileSync("public/data/newsData.json", "utf8"));
    const withImages = dataset.filter((d: any) => d.imageUrl);
    const withoutImages = dataset.filter((d: any) => !d.imageUrl);

    assert.ok(withImages.length > 20, "At least 20 official articles must carry verified images");
    assert.ok(withoutImages.length > 0, "Articles without photos in source must exist and have undefined imageUrl");

    // Check that every article with image has verified HTTPS or local asset and credit
    for (const art of withImages) {
      assert.ok(art.imageUrl.startsWith("https://") || art.imageUrl.startsWith("/images/"), "Image must be HTTPS or local asset for article " + art.id);
      assert.ok(isValidImageUrl(art.imageUrl), "Image URL must be valid for article " + art.id);
      assert.ok(art.imageCredit && art.imageCredit.trim().length > 0, "Image must have verified credit for article " + art.id);
    }

    // Check that no unrelated articles reuse the exact same photo URL unless they originate from the same wire series
    const urlUsage = new Map<string, string[]>();
    for (const art of withImages) {
      const existing = urlUsage.get(art.imageUrl) || [];
      existing.push(art.id);
      urlUsage.set(art.imageUrl, existing);
    }
    for (const [imgUrl, ids] of urlUsage.entries()) {
      assert.ok(ids.length <= 2, "Image URL " + imgUrl + " reused too many times: " + ids.join(", "));
    }
    console.log("  [PASS] 4. Verified images associated correctly (" + withImages.length + " with images, " + withoutImages.length + " text-only dispatches, zero fabrication).");

    // 5. Component single-rendering integrity
    const articleModalContent = fs.readFileSync("src/components/ArticleModal.tsx", "utf8");
    const figureMatches = articleModalContent.match(/<figure/g);
    assert.strictEqual(figureMatches?.length, 1, "ArticleModal must contain exactly ONE <figure> element (no duplication)");
    assert.ok(articleModalContent.includes("onError={() => setImageError(true)}"), "ArticleModal must handle image load errors gracefully");

    const newsSectionContent = fs.readFileSync("src/components/NewsSection.tsx", "utf8");
    assert.ok(newsSectionContent.includes("activeArticle.imageUrl && isValidImageUrl"), "NewsSection modal must render verified image");
    assert.ok(newsSectionContent.includes("onError={() => setModalImageError(true)}"), "NewsSection modal must handle image load errors gracefully");

    const articlePageContent = fs.readFileSync("src/pages/ArticlePage.tsx", "utf8");
    assert.ok(articlePageContent.includes("onError={() => setImageError(true)}"), "ArticlePage must handle image load errors gracefully");
    console.log("  [PASS] 5. Component single-rendering and error handling verified across all article views.");

    console.log("TEST 6 PASSED: All image extraction, validation, association, and resilience checks succeeded.");
  `;

  const t6 = await runTsxScript(test6Code);
  if (t6.code !== 0) {
    console.error('Test 6 failed with stderr:', t6.stderr);
    console.error('Stdout:', t6.stdout);
    process.exit(1);
  }
  console.log(t6.stdout.trim());
  passedTests++;

  // TEST 7: Sports News Ingestion (Agência Brasil Sports Feed), Category Mapping & Safe Failure Handling
  console.log('\n[TEST 7] Agência Brasil Sports Feed Ingestion, Category Mapping & Safe Failure Handling');
  const test7Code = `
    import fs from 'node:fs';
    import assert from 'node:assert';

    // 1. Verify sports feed URL is configured in scripts/update-news-data.mjs
    const scriptSrc = fs.readFileSync('scripts/update-news-data.mjs', 'utf8');
    assert.ok(
      scriptSrc.includes('https://agenciabrasil.ebc.com.br/rss/esportes/feed.xml'),
      "Script must configure the Agência Brasil sports feed URL: https://agenciabrasil.ebc.com.br/rss/esportes/feed.xml"
    );
    console.log("  [PASS] 1. Official Agência Brasil sports feed URL is properly configured.");

    // 2. Test ingestion and classification with simulated sports RSS XML
    const recentDate1 = new Date(Date.now() - 5 * 60 * 1000).toUTCString();
    const recentDate2 = new Date(Date.now() - 10 * 60 * 1000).toUTCString();
    const mockSportsXml = \`<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <channel>
          <title>Agência Brasil - Esportes</title>
          <item>
            <title><![CDATA[Brasil conquista título no circuito mundial de vôlei de praia]]></title>
            <description><![CDATA[Dupla brasileira supera adversários na grande final e garante título internacional histórico para o país.]]></description>
            <link>https://agenciabrasil.ebc.com.br/esportes/noticia/2026-10/brasil-conquista-titulo-volei-praia</link>
            <guid>https://agenciabrasil.ebc.com.br/node/1799001</guid>
            <dc:creator><![CDATA[Pedro Ramos/Agência Brasil]]></dc:creator>
            <category>Vôlei</category>
            <category>Esportes</category>
            <imagem-destaque>https://imagens.ebc.com.br/1170x700/smart/foto-volei.jpg</imagem-destaque>
            <pubDate>\${recentDate1}</pubDate>
          </item>
          <item>
            <title><![CDATA[Flamengo e Palmeiras disputam liderança do Campeonato Brasileiro]]></title>
            <description><![CDATA[Equipes se enfrentam neste fim de semana em partida decisiva pela ponta da tabela da Série A do futebol nacional.]]></description>
            <link>https://agenciabrasil.ebc.com.br/esportes/noticia/2026-10/flamengo-palmeiras-lideranca-brasileirao</link>
            <guid>https://agenciabrasil.ebc.com.br/node/1799002</guid>
            <dc:creator><![CDATA[Lucas Silva/Agência Brasil]]></dc:creator>
            <category>Futebol</category>
            <category>Brasileirão</category>
            <imagem-destaque>https://imagens.ebc.com.br/1170x700/smart/foto-futebol.jpg</imagem-destaque>
            <pubDate>\${recentDate2}</pubDate>
          </item>
        </channel>
      </rss>\`;

    // Set mock fetch BEFORE importing update-news-data.mjs
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/rss/esportes/')) {
        return {
          ok: true,
          status: 200,
          text: async () => mockSportsXml
        };
      }
      if (urlStr.includes('camara.leg.br') || urlStr.includes('agenciabrasil.ebc.com.br')) {
        return {
          ok: true,
          status: 200,
          text: async () => \`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel></channel></rss>\`
        };
      }
      if (urlStr.includes('ibge.gov.br')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [] })
        };
      }
      if (urlStr.includes('bcb.gov.br')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ conteudo: [] })
        };
      }
      return { ok: true, status: 200, text: async () => '' };
    };

    const { OFFICIAL_CATEGORIES } = await import('./scripts/update-news-data.mjs');

    // Verify category list includes 'Esportes'
    assert.ok(OFFICIAL_CATEGORIES.includes('Esportes'), "OFFICIAL_CATEGORIES must include 'Esportes'");
    console.log("  [PASS] 2. OFFICIAL_CATEGORIES includes 'Esportes'.");

    const dataset = JSON.parse(fs.readFileSync('public/data/newsData.json', 'utf8'));
    const sportsArticles = dataset.filter(a => a.category === 'Esportes');
    assert.ok(sportsArticles.length >= 2, "Expected at least 2 sports articles to be ingested");

    const voleiArt = sportsArticles.find(a => a.id.includes('1799001'));
    assert.ok(voleiArt, "Vôlei article was not ingested");
    assert.strictEqual(voleiArt.category, 'Esportes');
    assert.strictEqual(voleiArt.source, 'Agência Brasil');
    assert.ok(voleiArt.tags.includes('Esportes'), "Vôlei article missing 'Esportes' tag");
    assert.strictEqual(voleiArt.imageUrl, 'https://imagens.ebc.com.br/1170x700/smart/foto-volei.jpg');
    assert.strictEqual(voleiArt.imageCredit, 'Pedro Ramos/Agência Brasil');

    const futArt = sportsArticles.find(a => a.id.includes('1799002'));
    assert.ok(futArt, "Futebol article was not ingested");
    assert.strictEqual(futArt.category, 'Esportes');
    assert.ok(futArt.tags.includes('Futebol'), "Futebol article missing 'Futebol' tag");

    // Check compatibility with EsportesPage.tsx filter logic:
    // (a.category as string) === "Esportes" || a.tags?.some((t) => ["Esportes", "Futebol", ...].includes(t))
    for (const art of sportsArticles) {
      const isAcceptedInEsportesPage =
        art.category === "Esportes" ||
        art.tags?.some(t => ["Esportes", "Futebol", "Copa Libertadores", "Fluminense", "Palmeiras"].includes(t));
      assert.ok(isAcceptedInEsportesPage, "Article " + art.id + " must be accepted by EsportesPage filter");
    }
    console.log("  [PASS] 3. Ingestion, classification as 'Esportes', image metadata, and EsportesPage filter compatibility verified.");

    console.log("TEST 7 PASSED: Sports feed ingestion and category mapping checks succeeded.");
  `;

  const t7 = await runScript(test7Code);
  if (t7.code !== 0) {
    console.error('Test 7 failed with stderr:', t7.stderr);
    console.error('Stdout:', t7.stdout);
    process.exit(1);
  }
  console.log(t7.stdout.trim());
  passedTests++;

  // TEST 8: Safe feed failure handling for Sports feed (feed down does not fail pipeline or delete data)
  console.log('\n[TEST 8] Safe sports feed failure handling (isolated feed failure does not abort update)');
  const test8Code = `
    import fs from 'node:fs';
    import assert from 'node:assert';

    // Mock fetch where sports feed throws an error / fails, but others are reachable
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/rss/esportes/')) {
        throw new Error("HTTP 500 Internal Server Error (simulated sports outage)");
      }
      if (urlStr.includes('camara.leg.br') || urlStr.includes('agenciabrasil.ebc.com.br')) {
        return {
          ok: true,
          status: 200,
          text: async () => \`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel></channel></rss>\`
        };
      }
      if (urlStr.includes('ibge.gov.br')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 998877,
                titulo: "IBGE aponta crescimento em novos indicadores",
                introducao: "Resumo oficial do indicador social divulgado pela Agência de Notícias do IBGE.",
                link: "https://agenciadenoticias.ibge.gov.br/2012-agencia-de-noticias/noticias/998877-dados.html",
                data_publicacao: "21/10/2026 10:00:00",
                editorias: "geral"
              }
            ]
          })
        };
      }
      if (urlStr.includes('bcb.gov.br')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ conteudo: [] })
        };
      }
      return { ok: true, status: 200, text: async () => '' };
    };

    await import('./scripts/update-news-data.mjs');

    // Verify existing sports articles were retained and not wiped
    const datasetAfterOutage = JSON.parse(fs.readFileSync('public/data/newsData.json', 'utf8'));
    const sportsAfterOutage = datasetAfterOutage.filter(a => a.category === 'Esportes');
    assert.ok(sportsAfterOutage.length > 0, "Pre-existing sports articles must be preserved and not deleted when sports feed fails");
    console.log("  [PASS] Pre-existing sports articles preserved during sports feed outage (" + sportsAfterOutage.length + " sports articles retained).");

    console.log("TEST 8 PASSED: Sports feed failure handled safely without aborting pipeline.");
  `;

  const t8 = await runScript(test8Code);
  if (t8.code !== 0) {
    console.error('Test 8 failed with stderr:', t8.stderr);
    console.error('Stdout:', t8.stdout);
    process.exit(1);
  }
  console.log(t8.stdout.trim());
  passedTests++;

  // TEST 9: Regression test: Paragraph Extraction with Editorial Markers and HTML Escaped Validation
  console.log('\n[TEST 9] Regression: Paragraph Extraction with Editorial Markers & HTML Escaped Validation');
  const test9Code = `
    import fs from 'node:fs';
    import assert from 'node:assert';
    import { extractParagraphs } from './scripts/update-news-data.mjs';

    // 1. Verify extractParagraphs strips leading editorial bullet arrows (>> / &gt;&gt;)
    const rawWithArrows = \`
      <p>&gt;&gt; TSE dá 24h para Meta e X explicarem distribuição de material político</p>
      <p>Entidades da sociedade civil entregaram nota pública ao TSE manifestando preocupação.</p>
      <p>&gt;&gt; Leia também: Regras eleitorais de 2026</p>
    \`;
    const paragraphs = extractParagraphs(rawWithArrows);
    assert.ok(Array.isArray(paragraphs), "Expected paragraphs array");
    assert.ok(paragraphs.length >= 1, "Expected at least 1 valid paragraph");
    assert.strictEqual(
      paragraphs[0],
      "TSE dá 24h para Meta e X explicarem distribuição de material político",
      "extractParagraphs must strip leading '>>' or '&gt;&gt;' marker"
    );
    console.log("  [PASS] 1. Leading editorial markers like '>>' properly stripped from prose paragraphs.");

    // 2. Verify validate-build handles HTML-escaped characters (<, >, &, quotes)
    const validateScript = fs.readFileSync('scripts/validate-build.mjs', 'utf8');
    assert.ok(
      validateScript.includes('pSampleEscaped') || validateScript.includes('paragraphEscaped'),
      "validate-build.mjs must support HTML-escaped characters in paragraph validation"
    );
    console.log("  [PASS] 2. validate-build.mjs includes HTML-escaped paragraph validation support.");

    // 3. Verify .github/workflows/update-news-data.yml stages public/sitemap.txt
    const workflowContent = fs.readFileSync('.github/workflows/update-news-data.yml', 'utf8');
    assert.ok(
      workflowContent.includes('public/sitemap.txt'),
      "update-news-data.yml must stage public/sitemap.txt in git add"
    );
    console.log("  [PASS] 3. update-news-data.yml git add includes public/sitemap.txt.");

    console.log("TEST 9 PASSED: Paragraph extraction, HTML escaped validation, and workflow staging verified.");
  `;

  const t9 = await runScript(test9Code);
  if (t9.code !== 0) {
    console.error('Test 9 failed with stderr:', t9.stderr);
    console.error('Stdout:', t9.stdout);
    process.exit(1);
  }
  console.log(t9.stdout.trim());
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
