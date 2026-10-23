#!/usr/bin/env node

/**
 * Script de Geração de Páginas Estáticas Individuais de Notícias
 * Sociedade Ativa — Política, eleições, notícias e dados do Brasil.
 *
 * Gera páginas HTML individuais em dist/noticias/[id]/index.html
 * para compatibilidade total com GitHub Pages (URLs estáveis, 200 OK em reload,
 * SEO individual, meta tags Open Graph, Twitter e Schema.org NewsArticle).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DIST_DIR = path.join(rootDir, 'dist');
const NOTICIAS_DIR = path.join(DIST_DIR, 'noticias');
const TEMPLATE_PATH = path.join(NOTICIAS_DIR, 'index.html');
const PUBLIC_DATA_FILE = path.join(rootDir, 'public', 'data', 'newsData.json');
const DIST_DATA_FILE = path.join(DIST_DIR, 'data', 'newsData.json');

// Sincroniza e garante leitura do dataset oficial autoritativo
if (fs.existsSync(PUBLIC_DATA_FILE) && fs.existsSync(DIST_DATA_FILE)) {
  const pubStat = fs.statSync(PUBLIC_DATA_FILE);
  const distStat = fs.statSync(DIST_DATA_FILE);
  if (pubStat.mtimeMs > distStat.mtimeMs) {
    fs.copyFileSync(PUBLIC_DATA_FILE, DIST_DATA_FILE);
  }
}
const DATA_FILE = fs.existsSync(DIST_DATA_FILE) ? DIST_DATA_FILE : PUBLIC_DATA_FILE;

// Converte strings de data brasileiras para ISO 8601 UTC-3
function parseDateToIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  
  // Exemplo: 13/10/2026 às 12:00
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+às\s+(\d{2}):(\d{2}))?/);
  if (match) {
    const [, day, month, year, hours = '12', minutes = '00'] = match;
    return `${year}-${month}-${day}T${hours}:${minutes}:00-03:00`;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return '2026-10-13T12:00:00-03:00';
}

// Extrai data confiável no formato YYYY-MM-DD para lastmod do sitemap
function extractReliableDateYmd(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Formato brasileiro: 13/10/2026 ou 13/10/2026 às 13:02
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (y >= 2020 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Formato ISO: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (y >= 2020 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    if (y >= 2020 && y <= 2030) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeParagraphText(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJson(str) {
  if (!str) return '';
  return JSON.stringify(str).slice(1, -1);
}

// Garante que o resumo termine sempre em sentença completa sem pontas soltas ou reticências
function cleanSummary(raw, maxLen = 280) {
  if (!raw) return '';
  let text = String(raw).trim();

  // 1. Remove ruídos de créditos fotográficos no início ou fim (ex: IBGE: "- Foto: ...")
  text = text.replace(/\s*-\s*Foto:[\s\S]*$/i, '');
  text = text.replace(/\s*Foto:\s*[\s\S]*$/i, '');

  // 2. Remove reticências ou pontos suspensivos causados por truncamento por caracteres
  text = text.replace(/(\s*\.{2,}|\s*…)+$/g, '');

  // 3. Remove conectivos e preposições pendentes residuais
  const danglingPatterns = [
    /\s+(?:na|no|nas|nos|de|da|do|das|dos|em|para|por|com|e|ou|que|o|a|os|as|um|uma|uns|umas|se|ao|aos|à|às|sobre|após|pelo|pela|pelos|pelas)\s*$/i,
    /\s+(?:veiculação|veiculacao|distribuição|distribuicao|intermediação|intermediacao|operação|operacao)\s+de\s*$/i
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const pat of danglingPatterns) {
      if (pat.test(text)) {
        text = text.replace(pat, '').trim();
        changed = true;
      }
    }
  }

  // Remove pontuação solta residual
  text = text.replace(/[\s,;:!?-]+$/, '').trim();

  // 4. Protege números com ponto (ex: 3.071, 1.499) e abreviações brasileiras para não quebrar sentenças indevidamente
  const abbrevProtected = text
    .replace(/(\d+)\.(\d+)/g, '$1__TEMP_NUM_DOT__$2')
    .replace(/R\$\s*/g, 'R$__TEMP_SPACE__')
    .replace(/\b(art|nº|n°|dr|dra|sr|sra|prof|profa|gov|min|des|dep|sen|ex|etc|pág|p|vol|cap|inc|par|fls|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.\s*/gi, (m) => m.replace('.', '__TEMP_DOT__'));

  const sentenceMatches = abbrevProtected.match(/[^.!?]+(?:[.!?]+["”’\)]*|$)/g) || [abbrevProtected];
  const sentences = [];
  for (let s of sentenceMatches) {
    s = s.replace(/__TEMP_DOT__/g, '.').replace(/__TEMP_NUM_DOT__/g, '.').replace(/R\$__TEMP_SPACE__/g, 'R$ ').trim();
    if (s.length > 0) {
      sentences.push(s);
    }
  }

  // 5. Acumula sentenças completas que caibam no limite estrito
  let accumulated = '';
  for (const s of sentences) {
    const isTerminated = /[.!?]["”’\)]*$/.test(s);
    const candidate = accumulated ? `${accumulated} ${s}` : s;
    if (candidate.length <= maxLen && isTerminated) {
      accumulated = candidate;
    } else if (!accumulated && candidate.length <= maxLen) {
      accumulated = candidate;
    } else {
      break;
    }
  }

  // Fallback quando a primeira sentença sozinha excede maxLen
  if (!accumulated && sentences.length > 0) {
    let first = sentences[0].trim();
    if (first.length > maxLen) {
      let sliced = first.slice(0, maxLen - 1);
      const lastSpace = sliced.lastIndexOf(' ');
      if (lastSpace > 0) {
        sliced = sliced.slice(0, lastSpace);
      }
      sliced = sliced.replace(/[\s,;:!?-]+$/, '');
      for (const pat of danglingPatterns) {
        if (pat.test(sliced)) {
          sliced = sliced.replace(pat, '').trim();
        }
      }
      sliced = sliced.replace(/[\s,;:!?-]+$/, '');
      if (sliced.length > maxLen - 1) {
        sliced = sliced.slice(0, maxLen - 1).replace(/[\s,;:!?-]+$/, '');
      }
      accumulated = sliced;
    } else {
      accumulated = first;
    }
  }

  accumulated = accumulated.trim().replace(/[\s,;:!?-]+$/, '');

  // Garante terminação pontuada oficial da oração se couber no limite estrito
  if (!/[.!?]["”’\)]*$/.test(accumulated)) {
    if (accumulated.length + 1 <= maxLen) {
      accumulated += '.';
    }
  }

  // Garantia absoluta de que o resumo nunca excederá maxLen sob nenhuma circunstância
  if (accumulated.length > maxLen) {
    accumulated = accumulated.slice(0, maxLen).replace(/[\s,;:!?-]+$/, '');
    if (!/[.!?]["”’\)]*$/.test(accumulated) && accumulated.length + 1 <= maxLen) {
      accumulated += '.';
    }
  }

  return accumulated;
}

function formatMetaDescription(summary) {
  if (!summary) return 'Sociedade Ativa — Notícias e dados do Brasil.';
  if (summary.length <= 155 && /[.!?]["”’\)]*$/.test(summary.trim())) return summary.trim();

  // Prefere a primeira sentença completa se couber em até 155 caracteres
  const firstSentenceMatch = summary.match(/^([^.!?]+[.!?]["”’\)]*)/);
  if (firstSentenceMatch && firstSentenceMatch[1].trim().length <= 155) {
    return firstSentenceMatch[1].trim();
  }

  // Truncamento em limite de palavra sem deixar conectivos ou pontas soltas
  let sliced = summary.slice(0, 154);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 80) {
    sliced = sliced.slice(0, lastSpace);
  }
  sliced = sliced.trim().replace(/[\s,;:!?-]+$/, '');
  const danglingPatterns = [
    /\s+(?:na|no|nas|nos|de|da|do|das|dos|em|para|por|com|e|ou|que|o|a|os|as|um|uma|uns|umas|se|ao|aos|à|às|sobre|após|pelo|pela|pelos|pelas)\s*$/i,
    /\s+(?:veiculação|veiculacao|distribuição|distribuicao|intermediação|intermediacao|operação|operacao)\s+de\s*$/i
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const pat of danglingPatterns) {
      if (pat.test(sliced)) {
        sliced = sliced.replace(pat, '').trim();
        changed = true;
      }
    }
  }
  sliced = sliced.replace(/[\s,;:!?-]+$/, '').trim();
  if (!/[.!?]["”’\)]*$/.test(sliced) && sliced.length + 1 <= 155) {
    sliced += '.';
  }
  return sliced;
}

// Gera o sitemap.xml final com as 8 seções canônicas e todos os artigos gerados
function generateSitemap(generatedArticles) {
  const DIST_SITEMAP = path.join(DIST_DIR, 'sitemap.xml');
  const BASE_SITEMAP = path.join(rootDir, 'public', 'sitemap.xml');

  // As seções canônicas principais do portal Sociedade Ativa
  const canonicalSections = [
    { loc: 'https://sociedadeativa.github.io/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/politica/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/eleicoes/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/economia/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/estados/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/dados-publicos/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/noticias/', defaultDate: '2026-10-13' },
    { loc: 'https://sociedadeativa.github.io/esportes/', defaultDate: '2026-10-14' },
    { loc: 'https://sociedadeativa.github.io/tecnologia/', defaultDate: '2026-10-21' },
    { loc: 'https://sociedadeativa.github.io/clima/', defaultDate: '2026-10-15' },
    { loc: 'https://sociedadeativa.github.io/sobre/', defaultDate: '2026-10-13' },
  ];

  // Preserva os valores de lastmod definidos nas seções principais a partir de public/sitemap.xml
  const existingSectionDates = new Map();
  if (fs.existsSync(BASE_SITEMAP)) {
    const raw = fs.readFileSync(BASE_SITEMAP, 'utf8');
    const matches = raw.matchAll(/<url>[\s\S]*?<loc>(https:\/\/sociedadeativa\.github\.io\/[^<]*)<\/loc>(?:[\s\S]*?<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>)?[\s\S]*?<\/url>/g);
    for (const match of matches) {
      if (match[1] && match[2]) {
        existingSectionDates.set(match[1], match[2]);
      }
    }
  }

  const sitemapEntries = [];
  const seenLocs = new Set();

  // 1. Inclui as 8 seções canônicas principais
  for (const section of canonicalSections) {
    if (!seenLocs.has(section.loc)) {
      seenLocs.add(section.loc);
      const lastmod = existingSectionDates.get(section.loc) || section.defaultDate;
      sitemapEntries.push({
        loc: section.loc,
        lastmod,
      });
    }
  }

  // 2. Inclui cada matéria individual gerada que efetivamente exista em dist/
  for (const article of generatedArticles) {
    const articleUrl = `https://sociedadeativa.github.io/noticias/${article.id}/`;
    const articleHtmlPath = path.join(NOTICIAS_DIR, article.id, 'index.html');

    if (fs.existsSync(articleHtmlPath) && !seenLocs.has(articleUrl)) {
      seenLocs.add(articleUrl);
      const isGenuineUpdate = Boolean(article.updatedAt && article.updatedAt !== article.publishedAt);
      const reliableDate = extractReliableDateYmd((isGenuineUpdate ? article.updatedAt : null) || article.publishedAt);
      sitemapEntries.push({
        loc: articleUrl,
        lastmod: reliableDate,
      });
    }
  }

  // 3. Monta o sitemap.xml seguindo o padrão oficial sitemaps.org 0.9
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const entry of sitemapEntries) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${entry.loc}</loc>`);
    if (entry.lastmod) {
      xmlLines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>\n');

  const sitemapXml = xmlLines.join('\n');
  fs.writeFileSync(DIST_SITEMAP, sitemapXml, 'utf8');
  fs.writeFileSync(BASE_SITEMAP, sitemapXml, 'utf8');

  // Gera sitemap.txt simples (uma URL canônica absoluta por linha)
  // em conformidade com as diretrizes do Google Search Console e protocolo sitemaps.org
  const DIST_SITEMAP_TXT = path.join(DIST_DIR, 'sitemap.txt');
  const BASE_SITEMAP_TXT = path.join(rootDir, 'public', 'sitemap.txt');
  const sitemapTxt = sitemapEntries.map((entry) => entry.loc).join('\n') + '\n';
  fs.writeFileSync(DIST_SITEMAP_TXT, sitemapTxt, 'utf8');
  fs.writeFileSync(BASE_SITEMAP_TXT, sitemapTxt, 'utf8');

  console.log(`Sucesso: dist/sitemap.xml e dist/sitemap.txt gerados com ${sitemapEntries.length} URLs (${canonicalSections.length} seções canônicas + ${sitemapEntries.length - canonicalSections.length} matérias individuais).`);
}

function main() {
  console.log('Iniciando geração de páginas individuais de notícias...');

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`ERRO: Template base ${TEMPLATE_PATH} não existe. Execute o vite build primeiro.`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`ERRO: Arquivo de dados ${DATA_FILE} não existe.`);
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const articlesRaw = fs.readFileSync(DATA_FILE, 'utf8');
  const articles = JSON.parse(articlesRaw);

  if (!Array.isArray(articles) || articles.length === 0) {
    console.error('ERRO: Nenhum artigo encontrado em newsData.json.');
    process.exit(1);
  }

  let generatedCount = 0;
  const generatedArticles = [];
  const seenArticleIds = new Set();

  for (const article of articles) {
    if (!article.id || !article.title || !article.summary) {
      continue;
    }

    if (seenArticleIds.has(article.id)) {
      console.warn(`[Aviso] ID duplicado detectado durante geração: "${article.id}". Ignorando ocorrência subsequente para evitar sobrescrita de metadados.`);
      continue;
    }
    seenArticleIds.add(article.id);

    const articleDir = path.join(NOTICIAS_DIR, article.id);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    const canonicalUrl = `https://sociedadeativa.github.io/noticias/${article.id}/`;
    const pageTitle = `${article.title} — Sociedade Ativa | Notícias`;
    const cleanSummaryText = cleanSummary(article.summary, 280);
    const metaDescription = formatMetaDescription(cleanSummaryText);

    const hasGenuineUpdate = Boolean(article.updatedAt && article.updatedAt !== article.publishedAt);
    const isoDate = parseDateToIso(article.publishedAt);
    const isoModDate = hasGenuineUpdate ? parseDateToIso(article.updatedAt) : isoDate;
    const isVerifiedImage = Boolean(
      article.imageUrl &&
      article.imageUrl.startsWith('https://') &&
      article.imageCredit &&
      article.imageCredit.trim()
    );

    // Ajusta referências relativas de "../assets/" para "../../assets/" e "../favicon.svg" para "../../favicon.svg"
    let pageHtml = templateHtml
      .replace(/\.\.\/assets\//g, '../../assets/')
      .replace(/\.\.\/favicon\.svg/g, '../../favicon.svg');

    // Garante a presença da Google tag oficial (GA4: G-FVHPGPZTSL) sem duplicação
    if (!pageHtml.includes('G-FVHPGPZTSL')) {
      const gaTagSnippet = `    <!-- Google tag (gtag.js) — Carregamento diferido após renderização crítica -->\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      window.gtag = gtag;\n      gtag('js', new Date());\n      gtag('config', 'G-FVHPGPZTSL');\n\n      (function() {\n        if (window.__ga4Loaded || window.__ga4Loading) return;\n        function loadGtag() {\n          if (window.__ga4Loaded || window.__ga4Loading) return;\n          window.__ga4Loading = true;\n          removeInteractionListeners();\n          var s = document.createElement('script');\n          s.async = true;\n          s.src = 'https://www.googletagmanager.com/gtag/js?id=G-FVHPGPZTSL';\n          s.onload = function() { window.__ga4Loaded = true; };\n          s.onerror = function() { window.__ga4Loading = false; };\n          var head = document.head || document.getElementsByTagName('head')[0];\n          if (head) { head.appendChild(s); }\n        }\n        var interactionEvents = ['scroll', 'click', 'touchstart', 'keydown'];\n        function onInteraction() { loadGtag(); }\n        function addInteractionListeners() {\n          interactionEvents.forEach(function(evt) {\n            window.addEventListener(evt, onInteraction, { once: true, passive: true });\n          });\n        }\n        function removeInteractionListeners() {\n          interactionEvents.forEach(function(evt) {\n            window.removeEventListener(evt, onInteraction);\n          });\n        }\n        addInteractionListeners();\n        if ('requestIdleCallback' in window) {\n          window.requestIdleCallback(loadGtag, { timeout: 3500 });\n        } else if (document.readyState === 'complete') {\n          setTimeout(loadGtag, 1500);\n        } else {\n          window.addEventListener('load', function() { setTimeout(loadGtag, 1500); }, { once: true });\n        }\n      })();\n    </script>`;
      pageHtml = pageHtml.replace(/<\/head>/i, `${gaTagSnippet}\n  </head>`);
    }

    // Substitui <title>
    pageHtml = pageHtml.replace(
      /<title>[\s\S]*?<\/title>/i,
      () => `<title>${escapeHtml(pageTitle)}</title>`
    );

    // Substitui <meta name="description">
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta name="description" content="${escapeHtml(metaDescription)}" />`
    );

    // Substitui link canônico
    pageHtml = pageHtml.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
      () => `<link rel="canonical" href="${canonicalUrl}" />`
    );

    // Substitui Open Graph
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta property="og:description" content="${escapeHtml(metaDescription)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta property="og:url" content="${canonicalUrl}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:type["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta property="og:type" content="article" />\n    <meta property="article:published_time" content="${isoDate}" />${hasGenuineUpdate ? `\n    <meta property="article:modified_time" content="${isoModDate}" />` : ''}\n    <meta property="article:section" content="${escapeHtml(article.category)}" />`
    );

    // Substitui Twitter Cards
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
      () => `<meta name="twitter:description" content="${escapeHtml(metaDescription)}" />`
    );

    // Ajusta Open Graph / Twitter image e twitter:card de acordo com a verificação da imagem
    if (isVerifiedImage) {
      if (/<meta\s+property=["']og:image["']/i.test(pageHtml)) {
        pageHtml = pageHtml.replace(
          /<meta\s+property=["']og:image["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
          () => `<meta property="og:image" content="${escapeHtml(article.imageUrl)}" />`
        );
      } else {
        pageHtml = pageHtml.replace(/<\/head>/i, `    <meta property="og:image" content="${escapeHtml(article.imageUrl)}" />\n  </head>`);
      }

      if (/<meta\s+name=["']twitter:image["']/i.test(pageHtml)) {
        pageHtml = pageHtml.replace(
          /<meta\s+name=["']twitter:image["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
          () => `<meta name="twitter:image" content="${escapeHtml(article.imageUrl)}" />`
        );
      } else {
        pageHtml = pageHtml.replace(/<\/head>/i, `    <meta name="twitter:image" content="${escapeHtml(article.imageUrl)}" />\n  </head>`);
      }

      pageHtml = pageHtml.replace(
        /<meta\s+name=["']twitter:card["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
        () => `<meta name="twitter:card" content="summary_large_image" />`
      );
    } else {
      // Quando não há imagem verificada, remove totalmente og:image e twitter:image, e define twitter:card como summary
      pageHtml = pageHtml.replace(/\s*<meta\s+property=["']og:image["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
      pageHtml = pageHtml.replace(/\s*<meta\s+name=["']twitter:image["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
      pageHtml = pageHtml.replace(
        /<meta\s+name=["']twitter:card["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
        () => `<meta name="twitter:card" content="summary" />`
      );
    }

    // Substitui dados estruturados Schema.org
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "@id": `${canonicalUrl}#article`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "headline": article.title,
      "description": cleanSummaryText,
      "datePublished": isoDate,
      "dateModified": isoModDate,
      "articleSection": article.category,
      "inLanguage": "pt-BR",
      "publisher": {
        "@type": "NewsMediaOrganization",
        "@id": "https://sociedadeativa.github.io/#publisher",
        "name": "Sociedade Ativa",
        "url": "https://sociedadeativa.github.io/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sociedadeativa.github.io/assets/og-share.svg"
        }
      },
      "author": {
        "@type": "Organization",
        "name": article.source
      },
      "isAccessibleForFree": true
    };

    if (isVerifiedImage) {
      structuredData.image = [article.imageUrl];
    }

    if (article.content && Array.isArray(article.content) && article.content.length > 0) {
      structuredData.articleBody = article.content.join('\n\n');
    }

    pageHtml = pageHtml.replace(
      /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i,
      () => `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`
    );

    let timestampHtml = `<span>Publicado em ${escapeHtml(article.publishedAt)}</span>`;
    if (hasGenuineUpdate) {
      timestampHtml += ` &middot; <span>Atualizado em ${escapeHtml(article.updatedAt)}</span>`;
    } else if (article.ingestedAt && article.ingestedAt !== article.publishedAt) {
      timestampHtml += ` &middot; <span>Recebido pelo portal em ${escapeHtml(article.ingestedAt)}</span>`;
    }

    const imageBlockHtml = isVerifiedImage
      ? `\n            <figure style="margin:20px 0;">\n              <img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" style="width:100%;max-height:480px;object-fit:cover;border-radius:8px;" />\n              <figcaption style="font-size:12px;color:#64748b;margin-top:6px;">Foto: ${escapeHtml(article.imageCredit)}</figcaption>\n            </figure>`
      : '';

    // Pre-rendered HTML dentro de <div id="root"> para robôs de indexação e usuários sem JS
    const fallbackArticleHtml = `
      <div id="root">
        <main style="max-width:800px;margin:40px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;">
          <nav style="font-size:13px;margin-bottom:20px;color:#64748b;">
            <a href="/" style="color:#2563eb;text-decoration:none;">Início</a> &rarr; 
            <a href="/noticias/" style="color:#2563eb;text-decoration:none;">Notícias</a> &rarr; 
            <span>${escapeHtml(article.category)}</span>
          </nav>
          <article>
            <p style="font-size:12px;font-weight:bold;text-transform:uppercase;color:#1e40af;margin-bottom:8px;">${escapeHtml(article.category)}</p>
            <h1 style="font-size:28px;line-height:1.2;font-weight:900;color:#020617;margin-bottom:16px;">${escapeHtml(article.title)}</h1>
            <div style="font-size:12px;color:#64748b;margin-bottom:20px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
              <span><strong>Fonte:</strong> ${escapeHtml(article.source)}</span> &middot; 
              ${timestampHtml}
            </div>${imageBlockHtml}
            ${
              article.content && article.content.length > 0
                ? `
            <div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">
              <span style="display:block;font-size:11px;font-weight:bold;text-transform:uppercase;color:#475569;margin-bottom:6px;">Resumo Executivo</span>
              <p style="font-size:16px;line-height:1.6;font-weight:600;color:#334155;margin:0;">${escapeHtml(cleanSummaryText)}</p>
            </div>
            <div style="margin-top:24px;margin-bottom:32px;">
              ${article.content.map(p => `<p style="font-size:16px;line-height:1.75;color:#1e293b;margin-bottom:18px;">${escapeParagraphText(p)}</p>`).join('')}
            </div>`
                : `
            <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #cbd5e1;margin-bottom:24px;">
              <span style="display:inline-block;font-size:11px;font-weight:bold;text-transform:uppercase;color:#1e40af;background:#eff6ff;padding:3px 8px;border-radius:6px;border:1px solid #bfdbfe;margin-bottom:10px;">Nota de Síntese Factual Oficial</span>
              <p style="font-size:16px;line-height:1.6;font-weight:600;color:#334155;margin:0 0 12px 0;">${escapeHtml(cleanSummaryText)}</p>
              <p style="font-size:13px;line-height:1.5;color:#64748b;margin:0;border-top:1px dashed #cbd5e1;padding-top:10px;">Esta publicação é uma súmula factual oficial distribuída por <strong>${escapeHtml(article.source)}</strong>. A reportagem completa com documentos e anexos integrais está disponível na fonte oficial.</p>
            </div>`
            }
            <div style="margin-top:32px;display:flex;gap:12px;flex-wrap:wrap;">
              <a href="${escapeHtml(article.articleUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#1e3a8a;color:#ffffff;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:bold;">Acessar reportagem completa em ${escapeHtml(article.source)}</a>
              <a href="/noticias/" style="display:inline-block;background:#f1f5f9;color:#334155;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:bold;">Voltar para Notícias</a>
            </div>
          </article>
        </main>
      </div>
    `.trim();

    pageHtml = pageHtml.replace('<div id="root"></div>', () => fallbackArticleHtml);

    const outPath = path.join(articleDir, 'index.html');
    fs.writeFileSync(outPath, pageHtml, 'utf8');

    // Replica pasta data/ dentro do subdiretório do artigo para garantir 200 OK caso ocorra fetch relativo
    const articleDataDir = path.join(articleDir, 'data');
    if (!fs.existsSync(articleDataDir)) {
      fs.mkdirSync(articleDataDir, { recursive: true });
    }
    const distDataDir = path.join(DIST_DIR, 'data');
    if (fs.existsSync(distDataDir)) {
      const dataFiles = fs.readdirSync(distDataDir);
      for (const df of dataFiles) {
        fs.copyFileSync(path.join(distDataDir, df), path.join(articleDataDir, df));
      }
    }

    generatedArticles.push(article);
    generatedCount++;
  }

  // Limpa diretórios obsoletos de notícias que não constam mais no dataset atual
  if (fs.existsSync(NOTICIAS_DIR)) {
    const existingEntries = fs.readdirSync(NOTICIAS_DIR, { withFileTypes: true });
    for (const ent of existingEntries) {
      if (ent.isDirectory() && ent.name !== 'assets' && ent.name !== 'data') {
        if (!seenArticleIds.has(ent.name)) {
          fs.rmSync(path.join(NOTICIAS_DIR, ent.name), { recursive: true, force: true });
        }
      }
    }
  }

  console.log(`Sucesso: ${generatedCount} páginas individuais de notícias geradas em dist/noticias/[id]/index.html`);

  // Injeta o LCP image preload dinâmico na homepage gerada (dist/index.html)
  injectHomepageLcpPreload(articles, DIST_DIR);

  // Gera o sitemap.xml atualizado incluindo seções canônicas e todos os artigos
  generateSitemap(generatedArticles);
}

// Helpers para seleção de matéria líder idêntica ao FeaturedEditorial.tsx
export function parseNewsDateToTimestamp(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'Data não informada' || trimmed === 'Hoje') return 0;

  const brAsPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+às\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i;
  const matchAs = trimmed.match(brAsPattern);
  if (matchAs) {
    const day = parseInt(matchAs[1], 10);
    const month = parseInt(matchAs[2], 10) - 1;
    const year = parseInt(matchAs[3], 10);
    const hours = matchAs[4] !== undefined ? parseInt(matchAs[4], 10) : 0;
    const minutes = matchAs[5] !== undefined ? parseInt(matchAs[5], 10) : 0;
    const seconds = matchAs[6] !== undefined ? parseInt(matchAs[6], 10) : 0;
    return Date.UTC(year, month, day, hours + 3, minutes, seconds);
  }

  const brSpacePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const matchSpace = trimmed.match(brSpacePattern);
  if (matchSpace) {
    const day = parseInt(matchSpace[1], 10);
    const month = parseInt(matchSpace[2], 10) - 1;
    const year = parseInt(matchSpace[3], 10);
    const hours = matchSpace[4] !== undefined ? parseInt(matchSpace[4], 10) : 0;
    const minutes = matchSpace[5] !== undefined ? parseInt(matchSpace[5], 10) : 0;
    const seconds = matchSpace[6] !== undefined ? parseInt(matchSpace[6], 10) : 0;
    return Date.UTC(year, month, day, hours + 3, minutes, seconds);
  }

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/i;
  const matchIso = trimmed.match(isoPattern);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10) - 1;
    const day = parseInt(matchIso[3], 10);
    const hours = matchIso[4] !== undefined ? parseInt(matchIso[4], 10) : 0;
    const minutes = matchIso[5] !== undefined ? parseInt(matchIso[5], 10) : 0;
    const seconds = matchIso[6] !== undefined ? parseInt(matchIso[6], 10) : 0;
    const tz = matchIso[7];
    if (!tz) {
      return Date.UTC(year, month, day, hours + 3, minutes, seconds);
    }
  }

  const parsed = new Date(trimmed);
  const time = parsed.getTime();
  return isNaN(time) ? 0 : time;
}

export function deduplicateNewsItems(items) {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set();
  const seenUrls = new Set();
  const result = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    if (seenIds.has(item.id)) continue;

    const isInternalGenericUrl =
      !item.articleUrl ||
      item.articleUrl === 'https://sociedadeativa.github.io/' ||
      item.articleUrl === 'https://sociedadeativa.github.io/noticias/' ||
      item.articleUrl === 'https://sociedadeativa.github.io/eleicoes/';

    if (!isInternalGenericUrl && seenUrls.has(item.articleUrl.toLowerCase())) {
      continue;
    }

    seenIds.add(item.id);
    if (!isInternalGenericUrl) {
      seenUrls.add(item.articleUrl.toLowerCase());
    }
    result.push(item);
  }
  return result;
}

export function sortNewsItems(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const timeA = parseNewsDateToTimestamp(a.publishedAt);
    const timeB = parseNewsDateToTimestamp(b.publishedAt);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const ingA = parseNewsDateToTimestamp(a.ingestedAt);
    const ingB = parseNewsDateToTimestamp(b.ingestedAt);
    if (ingB !== ingA) {
      return ingB - ingA;
    }
    return 0;
  });
}

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://') && !trimmed.startsWith('/')) {
    return false;
  }
  if (/\.(aspx|php|html?|jsp)(\?.*)?$/i.test(trimmed)) return false;
  if (/(\.gif|ebc\.png|pixel|beacon|spacer|1x1|tracking)/i.test(trimmed)) return false;
  if (/(logo-agenciabrasil|favicon|banner-default|placeholder)/i.test(trimmed)) return false;

  const isImageExt = /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(trimmed);
  const isKnownImagePath = /(\/thumbnails\/image\/|\/midias\/image\/|\/noticias-img\/|\/images\/agenciadenoticias\/)/i.test(trimmed);

  return isImageExt || isKnownImagePath;
}

export function getInstitutionalFallbackAsset(category, distDir = DIST_DIR) {
  const map = {
    Eleições: 'editorial_urna_eleicoes',
    Economia: 'editorial_economia_brasil',
    Brasil: 'editorial_dados_publicos',
    Congresso: 'editorial_congresso_brasilia',
    Política: 'editorial_congresso_brasilia',
    Governo: 'editorial_congresso_brasilia',
    Justiça: 'editorial_congresso_brasilia',
    Mundo: 'editorial_congresso_brasilia',
  };
  const prefix = map[category] || 'editorial_congresso_brasilia';
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const match = files.find((f) => f.startsWith(prefix) && (f.endsWith('.webp') || f.endsWith('.jpg')));
    if (match) {
      return `./assets/${match}`;
    }
  }
  return null;
}

export function getLeadArticleImageUrl(articles, distDir = DIST_DIR) {
  if (!Array.isArray(articles) || articles.length === 0) return null;

  // Lógica de seleção estritamente idêntica a FeaturedEditorial.tsx
  const PINNED_LEAD_ARTICLE_ID = null;
  const validArticles = sortNewsItems(deduplicateNewsItems(articles));
  const pinnedArticle = PINNED_LEAD_ARTICLE_ID
    ? validArticles.find((a) => a.id === PINNED_LEAD_ARTICLE_ID)
    : null;
  const leadArticle = pinnedArticle || validArticles[0] || null;
  if (!leadArticle) return null;

  const hasValidArticleImage = Boolean(
    leadArticle.imageUrl && isValidImageUrl(leadArticle.imageUrl)
  );

  if (hasValidArticleImage) {
    return leadArticle.imageUrl.trim();
  }

  return getInstitutionalFallbackAsset(leadArticle.category, distDir);
}

export function injectHomepageLcpPreload(articles, distDir = DIST_DIR) {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn(`[Aviso] ${indexHtmlPath} não existe para injeção de LCP preload.`);
    return null;
  }

  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Remove com segurança qualquer preload de imagem LCP anterior para prevenir duplicatas e evitar URLs obsoletas
  html = html.replace(/\s*<!--\s*LCP:\s*Pré-carregamento dinâmico.*?-->\s*/gi, '\n');
  html = html.replace(/\s*<link\s+rel=["']preload["']\s+as=["']image["'][^>]*>\s*/gi, '\n');

  const leadImageSrc = getLeadArticleImageUrl(articles, distDir);

  if (leadImageSrc) {
    const preloadTag = `    <!-- LCP: Pré-carregamento dinâmico da imagem líder editorial para acelerar a renderização mobile -->\n    <link rel="preload" as="image" href="${leadImageSrc}" fetchpriority="high">`;

    // Injeta na seção <head> logo após dns-prefetch ou antes dos scripts
    if (html.includes('<link rel="dns-prefetch" href="https://imagens.ebc.com.br">')) {
      html = html.replace(
        '<link rel="dns-prefetch" href="https://imagens.ebc.com.br">',
        `<link rel="dns-prefetch" href="https://imagens.ebc.com.br">\n${preloadTag}`
      );
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `${preloadTag}\n  </head>`);
    }

    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log(`Sucesso: dist/index.html atualizado com LCP image preload dinâmico: ${leadImageSrc}`);
    return leadImageSrc;
  } else {
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('dist/index.html verificado: nenhuma imagem de lead válida para preloading (tag omitida com segurança).');
    return null;
  }
}

main();
