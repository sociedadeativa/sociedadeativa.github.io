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

  // Busca indicadores oficiais validados para a barra simplificada
  const ipcaIndicator = indicators.find((i) => i.id === "ipca");
  const selicIndicator = indicators.find((i) => i.id === "selic");
  const dolarIndicator = indicators.find((i) => i.id === "dolar");
  const ibovIndicator = indicators.find((i) => i.id === "ibovespa" || i.id === "ibov");

  const ipcaVal = ipcaIndicator?.formattedValue || "+0,82%";
  const ipcaRef = ipcaIndicator?.referencePeriod || "Set/26";
  const selicVal = selicIndicator?.formattedValue || "14,00%";
  const dolarVal = dolarIndicator?.formattedValue || "R$ 4,99";

  const ibovTimestamp = ibovIndicator?.quoteTimestamp || ibovIndicator?.updatedAt || "29/10/2026 18:00";
  const b3MarketInfo = getB3MarketStatus(new Date(), {
    timestamp: ibovTimestamp,
    tradingSession: ibovIndicator?.referencePeriod,
    marketStatus: ibovIndicator?.marketStatus,
  });
  const hasIbovValue = ibovIndicator?.value !== null && ibovIndicator?.value !== undefined;
  const ibovVal = hasIbovValue ? ibovIndicator.formattedValue : "142.850 pts";
  const ibovVariationInfo = formatDailyVariation(ibovIndicator?.variation ?? null);
  const isIbovOpen = b3MarketInfo.isOpen;

  // Data editorial formatada em português brasileiro
  const currentDateFormatted = "Quinta-feira, 29 de outubro de 2026";

  const mainNavLinks: { route: PortalRoute; label: string }[] = [
    { route: "politica", label: "Política" },
    { route: "eleicoes", label: "Arquivo Eleições 2026" },
    { route: "economia", label: "Economia" },
    { route: "estados", label: "Estados" },
    { route: "dados-publicos", label: "Dados Públicos" },
    { route: "noticias", label: "Notícias" },
    { route: "esportes", label: "Esportes" },
    { route: "tecnologia", label: "Tecnologia" },
    { route: "clima", label: "Clima" },
  ];

  const drawerLinks: { route: PortalRoute; label: string }[] = [
    { route: "home", label: "Início" },
    ...mainNavLinks,
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 transition-all shadow-xs">
      {/* 1. Barra de Informações Superior Simplificada (Essencial, Limpa e Elegante) */}
      <div className="bg-[#0B132B] text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Data Editorial e Ticker de Indicadores Essenciais */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap hidden sm:inline">
              {currentDateFormatted}
            </span>
            <span className="text-slate-700 hidden sm:inline" aria-hidden="true">·</span>

            <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono whitespace-nowrap">
              {/* Dólar PTAX */}
              <PortalLink
                route="economia"
                className="hover:text-white transition-colors flex items-center gap-1 text-slate-300"
                title={`Dólar Comercial PTAX: ${dolarVal} — Banco Central do Brasil`}
              >
                <span className="font-sans font-bold text-slate-400 text-[10px] uppercase">PTAX:</span>
                <span className="font-semibold text-white">{dolarVal}</span>
              </PortalLink>

              <span className="text-slate-700" aria-hidden="true">/</span>

              {/* IPCA */}
              <PortalLink
                route="economia"
                className="hover:text-white transition-colors flex items-center gap-1 text-slate-300"
                title={`IPCA mensal oficial: ${ipcaVal} — Fonte: IBGE`}
              >
                <span className="font-sans font-bold text-slate-400 text-[10px] uppercase">IPCA:</span>
                <span className="font-semibold text-white">{ipcaVal}</span>
              </PortalLink>

              <span className="text-slate-700" aria-hidden="true">/</span>

              {/* Selic */}
              <PortalLink
                route="economia"
                className="hover:text-white transition-colors flex items-center gap-1 text-slate-300"
                title={`Taxa Selic Meta Copom: ${selicVal} — Fonte: Banco Central`}
              >
                <span className="font-sans font-bold text-slate-400 text-[10px] uppercase">Selic:</span>
                <span className="font-semibold text-white">{selicVal}</span>
              </PortalLink>

              <span className="text-slate-700" aria-hidden="true">/</span>

              {/* Ibovespa B3 */}
              <PortalLink
                route="economia"
                className="hover:text-white transition-colors flex items-center gap-1 text-slate-300"
                title={`Ibovespa: ${ibovVal} (${ibovVariationInfo.formatted}) — B3`}
              >
                <span className="font-sans font-bold text-slate-400 text-[10px] uppercase">IBOV:</span>
                <span className="font-semibold text-white">{ibovVal}</span>
                {ibovVariationInfo.type !== "unavailable" && (
                  <span
                    className={`text-[10px] font-bold ${
                      ibovVariationInfo.type === "positive"
                        ? "text-emerald-400"
                        : ibovVariationInfo.type === "negative"
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {ibovVariationInfo.formatted}
                  </span>
                )}
              </PortalLink>

              <span className="text-slate-700" aria-hidden="true">·</span>

              {/* Status Eleições 2026: Homologado */}
              <PortalLink
                route="eleicoes"
                className="hover:text-white transition-colors flex items-center gap-1 text-blue-300 font-sans text-[10px] font-bold uppercase tracking-wider"
                title="Eleições 2026: Totalização Homologada pelo TSE"
              >
                <span>Eleições 2026: Homologado</span>
              </PortalLink>
            </div>
          </div>

          {/* Links Utilitários Essenciais (Transparência, Metodologia, JSON TSE) */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-sans text-slate-400 shrink-0">
            <PortalLink
              route="sobre"
              className="text-slate-300 hover:text-white transition-colors font-medium whitespace-nowrap"
            >
              Transparência
            </PortalLink>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={onOpenMethodology}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer font-medium whitespace-nowrap"
            >
              Metodologia
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              onClick={onOpenDataInspector}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 font-medium whitespace-nowrap"
              title="Inspecionar dados oficiais em formato JSON (TSE)"
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span>JSON TSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bloco Central da Marca (Logotipo Proeminente, Wordmark e Ações) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          {/* Lado Esquerdo: Identidade de Marca Sociedade Ativa Proeminente */}
          <PortalLink
            route="home"
            className="group flex items-center gap-3 sm:gap-4 focus-visible:outline-2 focus-visible:outline-blue-700 rounded-lg p-0.5"
            title="Sociedade Ativa — Página Inicial"
          >
            {/* Brasão / Selo Editorial */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0B132B] text-white flex items-center justify-center font-heading font-black text-sm sm:text-base tracking-widest shadow-sm shrink-0 border border-slate-800 group-hover:bg-[#1C2541] transition-colors"
              aria-label="Sociedade Ativa Monograma"
            >
              SA
            </div>

            {/* Wordmark e Linha Editorial com Maior Destaque e Legibilidade */}
            <div className="flex flex-col">
              <span className="font-heading text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-950 uppercase leading-none group-hover:text-blue-900 transition-colors">
                Sociedade Ativa
              </span>
              <p className="text-xs sm:text-[13px] text-slate-600 font-medium tracking-normal mt-1 leading-snug">
                Jornalismo Público, Política e Dados Oficiais do Brasil
              </p>
            </div>
          </PortalLink>

          {/* Lado Direito: Ação de Busca Acessível e Menu Mobile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="min-h-[44px] min-w-[44px] sm:min-w-0 px-3.5 sm:px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700 shadow-2xs"
                title="Pesquisar notícias, artigos ou indicadores"
                aria-label="Buscar no portal"
              >
                <Search className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="hidden sm:inline">Buscar no portal</span>
                <span className="hidden lg:inline text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Ctrl+K
                </span>
              </button>
            )}

            {/* Botão de Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700"
              aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Linha de Navegação Editorial (Categorias com Espaçamento e Contraste Otimizados) */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Navegação editorial principal"
            className="flex items-center justify-start gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1.5 text-xs lg:text-[13px] font-bold text-slate-700"
          >
            {mainNavLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route === "noticias" && currentRoute === "artigo");
              return (
                <PortalLink
                  key={link.route}
                  route={link.route}
                  className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#0B132B] text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                  }`}
                >
                  {link.label}
                </PortalLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 4. Gaveta Mobile de Navegação Completa e Responsiva */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-xl transition-all">
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#0B132B] text-white"
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

            <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-2">
              <PortalLink
                route="sobre"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Sobre &amp; Transparência Editorial</span>
              </PortalLink>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMethodology();
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Critérios &amp; Metodologia</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDataInspector();
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>Inspecionar Dados Oficiais (JSON TSE)</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
