import React, { useState, useMemo } from "react";
import { Search, X, ArrowRight, TrendingUp, Landmark, MapPin } from "lucide-react";
import { NewsItem } from "../types/news";
import { ElectionDataSet, StateElectionResult } from "../data/electionData";
import { EconomicIndicator } from "../types/economy";
import { PortalLink } from "./PortalLink";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem[];
  dataset: ElectionDataSet;
  indicators: EconomicIndicator[];
  onSelectArticle: (article: NewsItem) => void;
  onSelectState: (uf: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  news,
  dataset,
  indicators,
  onSelectArticle,
  onSelectState,
}) => {
  const [query, setQuery] = useState("");

  const statesList: StateElectionResult[] = useMemo(() => {
    return Object.values(dataset.states);
  }, [dataset.states]);

  const filteredNews = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return news
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 5);
  }, [news, query]);

  const filteredStates = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return statesList
      .filter(
        (s: StateElectionResult) =>
          s.name.toLowerCase().includes(q) ||
          s.uf.toLowerCase().includes(q) ||
          s.capital.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [statesList, query]);

  const filteredIndicators = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return indicators
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [indicators, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Pesquisa */}
        <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por notícias, estados, indicadores ou candidatos..."
            aria-label="Pesquisar notícias, estados, indicadores ou candidatos no portal"
            className="w-full bg-transparent text-sm sm:text-base outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Limpar campo de pesquisa"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Fechar janela de busca"
            title="Fechar busca"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-xs sm:text-sm">
          {!query.trim() && (
            <div className="text-center py-8 text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">
                Explore o acervo do Sociedade Ativa
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Digite um termo como &quot;IPCA&quot;, &quot;São Paulo&quot;, &quot;TSE&quot;, &quot;Congresso&quot; ou &quot;Segundo Turno&quot;.
              </p>
            </div>
          )}

          {/* Estados Encontrados */}
          {filteredStates.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Estados &amp; Resultados Eleitorais</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredStates.map((st: StateElectionResult) => (
                  <button
                    key={st.uf}
                    onClick={() => {
                      onSelectState(st.uf);
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {st.name} ({st.uf})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Capital: {st.capital} · {st.turnoutPercentage.toFixed(1)}% comparecimento
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicadores Econômicos Encontrados */}
          {filteredIndicators.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Indicadores Oficiais da Economia</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredIndicators.map((ind) => (
                  <PortalLink
                    key={ind.id}
                    route="economia"
                    onClick={onClose}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ind.name}</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {ind.formattedValue}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {ind.source} · {ind.category}
                    </div>
                  </PortalLink>
                ))}
              </div>
            </div>
          )}

          {/* Notícias Encontradas */}
          {filteredNews.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800 mb-2.5">
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Notícias e Atos Oficiais</span>
              </div>
              <div className="space-y-2">
                {filteredNews.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => {
                      onSelectArticle(art);
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      {art.category} · {art.source}
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                      {art.title}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {art.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() &&
            filteredNews.length === 0 &&
            filteredStates.length === 0 &&
            filteredIndicators.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p className="font-semibold text-slate-700">
                  Nenhum resultado direto para &quot;{query}&quot;
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Tente buscar por termos mais genéricos ou acesse os cadernos temáticos.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
