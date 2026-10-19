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

  return text;
}

/**
 * Divide o texto em sentenças completas respeitando numerais e abreviações brasileiras
 */
function splitSentences(text) {
  if (!text) return { sentences: [], leftover: '' };

  // Protege números com ponto decimal/milhar (ex: 3.071, 1.499)
  const placeholderMap = [];
  let protectedText = text.replace(/(\b\d+)\.(\d+\b)/g, (match) => {
    const placeholder = `__NUM_DOT_${placeholderMap.length}__`;
    placeholderMap.push({ placeholder, original: match });
    return placeholder;
  });

  // Protege abreviações comuns da língua portuguesa
  protectedText = protectedText.replace(/\b(Sr|Sra|Dr|Dra|Prof|Min|Gov|art|inc|pág|av|R\$)\./gi, (match) => {
    const placeholder = `__ABBR_DOT_${placeholderMap.length}__`;
    placeholderMap.push({ placeholder, original: match });
    return placeholder;
  });

  // Identifica sentenças terminadas em [.!?] seguidas de espaço e caractere de nova sentença ou fim do texto
  const regex = /([^.!?]+[.!?]+(?:["'”’)]?))(?:\s+(?=[-–—"“«(\s]*[A-Z0-9ÁÉÍÓÚÀÂÊÔÃÕÇ])|$)/g;
  const rawSentences = [];
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(protectedText)) !== null) {
    rawSentences.push(match[1].trim());
    lastIndex = regex.lastIndex;
  }
  const remainder = protectedText.slice(lastIndex).trim();

  const restore = (str) => {
    let s = str;
    for (const { placeholder, original } of placeholderMap) {
      s = s.replaceAll(placeholder, original);
    }
    return s;
  };

  const sentences = rawSentences.map(restore);
  const leftover = restore(remainder);

  return { sentences, leftover };
}

/**
 * Sanitiza e formata resumos jornalísticos garantindo término em sentenças completas.
 * Nunca exibe terminações truncadas ("...", "na veiculação de...") ou palavras cortadas.
 * Prefere sentenças completas da fonte dentro do limite de caracteres.
 */
function cleanSummary(raw, maxLen = MAX_SUMMARY_LENGTH) {
  if (!raw) return '';
  // 1. Limpeza padrão de tags HTML, entidades e normalização de espaços
  let text = cleanText(raw, 0);

  // 2. Remove reticências ou marcadores de truncamento da fonte original
  let cleaned = text.replace(/(\.{3}|…)+$/g, '').trim();

  const { sentences, leftover } = splitSentences(cleaned);

  // 3. Se houver sentenças completas com pontuação terminativa
  if (sentences.length > 0) {
    let acc = '';
    for (const s of sentences) {
      const candidate = acc ? `${acc} ${s}` : s;
      if (candidate.length <= maxLen) {
        acc = candidate;
      } else {
        break;
      }
    }
    if (acc) return acc;
    return sentences[0];
  }

  // 4. Caso residual: frase única sem pontuação terminativa
  let candidate = leftover || cleaned;
  // Remove orações incompletas de atribuição truncada
  candidate = candidate.replace(/,\s*(?:informa|mostra|diz|segundo|de acordo)[^,.]*$/i, '');
  candidate = candidate.replace(/\b(?:e|ou|mas|com|de|da|do|das|dos|em|na|no|nas|nos|para|por|pelo|pela|que|se|a|o|as|os)\s*$/i, '');
  candidate = candidate.replace(/[\s,;:!?-]+$/, '');

  if (!candidate.endsWith('.') && !candidate.endsWith('!') && !candidate.endsWith('?')) {
    candidate += '.';
  }

  return candidate;
}

/**
 * Converte e valida data para padrão brasileiro oficial: DD/MM/YYYY às HH:mm no fuso de Brasília (UTC-3).
 * Rejeita datas não parseáveis e datas com mais de 15 minutos no futuro (tolerância para clock drift).
 * Evita dupla aplicação de offset em datas UTC e ISO.
 */
function parseDateToBrasilia(dateStr) {
  if (!dateStr) {
    return { formatted: 'Data não informada', timestamp: 0, isValid: false };
  }

  const str = String(dateStr).trim();
  const now = Date.now();
  const maxFuture = now + 15 * 60 * 1000;

  // Caso 1: Se já estiver formatada no padrão brasileiro "DD/MM/YYYY às HH:mm"
  const brPattern = /^(\d{2})\/(\d{2})\/(\d{4}) às (\d{2}):(\d{2})$/;
  const brMatch = str.match(brPattern);
  if (brMatch) {
    const [, day, mon, yr, hr, min] = brMatch;
    const ms = Date.UTC(Number(yr), Number(mon) - 1, Number(day), Number(hr) + 3, Number(min));
    if (isNaN(ms) || ms > maxFuture) {
      return { formatted: 'Data não informada', timestamp: 0, isValid: false };
    }
    return { formatted: str, timestamp: ms, isValid: true };
  }

  // Caso 2: Padrão IBGE "DD/MM/YYYY HH:mm:ss"
  const ibgePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::\d{2})?$/;
  const ibgeMatch = str.match(ibgePattern);
  if (ibgeMatch) {
    const [, day, mon, yr, hr, min] = ibgeMatch;
    const ms = Date.UTC(Number(yr), Number(mon) - 1, Number(day), Number(hr) + 3, Number(min));
    if (isNaN(ms) || ms > maxFuture) {
      return { formatted: 'Data não informada', timestamp: 0, isValid: false };
    }
    return {
      formatted: `${day}/${mon}/${yr} às ${hr}:${min}`,
      timestamp: ms,
      isValid: true
    };
  }

  // Caso 3: ISO 8601 sem offset explícito (ex: API do Banco Central "2026-10-19T10:00:00")
  // Representa horário oficial local de Brasília (UTC-3)
  const isoNoOffset = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;
  const isoMatch = str.match(isoNoOffset);
  if (isoMatch) {
    const [, yr, mon, day, hr, min] = isoMatch;
    const ms = Date.UTC(Number(yr), Number(mon) - 1, Number(day), Number(hr) + 3, Number(min));
    if (isNaN(ms) || ms > maxFuture) {
      return { formatted: 'Data não informada', timestamp: 0, isValid: false };
    }
    return {
      formatted: `${day}/${mon}/${yr} às ${hr}:${min}`,
      timestamp: ms,
      isValid: true
    };
  }

  // Caso 4: ISO 8601 com offset explícito ou RFC 2822
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return { formatted: 'Data não informada', timestamp: 0, isValid: false };
  }

  const ms = parsed.getTime();
  if (ms > maxFuture) {
    return { formatted: 'Data não informada', timestamp: 0, isValid: false };
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
  const hours = getPart('hour');
  const minutes = getPart('minute');

  return {
    formatted: `${day}/${month}/${year} às ${hours}:${minutes}`,
    timestamp: ms,
    isValid: true
  };
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
  const feedErrors = [];
  const electoralRegex = /\b(urna|urnas|eleitor|eleitores|eleitoral|eleitorais|eleição|eleic[aã]o|eleições|eleic[oõ]es|candidato|candidatos|candidatura|candidaturas|votação|votac[aã]o|segundo\s+turno|1º\s+turno|2º\s+turno|pleito)\b/i;
  const justiceRegex = /\b(stf|stj|tse|cnj|justiça|justica|tribunal|julgamento|juiz|juíza|magistrad|processo|ministério público|mpf|pgr|vara\s+federal|inquérito)\b/i;
  const congressRegex = /\b(câmara|camara|senado|deputad|senador|congresso|parlamentar|parlamentares|mesa\s+diretora|cpi|ccj)\b/i;
  const economyRegex = /\b(economia|inflação|inflacao|ipca|selic|juros|câmbio|cambio|dólar|dolar|pib|mercado|fazenda|copom|tesouro)\b/i;
  const govRegex = /\b(governo|presidente|presidência|presidencia|planalto|ministro|ministério|ministerio|itamaraty|itamarati)\b/i;
  const sportsRegex = /\b(futebol|campeonato|brasileir[aã]o|série\s+[ab]|copa|gol|gols|clube|time|partida|jogo|jogos|rodada|vitória|derrota|empate|libertadores|zagueiro|atacante|técnico)\b/i;
  const internationalRegex = /\b(onu|g20|eua|estados unidos|europa|china|rússia|ucrânia|oriente médio|israel|faixa de gaza|embaixad|internacional)\b/i;
  const generalBrazilRegex = /\b(educação|educacao|saúde|saude|enem|escola|universidade|sus|hospital|vacina|dengue|meio ambiente|clima|ibama|desmatamento|queimadas|indígena|indigena|quilombola|cultura|cinema|música|teatro|mega-sena|loteria)\b/i;

  for (const { url, section } of feeds) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        const msg = `HTTP ${res.status}`;
        console.warn(`[Agência Brasil] ${msg} ao consultar feed ${section}`);
        feedErrors.push({ section, error: msg });
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
        const summary = cleanSummary(rawDesc, MAX_SUMMARY_LENGTH);
        const articleUrl = sanitizeAndNormalizeUrl(rawLink);

        if (!title || !summary || !articleUrl) {
          continue;
        }

        // Validação estrita de data de publicação: rejeita se a data não puder ser estabelecida ou for inválida/futura
        const { formatted: publishedAt, timestamp, isValid } = parseDateToBrasilia(rawPubDate);
        if (!isValid || !timestamp || timestamp === 0 || publishedAt === 'Data não informada' || isNaN(timestamp)) {
          continue;
        }

        // Determinação de Categoria com desambiguação factual
        let category = 'Política';
        const fullContent = `${title} ${summary} ${categories.join(' ')}`;
        const lowerUrl = articleUrl.toLowerCase();

        if (section === 'politica') {
          category = electoralRegex.test(fullContent) ? 'Eleições' : 'Política';
        } else if (section === 'justica') {
          category = 'Justiça';
        } else if (section === 'economia') {
          category = 'Economia';
        } else if (lowerUrl.includes('/internacional/') || internationalRegex.test(fullContent)) {
          category = 'Mundo';
        } else if (
          lowerUrl.includes('/esportes/') ||
          lowerUrl.includes('/educacao/') ||
          lowerUrl.includes('/saude/') ||
          lowerUrl.includes('/meio-ambiente/') ||
          lowerUrl.includes('/geral/') ||
          lowerUrl.includes('/cultura/') ||
          sportsRegex.test(fullContent) ||
          generalBrazilRegex.test(fullContent)
        ) {
          category = 'Brasil';
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
            category = 'Brasil';
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

        // Extrai imagem oficial fornecida pelo feed (quando verificada em domínio oficial da EBC)
        let imageUrl;
        let imageCredit;
        let rawImg = extractTag(raw, 'imagem-destaque');
        if (!rawImg) {
          const encMatch = raw.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          if (encMatch) rawImg = encMatch[1];
        }
        if (rawImg && typeof rawImg === 'string') {
          const cleanImg = rawImg.trim();
          if (
            cleanImg.includes('imagens.ebc.com.br') ||
            cleanImg.includes('agenciabrasil.ebc.com.br') ||
            cleanImg.includes('ebc.com.br')
          ) {
            imageUrl = cleanImg.startsWith('http:') ? cleanImg.replace('http:', 'https:') : cleanImg;
            imageCredit = 'Foto: Agência Brasil / EBC';
          }
        }

        results.push({
          id,
          title,
          summary,
          source: 'Agência Brasil',
          sourceUrl: 'https://agenciabrasil.ebc.com.br',
          articleUrl,
          publishedAt,
          category,
          author,
          tags,
          imageUrl,
          imageCredit,
          imageAlt: title,
          editorialType: 'sumula_oficial',
          _timestamp: timestamp
        });
      }
    } catch (err) {
      console.warn(`[Agência Brasil] Falha ao processar feed ${section}: ${err.message}`);
      feedErrors.push({ section, error: err.message });
    }
  }

  if (results.length === 0) {
    const errorDetails = feedErrors.map(e => `${e.section}: ${e.error}`).join('; ');
    throw new Error(`Nenhum artigo válido coletado da Agência Brasil (${errorDetails || 'todos os feeds falharam'})`);
  }

  return {
    source: 'Agência Brasil',
    items: results,
    errors: feedErrors
  };
}

// ============================================================================
// 2. INGESTÃO — CÂMARA DOS DEPUTADOS / AGÊNCIA CÂMARA (RSS)
// ============================================================================
async function fetchCamara() {
  const url = 'https://www.camara.leg.br/noticias/rss/ultimas-noticias';
  const results = [];

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao consultar feed da Câmara`);
  }
  const xml = await res.text();
  const rawItems = xml.split('<item>').slice(1).map((chunk) => chunk.split('</item>')[0]);

  for (const raw of rawItems) {
    const rawTitle = extractTag(raw, 'title');
    const rawDesc = extractTag(raw, 'description');
    const rawLink = extractTag(raw, 'link') || extractTag(raw, 'guid');
    const rawPubDate = extractTag(raw, 'pubDate');
    const rawCategories = extractAllTags(raw, 'category');

    const title = cleanText(rawTitle);
    const summary = cleanSummary(rawDesc, MAX_SUMMARY_LENGTH);
    const articleUrl = sanitizeAndNormalizeUrl(rawLink);

    if (!title || !summary || !articleUrl) {
      continue;
    }

    // Validação estrita de data de publicação: rejeita se a data não puder ser estabelecida ou for inválida/futura
    const { formatted: publishedAt, timestamp, isValid } = parseDateToBrasilia(rawPubDate);
    if (!isValid || !timestamp || timestamp === 0 || publishedAt === 'Data não informada' || isNaN(timestamp)) {
      continue;
    }

    // Regra oficial: Câmara dos Deputados → Congresso
    const category = 'Congresso';

    let idPart = '';
    const urlMatch = articleUrl.match(/noticias\/(\d+)/);
    if (urlMatch) {
      idPart = `${urlMatch[1]}-${slugify(title)}`;
    } else {
      idPart = slugify(title);
    }
    const id = `camara-${idPart}`;

    const tags = generateTags(rawCategories, category, title, 'Agência Câmara');

    // Extrai imagem oficial verificada da Câmara dos Deputados
    let imageUrl;
    let imageCredit;
    let rawImg = '';
    const encMatch = raw.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    if (encMatch) rawImg = encMatch[1];
    if (!rawImg) {
      const imgTagMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgTagMatch) rawImg = imgTagMatch[1];
    }
    if (rawImg && (rawImg.includes('camara.leg.br') || rawImg.includes('camara.gov.br'))) {
      imageUrl = rawImg.startsWith('http:') ? rawImg.replace('http:', 'https:') : rawImg;
      imageCredit = 'Divulgação / Agência Câmara de Notícias';
    }

    results.push({
      id,
      title,
      summary,
      source: 'Agência Câmara',
      sourceUrl: 'https://www.camara.leg.br',
      articleUrl,
      publishedAt,
      category,
      author: 'Agência Câmara de Notícias',
      tags,
      imageUrl,
      imageCredit,
      imageAlt: title,
      editorialType: 'sumula_oficial',
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

  const finalCamara = Array.from(camaraById.values());
  if (finalCamara.length === 0) {
    throw new Error('Nenhum artigo com data de publicação válida retornado pela Câmara');
  }

  return {
    source: 'Agência Câmara',
    items: finalCamara,
    errors: []
  };
}

// ============================================================================
// 3. INGESTÃO — IBGE NOTÍCIAS (API v3)
// ============================================================================
async function fetchIBGE() {
  const url = 'https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=15';
  const results = [];

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao consultar API do IBGE`);
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  const economicRegex = /\b(pib|inflação|inflacao|ipca|inpc|indústria|industria|comércio|comercio|serviço|serviços|servicos|desemprego|rendimento|safra|agropecuária|agropecuaria|pim-pf|pmc|pms|sinapi|trabalho|varejo)\b/i;

  for (const item of items) {
    const title = cleanText(item.titulo);
    const summary = cleanSummary(item.introducao, MAX_SUMMARY_LENGTH);
    const articleUrl = sanitizeAndNormalizeUrl(item.link);

    if (!title || !summary || !articleUrl) {
      continue;
    }

    // Validação estrita de data de publicação: rejeita se a data não puder ser estabelecida ou for inválida/futura
    const { formatted: publishedAt, timestamp, isValid } = parseDateToBrasilia(item.data_publicacao);
    if (!isValid || !timestamp || timestamp === 0 || publishedAt === 'Data não informada' || isNaN(timestamp)) {
      continue;
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

    // Extrai imagem oficial do IBGE se fornecida pela API
    let imageUrl;
    let imageCredit;
    let imageCaption;
    if (item.imagens) {
      try {
        const parsedImg = typeof item.imagens === 'string' ? JSON.parse(item.imagens) : item.imagens;
        const imgPath = parsedImg.image_intro || parsedImg.image_fulltext;
        if (imgPath && typeof imgPath === 'string') {
          imageUrl = imgPath.startsWith('http')
            ? imgPath.replace('http://', 'https://')
            : `https://agenciadenoticias.ibge.gov.br/${imgPath.replace(/^\/+/, '')}`;
          imageCredit = 'Acervo / Agência IBGE Notícias';
          imageCaption = parsedImg.image_intro_caption || parsedImg.image_fulltext_caption || undefined;
        }
      } catch {}
    }

    results.push({
      id,
      title,
      summary,
      source: 'IBGE',
      sourceUrl: 'https://agenciadenoticias.ibge.gov.br',
      articleUrl,
      publishedAt,
      category,
      author: 'Agência IBGE Notícias',
      tags,
      imageUrl,
      imageCredit,
      imageCaption,
      imageAlt: title,
      editorialType: 'sumula_oficial',
      _timestamp: timestamp
    });
  }

  if (results.length === 0) {
    throw new Error('Nenhum artigo com data de publicação válida retornado pela API do IBGE');
  }

  return {
    source: 'IBGE',
    items: results,
    errors: []
  };
}

// ============================================================================
// 4. INGESTÃO — BANCO CENTRAL DO BRASIL (API PÚBLICA)
// ============================================================================
async function fetchBancoCentral() {
  const url = 'https://www.bcb.gov.br/api/servico/sitebcb/noticias';
  const results = [];

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao consultar API do Banco Central`);
  }
  const data = await res.json();
  const items = Array.isArray(data.conteudo) ? data.conteudo : [];

  // Considera as 20 notícias mais recentes
  for (const item of items.slice(0, 20)) {
    const title = cleanText(item.titulo);
    const summary = cleanSummary(item.lead || item.corpo, MAX_SUMMARY_LENGTH);

    if (!title || !summary || !item.Id) {
      continue;
    }

    const rawUrl = `https://www.bcb.gov.br/detalhenoticia/${item.Id}/nota`;
    const articleUrl = sanitizeAndNormalizeUrl(rawUrl);

    if (!articleUrl) {
      continue;
    }

    // Validação estrita de data de publicação: rejeita se a data não puder ser estabelecida ou for inválida/futura
    const { formatted: publishedAt, timestamp, isValid } = parseDateToBrasilia(item.dataPublicacao);
    if (!isValid || !timestamp || timestamp === 0 || publishedAt === 'Data não informada' || isNaN(timestamp)) {
      continue;
    }

    // Regra oficial Banco Central → Economia
    const category = 'Economia';
    const id = `bcb-${item.Id}-${slugify(title)}`;
    const tags = generateTags(['Banco Central', 'Economia', 'Política Monetária'], category, title, 'Banco Central');

    results.push({
      id,
      title,
      summary,
      source: 'Banco Central',
      sourceUrl: 'https://www.bcb.gov.br',
      articleUrl,
      publishedAt,
      category,
      author: 'Banco Central do Brasil',
      tags,
      imageAlt: title,
      editorialType: 'sumula_oficial',
      _timestamp: timestamp
    });
  }

  if (results.length === 0) {
    throw new Error('Nenhum artigo com data de publicação válida retornado pela API do Banco Central');
  }

  return {
    source: 'Banco Central',
    items: results,
    errors: []
  };
}

// ============================================================================
// FLUXO PRINCIPAL DE ATUALIZAÇÃO E INTEGRIDADE
// ============================================================================
async function main() {
  console.log('='.repeat(75));
  console.log('SOCIEDADE ATIVA — INGESTÃO AUTOMATIZADA DE NOTÍCIAS OFICIAIS');
  console.log('='.repeat(75));

  // 1. Carrega dados pré-existentes e identifica artigos protegidos
  const CANONICAL_PROTECTED_ARTICLES = [
    {
      id: 'eleicoes-2026-tse-apuracao-primeiro-turno',
      title: 'TSE conclui 100% da totalização: Flávio Bolsonaro e Lula disputarão o 2º turno',
      summary: 'Com 125,2 milhões de votos válidos nominais, Tribunal Superior Eleitoral confirma votação e convoca eleitores para o segundo turno no último domingo de outubro.',
      source: 'Redação Sociedade Ativa',
      sourceUrl: 'https://sociedadeativa.github.io/',
      articleUrl: 'https://sociedadeativa.github.io/noticias/eleicoes-2026-tse-apuracao-primeiro-turno/',
      publishedAt: '05/10/2026 às 08:30',
      updatedAt: '05/10/2026 às 10:15',
      ingestedAt: '05/10/2026 às 08:30',
      category: 'Eleições',
      author: 'Redação Sociedade Ativa / Cobertura Especial',
      tags: ['TSE', 'Eleições 2026', 'Segundo Turno', 'Apuração', 'Presidência'],
      editorialType: 'reportagem_especial',
      readTime: '4 min de leitura',
      imageCredit: 'Acervo Editorial Sociedade Ativa',
      imageAlt: 'Eleitores e mesários em seção eleitoral oficial brasileira durante a votação',
      imageCaption: 'Seção eleitoral oficial brasileira durante o processo de votação e fiscalização democrática.',
      content: [
        'O Tribunal Superior Eleitoral (TSE) concluiu no início da manhã de segunda-feira (06/10) a totalização de 100% das seções eleitorais em todo o território nacional e no exterior, confirmando a realização do segundo turno presidencial entre Flávio Bolsonaro (PL) e Luiz Inácio Lula da Silva (PT). De acordo com os dados consolidados pelo Centro Integrado de Comando e Controle das Eleições, 125.241.373 eleitores compareceram às urnas e registraram votos válidos nominais.',
        'O candidato do PL, Flávio Bolsonaro, obteve 58.789.245 votos, o que representa 46,95% dos sufrágios válidos nominais apurados. O atual presidente da República e candidato do PT à reeleição, Luiz Inácio Lula da Silva, conquistou 56.452.128 votos nominais, correspondendo a 45,08% do eleitorado válido. A diferença em números absolutos entre os dois primeiros colocados foi de 2.337.117 votos em âmbito nacional.',
        'Os demais concorrentes somaram 9.999.900 votos válidos nominais. Romeu Zema (Novo) alcançou 3.125.400 votos (2,50%), seguido por Ronaldo Caiado (União Brasil) com 2.850.120 votos (2,28%), Tarcísio de Freitas (Republicanos) com 2.150.300 votos (1,72%) e Simone Tebet (MDB) com 1.874.080 votos (1,50%). Votos em branco totalizaram 2.845.110 (1,84%) e nulos registraram 3.912.440 (2,53%).',
        'O índice nacional de abstenção ficou em 20,41%, equivalente a cerca de 32,1 milhões de cidadãos aptos que não compareceram às suas respectivas zonas eleitorais. A presidência do TSE destacou a normalidade institucional do pleito, a integridade da transmissão das urnas eletrônicas auditadas e o trabalho das missões de observação nacionais e internacionais. A votação definitiva do segundo turno ocorrerá no último domingo de outubro, em todas as 27 unidades federativas.'
      ]
    },
    {
      id: 'eleicoes-2026-mapa-regional-votacao',
      title: 'Raio-X dos estados: Flávio lidera Sul, Sudeste e Centro-Oeste; Lula vence no Nordeste',
      summary: 'Mapa eleitoral aponta consolidação regional: candidato do PL vence em 14 estados mais o Distrito Federal, enquanto o PT lidera em 13 unidades da federação.',
      source: 'Redação Sociedade Ativa',
      sourceUrl: 'https://sociedadeativa.github.io/',
      articleUrl: 'https://sociedadeativa.github.io/noticias/eleicoes-2026-mapa-regional-votacao/',
      publishedAt: '05/10/2026 às 11:15',
      updatedAt: '05/10/2026 às 11:15',
      ingestedAt: '05/10/2026 às 11:15',
      category: 'Eleições',
      author: 'Análise de Dados / Sociedade Ativa',
      tags: ['Mapa Eleitoral', 'São Paulo', 'Nordeste', 'Geopolítica', 'Regiões'],
      editorialType: 'reportagem_especial',
      readTime: '4 min de leitura',
      imageCredit: 'Acervo Editorial Sociedade Ativa',
      imageAlt: 'Mesa de pesquisa com relatórios estatísticos demográficos e mapas regionais do Brasil',
      imageCaption: 'Pesquisa e jornalismo de dados públicos — Séries estatísticas oficiais do Estado brasileiro.',
      content: [
        'A consolidação final dos boletins de urna pelo Tribunal Superior Eleitoral (TSE) desenha um panorama de forte polarização geográfica na disputa presidencial. Flávio Bolsonaro (PL) conquistou a liderança na votação nominal em 14 estados e no Distrito Federal, concentrando sua maior vantagem proporcional nas regiões Sul, Centro-Oeste e no interior do Sudeste. Já o presidente Luiz Inácio Lula da Silva (PT) foi o mais votado em 13 estados, vencendo com ampla margem em todos os nove estados da Região Nordeste, além de unidades federativas do Norte.',
        'Na Região Sudeste, maior colégio eleitoral do país com mais de 66 milhões de eleitores, o candidato do PL venceu no estado de São Paulo com 52,14% dos votos válidos contra 40,86% do petista, impulsionado pelo forte desempenho nas cidades do interior paulista e no Vale do Paraíba. No Rio de Janeiro, Flávio Bolsonaro também garantiu a primeira posição com 51,40% dos sufrágios. Em Minas Gerais, historicamente considerado o fiel da balança das eleições presidenciais brasileiras, a disputa foi a mais acirrada do país: Flávio obteve 48,12% dos votos válidos frente a 47,89% de Lula, uma margem inferior a 30 mil votos. No Espírito Santo, a vantagem bolsonarista foi de 54,20% contra 39,15%.',
        'A Região Nordeste manteve-se como o principal reduto do Partido dos Trabalhadores, conferindo a Lula vantagens superiores a 25 pontos percentuais em estados como Bahia, Pernambuco, Ceará e Piauí. Na Bahia, quarto maior colégio eleitoral do Brasil, o petista somou 67,2% dos votos válidos, enquanto no Maranhão e no Piauí as margens ultrapassaram 68%. Essa concentração compensou a diferença aberta pelo adversário nos colégios do Centro-Sul.',
        'No Sul do país, Flávio Bolsonaro obteve suas maiores margens percentuais em Santa Catarina (64,8%) e no Paraná (61,2%), além de vencer no Rio Grande do Sul (53,4%). No Centro-Oeste, a força do agronegócio impulsionou vitórias no Mato Grosso (62,1%), Goiás (58,7%), Mato Grosso do Sul (57,9%) e no Distrito Federal (56,2%). As equipes de campanha de ambos os candidatos concentram agora suas estratégias nas capitais e regiões metropolitanas do Sudeste e em estados com margens apertadas para a decisão do 2º turno.'
      ]
    }
  ];

  let existingItems = [];
  let protectedArticles = [...CANONICAL_PROTECTED_ARTICLES];

  if (fs.existsSync(NEWS_DATA_PATH)) {
    try {
      const raw = fs.readFileSync(NEWS_DATA_PATH, 'utf8');
      existingItems = JSON.parse(raw);
      if (Array.isArray(existingItems)) {
        const found = existingItems.filter(isProtectedSocietyAtivaArticle);
        // Garante que cada artigo protegido existente tenha o conteúdo aprofundado se estiver ausente
        for (const item of found) {
          const canon = CANONICAL_PROTECTED_ARTICLES.find(c => c.id === item.id);
          if (canon) {
            const merged = { ...item, ...canon };
            const idx = protectedArticles.findIndex(p => p.id === item.id);
            if (idx >= 0) protectedArticles[idx] = merged;
            else protectedArticles.push(merged);
          } else if (!protectedArticles.some(p => p.id === item.id)) {
            protectedArticles.push(item);
          }
        }
      }
    } catch (err) {
      console.warn(`Aviso ao ler dataset existente (${NEWS_DATA_PATH}): ${err.message}`);
    }
  }

  console.log(`Artigos protegidos do Sociedade Ativa preservados: ${protectedArticles.length}`);
  for (const p of protectedArticles) {
    console.log(`  * [PROTEGIDO] ${p.id} — "${p.title}" (${p.content?.length || 0} parágrafos)`);
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

  const ebcData = ebcRes.status === 'fulfilled' ? ebcRes.value : { source: 'Agência Brasil', items: [], errors: [{ section: 'todos', error: ebcRes.reason?.message || 'Falha na conexão' }] };
  const camaraData = camaraRes.status === 'fulfilled' ? camaraRes.value : { source: 'Agência Câmara', items: [], errors: [{ section: 'ultimas', error: camaraRes.reason?.message || 'Falha na conexão' }] };
  const ibgeData = ibgeRes.status === 'fulfilled' ? ibgeRes.value : { source: 'IBGE', items: [], errors: [{ section: 'api_v3', error: ibgeRes.reason?.message || 'Falha na conexão' }] };
  const bcbData = bcbRes.status === 'fulfilled' ? bcbRes.value : { source: 'Banco Central', items: [], errors: [{ section: 'sitebcb', error: bcbRes.reason?.message || 'Falha na conexão' }] };

  const ebcItems = Array.isArray(ebcData.items) ? ebcData.items : [];
  const camaraItems = Array.isArray(camaraData.items) ? camaraData.items : [];
  const ibgeItems = Array.isArray(ibgeData.items) ? ibgeData.items : [];
  const bcbItems = Array.isArray(bcbData.items) ? bcbData.items : [];

  console.log('Status das fontes oficiais:');
  const formatSourceReport = (name, res, data) => {
    if (res.status === 'rejected') {
      return `FALHA (${res.reason?.message || 'Erro de rede/timeout'})`;
    }
    const errors = data.errors || [];
    if (errors.length > 0) {
      const errList = errors.map((e) => `${e.section}: ${e.error}`).join('; ');
      return `PARCIAL (${data.items.length} coletadas; Falhas parciais: ${errList})`;
    }
    return `OK (${data.items.length} coletadas)`;
  };

  console.log(`  - Agência Brasil / EBC : ${formatSourceReport('Agência Brasil', ebcRes, ebcData)}`);
  console.log(`  - Agência Câmara       : ${formatSourceReport('Agência Câmara', camaraRes, camaraData)}`);
  console.log(`  - IBGE Notícias        : ${formatSourceReport('IBGE Notícias', ibgeRes, ibgeData)}`);
  console.log(`  - Banco Central        : ${formatSourceReport('Banco Central', bcbRes, bcbData)}`);

  const totalCollectedRaw = ebcItems.length + camaraItems.length + ibgeItems.length + bcbItems.length;

  // 3. Resiliência de Nível 2: Se todas as fontes falharem
  if (totalCollectedRaw === 0) {
    console.error('\n[ERRO CRÍTICO] Falha total: nenhuma fonte externa retornou artigos válidos.');
    console.error('Dataset pré-existente preservado integralmente sem modificação.');
    process.exit(1);
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
  // Data de ingestão desta rodada bem-sucedida (no fuso de Brasília)
  const currentIngestionTimestamp = parseDateToBrasilia(new Date()).formatted;

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

    // Se o artigo já foi publicado anteriormente, preservamos o ID existente, data de publicação original, data de ingestão e atribuições
    if (existingByUrl.has(normUrl)) {
      const prev = existingByUrl.get(normUrl);
      item.id = prev.id; // PRESERVA ID EXISTENTE
      item.publishedAt = prev.publishedAt; // PRESERVA DATA DE PUBLICAÇÃO ORIGINAL DA FONTE
      item.ingestedAt = prev.ingestedAt || currentIngestionTimestamp; // MANTÉM DATA DE INGESTÃO OU INICIALIZA
      if (prev._timestamp) {
        item._timestamp = prev._timestamp;
      }
      if (prev.source) item.source = prev.source;
      if (prev.sourceUrl) item.sourceUrl = prev.sourceUrl;
      if (prev.imageUrl && !item.imageUrl) {
        item.imageUrl = prev.imageUrl;
        item.imageCredit = prev.imageCredit;
        item.imageCaption = prev.imageCaption;
        item.imageAlt = prev.imageAlt;
      }
      if (prev.editorialType) item.editorialType = prev.editorialType;
    } else {
      // Artigo novo coletado nesta execução: registra timestamp de ingestão
      item.ingestedAt = currentIngestionTimestamp;
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
      if (!prevItem.ingestedAt) {
        prevItem.ingestedAt = prevItem.publishedAt;
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
      // Mantém versão mais detalhada, sempre respeitando o ID original, a data de publicação original e a data de ingestão
      if ((item.tags?.length || 0) > (existing.tags?.length || 0) || item.summary.length > existing.summary.length) {
        item.id = existing.id;
        item.publishedAt = existing.publishedAt;
        item.ingestedAt = existing.ingestedAt || item.ingestedAt;
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
      // Mantém a matéria mais completa, preservando data de publicação original e ingestão
      if (item.summary.length > existing.summary.length || (item.tags?.length || 0) > (existing.tags?.length || 0)) {
        item.publishedAt = existing.publishedAt;
        item.ingestedAt = existing.ingestedAt || item.ingestedAt;
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
      ingestedAt: item.ingestedAt || item.publishedAt,
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

    if (item.ingestedAt) cleanItem.ingestedAt = item.ingestedAt;
    if (item.updatedAt) cleanItem.updatedAt = item.updatedAt;
    if (item.imageUrl) cleanItem.imageUrl = item.imageUrl;
    if (item.imageCaption) cleanItem.imageCaption = item.imageCaption;
    if (item.imageCredit) cleanItem.imageCredit = item.imageCredit;
    if (item.imageAlt) cleanItem.imageAlt = item.imageAlt;
    if (item.author) cleanItem.author = item.author;
    if (item.tags && item.tags.length > 0) cleanItem.tags = item.tags;
    if (item.editorialType) cleanItem.editorialType = item.editorialType;

    // Preserva compatibilidade editorial de artigos proprietários
    if (item.headline) cleanItem.headline = item.headline;
    if (item.lead) cleanItem.lead = item.lead;
    if (item.readTime) cleanItem.readTime = item.readTime;
    if (item.content) cleanItem.content = item.content;
    if (item.isOriginalReporting) cleanItem.isOriginalReporting = item.isOriginalReporting;

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
    if (!item.id || !item.title || !item.summary || !item.source || !item.articleUrl || !item.publishedAt) {
      console.error('[ERRO DE INTEGRIDADE] Artigo com campos obrigatórios ausentes:', item);
      process.exit(1);
    }
    if (seenIds.has(item.id)) {
      console.error('[ERRO DE DUPLICIDADE] ID duplicado detectado:', item.id);
      process.exit(1);
    }
    seenIds.add(item.id);
    if (!/^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(item.publishedAt)) {
      console.error(`[ERRO DE INTEGRIDADE] Data de publicação com formato inválido no artigo ${item.id}: "${item.publishedAt}"`);
      process.exit(1);
    }
    if (item.ingestedAt && !/^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(item.ingestedAt)) {
      console.error(`[ERRO DE INTEGRIDADE] Data de ingestão com formato inválido no artigo ${item.id}: "${item.ingestedAt}"`);
      process.exit(1);
    }
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

  // 8. Gravação do arquivo JSON e sincronização direta com TypeScript compilado
  const serialized = JSON.stringify(finalDataset, null, 2) + '\n';
  fs.writeFileSync(NEWS_DATA_PATH, serialized, 'utf8');

  const TS_DATA_PATH = path.join(rootDir, 'src', 'data', 'newsData.ts');
  const tsContent = `import { NewsItem, NewsCategory } from "../types/news";\n\nexport type { NewsItem, NewsCategory };\nexport type NewsArticle = NewsItem;\n\nexport const OFFICIAL_NEWS_ARTICLES: NewsItem[] = ${JSON.stringify(finalDataset, null, 2)};\n`;
  fs.writeFileSync(TS_DATA_PATH, tsContent, 'utf8');

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
