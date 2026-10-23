/**
 * Utilitário de rastreamento do Google Analytics 4 (GA4)
 * ID de medição oficial: G-FVHPGPZTSL
 *
 * Garante que a página inicial seja contabilizada apenas uma vez pela tag estática
 * e que as navegações subsequentes no cliente (SPA) disparem page_view sem duplicação.
 */

export const GA_MEASUREMENT_ID = "G-FVHPGPZTSL";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Armazena a última rota/caminho registrado para evitar disparos duplicados de page_view
let lastTrackedPath: string | null = null;

// Inicializa com o caminho atual na carga inicial da página (já contabilizado pela tag oficial no HTML)
if (typeof window !== "undefined") {
  lastTrackedPath = window.location.pathname + window.location.search;
}

/**
 * Garante que a função gtag exista para enfileirar chamadas no dataLayer
 * mesmo antes do carregamento remoto da biblioteca do Google Analytics 4.
 */
function ensureGtag(): (...args: unknown[]) => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  if (typeof window.gtag === "function") {
    return window.gtag;
  }
  window.dataLayer = window.dataLayer || [];
  const stubGtag = function (...args: unknown[]) {
    (window.dataLayer as unknown[]).push(args);
  };
  window.gtag = stubGtag;
  return stubGtag;
}

/**
 * Registra eventos de visualização de página no GA4 para navegações subsequentes no cliente (SPA).
 * Preserva o evento na fila caso o script externo ainda esteja em carregamento diferido.
 * Ignora a rota inicial para evitar contagem duplicada com o gtag('config') disparado no carregamento da página.
 */
export function trackPageView(path?: string, title?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = path || (window.location.pathname + window.location.search);
  const currentTitle = title || document.title;

  // Evita disparar page_view repetido para a mesma rota
  if (lastTrackedPath === currentPath) {
    return;
  }

  lastTrackedPath = currentPath;

  const gtagFn = ensureGtag();
  gtagFn("event", "page_view", {
    page_title: currentTitle,
    page_location: window.location.href,
    page_path: currentPath,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Registra eventos personalizados importantes no GA4, enfileirando com segurança
 * no dataLayer caso o script externo ainda não tenha sido baixado.
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  if (typeof window === "undefined") {
    return;
  }

  const gtagFn = ensureGtag();
  gtagFn("event", eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...eventParams,
  });
}
