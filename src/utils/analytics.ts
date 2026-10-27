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
 * Registra eventos de visualização de página no GA4 para navegações subsequentes no cliente (SPA).
 * Ignora a rota inicial para evitar contagem duplicada com o gtag('config') disparado no carregamento da página.
 */
export function trackPageView(path?: string, title?: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const currentPath = path || (window.location.pathname + window.location.search);
  const currentTitle = title || document.title;

  // Evita disparar page_view repetido para a mesma rota
  if (lastTrackedPath === currentPath) {
    return;
  }

  lastTrackedPath = currentPath;

  window.gtag("event", "page_view", {
    page_title: currentTitle,
    page_location: window.location.href,
    page_path: currentPath,
    send_to: GA_MEASUREMENT_ID,
  });
}
