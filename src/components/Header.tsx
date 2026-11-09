import React, { useState, useMemo, useEffect } from "react";
import { Database, FileText, Search, Menu, X, ChevronRight } from "lucide-react";
import { ElectionDataSet } from "../data/electionData";
import { PortalRoute } from "../utils/router";
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

  // Atalho de teclado Ctrl+K / Cmd+K para abrir busca internamente
  useEffect(() => {
    if (!onOpenSearch) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  // Busca indicadores oficiais validados para a barra de cotações
  const ipcaIndicator = indicators.find((i) => i.id === "ipca");
  const selicIndicator = indicators.find((i) => i.id === "selic");
  const dolarIndicator = indicators.find((i) => i.id === "dolar");
  const ibovIndicator = indicators.find((i) => i.id === "ibovespa" || i.id === "ibov");

  const ipcaVal = ipcaIndicator?.formattedValue || "+0,82%";
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

  // Data editorial formatada em português brasileiro
  const currentDateFormatted = useMemo(() => {
    try {
      const formatted = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return "Quinta-feira, 29 de outubro de 2026";
    }
  }, []);

  // 11 Seções editoriais na ordem oficial solicitada
  const horizontalNavItems: {
    route: PortalRoute;
    label: string;
    subId?: string;
  }[] = [
    { route: "politica", label: "Política" },
    { route: "politica", label: "Governo", subId: "governo" },
    { route: "politica", label: "Congresso", subId: "congresso" },
    { route: "politica", label: "Justiça", subId: "justica" },
    { route: "economia", label: "Economia" },
    { route: "estados", label: "Brasil" },
    { route: "esportes", label: "Esportes" },
    { route: "tecnologia", label: "Tecnologia" },
    { route: "entretenimento", label: "Entretenimento" },
    { route: "dados-publicos", label: "Dados Públicos" },
    { route: "clima", label: "Clima" },
  ];

  const drawerLinks: { route: PortalRoute; label: string }[] = [
    { route: "home", label: "Início" },
    { route: "politica", label: "Política & Eleições" },
    { route: "economia", label: "Economia" },
    { route: "estados", label: "Brasil & Estados" },
    { route: "esportes", label: "Esportes" },
    { route: "tecnologia", label: "Tecnologia" },
    { route: "entretenimento", label: "Entretenimento" },
    { route: "dados-publicos", label: "Dados Públicos" },
    { route: "clima", label: "Clima" },
    { route: "noticias", label: "Últimas Notícias" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 transition-all shadow-xs">
      {/* 1. NÍVEL 1: IDENTIDADE DE MARCA E AÇÕES PRINCIPAIS */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          {/* Layout Desktop: Menu à Esquerda | SA Sociedade Ativa Centralizada | Ações à Direita */}
          <div className="hidden md:grid md:grid-cols-3 md:items-center gap-4">
            {/* Lado Esquerdo: Botão Menu / Seções */}
            <div className="flex items-center justify-start gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-700 active:bg-slate-100"
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir índice completo de seções do portal"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-slate-700" /> : <Menu className="w-4 h-4 text-slate-700" />}
                <span>Menu</span>
              </button>
            </div>

            {/* Centro: Marca SA Sociedade Ativa Centralizada */}
            <div className="flex justify-center">
              <PortalLink
                route="home"
                className="group flex items-center gap-3 text-center focus-visible:outline-2 focus-visible:outline-blue-700 rounded-lg p-1"
                title="Sociedade Ativa — Página Inicial"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-[#0B132B] text-white flex items-center justify-center font-heading font-black text-sm tracking-widest shadow-sm shrink-0 border border-slate-800 group-hover:bg-[#1C2541] transition-colors"
                  aria-label="Sociedade Ativa Monograma"
                >
                  SA
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-heading text-xl lg:text-2xl font-black tracking-tight text-slate-950 uppercase leading-none group-hover:text-blue-900 transition-colors">
                    Sociedade Ativa
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium tracking-normal mt-0.5 leading-tight">
                    Jornalismo Cívico, Política &amp; Dados Oficiais
                  </span>
                </div>
              </PortalLink>
            </div>

            {/* Lado Direito: Busca, Sobre e Transparência */}
            <div className="flex items-center justify-end gap-2.5 lg:gap-3 text-xs">
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="min-h-[44px] min-w-[44px] sm:min-w-0 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-center gap-2 font-semibold cursor-pointer active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700 shadow-2xs"
                  title="Pesquisar notícias, artigos ou indicadores"
                  aria-label="Buscar"
                >
                  <Search className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Buscar</span>
                </button>
              )}

              <PortalLink
                route="sobre"
                className="text-slate-600 hover:text-slate-950 font-semibold px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                Sobre
              </PortalLink>

              <span className="text-slate-300" aria-hidden="true">·</span>

              <PortalLink
                route="sobre"
                className="text-slate-600 hover:text-slate-950 font-semibold px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                Transparência
              </PortalLink>
            </div>
          </div>

          {/* Layout Mobile: Marca à Esquerda | Ações de Busca e Menu à Direita */}
          <div className="md:hidden flex items-center justify-between gap-3">
            {/* Marca alinhada à esquerda no mobile */}
            <PortalLink
              route="home"
              className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-blue-700 rounded-lg p-0.5"
              title="Sociedade Ativa — Página Inicial"
            >
              <div
                className="w-9 h-9 rounded-xl bg-[#0B132B] text-white flex items-center justify-center font-heading font-black text-xs tracking-widest shadow-sm shrink-0 border border-slate-800"
                aria-label="Sociedade Ativa Monograma"
              >
                SA
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                  Sociedade Ativa
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-none mt-1">
                  Jornalismo &amp; Dados Oficiais
                </span>
              </div>
            </PortalLink>

            {/* Ações Mobile: Busca e Menu à Direita */}
            <div className="flex items-center gap-2">
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="min-h-[44px] min-w-[44px] sm:min-w-0 p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-center cursor-pointer active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700"
                  title="Pesquisar notícias, artigos ou indicadores"
                  aria-label="Buscar no portal"
                >
                  <Search className="w-4 h-4 text-slate-700" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700"
                aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NÍVEL 2: BARRA DE NAVEGAÇÃO HORIZONTAL (11 CATEGORIAS) */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Navegação editorial principal"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-1.5 text-xs lg:text-[13px] font-bold text-slate-700 touch-pan-x whitespace-nowrap"
          >
            {horizontalNavItems.map((item, index) => {
              const isActive =
                currentRoute === item.route &&
                (!item.subId || currentRoute === "politica");

              return (
                <PortalLink
                  key={`${item.route}-${item.label}-${index}`}
                  route={item.route}
                  hash={item.subId}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    isActive
                      ? "bg-[#0B132B] text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-200/80"
                  }`}
                >
                  {item.label}
                </PortalLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. NÍVEL 3: DATA BRASILEIRA E TICKER DE INDICADORES ECONÔMICOS */}
      <div className="bg-[#0B132B] text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Data Editorial e Ticker de Indicadores Oficiais */}
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

          {/* Links Utilitários Essenciais (Metodologia e JSON TSE) */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-sans text-slate-400 shrink-0">
            <button
              type="button"
              onClick={onOpenMethodology}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer font-medium whitespace-nowrap"
            >
              Critérios &amp; Metodologia
            </button>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <button
              type="button"
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

      {/* 4. GAVETA DE NAVEGAÇÃO COMPLETA (DRAWER / MENU) */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl transition-all">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="font-heading font-black text-xs uppercase tracking-wider text-slate-500">
                Índice Editorial Completo
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold p-1"
              >
                Fechar [x]
              </button>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm font-bold text-slate-800">
              {drawerLinks.map((link) => {
                const isActive =
                  currentRoute === link.route ||
                  (link.route === "noticias" && currentRoute === "artigo");
                return (
                  <PortalLink
                    key={link.route}
                    route={link.route}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
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
            </nav>

            <div className="pt-4 mt-3 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              <PortalLink
                route="sobre"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Sobre &amp; Transparência</span>
              </PortalLink>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMethodology();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Metodologia</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDataInspector();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Dados Oficiais (JSON TSE)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
