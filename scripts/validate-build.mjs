import fs from 'node:fs';

const requiredHtmlFiles = [
  'dist/index.html',
  'dist/politica/index.html',
  'dist/eleicoes/index.html',
  'dist/economia/index.html',
  'dist/estados/index.html',
  'dist/dados-publicos/index.html',
  'dist/noticias/index.html',
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
];

for (const dataFile of requiredDataFiles) {
  if (!fs.existsSync(dataFile)) {
    console.error(`ERROR: Arquivo de dados ${dataFile} não foi encontrado no build!`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    JSON.parse(raw);
  } catch (err) {
    console.error(`ERROR: Arquivo de dados ${dataFile} contém JSON inválido:`, err.message);
    process.exit(1);
  }
}

// Replica pastas data/ e assets/candidates/ nos subdiretórios para garantir 200 OK em qualquer tipo de requisição relativa
const subdirs = ['politica', 'eleicoes', 'economia', 'estados', 'dados-publicos', 'noticias', 'sobre'];
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

// Verifica integridade do sitemap e robots.txt
if (!fs.existsSync('dist/sitemap.xml')) {
  console.error('ERROR: dist/sitemap.xml does not exist!');
  process.exit(1);
}
if (!fs.existsSync('dist/robots.txt')) {
  console.error('ERROR: dist/robots.txt does not exist!');
  process.exit(1);
}

const sitemapContent = fs.readFileSync('dist/sitemap.xml', 'utf8');
const canonicalPages = [
  'https://sociedadeativa.github.io/',
  'https://sociedadeativa.github.io/politica/',
  'https://sociedadeativa.github.io/eleicoes/',
  'https://sociedadeativa.github.io/economia/',
  'https://sociedadeativa.github.io/estados/',
  'https://sociedadeativa.github.io/dados-publicos/',
  'https://sociedadeativa.github.io/noticias/',
  'https://sociedadeativa.github.io/sobre/',
];

for (const pageUrl of canonicalPages) {
  if (!sitemapContent.includes(`<loc>${pageUrl}</loc>`)) {
    console.error(`ERROR: sitemap.xml ausente da URL canônica: ${pageUrl}`);
    process.exit(1);
  }
}

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
}

console.log(`Build validation passed: All ${requiredHtmlFiles.length} pages, SEO metadata, 6 candidate photos, market/economy datasets, sitemap.xml and robots.txt are clean and production-ready.`);
