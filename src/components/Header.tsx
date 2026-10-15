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
  const dolarVal = dolarIndicator?.formattedValue || "R$ 4,99";
  const dolarRef = dolarIndicator?.referencePeriod || "PTAX 09/10/2026";

  const b3MarketInfo = getB3MarketStatus();
  const hasIbovValue = ibovIndicator?.value !== null && ibovIndicator?.value !== undefined;
  const ibovVal = hasIbovValue
    ? ibovIndicator.formattedValue
    : "Dados indisponíveis no momento.";
  const ibovVariationInfo = formatDailyVariation(ibovIndicator?.variation ?? null);
  const ibovTimestamp = ibovIndicator?.quoteTimestamp || "09/10/2026 18:00";
  const ibovStatus = ibovIndicator?.marketStatus || b3MarketInfo.status;
  const isIbovOpen = ibovStatus === "aberto";

  const navLinks: { route: PortalRoute; label: string; colorClass: string; activeClass: string }[] = [
    {
      route: "home",
      label: "Início",
      colorClass: "hover:text-slate-950",
      activeClass: "text-slate-950 font-black border-b-2 border-slate-900",
    },
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
      route: "clima",
      label: "Clima",
      colorClass: "hover:text-sky-700",
      activeClass: "text-sky-700 font-black border-b-2 border-sky-600",
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/98 backdrop-blur-md sticky top-0 z-40 transition-all">
      {/* 1. Barra de Utilitários e Indicadores Rápidos (Civic Ticker Oficial) */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800 block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
            <span className="font-bold text-white uppercase tracking-wider text-[10px] shrink-0 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Radar Oficial:
            </span>
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono tabular-nums whitespace-nowrap shrink-0">
              <PortalLink
                route="economia"
                className="text-slate-200 hover:text-white transition-colors flex items-center gap-1"
                title={`IPCA mensal oficial: ${ipcaVal} (${ipcaRef}) - IBGE`}
              >
                <strong className="text-emerald-400 font-sans font-bold text-[11px]">IPCA (mensal):</strong>
                <span>{ipcaVal}</span>
                <span className="text-[10px] text-slate-400 font-sans ml-0.5">[{ipcaRef.replace("setembro 2026", "Set/26")} · IBGE]</span>
              </PortalLink>

              <span className="text-slate-600" aria-hidden="true">·</span>

              <PortalLink
                route="economia"
                className="text-slate-200 hover:text-white transition-colors flex items-center gap-1"
                title={`Taxa Selic Meta Copom: ${selicVal} (${selicRef}) - BCB`}
              >
                <strong className="text-emerald-400 font-sans font-bold text-[11px]">Selic Meta:</strong>
                <span>{selicVal}</span>
                <span className="text-[10px] text-slate-400 font-sans ml-0.5">[06/08/26 · BCB]</span>
              </PortalLink>

              <span className="text-slate-600" aria-hidden="true">·</span>

              <PortalLink
                route="economia"
                className="text-slate-200 hover:text-white transition-colors flex items-center gap-1"
                title={`Dólar Comercial PTAX Venda oficial: ${dolarVal} (${dolarRef}) - BCB`}
              >
                <strong className="text-emerald-400 font-sans font-bold text-[11px]">PTAX Venda:</strong>
                <span>{dolarVal}</span>
                <span className="text-[10px] text-slate-400 font-sans ml-0.5">[{dolarRef.replace("Fechamento PTAX ", "")} · BCB]</span>
              </PortalLink>

              <span className="text-slate-600" aria-hidden="true">·</span>

              {/* Ibovespa (IBOV) B3 */}
              <div className="flex items-center gap-1 shrink-0">
                <PortalLink
                  route="economia"
                  className="text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                  title={`Ibovespa (IBOV): ${ibovVal} (${ibovVariationInfo.formatted}). ${
                    isIbovOpen
                      ? "Pregão Aberto (cotações públicas com defasagem regulatória mínima de 15 min)."
                      : "Mercado Fechado (último fechamento consolidado)."
                  } Cotação: ${ibovTimestamp}. Fonte oficial: B3.`}
                >
                  <strong className="text-emerald-400 font-sans font-bold text-[11px]">Ibovespa (IBOV):</strong>
                  <span>{ibovVal}</span>
                  {hasIbovValue && ibovVariationInfo.type !== "unavailable" && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-bold transition-colors ${
                        ibovVariationInfo.type === "positive"
                          ? "text-emerald-300 bg-emerald-950/80 border border-emerald-500/30"
                          : ibovVariationInfo.type === "negative"
                          ? "text-rose-300 bg-rose-950/80 border border-rose-500/30"
                          : "text-slate-300 bg-slate-800 border border-slate-700"
                      }`}
                    >
                      {ibovVariationInfo.formatted}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-sans ml-0.5">
                    [{isIbovOpen ? "Aberto · 15m" : "Fechado"} · {ibovTimestamp.split(" ")[0].slice(0, 5)} · B3]
                  </span>
                </PortalLink>
                <a
                  href="https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 inline-flex items-center"
                  title="Abrir cotação oficial diretamente no portal da B3 (defasagem de 15 min)"
                  aria-label="Abrir cotação oficial do Ibovespa no portal da B3"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <span className="text-slate-600" aria-hidden="true">·</span>

              <PortalLink
                route="eleicoes"
                className="text-slate-200 hover:text-white transition-colors flex items-center gap-1"
                title="Eleições 2026: 100% das seções totalizadas pelo TSE no 1º turno"
              >
                <strong className="text-blue-400 font-sans font-bold text-[11px]">Eleições 2026:</strong>
                <span>100% Apurado</span>
                <span className="text-[10px] text-slate-400 font-sans ml-0.5">[1º Turno · TSE]</span>
              </PortalLink>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-sans">
            <PortalLink
              route="sobre"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Transparência &amp; Fontes
            </PortalLink>
            <span className="text-slate-700" aria-hidden="true">|</span>
            <button
              onClick={onOpenMethodology}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Metodologia
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra Principal do Portal (Wordmark, Menu Editorial e Ações) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Marca / Identidade Editorial Sociedade Ativa */}
          <div className="flex items-center gap-3 min-w-0">
            <PortalLink
              route="home"
              className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-2 focus-visible:outline-blue-700 rounded-lg p-0.5"
              title="Sociedade Ativa — Página Inicial"
            >
              <div
                className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-heading font-black text-xs sm:text-sm tracking-widest shadow-xs shrink-0 select-none border border-blue-950 group-hover:bg-blue-800 transition-colors"
                aria-label="Sociedade Ativa Logotipo"
              >
                SA
              </div>
              <div className="min-w-0">
                <span className="font-heading text-base sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-none block truncate">
                  Sociedade Ativa
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight block truncate mt-0.5">
                  Política, eleições, notícias e dados do Brasil
                </span>
              </div>
            </PortalLink>
          </div>

          {/* Navegação Temática Principal (Desktop) */}
          <nav
            aria-label="Navegação editorial principal"
            className="hidden xl:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            {navLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route === "noticias" && currentRoute === "artigo");
              return (
                <PortalLink
                  key={link.route}
                  route={link.route}
                  className={`py-5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? link.activeClass : link.colorClass
                  }`}
                >
                  {link.label}
                </PortalLink>
              );
            })}
          </nav>

          {/* Navegação Compacta para Telas Médias (Tablet/Laptop) */}
          <nav
            aria-label="Navegação secundária"
            className="hidden lg:flex xl:hidden items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            {navLinks.slice(0, 5).map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route === "noticias" && currentRoute === "artigo");
              return (
                <PortalLink
                  key={link.route}
                  route={link.route}
                  className={`py-5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? link.activeClass : link.colorClass
                  }`}
                >
                  {link.label}
                </PortalLink>
              );
            })}
          </nav>

          {/* Ações Rápidas do Cabeçalho */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700"
                title="Pesquisar notícias, indicadores ou estados"
                aria-label="Pesquisar no portal"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            )}

            <button
              onClick={onOpenDataInspector}
              className="hidden md:flex min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 transition-colors items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer whitespace-nowrap active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700"
              title="Inspecionar dados oficiais em formato JSON"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON TSE</span>
            </button>

            {/* Botão de Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[40px] min-w-[40px] p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700"
              aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Gaveta Mobile de Navegação */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-xl transition-all">
          <nav className="flex flex-col gap-1 text-sm font-bold text-slate-800">
            {navLinks.map((link) => {
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
