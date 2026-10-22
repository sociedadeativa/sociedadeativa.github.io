import React, { useState } from "react";
import { Database, FileText, Search, Menu, X, TrendingUp, ChevronRight, ExternalLink } from "lucide-react";
import { ElectionDataSet } from "../data/electionData";
import { PortalRoute, ROUTE_CONFIGS } from "../utils/router";
import { PortalLink } from "./PortalLink";
import { EconomicIndicator } from "../types/economy";
import { getB3MarketStatus, formatDailyVariation } from "../utils/marketHours";

interface HeaderProps {
  dataset: ElectionDataSet;
  currentRoute: PortalRoute;
  indicators?: EconomicIndicator[];
  onOpenMethodology: () => void;
  onOpenDataInspector: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataset,
  currentRoute,
  indicators = [],
  onOpenMethodology,
  onOpenDataInspector,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Busca indicadores oficiais validados para o radar superior
  const ipcaIndicator = indicators.find((i) => i.id === "ipca");
  const selicIndicator = indicators.find((i) => i.id === "selic");
  const dolarIndicator = indicators.find((i) => i.id === "dolar");
  const ibovIndicator = indicators.find((i) => i.id === "ibovespa" || i.id === "ibov");

  const ipcaVal = ipcaIndicator?.formattedValue || "+0,82%";
  const ipcaRef = ipcaIndicator?.referencePeriod || "setembro 2026";
  const selicVal = selicIndicator?.formattedValue || "14,00% a.a.";
  const selicRef = selicIndicator?.referencePeriod || "Vigência a partir de 06/08/2026 (Copom)";
  const selicDateMatch = selicRef ? selicRef.match(/(\d{2}\/\d{2}\/)(\d{2,4})/) : null;
  const formattedSelicDate = selicDateMatch
    ? `${selicDateMatch[1]}${selicDateMatch[2].slice(-2)}`
    : "";
  const selicBadgeText = formattedSelicDate ? `${formattedSelicDate} · BCB` : "BCB";
  const dolarVal = dolarIndicator?.formattedValue || "R$ 4,99";
  const dolarRef = dolarIndicator?.referencePeriod || "PTAX 09/10/2026";

  const ibovTimestamp = ibovIndicator?.quoteTimestamp || ibovIndicator?.updatedAt || "15/10/2026 18:00";
  const b3MarketInfo = getB3MarketStatus(new Date(), {
    timestamp: ibovTimestamp,
    tradingSession: ibovIndicator?.referencePeriod,
    marketStatus: ibovIndicator?.marketStatus,
  });
  const hasIbovValue = ibovIndicator?.value !== null && ibovIndicator?.value !== undefined;
  const ibovVal = hasIbovValue
    ? ibovIndicator.formattedValue
    : "Dados indisponíveis no momento.";
  const ibovVariationInfo = formatDailyVariation(ibovIndicator?.variation ?? null);
  const isIbovOpen = b3MarketInfo.isOpen;

  // Trend arrows: calculadas estritamente a partir de dados de comparação válidos e neutros (sem inferência de bom/ruim)
  const ipcaVariation =
    typeof ipcaIndicator?.variation === "number" && !isNaN(ipcaIndicator.variation)
      ? ipcaIndicator.variation
      : null;
  const ipcaTrendArrow =
    ipcaVariation !== null && ipcaVariation !== 0
      ? ipcaVariation > 0
        ? "↑"
        : "↓"
      : null;

  const selicVariation =
    typeof selicIndicator?.variation === "number" && !isNaN(selicIndicator.variation)
      ? selicIndicator.variation
      : null;
  const selicTrendArrow =
    selicVariation !== null && selicVariation !== 0
      ? selicVariation > 0
        ? "↑"
        : "↓"
      : null;

  const dolarVariation =
    typeof dolarIndicator?.variation === "number" && !isNaN(dolarIndicator.variation)
      ? dolarIndicator.variation
      : null;
  const dolarTrendArrow =
    dolarVariation !== null && dolarVariation !== 0
      ? dolarVariation > 0
        ? "↑"
        : "↓"
      : null;

  const hasIbovVariation =
    hasIbovValue &&
    ibovVariationInfo.type !== "unavailable" &&
    ibovVariationInfo.type !== "zero";
  const ibovTrendArrow = hasIbovVariation
    ? ibovVariationInfo.type === "positive"
      ? "↑"
      : "↓"
    : null;

  const mainNavLinks: { route: PortalRoute; label: string; colorClass: string; activeClass: string }[] = [
    {
      route: "politica",
      label: "Política",
      colorClass: "hover:text-red-700",
      activeClass: "text-red-700 font-black border-b-2 border-red-600",
    },
    {
      route: "eleicoes",
      label: "Eleições",
      colorClass: "hover:text-blue-700",
      activeClass: "text-blue-700 font-black border-b-2 border-blue-600",
    },
    {
      route: "economia",
      label: "Economia",
      colorClass: "hover:text-emerald-700",
      activeClass: "text-emerald-700 font-black border-b-2 border-emerald-600",
    },
    {
      route: "estados",
      label: "Estados",
      colorClass: "hover:text-amber-700",
      activeClass: "text-amber-700 font-black border-b-2 border-amber-600",
    },
    {
      route: "dados-publicos",
      label: "Dados Públicos",
      colorClass: "hover:text-purple-700",
      activeClass: "text-purple-700 font-black border-b-2 border-purple-600",
    },
    {
      route: "noticias",
      label: "Notícias",
      colorClass: "hover:text-slate-950",
      activeClass: "text-slate-950 font-black border-b-2 border-slate-700",
    },
    {
      route: "esportes",
      label: "Esportes",
      colorClass: "hover:text-emerald-700",
      activeClass: "text-emerald-700 font-black border-b-2 border-emerald-600",
    },
    {
      route: "tecnologia",
      label: "Tecnologia",
      colorClass: "hover:text-indigo-700",
      activeClass: "text-indigo-700 font-black border-b-2 border-indigo-600",
    },
    {
      route: "clima",
      label: "Clima",
      colorClass: "hover:text-sky-700",
      activeClass: "text-sky-700 font-black border-b-2 border-sky-600",
    },
  ];

  const drawerLinks: { route: PortalRoute; label: string; colorClass: string; activeClass: string }[] = [
    {
      route: "home",
      label: "Início",
      colorClass: "hover:text-slate-950",
      activeClass: "text-slate-950 font-black border-b-2 border-slate-900",
    },
    ...mainNavLinks,
  ];

  return (
    <header className="border-b border-slate-200 bg-white/98 backdrop-blur-md sticky top-0 z-40 transition-all">
      {/* 1. Linha Exclusiva de Indicadores Econômicos (Totalmente visíveis e sem corte no desktop) */}
      <div className="bg-slate-900 text-slate-300 py-2 px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 border-b border-slate-800/80 block w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mini-Cards dos Indicadores Econômicos (IPCA, Selic, PTAX, Ibovespa e Eleições) com espaço e distribuição equilibrada */}
          <div className="flex items-center justify-start lg:justify-between gap-1.5 sm:gap-2 xl:gap-2.5 overflow-x-auto lg:overflow-x-visible scrollbar-none py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 max-w-full touch-pan-x min-w-0 w-full">
            <span className="font-heading font-extrabold text-slate-200 uppercase tracking-wider text-[11px] shrink-0 hidden 2xl:inline-flex items-center gap-1.5 mr-1 select-none">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>Indicadores:</span>
            </span>

            {/* Mini-Card 1: IPCA (Neutro, sem inferência de bom/ruim) */}
            <PortalLink
              route="economia"
              className="group flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 transition-all shrink-0 text-xs text-slate-200 shadow-2xs"
              title={`IPCA mensal oficial: ${ipcaVal} (${ipcaRef}) — Fonte: IBGE`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                IPCA:
              </span>
              <span className="font-mono font-extrabold text-white text-xs sm:text-[13px] tabular-nums tracking-tight">
                {ipcaVal}
              </span>
              {ipcaTrendArrow && (
                <span
                  className="font-mono text-[11px] text-slate-300 font-bold"
                  aria-label={`Variação de ${ipcaVariation} ponto percentual`}
                >
                  {ipcaTrendArrow}
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans pl-1.5 border-l border-slate-700/80 whitespace-nowrap">
                {ipcaRef.replace("setembro 2026", "Set/26").replace("Setembro 2026", "Set/26")} · IBGE
              </span>
            </PortalLink>

            {/* Mini-Card 2: Selic Meta (Neutro, sem inferência de bom/ruim) */}
            <PortalLink
              route="economia"
              className="group flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 transition-all shrink-0 text-xs text-slate-200 shadow-2xs"
              title={`Taxa Selic Meta Copom: ${selicVal} (${selicRef}) — Fonte: BCB`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                Selic:
              </span>
              <span className="font-mono font-extrabold text-white text-xs sm:text-[13px] tabular-nums tracking-tight">
                {selicVal}
              </span>
              {selicTrendArrow && (
                <span className="font-mono text-[11px] text-slate-300 font-bold">
                  {selicTrendArrow}
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans pl-1.5 border-l border-slate-700/80 whitespace-nowrap">
                {selicBadgeText}
              </span>
            </PortalLink>

            {/* Mini-Card 3: PTAX Venda */}
            <PortalLink
              route="economia"
              className="group flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 transition-all shrink-0 text-xs text-slate-200 shadow-2xs"
              title={`Dólar Comercial PTAX Venda oficial: ${dolarVal} (${dolarRef}) — Fonte: BCB`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                PTAX:
              </span>
              <span className="font-mono font-extrabold text-white text-xs sm:text-[13px] tabular-nums tracking-tight">
                {dolarVal}
              </span>
              {dolarTrendArrow && (
                <span
                  className="font-mono text-[11px] text-slate-300 font-bold"
                  aria-label={`Variação de ${dolarVariation}`}
                >
                  {dolarTrendArrow}
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans pl-1.5 border-l border-slate-700/80 whitespace-nowrap">
                {dolarRef.replace("Fechamento PTAX ", "").replace("PTAX ", "").replace("2026", "26")} · BCB
              </span>
            </PortalLink>

            {/* Mini-Card 4: Ibovespa (IBOV) B3 — Ativo de mercado com variação colorida */}
            <div className="flex items-center rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 transition-all shrink-0 text-xs text-slate-200 shadow-2xs">
              <PortalLink
                route="economia"
                className="group flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 py-1.5 text-slate-200 hover:text-white transition-colors"
                title={`Ibovespa (IBOV): ${ibovVal} (${ibovVariationInfo.formatted}). ${
                  isIbovOpen
                    ? "Pregão Aberto (cotações públicas com defasagem regulatória mínima de 15 min)."
                    : "Mercado Fechado (último fechamento oficial consolidado)."
                } ${isIbovOpen ? "Cotação:" : "Fechamento:"} ${ibovTimestamp}. Fonte oficial: B3.`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                  IBOV:
                </span>
                <span className="font-mono font-extrabold text-white text-xs sm:text-[13px] tabular-nums tracking-tight">
                  {ibovVal}
                </span>
                {hasIbovValue && ibovVariationInfo.type !== "unavailable" && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 tabular-nums ${
                      ibovVariationInfo.type === "positive"
                        ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/40"
                        : ibovVariationInfo.type === "negative"
                        ? "text-rose-400 bg-rose-950/60 border border-rose-500/40"
                        : "text-slate-300 bg-slate-700/70 border border-slate-600/60"
                    }`}
                  >
                    {ibovTrendArrow && <span>{ibovTrendArrow}</span>}
                    <span>{ibovVariationInfo.formatted}</span>
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans pl-1.5 border-l border-slate-700/80 whitespace-nowrap">
                  {isIbovOpen ? "Aberto · 15m" : "Fechado"} · B3
                </span>
              </PortalLink>
              <a
                href="https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[32px] min-w-[32px] px-1.5 py-1 text-slate-400 hover:text-white transition-colors inline-flex items-center justify-center rounded-md"
                title="Abrir cotação oficial diretamente no portal da B3 (defasagem de 15 min)"
                aria-label="Abrir cotação oficial do Ibovespa no portal da B3"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Mini-Card 5: Eleições 2026 (Apuração 1º Turno) — Totalmente visível no desktop */}
            <PortalLink
              route="eleicoes"
              className="group flex items-center gap-1.5 lg:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-900/80 transition-all shrink-0 text-xs text-slate-200 shadow-2xs"
              title="Eleições 2026: 100% das seções totalizadas pelo TSE no 1º turno"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300 transition-colors">
                Eleições:
              </span>
              <span className="font-mono font-extrabold text-white text-xs sm:text-[13px] tabular-nums tracking-tight">
                100% Apurado
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans pl-1.5 border-l border-slate-700/80 whitespace-nowrap">
                1ºT · TSE
              </span>
            </PortalLink>
          </div>
        </div>
      </div>

      {/* 2. Linha Utilitária Discreta (Transparência, Metodologia e JSON TSE) */}
      <div className="bg-slate-950 text-slate-400 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800/90 block w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full">
          <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Dados Oficiais Verificados · Fontes primárias públicas</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs font-sans text-slate-400 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto scrollbar-none py-0.5">
            <PortalLink
              route="sobre"
              className="text-slate-300 hover:text-white transition-colors font-medium text-[11px] sm:text-xs whitespace-nowrap"
            >
              Transparência &amp; Fontes
            </PortalLink>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={onOpenMethodology}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer font-medium text-[11px] sm:text-xs whitespace-nowrap"
            >
              Metodologia
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={onOpenDataInspector}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-slate-900 text-[11px] sm:text-xs whitespace-nowrap"
              title="Inspecionar dados oficiais em formato JSON (TSE)"
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span>JSON TSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bloco Central da Marca (Logotipo, Wordmark e Subtítulo) e Ação de Busca */}
      <div className="border-b border-slate-100">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-center">
          {/* Marca / Identidade Editorial Sociedade Ativa Centralizada */}
          <PortalLink
            route="home"
            className="flex flex-col items-center justify-center text-center group focus-visible:outline-2 focus-visible:outline-blue-700 rounded-lg p-1 max-w-[calc(100%-110px)] sm:max-w-none"
            title="Sociedade Ativa — Página Inicial"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-heading font-black text-xs sm:text-sm tracking-widest shadow-xs shrink-0 select-none border border-blue-950 group-hover:bg-blue-800 transition-colors"
                aria-label="Sociedade Ativa Logotipo"
              >
                SA
              </div>
              <span className="font-heading text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-slate-950 uppercase leading-none whitespace-nowrap">
                Sociedade Ativa
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-1 text-center">
              Política, eleições, notícias e dados do Brasil
            </p>
          </PortalLink>

          {/* Ação de Busca e Menu Mobile */}
          <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="min-h-[44px] min-w-[44px] sm:min-w-0 px-2.5 sm:px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700"
                title="Pesquisar notícias, indicadores ou estados"
                aria-label="Pesquisar no portal"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            )}

            {/* Botão de Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700"
              aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Linha Exclusiva de Navegação Temática (Abaixo do bloco da marca, centralizada horizontalmente) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Navegação editorial principal"
            className="flex items-center justify-start md:justify-center gap-3 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-none py-2 text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            {mainNavLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route === "noticias" && currentRoute === "artigo");
              return (
                <PortalLink
                  key={link.route}
                  route={link.route}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? link.activeClass
                      : `border-transparent ${link.colorClass}`
                  }`}
                >
                  {link.label}
                </PortalLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 4. Gaveta Mobile de Navegação */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-xl transition-all">
          <nav className="flex flex-col gap-1 text-sm font-bold text-slate-800">
            {drawerLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route === "noticias" && currentRoute === "artigo");
              return (
                <PortalLink
                  key={link.route}
                  route={link.route}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight
                    className={`w-4 h-4 ${isActive ? "text-slate-300" : "text-slate-400"}`}
                  />
                </PortalLink>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
              <PortalLink
                route="sobre"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Sobre &amp; Metodologia Editorial</span>
              </PortalLink>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDataInspector();
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
              >
                <Database className="w-4 h-4 text-slate-400" />
                <span>Inspecionar Dados Oficiais (JSON)</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
