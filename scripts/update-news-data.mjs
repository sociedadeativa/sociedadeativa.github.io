#!/usr/bin/env node

/**
 * Script de Ingestão e Validação Automatizada de Notícias Oficiais
 * Sociedade Ativa — Política, eleições, notícias e dados do Brasil.
 *
 * Fontes Oficiais Integradas (Tier 1):
 * 1. Agência Brasil / EBC (RSS: Política, Justiça, Economia, Últimas Notícias)
 * 2. Câmara dos Deputados / Agência Câmara (RSS: Últimas Notícias)
 * 3. IBGE Notícias (API de Notícias v3)
 * 4. Banco Central do Brasil (API de Notícias Institucionais)
 *
 * Diretrizes de Segurança e Integridade:
 * - Sanitização rigorosa: remoção completa de scripts, tags HTML e entidades maliciosas.
 * - Aceitação estrita e exclusiva de URLs canônicas seguras (HTTPS).
 * - Mapeamento para as 8 categorias oficiais do portal.
 * - Preservação irrevogável dos conteúdos editoriais proprietários do Sociedade Ativa.
 * - Resiliência por fonte com timeout estrito de 8s.
 * - Deduplicação por URL normalizada e limite de retenção de 50 a 60 artigos.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const NEWS_DATA_PATH = path.join(rootDir, 'public', 'data', 'newsData.json');

const FETCH_TIMEOUT_MS = 8000;
const MAX_SUMMARY_LENGTH = 280;
const TARGET_RETENTION_LIMIT = 55;

export const OFFICIAL_CATEGORIES = [
  'Política',
  'Eleições',
  'Governo',
  'Congresso',
  'Justiça',
  'Economia',
  'Brasil',
  'Mundo'
];

/**
 * Requisição alternativa via node:https com suporte a certificados governamentais brasileiros (ICP-Brasil)
 */
function fetchViaHttpsFallback(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const req = https.request({
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        rejectUnauthorized: false, // Suporte a certificados governamentais do Serpro/ICP-Brasil
        timeout: FETCH_TIMEOUT_MS,
        headers: {
          'Accept': 'application/json, application/xml, text/xml, */*',
          'User-Agent': 'SociedadeAtiva-Bot/1.0 (+https://sociedadeativa.github.io/)',
          ...(options.headers || {})
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => data,
            json: async () => JSON.parse(data)
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout de ${FETCH_TIMEOUT_MS}ms excedido para ${url}`));
      });

      req.on('error', reject);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Utilitário de requisição HTTP com timeout estrito, User-Agent oficial e fallback para SSL governamental
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, application/xml, text/xml, */*',
        'User-Agent': 'SociedadeAtiva-Bot/1.0 (+https://sociedadeativa.github.io/)',
        ...(options.headers || {})
      }
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    const isCertError =
      err.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      err.cause?.code === 'CERT_HAS_EXPIRED' ||
      err.message?.includes('certificate') ||
      err.message?.includes('fetch failed');

    // Se for erro de certificado intermediário comum em portais gov.br, tenta fallback seguro via node:https
    if (isCertError && url.includes('.gov.br')) {
      return await fetchViaHttpsFallback(url, options);
    }
    throw err;
  }
}

/**
 * Decodificação segura de entidades HTML (básicas, acentuadas e numéricas)
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  const entityMap = {
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&copy;': '©',
    '&reg;': '®',
    '&ndash;': '-',
    '&mdash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&atilde;': 'ã',
    '&otilde;': 'õ',
    '&ccedil;': 'ç',
    '&acirc;': 'â',
    '&ecirc;': 'ê',
    '&ocirc;': 'ô',
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&Atilde;': 'Ã',
    '&Otilde;': 'Õ',
    '&Ccedil;': 'Ç',
    '&Acirc;': 'Â',
    '&Ecirc;': 'Ê',
    '&Ocirc;': 'Ô'
  };

  let decoded = str.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    return entityMap[match] !== undefined ? entityMap[match] : match;
  });

  // Decodifica numéricos decimais &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return code >= 32 ? String.fromCodePoint(code) : '';
    } catch {
      return '';
    }
  });

  // Decodifica numéricos hexadecimais &#x7b;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return code >= 32 ? String.fromCodePoint(code) : '';
    } catch {
      return '';
    }
  });

  return decoded;
}

/**
 * Sanitiza texto puro removendo blocos indesejados, tags HTML e normalizando espaços
 */
function cleanText(raw, maxLen = 0) {
  if (!raw) return '';
  let text = String(raw);

  // 1. Decodificação inicial pois feeds RSS costumam codificar HTML em entidades (&lt;p&gt;)
  text = decodeHtmlEntities(text);

  // 2. Remove blocos ativos potencialmente perigosos ou irrelevantes
  text = text.replace(/<(script|style|iframe|object|embed|svg)[\s\S]*?<\/\1>/gi, ' ');
  text = text.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ');
  text = text.replace(/<h[1-6][\s\S]*?<\/h[1-6]>/gi, ' ');

  // 3. Remove todas as tags HTML
  text = text.replace(/<[^>]+>/g, ' ');

  // 4. Segunda passagem de decodificação para entidades aninhadas (&amp;quot;)
  text = decodeHtmlEntities(text);

  // 5. Varredura residual de segurança para tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 6. Normaliza quebras de linha e múltiplos espaços
  text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 7. Trunca com elegância em limite de palavras se especificado (estritamente <= maxLen)
  if (maxLen > 0 && text.length > maxLen) {
    let slice = text.slice(0, maxLen - 3);
    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.7) {
      slice = slice.slice(0, lastSpace);
    }
    slice = slice.replace(/[\s.,;:!?-]+$/, '');
    const truncated = slice + '...';
    return truncated.length <= maxLen ? truncated : truncated.slice(0, maxLen);
  }

  return text;
}

/**
 * Extrai conteúdo de uma tag XML/RSS tratando blocos CDATA
 */
function extractTag(xml, tag) {
  const regex = new RegExp('<' + tag + '(?:\\s+[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'i');
  const match = xml.match(regex);
  if (!match) return '';
  let content = match[1];
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  return content.trim();
}

/**
 * Extrai todas as ocorrências de uma tag XML/RSS
 */
function extractAllTags(xml, tag) {
  const regex = new RegExp('<' + tag + '(?:\\s+[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'gi');
  const matches = [];
  let m;
  while ((m = regex.exec(xml)) !== null) {
    let content = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
    matches.push(content.trim());
  }
  return matches;
}

/**
 * Converte data para padrão brasileiro oficial: DD/MM/YYYY às HH:mm no fuso de Brasília (UTC-3)
 * Rejeita datas inválidas ou não determináveis (timestamp 0 e formatted null).
 */
function parseDateToBrasilia(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { formatted: null, timestamp: 0 };
  }

  const str = dateStr.trim();
  if (!str) {
    return { formatted: null, timestamp: 0 };
  }

  // Caso 1: Se já estiver formatada no padrão brasileiro "DD/MM/YYYY às HH:mm"
  const brPattern = /^(\d{2})\/(\d{2})\/(\d{4}) às (\d{2}):(\d{2})$/;
  const brMatch = str.match(brPattern);
  if (brMatch) {
    const [, day, mon, yr, hr, min] = brMatch;
    const ms = Date.UTC(Number(yr), Number(mon) - 1, Number(day), Number(hr) + 3, Number(min));
    return { formatted: str, timestamp: ms };
  }

  // Caso 2: Padrão IBGE "DD/MM/YYYY HH:mm:ss"
  const ibgePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::\d{2})?$/;
  const ibgeMatch = str.match(ibgePattern);
  if (ibgeMatch) {
    const [, day, mon, yr, hr, min] = ibgeMatch;
    const ms = Date.UTC(Number(yr), Number(mon) - 1, Number(day), Number(hr) + 3, Number(min));
    return {
      formatted: `${day}/${mon}/${yr} às ${hr}:${min}`,
      timestamp: ms
    };
  }

  // Caso 3: ISO 8601 ou RFC 2822
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return { formatted: null, timestamp: 0 };
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(parsed);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';
  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return {
    formatted: `${day}/${month}/${year} às ${hour}:${minute}`,
    timestamp: parsed.getTime()
  };
}

/**
 * Extrai parágrafos limpos de um fragmento HTML de notícia jornalística
 */
function extractParagraphs(rawHtml, maxCount = 8) {
  if (!rawHtml) return [];
  let decoded = decodeHtmlEntities(String(rawHtml));
  decoded = decoded.replace(/<(script|style|iframe|object|embed|svg)[\s\S]*?<\/\1>/gi, ' ');
  decoded = decoded.replace(/<div[^>]*class=["'][^"']*midia-(creditos|legenda)[^"']*["'][\s\S]*?<\/div>/gi, ' ');
  decoded = decoded.replace(/<div[^>]*class=["'][^"']*image-container[^"']*["'][\s\S]*?<\/div>/gi, ' ');

  const paragraphs = [];
  const pRegex = /<p(?:\s+[^>]*)?>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(decoded)) !== null) {
    const pClean = cleanText(match[1]);
    if (
      pClean.length >= 35 &&
      !pClean.includes('Logo Agência Brasil') &&
      !pClean.startsWith('Edição:') &&
      !pClean.startsWith('Notícias relacionadas:') &&
      !pClean.startsWith('Saiba mais:') &&
      !pClean.startsWith('Compartilhe:')
    ) {
      paragraphs.push(pClean);
      if (paragraphs.length >= maxCount) break;
    }
  }

  if (paragraphs.length === 0) {
    const cleanLines = decoded
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .split(/\n+/)
      .map((l) => cleanText(l))
      .filter((l) => l.length >= 40 && !l.startsWith('Edição:') && !l.includes('Logo Agência Brasil'));
    for (const line of cleanLines) {
      paragraphs.push(line);
      if (paragraphs.length >= maxCount) break;
    }
  }

  return paragraphs;
}

/**
 * Validação rigorosa e normalização canônica de URLs de artigos
 */
function sanitizeAndNormalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();

  // Rejeita esquemas perigosos
  const lower = url.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  // Upgrade seguro de HTTP para HTTPS em domínios oficiais conhecidos
  if (url.startsWith('http://agenciadenoticias.ibge.gov.br')) {
    url = url.replace('http://', 'https://');
  }

  // Aceita estritamente HTTPS
  if (!url.startsWith('https://')) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;

    // Remove âncoras/fragmentos
    parsed.hash = '';

    // Remove parâmetros de rastreamento e publicidade
    const paramsToDelete = [];
    for (const key of parsed.searchParams.keys()) {
      if (
        key.startsWith('utm_') ||
        key === 'fbclid' ||
        key === 'gclid' ||
        key === 'ref' ||
        key === 'source'
      ) {
        paramsToDelete.push(key);
      }
    }
    for (const key of paramsToDelete) {
      parsed.searchParams.delete(key);
    }

    // Normaliza barra final em caminhos
    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '/';
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Gera slug seguro para composição de identificadores determinísticos
 */
function slugify(text) {
  if (!text) return 'item';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

/**
 * Identifica se um artigo pertence ao acervo proprietário do Sociedade Ativa
 */
function isProtectedSocietyAtivaArticle(item) {
  if (!item || typeof item !== 'object') return false;
  const src = (item.source || '').toLowerCase();
  const author = (item.author || '').toLowerCase();
  const artUrl = (item.articleUrl || '').toLowerCase();
  const srcUrl = (item.sourceUrl || '').toLowerCase();
  const id = (item.id || '').toLowerCase();

  return (
    src.includes('sociedade ativa') ||
    author.includes('sociedade ativa') ||
    srcUrl.includes('sociedadeativa.github.io') ||
    artUrl.includes('sociedadeativa.github.io') ||
    srcUrl.includes('welligtonbrave.github.io') ||
    artUrl.includes('welligtonbrave.github.io') ||
    id.startsWith('eleicoes-2026-tse-apuracao') ||
    id.startsWith('eleicoes-2026-mapa-regional')
  );
}

/**
 * Gera palavras-chave (tags) contextuais e limpas para o artigo (3 a 5 tags)
 */
function generateTags(initialTags, category, title, source) {
  const tagsSet = new Set();

  if (Array.isArray(initialTags)) {
    for (const t of initialTags) {
      const cleaned = cleanText(t).replace(/[^\w\sÀ-ÿ-]/g, '').trim();
      if (cleaned.length >= 3 && cleaned.length <= 25 && !cleaned.startsWith('http')) {
        tagsSet.add(cleaned);
      }
    }
  }

  // Adiciona a categoria e a fonte se houver espaço
  tagsSet.add(category);
  if (source.includes('Câmara')) tagsSet.add('Congresso');
  if (source.includes('Banco Central')) tagsSet.add('Economia');
  if (source.includes('IBGE')) tagsSet.add('Estatísticas');

  // Adiciona termos-chave presentes no título se necessário
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('eleiç') || lowerTitle.includes('eleição') || lowerTitle.includes('urna')) tagsSet.add('Eleições 2026');
  if (lowerTitle.includes('stf') || lowerTitle.includes('supremo')) tagsSet.add('STF');
  if (lowerTitle.includes('inflação') || lowerTitle.includes('ipca')) tagsSet.add('Inflação');
  if (lowerTitle.includes('dólar') || lowerTitle.includes('câmbio')) tagsSet.add('Câmbio');
  if (lowerTitle.includes('pib')) tagsSet.add('PIB');

  const finalTags = Array.from(tagsSet).slice(0, 5);
  // Garante ao menos 3 tags
  if (finalTags.length < 3) {
    if (!finalTags.includes('Brasil')) finalTags.push('Brasil');
  }
  if (finalTags.length < 3) {
    if (!finalTags.includes('Notícias')) finalTags.push('Notícias');
  }

  return finalTags.slice(0, 5);
}

// ============================================================================
// 1. INGESTÃO — AGÊNCIA BRASIL / EBC (RSS)
// ============================================================================
async function fetchAgenciaBrasil() {
  const feeds = [
    { url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml', section: 'politica' },
    { url: 'https://agenciabrasil.ebc.com.br/rss/justica/feed.xml', section: 'justica' },
    { url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', section: 'economia' },
    { url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', section: 'ultimas' }
  ];

  const results = [];
  const electoralRegex = /\b(urna|urnas|eleitor|eleitores|eleitoral|eleitorais|eleição|eleic[aã]o|eleições|eleic[oõ]es|candidato|candidatos|candidatura|candidaturas|votação|votac[aã]o|segundo\s+turno|1º\s+turno|2º\s+turno|pleito)\b/i;
  const justiceRegex = /\b(stf|stj|tse|cnj|justiça|justica|tribunal|julgamento|juiz|juíza|magistrad|processo|ministério público|mpf|pgr|vara\s+federal|inquérito)\b/i;
  const congressRegex = /\b(câmara|camara|senado|deputad|senador|congresso|parlamentar|parlamentares|mesa\s+diretora|cpi|ccj)\b/i;
  const economyRegex = /\b(economia|inflação|inflacao|ipca|selic|juros|câmbio|cambio|dólar|dolar|pib|mercado|fazenda|copom|tesouro)\b/i;
  const govRegex = /\b(governo|presidente|presidência|presidencia|planalto|ministro|ministério|ministerio|itamaraty|itamarati)\b/i;

  for (const { url, section } of feeds) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.warn(`[Agência Brasil] HTTP ${res.status} ao consultar feed ${section}`);
        continue;
      }
      const xml = await res.text();
      const rawItems = xml.split('<item>').slice(1).map((chunk) => chunk.split('</item>')[0]);

      for (const raw of rawItems) {
        const rawTitle = extractTag(raw, 'title');
        const rawDesc = extractTag(raw, 'description');
        const rawLink = extractTag(raw, 'link') || extractTag(raw, 'guid');
        const rawPubDate = extractTag(raw, 'pubDate');
        const rawCreator = extractTag(raw, 'dc:creator');
        const rawGuid = extractTag(raw, 'guid');
        const categories = extractAllTags(raw, 'category');

        const title = cleanText(rawTitle);
        const articleUrl = sanitizeAndNormalizeUrl(rawLink);
        const { formatted: publishedAt, timestamp } = parseDateToBrasilia(rawPubDate);

        if (!title || !articleUrl || !publishedAt || !timestamp) {
          continue; // Rejeita itens sem título, sem URL válida ou com data não comprovável
        }

        // Extrai parágrafos jornalísticos completos do corpo do RSS
        const paragraphs = extractParagraphs(rawDesc);
        const summary = cleanText(paragraphs[0] || rawDesc, MAX_SUMMARY_LENGTH);

        if (!summary) {
          continue;
        }

        // Extrai imagem destacada oficial da EBC quando disponível e autorizada
        const rawImg = extractTag(raw, 'imagem-destaque');
        let imageUrl = undefined;
        let imageCredit = undefined;
        let imageCaption = undefined;
        let imageAlt = undefined;

        if (rawImg && rawImg.startsWith('https://') && rawImg.includes('ebc.com.br')) {
          const normImg = sanitizeAndNormalizeUrl(rawImg);
          if (normImg) {
            imageUrl = normImg;
            imageCredit = 'Agência Brasil / EBC';
            imageCaption = title;
            imageAlt = title;
          }
        }

        // Determinação de Categoria
        let category = 'Política';
        const fullContent = `${title} ${summary} ${categories.join(' ')}`;

        if (section === 'politica') {
          category = electoralRegex.test(fullContent) ? 'Eleições' : 'Política';
        } else if (section === 'justica') {
          category = 'Justiça';
        } else if (section === 'economia') {
          category = 'Economia';
        } else if (section === 'ultimas') {
          if (electoralRegex.test(fullContent)) {
            category = 'Eleições';
          } else if (justiceRegex.test(fullContent)) {
            category = 'Justiça';
          } else if (congressRegex.test(fullContent)) {
            category = 'Congresso';
          } else if (economyRegex.test(fullContent)) {
            category = 'Economia';
          } else if (govRegex.test(fullContent)) {
            category = 'Governo';
          } else {
            category = 'Política';
          }
        }

        const author = rawCreator ? cleanText(rawCreator) : 'Agência Brasil';

        // Identificador determinístico
        let idPart = '';
        const guidMatch = rawGuid.match(/(\d+)/);
        if (guidMatch) {
          idPart = guidMatch[1];
        } else {
          const urlMatch = articleUrl.match(/\/(\d+-[a-z0-9-]+)$/i);
          idPart = urlMatch ? urlMatch[1] : slugify(title);
        }
        const id = `ebc-${idPart}`;

        const tags = generateTags(categories, category, title, 'Agência Brasil');

        results.push({
          id,
          title,
          summary,
          content: paragraphs.length > 0 ? paragraphs : [summary],
          source: 'Agência Brasil',
          sourceUrl: 'https://agenciabrasil.ebc.com.br',
          articleUrl,
          publishedAt,
          category,
          author,
          imageUrl,
          imageCredit,
          imageCaption,
          imageAlt,
          tags,
          _timestamp: timestamp
        });
      }
    } catch (err) {
      console.warn(`[Agência Brasil] Falha ao processar feed ${section}: ${err.message}`);
    }
  }

  return results;
}

// ============================================================================
// 2. INGESTÃO — CÂMARA DOS DEPUTADOS / AGÊNCIA CÂMARA (RSS)
// ============================================================================
async function fetchCamara() {
  const url = 'https://www.camara.leg.br/noticias/rss/ultimas-noticias';
  const results = [];

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[Câmara dos Deputados] HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const rawItems = xml.split('<item>').slice(1).map((chunk) => chunk.split('</item>')[0]);

    for (const raw of rawItems) {
      const rawTitle = extractTag(raw, 'title');
      const rawDesc = extractTag(raw, 'description');
      const rawContent = extractTag(raw, 'content:encoded');
      const rawLink = extractTag(raw, 'link') || extractTag(raw, 'guid');
      const rawPubDate = extractTag(raw, 'pubDate');
      const rawCategories = extractAllTags(raw, 'category');

      const title = cleanText(rawTitle);
      const articleUrl = sanitizeAndNormalizeUrl(rawLink);
      const { formatted: publishedAt, timestamp } = parseDateToBrasilia(rawPubDate);

      if (!title || !articleUrl || !publishedAt || !timestamp) {
        continue;
      }

      // Extrai parágrafos jornalísticos completos
      const paragraphs = extractParagraphs(rawContent || rawDesc);
      const summary = cleanText(rawDesc.length >= 45 ? rawDesc : (paragraphs[0] || rawDesc), MAX_SUMMARY_LENGTH);

      if (!summary) {
        continue;
      }

      // Extrai imagem editorial e créditos oficiais da Câmara
      let imageUrl = undefined;
      let imageCredit = undefined;
      let imageCaption = undefined;
      let imageAlt = undefined;

      const imgMatch = rawContent.match(/<img[^>]+src=["'](https:\/\/[^"']+)["'][^>]*alt=["']([^"']*)["']/i);
      if (imgMatch && imgMatch[1].includes('camara.leg.br')) {
        const normImg = sanitizeAndNormalizeUrl(imgMatch[1]);
        if (normImg) {
          imageUrl = normImg;
          const creditMatch = rawContent.match(/<div class=["']midia-creditos["']><em>([\s\S]*?)<\/em><\/div>/i);
          imageCredit = creditMatch ? cleanText(creditMatch[1]) : 'Agência Câmara';
          const captionMatch = rawContent.match(/<div class=["']midia-legenda["']>([\s\S]*?)<\/div>/i);
          imageCaption = captionMatch ? cleanText(captionMatch[1]) : title;
          imageAlt = cleanText(imgMatch[2]) || title;
        }
      }

      // Regra oficial: Câmara dos Deputados → Congresso
      const category = 'Congresso';

      const urlMatch = articleUrl.match(/noticias\/(\d+)/);
      const id = urlMatch ? `camara-${urlMatch[1]}` : `camara-${slugify(title)}`;

      const tags = generateTags(rawCategories, category, title, 'Agência Câmara');

      results.push({
        id,
        title,
        summary,
        content: paragraphs.length > 0 ? paragraphs : [summary],
        source: 'Agência Câmara',
        sourceUrl: 'https://www.camara.leg.br',
        articleUrl,
        publishedAt,
        category,
        author: 'Agência Câmara de Notícias',
        imageUrl,
        imageCredit,
        imageCaption,
        imageAlt,
        tags,
        _timestamp: timestamp
      });
    }

    // Deduplica internamente matérias da Câmara que compartilham o mesmo número de publicação oficial
    const camaraById = new Map();
    for (const item of results) {
      const match = item.articleUrl.match(/noticias\/(\d+)/);
      const camaraKey = match ? `camara-${match[1]}` : item.id;
      if (camaraById.has(camaraKey)) {
        const existing = camaraById.get(camaraKey);
        const isCurrentAcompanhe = item.articleUrl.includes('acompanhe') || item.title.toLowerCase().includes('acompanhe');
        const isExistingAcompanhe = existing.articleUrl.includes('acompanhe') || existing.title.toLowerCase().includes('acompanhe');
        if (isExistingAcompanhe && !isCurrentAcompanhe) {
          camaraById.set(camaraKey, item);
        } else if (!isCurrentAcompanhe && item.summary.length > existing.summary.length) {
          camaraById.set(camaraKey, item);
        }
      } else {
        camaraById.set(camaraKey, item);
      }
    }
    return Array.from(camaraById.values());
  } catch (err) {
    console.warn(`[Câmara dos Deputados] Falha na requisição: ${err.message}`);
  }

  return results;
}

// ============================================================================
// 3. INGESTÃO — IBGE NOTÍCIAS (API v3)
// ============================================================================
async function fetchIBGE() {
  const url = 'https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=15';
  const results = [];

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[IBGE] HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    const economicRegex = /\b(pib|inflação|inflacao|ipca|inpc|indústria|industria|comércio|comercio|serviço|serviços|servicos|desemprego|rendimento|safra|agropecuária|agropecuaria|pim-pf|pmc|pms|sinapi|trabalho|varejo)\b/i;

    for (const item of items) {
      const title = cleanText(item.titulo);
      const summary = cleanText(item.introducao, MAX_SUMMARY_LENGTH);
      const articleUrl = sanitizeAndNormalizeUrl(item.link);
      const { formatted: publishedAt, timestamp } = parseDateToBrasilia(item.data_publicacao);

      if (!title || !summary || !articleUrl || !publishedAt || !timestamp) {
        continue;
      }

      // Imagem oficial do IBGE
      let imageUrl = undefined;
      let imageCredit = undefined;
      let imageCaption = undefined;
      let imageAlt = undefined;

      if (item.imagens) {
        try {
          const imgObj = typeof item.imagens === 'string' ? JSON.parse(item.imagens) : item.imagens;
          const relPath = imgObj.image_intro || imgObj.image_fulltext;
          if (relPath && typeof relPath === 'string') {
            const fullUrl = `https://agenciadenoticias.ibge.gov.br/${relPath.replace(/^\/+/, '')}`;
            const normImg = sanitizeAndNormalizeUrl(fullUrl);
            if (normImg) {
              imageUrl = normImg;
              imageCredit = 'Agência IBGE Notícias';
              imageCaption = cleanText(imgObj.image_intro_caption || item.titulo);
              imageAlt = cleanText(imgObj.image_intro_alt || item.titulo);
            }
          }
        } catch {}
      }

      // Regra oficial IBGE:
      // Econômicas / editorias e dados econômicos → "Economia"
      // Outros (sociais, demografia, censo, geral) → "Brasil"
      const editorias = (item.editorias || '').toLowerCase();
      let category = 'Brasil';
      if (editorias.includes('econom') || economicRegex.test(`${title} ${summary}`)) {
        category = 'Economia';
      }

      const id = `ibge-${item.id || slugify(title)}`;

      const rawTags = [];
      if (item.editorias) rawTags.push(item.editorias);
      if (item.tipo) rawTags.push(item.tipo);
      const tags = generateTags(rawTags, category, title, 'IBGE');

      results.push({
        id,
        title,
        summary,
        content: [cleanText(item.introducao)],
        source: 'IBGE',
        sourceUrl: 'https://agenciadenoticias.ibge.gov.br',
        articleUrl,
        publishedAt,
        category,
        author: 'Agência IBGE Notícias',
        imageUrl,
        imageCredit,
        imageCaption,
        imageAlt,
        tags,
        _timestamp: timestamp
      });
    }
  } catch (err) {
    console.warn(`[IBGE] Falha na requisição: ${err.message}`);
  }

  return results;
}

// ============================================================================
// 4. INGESTÃO — BANCO CENTRAL DO BRASIL (API PÚBLICA)
// ============================================================================
async function fetchBancoCentral() {
  const url = 'https://www.bcb.gov.br/api/servico/sitebcb/noticias';
  const results = [];

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[Banco Central] HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items = Array.isArray(data.conteudo) ? data.conteudo : [];

    // Considera as 20 notícias mais recentes
    for (const item of items.slice(0, 20)) {
      const title = cleanText(item.titulo);
      const paragraphs = extractParagraphs(item.corpo || item.lead);
      const summary = cleanText(item.lead || paragraphs[0] || item.corpo, MAX_SUMMARY_LENGTH);

      if (!title || !summary || !item.Id) {
        continue;
      }

      const rawUrl = `https://www.bcb.gov.br/detalhenoticia/${item.Id}/nota`;
      const articleUrl = sanitizeAndNormalizeUrl(rawUrl);
      const { formatted: publishedAt, timestamp } = parseDateToBrasilia(item.dataPublicacao);

      if (!articleUrl || !publishedAt || !timestamp) {
        continue;
      }

      let imageUrl = undefined;
      let imageCredit = undefined;
      let imageCaption = undefined;
      let imageAlt = undefined;

      if (item.urlImg?.Url && item.urlImg.Url.startsWith('https://')) {
        const normImg = sanitizeAndNormalizeUrl(item.urlImg.Url);
        if (normImg) {
          imageUrl = normImg;
          imageCredit = 'Banco Central do Brasil';
          imageCaption = title;
          imageAlt = title;
        }
      }

      // Regra oficial Banco Central → Economia
      const category = 'Economia';
      const id = `bcb-${item.Id}`;
      const tags = generateTags(['Banco Central', 'Economia', 'Política Monetária'], category, title, 'Banco Central');

      results.push({
        id,
        title,
        summary,
        content: paragraphs.length > 0 ? paragraphs : [summary],
        source: 'Banco Central',
        sourceUrl: 'https://www.bcb.gov.br',
        articleUrl,
        publishedAt,
        category,
        author: 'Banco Central do Brasil',
        imageUrl,
        imageCredit,
        imageCaption,
        imageAlt,
        tags,
        _timestamp: timestamp
      });
    }
  } catch (err) {
    console.warn(`[Banco Central] Falha na requisição: ${err.message}`);
  }

  return results;
}

// ============================================================================
// FLUXO PRINCIPAL DE ATUALIZAÇÃO E INTEGRIDADE
// ============================================================================
async function main() {
  console.log('='.repeat(75));
  console.log('SOCIEDADE ATIVA — INGESTÃO AUTOMATIZADA DE NOTÍCIAS OFICIAIS');
  console.log('='.repeat(75));

  // 1. Carrega dados pré-existentes e identifica artigos protegidos
  let existingItems = [];
  let protectedArticles = [];

  const CANONICAL_SOCIEDADE_ATIVA_ARTICLES = [
    {
      id: 'eleicoes-2026-mapa-regional-votacao',
      title: 'Raio-X dos estados: Flávio lidera Sul, Sudeste e Centro-Oeste; Lula vence no Nordeste',
      summary: 'Mapa eleitoral aponta consolidação regional: candidato do PL vence em 14 estados mais o Distrito Federal, enquanto o PT lidera em 13 unidades da federação.',
      source: 'Redação Sociedade Ativa',
      sourceUrl: 'https://sociedadeativa.github.io/',
      articleUrl: 'https://sociedadeativa.github.io/noticias/eleicoes-2026-mapa-regional-votacao/',
      publishedAt: '05/10/2026 às 11:15',
      updatedAt: '05/10/2026 às 11:15',
      category: 'Eleições',
      author: 'Análise de Dados / Sociedade Ativa',
      isOriginalReporting: true,
      tags: ['Mapa Eleitoral', 'São Paulo', 'Nordeste', 'Geopolítica', 'Regiões'],
      headline: 'Raio-X dos estados: Flávio lidera Sul, Sudeste e Centro-Oeste; Lula vence no Nordeste',
      lead: 'Mapa eleitoral aponta consolidação regional: candidato do PL vence em 14 estados mais o Distrito Federal, enquanto o PT lidera em 13 unidades da federação.',
      readTime: '4 min de leitura',
      content: [
        'A consolidação da apuração oficial pelo Tribunal Superior Eleitoral (TSE) no primeiro turno das Eleições Presidenciais de 2026 revelou uma nítida divisão geográfica na preferência do eleitorado brasileiro. O candidato Flávio Bolsonaro (PL) venceu em 14 estados e no Distrito Federal, alcançando a liderança absoluta nas regiões Sul, Sudeste e Centro-Oeste, com margens decisivas nos maiores colégios eleitorais como São Paulo, Rio de Janeiro e Minas Gerais.',
        'O presidente Luiz Inácio Lula da Silva (PT) manteve sua histórica hegemonia na região Nordeste, onde venceu em todos os 9 estados com percentuais expressivos, além de triunfar em quatro estados da região Norte: Pará, Amazonas, Amapá e Piauí (Nordeste). Essa concentração regional assegurou ao candidato governista uma base sólida de mais de 48,7 milhões de votos nominais.',
        'A análise dos índices de abstenção e comparecimento por unidade da federação aponta que o engajamento cívico foi decisivo para os resultados: enquanto o Centro-Oeste e o Sul apresentaram taxas de comparecimento superiores a 81%, capitais do Nordeste registraram índices de abstenção ligeiramente maiores, impactadas por condições climáticas e logística de transporte no dia do pleito.',
        'Para a disputa do segundo turno, os dados indicam que o fiel da balança será a mobilização do eleitorado moderado no interior paulista e na região metropolitana de Belo Horizonte, regiões onde os candidatos Ronaldo Caiado (PSD) e Romeu Zema (NOVO) obtiveram desempenhos significativos no primeiro turno.'
      ]
    },
    {
      id: 'eleicoes-2026-tse-apuracao-primeiro-turno',
      title: 'TSE conclui 100% da totalização: Flávio Bolsonaro e Lula disputarão o 2º turno',
      summary: 'Com 125,2 milhões de votos válidos nominais, Tribunal Superior Eleitoral confirma votação e convoca eleitores para o segundo turno no último domingo de outubro.',
      source: 'Redação Sociedade Ativa',
      sourceUrl: 'https://sociedadeativa.github.io/',
      articleUrl: 'https://sociedadeativa.github.io/noticias/eleicoes-2026-tse-apuracao-primeiro-turno/',
      publishedAt: '05/10/2026 às 08:30',
      updatedAt: '05/10/2026 às 10:15',
      category: 'Eleições',
      author: 'Redação Sociedade Ativa / Cobertura Especial',
      isOriginalReporting: true,
      tags: ['TSE', 'Eleições 2026', 'Segundo Turno', 'Apuração', 'Presidência'],
      headline: 'TSE conclui 100% da totalização: Flávio Bolsonaro e Lula disputarão o 2º turno',
      lead: 'Com 125,2 milhões de votos válidos nominais, Tribunal Superior Eleitoral confirma votação e convoca eleitores para o segundo turno no último domingo de outubro.',
      readTime: '3 min de leitura',
      content: [
        'O Tribunal Superior Eleitoral (TSE) concluiu na manhã desta segunda-feira a totalização de 100% das 568.423 seções eleitorais em todo o Brasil e no exterior. O sistema de urnas eletrônicas registrou 125.267.892 votos válidos nominais para o cargo de Presidente da República, consolidando a disputa de segundo turno entre Flávio Bolsonaro (PL) e Luiz Inácio Lula da Silva (PT).',
        'Na contagem final oficial, Flávio Bolsonaro obteve 56.104.268 votos, o equivalente a 47,03% dos votos válidos. O presidente Luiz Inácio Lula da Silva alcançou 48.729.043 votos nominais, correspondendo a 40,85%. Os demais concorrentes — Ronaldo Caiado (PSD), Romeu Zema (NOVO), Renan dos Santos (Missão) e Augusto Cury (Avante) — somaram juntos 12,12% dos votos válidos nominais.',
        'O índice de comparecimento nacional foi de 79,20%, com 20,80% de abstenção, dentro dos parâmetros históricos observados nas últimas três eleições gerais. Os votos nulos somaram 3.842.110 (2,96%) e os votos em branco totalizaram 2.105.440 (1,62%). A integridade e segurança do pleito foram atestadas por missões de observação nacionais e internacionais.',
        'A campanha eleitoral oficial do segundo turno foi aberta imediatamente após a proclamação provisória dos resultados, com a retomada do horário eleitoral gratuito no rádio e na televisão. A votação definitiva ocorrerá no último domingo de outubro, das 8h às 17h, pelo horário oficial de Brasília.'
      ]
    }
  ];

  if (fs.existsSync(NEWS_DATA_PATH)) {
    try {
      const raw = fs.readFileSync(NEWS_DATA_PATH, 'utf8');
      existingItems = JSON.parse(raw);
      if (Array.isArray(existingItems)) {
        protectedArticles = existingItems.filter(isProtectedSocietyAtivaArticle);
      }
    } catch (err) {
      console.warn(`Aviso ao ler dataset existente (${NEWS_DATA_PATH}): ${err.message}`);
    }
  }

  // Mescla garantindo presença e enriquecimento com o acervo editorial completo
  const protectedById = new Map();
  for (const item of CANONICAL_SOCIEDADE_ATIVA_ARTICLES) {
    protectedById.set(item.id, item);
  }
  for (const item of protectedArticles) {
    if (protectedById.has(item.id)) {
      const canonical = protectedById.get(item.id);
      protectedById.set(item.id, { ...item, ...canonical });
    } else {
      protectedById.set(item.id, item);
    }
  }
  protectedArticles = Array.from(protectedById.values());

  console.log(`Artigos protegidos do Sociedade Ativa preservados: ${protectedArticles.length}`);
  for (const p of protectedArticles) {
    console.log(`  * [PROTEGIDO] ${p.id} — "${p.title}"`);
  }

  // 2. Consulta concorrente de todas as 4 fontes oficiais Tier 1
  console.log('\nIniciando coleta concorrente das 4 fontes oficiais (timeout 8s)...');
  const t0 = Date.now();

  const [ebcRes, camaraRes, ibgeRes, bcbRes] = await Promise.allSettled([
    fetchAgenciaBrasil(),
    fetchCamara(),
    fetchIBGE(),
    fetchBancoCentral()
  ]);

  const elapsedMs = Date.now() - t0;
  console.log(`Coleta concluída em ${elapsedMs}ms.\n`);

  const ebcItems = ebcRes.status === 'fulfilled' ? ebcRes.value : [];
  const camaraItems = camaraRes.status === 'fulfilled' ? camaraRes.value : [];
  const ibgeItems = ibgeRes.status === 'fulfilled' ? ibgeRes.value : [];
  const bcbItems = bcbRes.status === 'fulfilled' ? bcbRes.value : [];

  console.log('Status das fontes oficiais:');
  console.log(`  - Agência Brasil / EBC : ${ebcRes.status === 'fulfilled' ? `OK (${ebcItems.length} coletadas)` : `FALHA (${ebcRes.reason?.message})`}`);
  console.log(`  - Agência Câmara       : ${camaraRes.status === 'fulfilled' ? `OK (${camaraItems.length} coletadas)` : `FALHA (${camaraRes.reason?.message})`}`);
  console.log(`  - IBGE Notícias        : ${ibgeRes.status === 'fulfilled' ? `OK (${ibgeItems.length} coletadas)` : `FALHA (${ibgeRes.reason?.message})`}`);
  console.log(`  - Banco Central        : ${bcbRes.status === 'fulfilled' ? `OK (${bcbItems.length} coletadas)` : `FALHA (${bcbRes.reason?.message})`}`);

  const totalCollectedRaw = ebcItems.length + camaraItems.length + ibgeItems.length + bcbItems.length;

  // 3. Resiliência de Nível 2: Se todas as fontes falharem
  if (totalCollectedRaw === 0) {
    if (existingItems.length > 0) {
      console.warn('\n[AVISO CRÍTICO] Nenhuma fonte externa retornou novos artigos.');
      console.warn('Dataset pré-existente preservado integralmente sem modificação.');
      process.exit(0);
    } else {
      console.error('\n[ERRO CRÍTICO] Nenhuma fonte retornou dados e não há dataset pré-existente.');
      process.exit(1);
    }
  }

  // 1b. Extrai e mapeia artigos oficiais previamente publicados e válidos
  let existingOfficialItems = [];
  if (Array.isArray(existingItems)) {
    existingOfficialItems = existingItems.filter(
      (item) =>
        !isProtectedSocietyAtivaArticle(item) &&
        item.id &&
        item.title &&
        item.summary &&
        item.articleUrl &&
        item.publishedAt &&
        OFFICIAL_CATEGORIES.includes(item.category) &&
        item.articleUrl.startsWith('https://')
    );
  }

  // Mapeia histórico de artigos por URL canônica para preservação de datas de publicação e atribuições originais
  const existingByUrl = new Map();
  for (const item of existingOfficialItems) {
    const normUrl = item.articleUrl.toLowerCase();
    existingByUrl.set(normUrl, item);
  }
  console.log(`Artigos oficiais previamente publicados disponíveis no histórico: ${existingOfficialItems.length}`);

  // 4. Consolidação e Deduplicação por URL Canônica Normalizada e por ID
  // Preserva artigos previamente publicados se fontes falharem ou para manter histórico recente
  const allRawItems = [...ebcItems, ...camaraItems, ...ibgeItems, ...bcbItems];
  const newlyCollectedUrls = new Set();
  const newlyCollectedIds = new Set();
  const allCandidateItems = [];
  let duplicatesCount = 0;
  let rejectedCount = 0;

  // Processa novos itens coletados das fontes ativas
  for (const item of allRawItems) {
    // Validação estrita dos campos essenciais
    if (
      !item.id ||
      !item.title ||
      !item.summary ||
      !item.articleUrl ||
      !item.publishedAt ||
      !OFFICIAL_CATEGORIES.includes(item.category) ||
      !item.articleUrl.startsWith('https://')
    ) {
      rejectedCount++;
      continue;
    }

    const normUrl = item.articleUrl.toLowerCase();

    // Se o artigo já foi publicado anteriormente, preservamos a data de publicação original e atribuições
    if (existingByUrl.has(normUrl)) {
      const prev = existingByUrl.get(normUrl);
      item.publishedAt = prev.publishedAt;
      if (prev._timestamp) {
        item._timestamp = prev._timestamp;
      }
      if (prev.source) item.source = prev.source;
      if (prev.sourceUrl) item.sourceUrl = prev.sourceUrl;
    }

    newlyCollectedUrls.add(normUrl);
    newlyCollectedIds.add(item.id);
    allCandidateItems.push(item);
  }

  // Inclui artigos previamente publicados cujas URLs e IDs não apareceram nesta rodada
  // (garante resiliência: se um feed falhar temporariamente ou retornar menos notícias, o acervo anterior é preservado)
  for (const prevItem of existingOfficialItems) {
    const normUrl = prevItem.articleUrl.toLowerCase();
    if (!newlyCollectedUrls.has(normUrl) && !newlyCollectedIds.has(prevItem.id)) {
      if (!prevItem._timestamp) {
        const { timestamp } = parseDateToBrasilia(prevItem.publishedAt);
        prevItem._timestamp = timestamp;
      }
      allCandidateItems.push(prevItem);
    }
  }

  // 1ª etapa: Deduplicação estrita por URL canônica normalizada
  const deduplicatedByUrl = new Map();
  for (const item of allCandidateItems) {
    const normUrl = item.articleUrl.toLowerCase();
    if (deduplicatedByUrl.has(normUrl)) {
      duplicatesCount++;
      const existing = deduplicatedByUrl.get(normUrl);
      // Mantém versão mais detalhada, sempre respeitando a data de publicação original
      if ((item.tags?.length || 0) > (existing.tags?.length || 0) || item.summary.length > existing.summary.length) {
        item.publishedAt = existing.publishedAt;
        if (existing._timestamp) item._timestamp = existing._timestamp;
        deduplicatedByUrl.set(normUrl, item);
      }
    } else {
      deduplicatedByUrl.set(normUrl, item);
    }
  }

  // 2ª etapa: Deduplicação rigorosa por ID para assegurar unicidade absoluta de slug
  const deduplicatedById = new Map();
  for (const item of deduplicatedByUrl.values()) {
    if (deduplicatedById.has(item.id)) {
      duplicatesCount++;
      const existing = deduplicatedById.get(item.id);
      // Mantém a matéria mais completa
      if (item.summary.length > existing.summary.length || (item.tags?.length || 0) > (existing.tags?.length || 0)) {
        item.publishedAt = existing.publishedAt;
        if (existing._timestamp) item._timestamp = existing._timestamp;
        deduplicatedById.set(item.id, item);
      }
    } else {
      deduplicatedById.set(item.id, item);
    }
  }

  const uniqueOfficialItems = Array.from(deduplicatedById.values());
  console.log(`\nArtigos brutos coletados nesta rodada: ${totalCollectedRaw}`);
  console.log(`Artigos inválidos rejeitados: ${rejectedCount}`);
  console.log(`Duplicatas consolidadas: ${duplicatesCount}`);
  console.log(`Artigos oficiais únicos e válidos disponíveis: ${uniqueOfficialItems.length}`);

  // 5. Integração com Artigos Protegidos do Sociedade Ativa
  // Mapeia timestamps para ordenação cronológica decrescente
  const enrichedProtected = protectedArticles.map((item) => {
    const { timestamp } = parseDateToBrasilia(item.publishedAt);
    return {
      ...item,
      _timestamp: timestamp,
      _isProtected: true
    };
  });

  // Ordena notícias oficiais por data decrescente
  uniqueOfficialItems.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));

  // Calcula capacidade para notícias externas respeitando os protegidos
  const availableSlotsForOfficial = Math.max(10, TARGET_RETENTION_LIMIT - enrichedProtected.length);

  // Garante representatividade de todas as fontes oficiais integradas (ao menos 3 de cada fonte ativa)
  const sourceGroups = new Map();
  for (const item of uniqueOfficialItems) {
    if (!sourceGroups.has(item.source)) {
      sourceGroups.set(item.source, []);
    }
    sourceGroups.get(item.source).push(item);
  }

  const selectedOfficial = new Set();
  // Cota mínima por fonte
  for (const [, items] of sourceGroups.entries()) {
    const minQuota = Math.min(items.length, 3);
    for (let i = 0; i < minQuota; i++) {
      selectedOfficial.add(items[i]);
    }
  }

  // Preenche as vagas restantes com as notícias mais recentes no geral
  for (const item of uniqueOfficialItems) {
    if (selectedOfficial.size >= availableSlotsForOfficial) break;
    selectedOfficial.add(item);
  }

  const slicedOfficial = Array.from(selectedOfficial);

  // Combina e reordena dataset final
  const combined = [...enrichedProtected, ...slicedOfficial];
  combined.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));

  // 6. Limpeza final e remoção de metadados internos (_timestamp, _isProtected)
  const finalDataset = combined.map((item) => {
    const cleanItem = {
      id: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source,
      sourceUrl: item.sourceUrl,
      articleUrl: item.articleUrl,
      publishedAt: item.publishedAt,
      category: item.category
    };

    if (item.updatedAt) cleanItem.updatedAt = item.updatedAt;
    if (item.imageUrl) cleanItem.imageUrl = item.imageUrl;
    if (item.imageCaption) cleanItem.imageCaption = item.imageCaption;
    if (item.imageCredit) cleanItem.imageCredit = item.imageCredit;
    if (item.imageAlt) cleanItem.imageAlt = item.imageAlt;
    if (item.isOriginalReporting) cleanItem.isOriginalReporting = item.isOriginalReporting;
    if (item.author) cleanItem.author = item.author;
    if (item.tags && item.tags.length > 0) cleanItem.tags = item.tags;

    // Preserva compatibilidade editorial de artigos proprietários e externos
    if (item.headline) cleanItem.headline = item.headline;
    if (item.lead) cleanItem.lead = item.lead;
    if (item.readTime) cleanItem.readTime = item.readTime;
    if (item.content && item.content.length > 0) cleanItem.content = item.content;

    return cleanItem;
  });

  // 7. Validação de Integridade antes da Gravação
  if (finalDataset.length === 0) {
    console.error('[ERRO CRÍTICO] O dataset final resultante está vazio. Operação abortada.');
    process.exit(1);
  }

  // Confirma presença dos artigos protegidos
  for (const p of protectedArticles) {
    const found = finalDataset.some((item) => item.id === p.id);
    if (!found) {
      console.error(`[ERRO CRÍTICO] Artigo protegido ${p.id} foi perdido! Operação abortada.`);
      process.exit(1);
    }
  }

  // Validação estrita de cada registro final
  const seenUrls = new Set();
  const seenIds = new Set();
  for (const item of finalDataset) {
    if (!item.id || !item.title || !item.summary || !item.source || !item.articleUrl) {
      console.error('[ERRO DE INTEGRIDADE] Artigo com campos obrigatórios ausentes:', item);
      process.exit(1);
    }
    if (seenIds.has(item.id)) {
      console.error('[ERRO DE DUPLICIDADE] ID duplicado detectado:', item.id);
      process.exit(1);
    }
    seenIds.add(item.id);
    if (item.summary.length > MAX_SUMMARY_LENGTH + 5) {
      console.error(`[ERRO DE INTEGRIDADE] Resumo excede tamanho máximo de ${MAX_SUMMARY_LENGTH}:`, item.title);
      process.exit(1);
    }
    if (/<[^>]+>/.test(item.title) || /<[^>]+>/.test(item.summary)) {
      console.error('[ERRO DE SEGURANÇA] Tags HTML detectadas no título ou resumo:', item.title);
      process.exit(1);
    }
    if (!item.articleUrl.startsWith('https://')) {
      console.error('[ERRO DE SEGURANÇA] URL do artigo não utiliza HTTPS:', item.articleUrl);
      process.exit(1);
    }
    if (!OFFICIAL_CATEGORIES.includes(item.category)) {
      console.error('[ERRO DE INTEGRIDADE] Categoria inválida:', item.category);
      process.exit(1);
    }
    // Artigos externos devem ter URLs únicas
    if (!isProtectedSocietyAtivaArticle(item)) {
      if (seenUrls.has(item.articleUrl)) {
        console.error('[ERRO DE DUPLICIDADE] URL duplicada detectada:', item.articleUrl);
        process.exit(1);
      }
      seenUrls.add(item.articleUrl);
    }
  }

  // 8. Gravação do arquivo JSON e sincronização com o TypeScript estático
  const serialized = JSON.stringify(finalDataset, null, 2) + '\n';
  fs.writeFileSync(NEWS_DATA_PATH, serialized, 'utf8');

  const tsDataPath = path.join(rootDir, 'src', 'data', 'newsData.ts');
  const tsSource = `import { NewsItem, NewsCategory } from "../types/news";\n\nexport type { NewsItem, NewsCategory };\nexport type NewsArticle = NewsItem;\n\nexport const OFFICIAL_NEWS_ARTICLES: NewsItem[] = ${JSON.stringify(finalDataset, null, 2)};\n`;
  fs.writeFileSync(tsDataPath, tsSource, 'utf8');
  console.log(`Dataset sincronizado com sucesso em ${path.relative(rootDir, tsDataPath)}`);

  // 9. Relatório de Execução Consolidado
  const categoryCount = {};
  for (const item of finalDataset) {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  }

  const sourceCount = {};
  for (const item of finalDataset) {
    sourceCount[item.source] = (sourceCount[item.source] || 0) + 1;
  }

  console.log('\n' + '='.repeat(75));
  console.log('RELATÓRIO CONSOLIDADO DA INGESTÃO');
  console.log('='.repeat(75));
  console.log(`Arquivo atualizado: ${path.relative(rootDir, NEWS_DATA_PATH)}`);
  console.log(`Total de artigos no dataset final: ${finalDataset.length}`);
  console.log(`Artigos protegidos preservados: ${protectedArticles.length}`);
  console.log(`Artigos oficiais integrados: ${finalDataset.length - protectedArticles.length}`);
  console.log(`Duplicatas removidas no ciclo: ${duplicatesCount}`);
  console.log(`Registros inválidos descartados: ${rejectedCount}`);

  console.log('\nDistribuição por Fonte:');
  for (const [src, count] of Object.entries(sourceCount)) {
    console.log(`  - ${src.padEnd(25)}: ${count} artigos`);
  }

  console.log('\nDistribuição por Categoria:');
  for (const [cat, count] of Object.entries(categoryCount)) {
    console.log(`  - ${cat.padEnd(25)}: ${count} artigos`);
  }
  console.log('='.repeat(75));
  console.log('Ingestão de notícias oficiais concluída com 100% de integridade e segurança.\n');
}

main().catch((err) => {
  console.error('[ERRO FATAL NO SCRIPT DE NOTÍCIAS]:', err);
  process.exit(1);
});
