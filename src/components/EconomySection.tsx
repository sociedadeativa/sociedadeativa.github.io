import React from "react";
import { useEconomy } from "../hooks/useEconomy";
import { EconomyCard } from "./EconomyCard";
import { IndicatorDetailModal } from "./IndicatorDetailModal";
import { ECONOMY_CATEGORIES, EconomyCategory, OfficialAgency } from "../types/economy";
import {
  TrendingUp,
  Search,
  Building2,
  Landmark,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { handleTabKeyDown } from "../utils/a11yTabs";

export const EconomySection: React.FC = () => {
  const {
    filteredIndicators,
    selectedCategory,
    setSelectedCategory,
    selectedSource,
    setSelectedSource,
    searchQuery,
    setSearchQuery,
    activeIndicatorModal,
    setActiveIndicatorModal,
    stats,
  } = useEconomy();

  return (
    <section
      id="economia"
      className="py-12 sm:py-16 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Economia &amp; Dados Oficiais</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                IBGE • Banco Central do Brasil
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-slate-900">
              Indicadores Oficiais da Economia Brasileira
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Métricas públicas de inflação, atividade produtiva, emprego, juros e câmbio. Dados consolidados diretamente das pesquisas e séries temporais do Estado brasileiro.
            </p>
          </div>

          {/* Badges de Resumo e Integridade */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{stats.total} Indicadores Oficiais</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1 text-blue-700">
                <Building2 className="w-3 h-3" /> IBGE: {stats.ibgeCount}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-700">
                <Landmark className="w-3 h-3" /> BCB: {stats.bcbCount}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs mb-8 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Categorias */}
            {/* Abas de Categorias */}
            <div
              role="tablist"
              aria-label="Categorias de indicadores econômicos"
              onKeyDown={(e) =>
                handleTabKeyDown(
                  e,
                  ["Todas", ...ECONOMY_CATEGORIES] as const,
                  selectedCategory,
                  setSelectedCategory
                )
              }
              className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none"
            >
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                Categoria:
              </span>
              <button
                id="tab-econ-cat-Todas"
                role="tab"
                aria-selected={selectedCategory === "Todas"}
                tabIndex={selectedCategory === "Todas" ? 0 : -1}
                aria-controls="panel-economy-indicators"
                aria-label={`Todas (${stats.total}): visualizar todos os indicadores`}
                onClick={() => setSelectedCategory("Todas")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === "Todas"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Todas ({stats.total})
              </button>

              {ECONOMY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  id={`tab-econ-cat-${cat}`}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  tabIndex={selectedCategory === cat ? 0 : -1}
                  aria-controls="panel-economy-indicators"
                  aria-label={`${cat}: filtrar indicadores pela categoria ${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Busca e Filtro de Fonte */}
            <div className="flex items-center gap-2">
              {/* Filtro por Fonte */}
              <div
                role="tablist"
                aria-label="Filtrar por instituição emissora"
                onKeyDown={(e) =>
                  handleTabKeyDown(
                    e,
                    ["Todas", "IBGE", "Banco Central do Brasil"] as const,
                    selectedSource,
                    setSelectedSource
                  )
                }
                className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs"
              >
                {(["Todas", "IBGE", "Banco Central do Brasil"] as (OfficialAgency | "Todas")[]).map((src) => (
                  <button
                    key={src}
                    id={`tab-econ-src-${src === "Banco Central do Brasil" ? "BCB" : src}`}
                    role="tab"
                    aria-selected={selectedSource === src}
                    tabIndex={selectedSource === src ? 0 : -1}
                    aria-controls="panel-economy-indicators"
                    aria-label={`${src === "Banco Central do Brasil" ? "BCB" : src}: filtrar indicadores pela fonte oficial ${src}`}
                    onClick={() => setSelectedSource(src)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
                      selectedSource === src
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {src === "Banco Central do Brasil" ? "BCB" : src}
                  </button>
                ))}
              </div>

              {/* Campo de Busca */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar indicador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar indicador econômico oficial"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-800 placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cards dos Indicadores (TabPanel) */}
        <div id="panel-economy-indicators" role="tabpanel" aria-label="Indicadores econômicos oficiais">
          {filteredIndicators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIndicators.map((indicator) => (
                <EconomyCard
                  key={indicator.id}
                  indicator={indicator}
                  onOpenDetails={(ind) => setActiveIndicatorModal(ind)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-md mx-auto">
              <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-heading font-bold text-slate-800 text-base">
                Nenhum indicador encontrado
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Não encontramos resultados para a combinação de filtros ou busca selecionada.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("Todas");
                  setSelectedSource("Todas");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Nota Metodológica e Transparência */}
        <div className="mt-10 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900">
                Metodologia, Fontes Oficiais e Atualização Contínua
              </div>
              <p className="leading-relaxed">
                Todos os dados são de domínio público, apurados pelo <strong>IBGE</strong> (Sistema SIDRA) e pelo <strong>Banco Central do Brasil</strong> (Sistema SGS e PTAX). O Sociedade Ativa não produz estimativas próprias, não altera séries temporais e segue estritamente os calendários de divulgação oficial dos órgãos de Estado.
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Aviso de integridade: indicadores sincronizados automaticamente a partir das séries públicas estruturadas do IBGE (SIDRA) e do Banco Central do Brasil (SGS/PTAX), com validação de dados em pipeline seguro.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Indicador */}
      <IndicatorDetailModal
        indicator={activeIndicatorModal}
        onClose={() => setActiveIndicatorModal(null)}
      />
    </section>
  );
};
