/**
 * Helper compartilhado para deduplicação de requisições em voo (in-flight).
 * 
 * Garante que requisições simultâneas para o mesmo recurso/URL normalizada compartilhem
 * uma única Promise, eliminando requisições de rede duplicadas durante a montagem concorrente
 * de componentes (ex: App.tsx e EconomySection.tsx requisitando economyData.json).
 * 
 * As entradas são removidas do Map imediatamente quando a Promise é finalizada (.finally()),
 * preservando a capacidade de retry em caso de falha transitória e evitando cacheamento
 * indevido de erros ou dados obsoletos.
 */

export const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Normaliza uma URL ou caminho de recurso para uma chave canônica estável.
 * Remove parâmetros de query, fragmentos de hash e normaliza caminhos relativos/absolutos.
 */
export function normalizeResourceUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const base = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://sociedadeativa.github.io";
    const parsed = new URL(rawUrl, base);
    let pathname = parsed.pathname || "";
    // Remove barra final exceto na raiz
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    // Padroniza seções conhecidas ou caminhos com sufixos
    const filenameMatch = pathname.match(/\/data\/[^/]+\.json$/);
    if (filenameMatch) {
      return filenameMatch[0];
    }
    return pathname;
  } catch {
    const clean = rawUrl.split("?")[0].split("#")[0];
    const match = clean.match(/\/data\/[^/]+\.json$/);
    return match ? match[0] : clean;
  }
}

/**
 * Executa uma requisição deduplicada em voo.
 * Se já houver uma requisição em andamento para a mesma URL normalizada,
 * retorna a Promise existente em vez de iniciar uma nova requisição de rede.
 */
export function dedupeInFlightRequest<T>(
  rawUrlOrKey: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const normalizedKey = normalizeResourceUrl(rawUrlOrKey);
  const existingPromise = inFlightRequests.get(normalizedKey);

  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fetcher();
    } finally {
      inFlightRequests.delete(normalizedKey);
    }
  })();

  inFlightRequests.set(normalizedKey, promise);
  return promise;
}

/**
 * Limpa o mapa de requisições em voo (útil para testes unitários).
 */
export function clearInFlightRequests(): void {
  inFlightRequests.clear();
}
