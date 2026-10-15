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
const DATA_FILE = path.join(rootDir, 'public', 'data', 'newsData.json');

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

function escapeJson(str) {
  if (!str) return '';
  return JSON.stringify(str).slice(1, -1);
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
      const reliableDate = extractReliableDateYmd(article.updatedAt || article.publishedAt);
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
  console.log(`Sucesso: dist/sitemap.xml gerado com ${sitemapEntries.length} URLs (${canonicalSections.length} seções canônicas + ${sitemapEntries.length - canonicalSections.length} matérias individuais).`);
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

  for (const article of articles) {
    if (!article.id || !article.title || !article.summary) {
      continue;
    }

    const articleDir = path.join(NOTICIAS_DIR, article.id);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    const canonicalUrl = `https://sociedadeativa.github.io/noticias/${article.id}/`;
    const pageTitle = `${article.title} — Sociedade Ativa | Notícias`;
    const metaDescription = article.summary.length > 155
      ? `${article.summary.slice(0, 152)}...`
      : article.summary;

    const isoDate = parseDateToIso(article.publishedAt);
    const isoModDate = parseDateToIso(article.updatedAt || article.publishedAt);

    // Ajusta referências relativas de "../assets/" para "../../assets/" e "../favicon.svg" para "../../favicon.svg"
    let pageHtml = templateHtml
      .replace(/\.\.\/assets\//g, '../../assets/')
      .replace(/\.\.\/favicon\.svg/g, '../../favicon.svg');

    // Garante a presença da Google tag oficial (GA4: G-FVHPGPZTSL) sem duplicação
    if (!pageHtml.includes('G-FVHPGPZTSL')) {
      const gaTagSnippet = `    <!-- Google tag (gtag.js) -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=G-FVHPGPZTSL"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n\n      gtag('config', 'G-FVHPGPZTSL');\n    </script>`;
      pageHtml = pageHtml.replace(/<head>/i, `<head>\n${gaTagSnippet}`);
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
      () => `<meta property="og:type" content="article" />\n    <meta property="article:published_time" content="${isoDate}" />\n    <meta property="article:section" content="${escapeHtml(article.category)}" />`
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
      "description": article.summary,
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

    pageHtml = pageHtml.replace(
      /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i,
      () => `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n    </script>`
    );

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
            <p style="font-size:16px;line-height:1.6;font-weight:600;color:#334155;background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;">${escapeHtml(article.summary)}</p>
            <div style="font-size:12px;color:#64748b;margin-bottom:24px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
              <span><strong>Fonte:</strong> ${escapeHtml(article.source)}</span> &middot; 
              <span>Publicado em ${escapeHtml(article.publishedAt)}</span>
            </div>
            ${
              article.content && article.content.length > 0
                ? article.content.map(p => `<p style="font-size:15px;line-height:1.7;color:#1e293b;margin-bottom:16px;">${escapeHtml(p)}</p>`).join('')
                : `<p style="font-size:13px;color:#64748b;font-style:italic;margin-bottom:20px;">Esta é uma súmula factual oficial distribuída por ${escapeHtml(article.source)}. Acesse a matéria original para conferir documentos e anexos completos.</p>`
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

  console.log(`Sucesso: ${generatedCount} páginas individuais de notícias geradas em dist/noticias/[id]/index.html`);

  // Gera o sitemap.xml atualizado incluindo seções canônicas e todos os artigos
  generateSitemap(generatedArticles);
}

main();
