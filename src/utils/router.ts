export type PortalRoute =
  | "home"
  | "politica"
  | "eleicoes"
  | "economia"
  | "estados"
  | "dados-publicos"
  | "noticias"
  | "sobre";

export interface RouteConfig {
  route: PortalRoute;
  path: string;
  label: string;
  title: string;
  description: string;
  categoryTag?: string;
  accentColor: string; // Tailwind color token
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const ROUTE_CONFIGS: Record<PortalRoute, RouteConfig> = {
  home: {
    route: "home",
    path: "/",
    label: "Início",
    title: "Sociedade Ativa — Política, Eleições, Notícias e Dados do Brasil",
    description:
      "Portal de dados públicos, política, eleições e notícias do Brasil. Acompanhe a apuração das Eleições 2026, mapas por estado e indicadores econômicos oficiais.",
    accentColor: "blue",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    badgeBorder: "border-slate-200",
  },
  politica: {
    route: "politica",
    path: "/politica/",
    label: "Política",
    title: "Política — Sociedade Ativa | Poderes, Congresso e Atos Oficiais",
    description:
      "Cobertura de política nacional, atos dos Três Poderes, decisões do Executivo e tramitação legislativa no Congresso Nacional no Sociedade Ativa.",
    categoryTag: "Política",
    accentColor: "red",
    badgeBg: "bg-red-50",
    badgeText: "text-red-800",
    badgeBorder: "border-red-200",
  },
  eleicoes: {
    route: "eleicoes",
    path: "/eleicoes/",
    label: "Eleições",
    title: "Eleições 2026 — Sociedade Ativa | Apuração Oficial e 2º Turno",
    description:
      "Apuração oficial do 1º Turno das Eleições 2026 pelo TSE. Mapas eleitorais por estado, comparativo de candidatos e regras do segundo turno presidencial.",
    categoryTag: "Eleições",
    accentColor: "blue",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800",
    badgeBorder: "border-blue-200",
  },
  economia: {
    route: "economia",
    path: "/economia/",
    label: "Economia",
    title: "Economia — Sociedade Ativa | Indicadores Oficiais e Bolsa B3",
    description:
      "Indicadores econômicos oficiais do Brasil: inflação IPCA, Selic, Dólar PTAX, PIB e cotações da Bolsa B3 (Ibovespa) com dados do IBGE e Banco Central.",
    categoryTag: "Economia",
    accentColor: "emerald",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-200",
  },
  estados: {
    route: "estados",
    path: "/estados/",
    label: "Estados",
    title: "Estados do Brasil — Sociedade Ativa | Mapa e Dados por UF",
    description:
      "Dados públicos e mapa eleitoral dos 26 estados e DF: votação nominal por candidato, comparecimento das urnas e histórico dos colégios eleitorais.",
    categoryTag: "Estados",
    accentColor: "amber",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200",
  },
  "dados-publicos": {
    route: "dados-publicos",
    path: "/dados-publicos/",
    label: "Dados Públicos",
    title: "Dados Públicos — Sociedade Ativa | Estatísticas e Transparência",
    description:
      "Transparência e dados abertos do Brasil: microdados do TSE, séries do IBGE e Banco Central com metodologia aberta e auditoria pública de estatísticas.",
    categoryTag: "Dados Públicos",
    accentColor: "purple",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-800",
    badgeBorder: "border-purple-200",
  },
  noticias: {
    route: "noticias",
    path: "/noticias/",
    label: "Notícias",
    title: "Notícias — Sociedade Ativa | Política, Eleições e Economia",
    description:
      "Acompanhe as últimas notícias e despachos sobre política, eleições, economia, atos do Executivo, Congresso Nacional, STF e dados do Brasil.",
    categoryTag: "Notícias",
    accentColor: "slate",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    badgeBorder: "border-slate-200",
  },
  sobre: {
    route: "sobre",
    path: "/sobre/",
    label: "Sobre & Metodologia",
    title: "Sobre e Metodologia — Sociedade Ativa | Fontes Oficiais",
    description:
      "Conheça a missão do Sociedade Ativa, a metodologia de totalização eleitoral (Art. 77 da CF), o catálogo de dados abertos e os princípios de neutralidade.",
    accentColor: "slate",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-800",
    badgeBorder: "border-slate-200",
  },
};

/**
 * Converte o pathname atual do browser em uma rota válida do portal
 */
export function getRouteFromPath(pathname: string): PortalRoute {
  // Trata parâmetros de fallback como ?p=/politica/ caso venha de 404.html
  if (typeof window !== "undefined" && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    if (p) {
      const cleanParam = p.replace(/^\/+|\/+$/g, "").toLowerCase();
      for (const [key, config] of Object.entries(ROUTE_CONFIGS)) {
        const cleanConfig = config.path.replace(/^\/+|\/+$/g, "").toLowerCase();
        if (cleanConfig && cleanParam.startsWith(cleanConfig)) {
          return key as PortalRoute;
        }
      }
    }
  }

  const clean = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!clean || clean === "index.html") return "home";

  if (clean.startsWith("politica")) return "politica";
  if (clean.startsWith("eleicoes")) return "eleicoes";
  if (clean.startsWith("economia")) return "economia";
  if (clean.startsWith("estados")) return "estados";
  if (clean.startsWith("dados-publicos")) return "dados-publicos";
  if (clean.startsWith("noticias")) return "noticias";
  if (clean.startsWith("sobre")) return "sobre";

  return "home";
}

/**
 * Navegação suave no cliente com atualização de histórico e título da página
 */
export function navigateTo(route: PortalRoute, hash?: string) {
  const config = ROUTE_CONFIGS[route];
  if (!config) return;

  const targetPath = config.path + (hash ? `#${hash}` : "");

  if (typeof window !== "undefined") {
    if (window.location.pathname !== config.path) {
      window.history.pushState({ route }, "", targetPath);
    } else if (hash) {
      window.location.hash = hash;
    }
    // Dispara evento popstate para ouvintes reagirem
    window.dispatchEvent(new PopStateEvent("popstate"));

    // Atualiza título do documento dinamicamente no cliente
    document.title = config.title;

    // Atualiza meta description dinamicamente no cliente
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.description) {
      metaDesc.setAttribute("content", config.description);
    }

    // Rola para o topo caso não haja hash específico
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }
}
