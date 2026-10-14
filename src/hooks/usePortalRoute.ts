import { useState, useEffect, useCallback } from "react";
import {
  PortalRoute,
  getRouteFromPath,
  getArticleIdFromPath,
  ROUTE_CONFIGS,
  navigateTo,
  navigateToArticle,
} from "../utils/router";
import { trackPageView } from "../utils/analytics";

export function usePortalRoute() {
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>(() => {
    if (typeof window !== "undefined") {
      return getRouteFromPath(window.location.pathname, window.location.search);
    }
    return "home";
  });

  const [articleId, setArticleId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return getArticleIdFromPath(window.location.pathname, window.location.search);
    }
    return null;
  });

  const syncRoute = useCallback(() => {
    if (typeof window !== "undefined") {
      const detected = getRouteFromPath(window.location.pathname, window.location.search);
      const detectedId = getArticleIdFromPath(window.location.pathname, window.location.search);
      setCurrentRoute(detected);
      setArticleId(detectedId);

      const config = ROUTE_CONFIGS[detected];
      if (config && detected !== "artigo") {
        document.title = config.title;
      }
    }
  }, []);

  useEffect(() => {
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
    };
  }, [syncRoute]);

  // Rastreia visualizações de página subsequentes em mudanças de rota no cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        trackPageView(window.location.pathname + window.location.search, document.title);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentRoute, articleId]);

  const goTo = useCallback((route: PortalRoute, hash?: string) => {
    navigateTo(route, hash);
    setCurrentRoute(route);
    setArticleId(null);
  }, []);

  const goToArticle = useCallback((id: string) => {
    navigateToArticle(id);
    setCurrentRoute("artigo");
    setArticleId(id);
  }, []);

  return {
    currentRoute,
    articleId,
    routeConfig: ROUTE_CONFIGS[currentRoute],
    goTo,
    goToArticle,
  };
}
