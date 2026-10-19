import fs from 'node:fs';

const requiredHtmlFiles = [
  'dist/index.html',
  'dist/politica/index.html',
  'dist/eleicoes/index.html',
  'dist/economia/index.html',
  'dist/estados/index.html',
  'dist/dados-publicos/index.html',
  'dist/noticias/index.html',
  'dist/esportes/index.html',
  'dist/clima/index.html',
  'dist/sobre/index.html',
  'dist/404.html',
];

for (const filePath of requiredHtmlFiles) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${filePath} does not exist in build output!`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('/src/') || content.includes('main.tsx')) {
    console.error(`ERROR: ${filePath} contains uncompiled development references (/src/ or main.tsx)!`);
    process.exit(1);
  }

  if (filePath === 'dist/index.html' && !content.includes('./assets/')) {
    console.warn(`WARNING: ${filePath} does not contain ./assets/ references.`);
  }
}

// Verifica e valida todas as imagens oficiais dos candidatos no build
const requiredCandidateImages = [
  'dist/assets/candidates/flavio.jpg',
  'dist/assets/candidates/lula.jpg',
  'dist/assets/candidates/cury.jpg',
  'dist/assets/candidates/santos.jpg',
  'dist/assets/candidates/caiado.jpg',
  'dist/assets/candidates/zema.jpg',
];

for (const imgPath of requiredCandidateImages) {
  if (!fs.existsSync(imgPath)) {
    console.error(`ERROR: Imagem oficial do candidato ausente no build: ${imgPath}`);
    process.exit(1);
  }
  const stat = fs.statSync(imgPath);
  if (stat.size < 1000) {
    console.error(`ERROR: Imagem ${imgPath} está corrompida ou vazia (tamanho: ${stat.size} bytes)`);
    process.exit(1);
  }
}

// Verifica integridade dos arquivos JSON de dados
const requiredDataFiles = [
  'dist/data/marketData.json',
  'dist/data/economyData.json',
  'dist/data/electionData.json',
  'dist/data/newsData.json',
];

for (const dataFile of requiredDataFiles) {
  if (!fs.existsSync(dataFile)) {
    console.error(`ERROR: Arquivo de dados ${dataFile} não foi encontrado no build!`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);

    // Validação específica para o arquivo de notícias
    if (dataFile === 'dist/data/newsData.json') {
      if (!Array.isArray(parsed) || parsed.length < 10) {
        console.error(`ERROR: dist/data/newsData.json possui menos de 10 artigos (${parsed?.length || 0})!`);
        process.exit(1);
      }
      const seenDatasetIds = new Set();
      const seenDatasetUrls = new Set();
      for (const item of parsed) {
        if (!item.id || !item.title || !item.summary || !item.source || !item.articleUrl || !item.publishedAt || !item.category) {
          console.error('ERROR: Artigo com campos obrigatórios ausentes em dist/data/newsData.json:', item);
          process.exit(1);
        }
        if (!item.articleUrl.startsWith('https://')) {
          console.error('ERROR: URL de notícia não é HTTPS em dist/data/newsData.json:', item.articleUrl);
          process.exit(1);
        }
        if (!/^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(item.publishedAt)) {
          console.error(`ERROR: Data inválida "${item.publishedAt}" no artigo ${item.id} (esperado DD/MM/AAAA às HH:mm)!`);
          process.exit(1);
        }
        if (/<[^>]+>/.test(item.title) || /<[^>]+>/.test(item.summary)) {
          console.error(`ERROR: Tags HTML detectadas no título ou resumo do artigo ${item.id}!`);
          process.exit(1);
        }
        if (seenDatasetIds.has(item.id)) {
          console.error(`ERROR: ID duplicado em dist/data/newsData.json: ${item.id}`);
          process.exit(1);
        }
        seenDatasetIds.add(item.id);

        if (!item.source.includes('Sociedade Ativa')) {
          if (seenDatasetUrls.has(item.articleUrl)) {
            console.error(`ERROR: URL canônica duplicada em dist/data/newsData.json: ${item.articleUrl}`);
            process.exit(1);
          }
          seenDatasetUrls.add(item.articleUrl);
        }

        // Validação de integridade de imagens e créditos
        if (item.imageUrl) {
          if (!item.imageUrl.startsWith('https://')) {
            console.error(`ERROR: Imagem não é HTTPS no artigo ${item.id}: ${item.imageUrl}`);
            process.exit(1);
          }
          if (!item.imageCredit || !item.imageCredit.trim()) {
            console.error(`ERROR: Imagem sem crédito/atribuição comprovada no artigo ${item.id}!`);
            process.exit(1);
          }
        }

        if (item.ingestedAt && !/^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(item.ingestedAt)) {
          console.error(`ERROR: Data de ingestão inválida "${item.ingestedAt}" no artigo ${item.id} (esperado DD/MM/AAAA às HH:mm)!`);
          process.exit(1);
        }
      }

      // Validação estrita de sincronização entre public/data/newsData.json e src/data/newsData.ts
      if (fs.existsSync('src/data/newsData.ts')) {
        const tsContent = fs.readFileSync('src/data/newsData.ts', 'utf8');
        const match = tsContent.match(/export const OFFICIAL_NEWS_ARTICLES: NewsItem\[\] = (\[[\s\S]*\]);/);
        if (!match) {
          console.error('ERROR: src/data/newsData.ts não exporta OFFICIAL_NEWS_ARTICLES em formato válido!');
          process.exit(1);
        }
        const tsArticles = JSON.parse(match[1]);
        if (tsArticles.length !== parsed.length) {
          console.error(`ERROR: Assincronia entre dataset JSON (${parsed.length}) e TypeScript (${tsArticles.length})!`);
          process.exit(1);
        }
        for (let i = 0; i < parsed.length; i++) {
          if (parsed[i].id !== tsArticles[i].id) {
            console.error(`ERROR: Divergência de ID no índice ${i}: JSON="${parsed[i].id}" vs TS="${tsArticles[i].id}"`);
            process.exit(1);
          }
          if (parsed[i].publishedAt !== tsArticles[i].publishedAt) {
            console.error(`ERROR: Divergência de publishedAt no artigo ${parsed[i].id}!`);
            process.exit(1);
          }
        }
        console.log(`Paridade comprovada entre newsData.json e newsData.ts: ${parsed.length} artigos sincronizados.`);
      }
    }
  } catch (err) {
    console.error(`ERROR: Arquivo de dados ${dataFile} contém JSON inválido:`, err.message);
    process.exit(1);
  }
}

// Replica pastas data/ e assets/candidates/ nos subdiretórios para garantir 200 OK em qualquer tipo de requisição relativa
const subdirs = ['politica', 'eleicoes', 'economia', 'estados', 'dados-publicos', 'noticias', 'esportes', 'clima', 'sobre'];
for (const sub of subdirs) {
  // Replicar data/
  const subDataDir = `dist/${sub}/data`;
  if (!fs.existsSync(subDataDir)) {
    fs.mkdirSync(subDataDir, { recursive: true });
  }
  const dataItems = fs.readdirSync('dist/data');
  for (const item of dataItems) {
    fs.copyFileSync(`dist/data/${item}`, `${subDataDir}/${item}`);
  }

  // Replicar assets/candidates/
  const subCandDir = `dist/${sub}/assets/candidates`;
  if (!fs.existsSync(subCandDir)) {
    fs.mkdirSync(subCandDir, { recursive: true });
  }
  for (const img of requiredCandidateImages) {
    const filename = img.split('/').pop();
    fs.copyFileSync(img, `${subCandDir}/${filename}`);
  }
}

// Verifica integridade do .nojekyll, sitemap e robots.txt
if (!fs.existsSync('dist/.nojekyll')) {
  if (fs.existsSync('.nojekyll')) {
    fs.copyFileSync('.nojekyll', 'dist/.nojekyll');
  } else {
    fs.writeFileSync('dist/.nojekyll', '');
  }
}
if (!fs.existsSync('dist/sitemap.xml')) {
  console.error('ERROR: dist/sitemap.xml does not exist!');
  process.exit(1);
}
if (!fs.existsSync('public/sitemap.xml')) {
  console.error('ERROR: public/sitemap.xml does not exist!');
  process.exit(1);
}
if (!fs.existsSync('dist/robots.txt')) {
  console.error('ERROR: dist/robots.txt does not exist!');
  process.exit(1);
}
if (!fs.existsSync('public/robots.txt')) {
  console.error('ERROR: public/robots.txt does not exist!');
  process.exit(1);
}

const distRobots = fs.readFileSync('dist/robots.txt', 'utf8');
const publicRobots = fs.readFileSync('public/robots.txt', 'utf8');
const expectedSitemapDirective = 'Sitemap: https://sociedadeativa.github.io/sitemap.xml';

if (!distRobots.includes(expectedSitemapDirective)) {
  console.error(`ERROR: dist/robots.txt não aponta para o sitemap correto (${expectedSitemapDirective})!`);
  process.exit(1);
}
if (!publicRobots.includes(expectedSitemapDirective)) {
  console.error(`ERROR: public/robots.txt não aponta para o sitemap correto (${expectedSitemapDirective})!`);
  process.exit(1);
}

const sitemapContent = fs.readFileSync('dist/sitemap.xml', 'utf8');
const publicSitemapContent = fs.readFileSync('public/sitemap.xml', 'utf8');

if (!sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  console.error('ERROR: dist/sitemap.xml deve iniciar com a declaração UTF-8 padrão!');
  process.exit(1);
}
if (!publicSitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  console.error('ERROR: public/sitemap.xml deve iniciar com a declaração UTF-8 padrão!');
  process.exit(1);
}

if (!sitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  console.error('ERROR: dist/sitemap.xml deve utilizar o namespace oficial do sitemap.org!');
  process.exit(1);
}
if (!publicSitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  console.error('ERROR: public/sitemap.xml deve utilizar o namespace oficial do sitemap.org!');
  process.exit(1);
}

if (sitemapContent.includes('<changefreq>') || sitemapContent.includes('<priority>')) {
  console.error('ERROR: dist/sitemap.xml não deve conter <changefreq> ou <priority>!');
  process.exit(1);
}

const canonicalPages = [
  'https://sociedadeativa.github.io/',
  'https://sociedadeativa.github.io/politica/',
  'https://sociedadeativa.github.io/eleicoes/',
  'https://sociedadeativa.github.io/economia/',
  'https://sociedadeativa.github.io/estados/',
  'https://sociedadeativa.github.io/dados-publicos/',
  'https://sociedadeativa.github.io/noticias/',
  'https://sociedadeativa.github.io/esportes/',
  'https://sociedadeativa.github.io/clima/',
  'https://sociedadeativa.github.io/sobre/',
];

for (const pageUrl of canonicalPages) {
  if (!sitemapContent.includes(`<loc>${pageUrl}</loc>`)) {
    console.error(`ERROR: sitemap.xml ausente da URL canônica: ${pageUrl}`);
    process.exit(1);
  }
}

// Descobre todas as páginas de notícias geradas em dist/noticias/[id]/index.html
const generatedArticleDirs = fs.existsSync('dist/noticias')
  ? fs.readdirSync('dist/noticias').filter((item) => {
      return (
        item !== 'index.html' &&
        fs.statSync(`dist/noticias/${item}`).isDirectory() &&
        fs.existsSync(`dist/noticias/${item}/index.html`)
      );
    })
  : [];

// Verifica que todas as páginas de artigos geradas constam no sitemap.xml
for (const articleId of generatedArticleDirs) {
  const articleUrl = `https://sociedadeativa.github.io/noticias/${articleId}/`;
  if (!sitemapContent.includes(`<loc>${articleUrl}</loc>`)) {
    console.error(`ERROR: sitemap.xml ausente da URL de notícia gerada: ${articleUrl}`);
    process.exit(1);
  }
}

// Valida a contagem total de URLs no sitemap contra as seções canônicas e artigos gerados
const expectedTotalUrls = canonicalPages.length + generatedArticleDirs.length;
const urlBlocks = sitemapContent.match(/<url>[\s\S]*?<\/url>/g) || [];
const publicUrlBlocks = publicSitemapContent.match(/<url>[\s\S]*?<\/url>/g) || [];

if (urlBlocks.length !== expectedTotalUrls) {
  console.error(`ERROR: dist/sitemap.xml possui ${urlBlocks.length} URLs, esperado ${expectedTotalUrls} (${canonicalPages.length} seções canônicas + ${generatedArticleDirs.length} artigos gerados)!`);
  process.exit(1);
}

if (publicUrlBlocks.length !== expectedTotalUrls) {
  console.error(`ERROR: public/sitemap.xml possui ${publicUrlBlocks.length} URLs, esperado ${expectedTotalUrls} para paridade com dist/sitemap.xml!`);
  process.exit(1);
}

// Verifica unicidade, integridade de protocolo/domínio, existência do arquivo físico e formato de lastmod
const sitemapLocs = new Set();
for (const block of urlBlocks) {
  const locMatch = block.match(/<loc>(https:\/\/sociedadeativa\.github\.io\/[^<]*)<\/loc>/);
  if (!locMatch) {
    console.error(`ERROR: Bloco <url> no sitemap sem tag <loc> válida ou fora do domínio HTTPS esperado: ${block}`);
    process.exit(1);
  }
  const loc = locMatch[1];
  if (sitemapLocs.has(loc)) {
    console.error(`ERROR: URL duplicada encontrada no sitemap: ${loc}`);
    process.exit(1);
  }
  sitemapLocs.add(loc);

  // Garante que a URL corresponde a uma página efetivamente gerada em dist/
  const sub = loc.replace('https://sociedadeativa.github.io/', '').replace(/\/$/, '');
  const targetFile = sub ? `dist/${sub}/index.html` : 'dist/index.html';
  if (!fs.existsSync(targetFile)) {
    console.error(`ERROR: URL no sitemap (${loc}) não corresponde a um arquivo gerado no build (${targetFile})!`);
    process.exit(1);
  }

  // Validação de lastmod quando presente
  const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
  if (lastmodMatch) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmodMatch[1])) {
      console.error(`ERROR: <lastmod> "${lastmodMatch[1]}" para ${loc} não está no formato YYYY-MM-DD!`);
      process.exit(1);
    }
  }
}

console.log(`Validação do sitemap.xml aprovada: ${urlBlocks.length} URLs conferidas (${canonicalPages.length} seções canônicas + ${generatedArticleDirs.length} páginas de notícias geradas).`);

// Auditoria de SEO nos 9 arquivos HTML gerados
for (const filePath of requiredHtmlFiles) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  // 1. Título obrigatório e não vazio
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch || !titleMatch[1].trim()) {
    console.error(`ERROR: ${filePath} não possui tag <title> válida!`);
    process.exit(1);
  }

  // 2. Meta description obrigatória
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    console.error(`ERROR: ${filePath} não possui <meta name="description"> preenchida!`);
    process.exit(1);
  }

  // 3. Verificação do Google Search Console nas páginas indexáveis
  if (filePath !== 'dist/404.html') {
    if (!html.includes('oZPS6sfWTE5EJAuLOsZCtq9UoF1lh4wMhD9Jz13OTSs')) {
      console.error(`ERROR: ${filePath} ausente da tag google-site-verification!`);
      process.exit(1);
    }
    const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](https:\/\/sociedadeativa\.github\.io\/[^"']*)["']/i);
    if (!canonMatch) {
      console.error(`ERROR: ${filePath} não possui link canônico válido!`);
      process.exit(1);
    }
  }

  // 4. Verificação da Google Tag (GA4: G-FVHPGPZTSL) e prevenção de duplicações
  if (!html.includes('https://www.googletagmanager.com/gtag/js?id=G-FVHPGPZTSL') || !html.includes("gtag('config', 'G-FVHPGPZTSL')")) {
    console.error(`ERROR: ${filePath} ausente da Google tag oficial (G-FVHPGPZTSL)!`);
    process.exit(1);
  }
  const gaTagMatches = html.match(/googletagmanager\.com\/gtag\/js\?id=G-FVHPGPZTSL/g) || [];
  if (gaTagMatches.length !== 1) {
    console.error(`ERROR: ${filePath} possui Google tag GA4 duplicada (${gaTagMatches.length} ocorrências)!`);
    process.exit(1);
  }
}

// Validação e auditoria estrita de prontidão de produção para todas as páginas de notícias
if (fs.existsSync('dist/noticias')) {
  const newsData = JSON.parse(fs.readFileSync('dist/data/newsData.json', 'utf8'));
  const seenCanonical = new Set();
  const seenTitles = new Set();
  const seenArticleIds = new Set();

  for (const article of newsData) {
    if (seenArticleIds.has(article.id)) {
      console.error(`ERROR: ID duplicado detectado em newsData.json: ${article.id}`);
      process.exit(1);
    }
    seenArticleIds.add(article.id);

    const articleHtmlPath = `dist/noticias/${article.id}/index.html`;
    if (!fs.existsSync(articleHtmlPath)) {
      console.error(`ERROR: Página individual do artigo ausente no build: ${articleHtmlPath}`);
      process.exit(1);
    }
    const html = fs.readFileSync(articleHtmlPath, 'utf8');
    if (html.includes('/src/') || html.includes('main.tsx')) {
      console.error(`ERROR: ${articleHtmlPath} contém referências de desenvolvimento não compiladas!`);
      process.exit(1);
    }

    // Validação de título único
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch || !titleMatch[1].trim()) {
      console.error(`ERROR: ${articleHtmlPath} não possui tag <title> válida!`);
      process.exit(1);
    }
    const title = titleMatch[1].trim();
    if (seenTitles.has(title)) {
      console.error(`ERROR: Título duplicado detectado: ${title}`);
      process.exit(1);
    }
    seenTitles.add(title);

    // Validação de meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (!descMatch || !descMatch[1].trim()) {
      console.error(`ERROR: ${articleHtmlPath} não possui <meta name="description"> preenchida!`);
      process.exit(1);
    }

    // Validação de URL canônica única
    const expectedCanonical = `https://sociedadeativa.github.io/noticias/${article.id}/`;
    if (!html.includes(`rel="canonical"`) || !html.includes(expectedCanonical)) {
      console.error(`ERROR: ${articleHtmlPath} não possui link canônico exato (${expectedCanonical})!`);
      process.exit(1);
    }
    if (seenCanonical.has(expectedCanonical)) {
      console.error(`ERROR: URL canônica duplicada: ${expectedCanonical}`);
      process.exit(1);
    }
    seenCanonical.add(expectedCanonical);

    // Validação de Schema.org NewsArticle JSON-LD
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    if (!jsonLdMatch) {
      console.error(`ERROR: ${articleHtmlPath} não possui bloco JSON-LD!`);
      process.exit(1);
    }
    let ld;
    try {
      ld = JSON.parse(jsonLdMatch[1]);
      if (ld['@context'] !== 'https://schema.org') {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD @context inválido: ${ld['@context']}`);
        process.exit(1);
      }
      if (ld['@type'] !== 'NewsArticle') {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD @type não é NewsArticle!`);
        process.exit(1);
      }
      if (ld.headline !== article.title) {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD headline diverge do dataset!`);
        process.exit(1);
      }
      if (ld.author?.name !== article.source) {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD author diverge da fonte oficial!`);
        process.exit(1);
      }
      if (!ld.datePublished || isNaN(new Date(ld.datePublished).getTime())) {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD datePublished inválida: ${ld.datePublished}`);
        process.exit(1);
      }
      if (!ld.mainEntityOfPage || ld.mainEntityOfPage['@id'] !== expectedCanonical) {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD mainEntityOfPage diverge da URL canônica!`);
        process.exit(1);
      }
      if (!ld.publisher || ld.publisher.name !== 'Sociedade Ativa') {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD publisher inválido!`);
        process.exit(1);
      }
    } catch (e) {
      console.error(`ERROR: ${articleHtmlPath} JSON-LD inválido:`, e.message);
      process.exit(1);
    }

    // Validação de parágrafos disponíveis: a página estática gerada DEVE renderizar todos os parágrafos legítimos no corpo HTML
    if (article.content && Array.isArray(article.content) && article.content.length > 0) {
      const bodyHtml = html.split('<div id="root">')[1] || html;
      for (let i = 0; i < article.content.length; i++) {
        const paragraph = article.content[i].trim();
        const pSample = paragraph.slice(0, Math.min(50, paragraph.length));
        if (!bodyHtml.includes(pSample) && !bodyHtml.includes(paragraph)) {
          console.error(`ERROR: ${articleHtmlPath} omitiu parágrafo de conteúdo ${i + 1}/${article.content.length} no corpo do artigo: "${pSample}..."`);
          process.exit(1);
        }
      }
      // Validação de articleBody no JSON-LD
      if (!ld.articleBody || typeof ld.articleBody !== 'string' || !ld.articleBody.trim()) {
        console.error(`ERROR: ${articleHtmlPath} possui parágrafos no dataset mas o JSON-LD omite articleBody!`);
        process.exit(1);
      }
    } else {
      // Quando não há parágrafos completos disponíveis, o JSON-LD não deve inventar articleBody
      if (ld.articleBody) {
        console.error(`ERROR: ${articleHtmlPath} não possui parágrafos completos mas JSON-LD inventou articleBody!`);
        process.exit(1);
      }
    }

    // Validação de integridade de imagens e concordância entre HTML, Open Graph, Twitter e JSON-LD
    const isVerifiedImage = Boolean(
      article.imageUrl &&
      article.imageUrl.startsWith('https://') &&
      article.imageCredit &&
      article.imageCredit.trim()
    );

    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const twImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    const twCardMatch = html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i);

    if (isVerifiedImage) {
      // Deve conter a imagem no HTML estático
      if (!html.includes(article.imageUrl)) {
        console.error(`ERROR: ${articleHtmlPath} possui imagem verificada mas omitiu a tag <img> no HTML!`);
        process.exit(1);
      }
      // Deve conter o crédito da imagem no HTML estático
      if (article.imageCredit && !html.includes(article.imageCredit)) {
        console.error(`ERROR: ${articleHtmlPath} omitiu o crédito da imagem "${article.imageCredit}" no HTML!`);
        process.exit(1);
      }
      // og:image deve concordar com a imagem verificada
      if (!ogImageMatch || ogImageMatch[1] !== article.imageUrl) {
        console.error(`ERROR: ${articleHtmlPath} og:image (${ogImageMatch?.[1]}) diverge da imagem do artigo (${article.imageUrl})!`);
        process.exit(1);
      }
      // twitter:image deve concordar com a imagem verificada
      if (!twImageMatch || twImageMatch[1] !== article.imageUrl) {
        console.error(`ERROR: ${articleHtmlPath} twitter:image (${twImageMatch?.[1]}) diverge da imagem do artigo (${article.imageUrl})!`);
        process.exit(1);
      }
      // twitter:card deve ser summary_large_image
      if (!twCardMatch || twCardMatch[1] !== 'summary_large_image') {
        console.error(`ERROR: ${articleHtmlPath} twitter:card deve ser summary_large_image quando há imagem!`);
        process.exit(1);
      }
      // JSON-LD deve conter a imagem verificada
      if (!ld.image || !Array.isArray(ld.image) || !ld.image.includes(article.imageUrl)) {
        console.error(`ERROR: ${articleHtmlPath} JSON-LD image diverge ou não contém ${article.imageUrl}!`);
        process.exit(1);
      }
    } else {
      // Quando NÃO há imagem verificada, as tags de imagem DEVEM ser omitidas
      if (ogImageMatch) {
        console.error(`ERROR: ${articleHtmlPath} não possui imagem verificada mas contém og:image (${ogImageMatch[1]})!`);
        process.exit(1);
      }
      if (twImageMatch) {
        console.error(`ERROR: ${articleHtmlPath} não possui imagem verificada mas contém twitter:image (${twImageMatch[1]})!`);
        process.exit(1);
      }
      if (twCardMatch && twCardMatch[1] !== 'summary') {
        console.error(`ERROR: ${articleHtmlPath} twitter:card deve ser summary quando não há imagem verificada!`);
        process.exit(1);
      }
      if (ld.image) {
        console.error(`ERROR: ${articleHtmlPath} não possui imagem verificada mas JSON-LD contém propriedade image!`);
        process.exit(1);
      }
    }

    // Validação de verificação do Google
    if (!html.includes('oZPS6sfWTE5EJAuLOsZCtq9UoF1lh4wMhD9Jz13OTSs')) {
      console.error(`ERROR: ${articleHtmlPath} ausente da tag google-site-verification!`);
      process.exit(1);
    }

    // Validação de fidelidade de conteúdo e fontes
    if (!html.includes(article.source)) {
      console.error(`ERROR: ${articleHtmlPath} não contém o nome da fonte ${article.source}!`);
      process.exit(1);
    }
    if (!html.includes(article.publishedAt)) {
      console.error(`ERROR: ${articleHtmlPath} não contém a data original ${article.publishedAt}!`);
      process.exit(1);
    }

    // Validação de integridade dos links para assets CSS e JS
    const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
    const linkMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)].map(m => m[1]);
    for (const ref of [...scriptMatches, ...linkMatches]) {
      if (ref.startsWith('../../')) {
        const resolved = ref.replace('../../', 'dist/');
        if (!fs.existsSync(resolved)) {
          console.error(`ERROR: Asset não encontrado no build: ${ref} (esperado em ${resolved})`);
          process.exit(1);
        }
      }
    }

    // Validação de presença da Google tag oficial (GA4: G-FVHPGPZTSL) e prevenção de duplicações
    if (!html.includes('https://www.googletagmanager.com/gtag/js?id=G-FVHPGPZTSL') || !html.includes("gtag('config', 'G-FVHPGPZTSL')")) {
      console.error(`ERROR: ${articleHtmlPath} ausente da Google tag oficial (G-FVHPGPZTSL)!`);
      process.exit(1);
    }
    const articleGaMatches = html.match(/googletagmanager\.com\/gtag\/js\?id=G-FVHPGPZTSL/g) || [];
    if (articleGaMatches.length !== 1) {
      console.error(`ERROR: ${articleHtmlPath} possui Google tag GA4 duplicada (${articleGaMatches.length} ocorrências)!`);
      process.exit(1);
    }
  }
  console.log(`Auditoria estrita de páginas de notícias: Todas as ${newsData.length} páginas individuais validadas com sucesso (conteúdo, metadados, GA4 G-FVHPGPZTSL, JSON-LD e assets).`);
}

console.log(`Build validation passed: All ${requiredHtmlFiles.length} pages, individual news pages, SEO metadata, Google Analytics 4 (G-FVHPGPZTSL), 6 candidate photos, market/economy datasets, sitemap.xml and robots.txt are clean and production-ready.`);
