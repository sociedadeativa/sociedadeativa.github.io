import React, { useState, useMemo } from "react";
import {
  ElectionDataSet,
  StateElectionResult,
  formatVotesBR,
  formatPercentBR,
} from "../data/electionData";
import {
  Search,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";

interface StateTableProps {
  dataset: ElectionDataSet;
  selectedStateUf: string | null;
  onSelectState: (uf: string) => void;
}

type SortField =
  | "name"
  | "region"
  | "winner"
  | "flavioPct"
  | "lulaPct"
  | "margin"
  | "validVotes"
  | "turnout";
type SortDirection = "asc" | "desc";

export const StateTable: React.FC<StateTableProps> = ({
  dataset,
  selectedStateUf,
  onSelectState,
}) => {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedWinnerFilter, setSelectedWinnerFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("validVotes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const candidatesMap = useMemo(() => {
    return Object.fromEntries(dataset.candidates.map((c) => [c.id, c]));
  }, [dataset.candidates]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedStates = useMemo(() => {
    let list = Object.values(dataset.states);

    // Filtragem por busca
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.uf.toLowerCase().includes(q) ||
          s.capital.toLowerCase().includes(q)
      );
    }

    // Filtragem por região
    if (selectedRegion !== "all") {
      list = list.filter((s) => s.region === selectedRegion);
    }

    // Filtragem por candidato vencedor
    if (selectedWinnerFilter !== "all") {
      list = list.filter((s) => s.winnerId === selectedWinnerFilter);
    }

    // Ordenação das colunas
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const getCandidatePct = (st: StateElectionResult, id: string) => {
        return st.candidates.find((c) => c.candidateId === id)?.percentage || 0;
      };

      switch (sortField) {
        case "name":
          valA = a.name;
          valB = b.name;
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "region":
          valA = a.region;
          valB = b.region;
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "winner":
          valA = candidatesMap[a.winnerId]?.popularName || "";
          valB = candidatesMap[b.winnerId]?.popularName || "";
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "flavioPct":
          valA = getCandidatePct(a, "flavio");
          valB = getCandidatePct(b, "flavio");
          break;
        case "lulaPct":
          valA = getCandidatePct(a, "lula");
          valB = getCandidatePct(b, "lula");
          break;
        case "margin":
          valA = a.marginPercentage;
          valB = b.marginPercentage;
          break;
        case "validVotes":
          valA = a.validVotes;
          valB = b.validVotes;
          break;
        case "turnout":
          valA = a.turnoutPercentage;
          valB = b.turnoutPercentage;
          break;
      }

      return sortDirection === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [
    dataset.states,
    search,
    selectedRegion,
    selectedWinnerFilter,
    sortField,
    sortDirection,
    candidatesMap,
  ]);

  return (
    <section id="tabela-estados" className="py-12 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título e Descrição da Seção */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Quadro Comparativo por Estado
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Resultados Oficiais por Estado e DF
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Comparativo direto entre Flávio Bolsonaro (PL) e Lula (PT) nas 27 Unidades da Federação. Clique em qualquer linha para abrir a apuração detalhada no mapa.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono font-medium">
            Exibindo {filteredAndSortedStates.length} de 27 Unidades da Federação
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          {/* Caixa de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por estado ou sigla (ex: São Paulo, SP, Minas)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filtrar estados por nome ou sigla"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Filtros por Vencedor e Região */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro por Vencedor */}
            <div role="tablist" aria-label="Filtrar estados por resultado de apuração" className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
              <button
                role="tab"
                aria-selected={selectedWinnerFilter === "all"}
                aria-label="Exibir todos os estados"
                onClick={() => setSelectedWinnerFilter("all")}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-bold whitespace-nowrap active:bg-slate-200 flex items-center justify-center ${
                  selectedWinnerFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                Todos
              </button>
              <button
                role="tab"
                aria-selected={selectedWinnerFilter === "flavio"}
                aria-label="Filtrar estados com vitória de Flávio Bolsonaro"
                onClick={() => setSelectedWinnerFilter("flavio")}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-bold whitespace-nowrap active:bg-blue-100 flex items-center justify-center ${
                  selectedWinnerFilter === "flavio"
                    ? "bg-blue-700 text-white"
                    : "text-blue-700 hover:bg-blue-50"
                }`}
              >
                Vitória Flávio Bolsonaro
              </button>
              <button
                role="tab"
                aria-selected={selectedWinnerFilter === "lula"}
                aria-label="Filtrar estados com vitória de Lula"
                onClick={() => setSelectedWinnerFilter("lula")}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer text-xs font-bold whitespace-nowrap active:bg-red-100 flex items-center justify-center ${
                  selectedWinnerFilter === "lula"
                    ? "bg-red-600 text-white"
                    : "text-red-700 hover:bg-red-50"
                }`}
              >
                Vitória Lula
              </button>
            </div>

            {/* Filtro por Região */}
            <div role="tablist" aria-label="Filtrar tabela por região geográfica" className="flex items-center gap-1 overflow-x-auto text-xs py-0.5 max-w-full">
              {["all", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"].map(
                (reg) => {
                  const isActive = selectedRegion === reg;
                  return (
                    <button
                      key={reg}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Filtrar por ${reg === "all" ? "todas as regiões" : `região ${reg}`}`}
                      onClick={() => setSelectedRegion(reg)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap text-xs font-bold active:bg-slate-200 flex items-center justify-center ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:text-slate-950 border border-slate-200"
                      }`}
                    >
                      {reg === "all" ? "Todas as Regiões" : reg}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estado / Sigla</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("region")}
                    className="py-3.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Região</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("winner")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Vencedor no Estado</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("flavioPct")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors text-right whitespace-nowrap text-blue-900"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Flávio Bolsonaro (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("lulaPct")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors text-right whitespace-nowrap text-red-900"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Lula (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("margin")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Vantagem (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("validVotes")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Votos Válidos</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("turnout")}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Comparecimento</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="py-3.5 px-3 text-center whitespace-nowrap">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedStates.map((st) => {
                  const winner = candidatesMap[st.winnerId];
                  const isSelected = selectedStateUf === st.uf;

                  const fData = st.candidates.find((c) => c.candidateId === "flavio");
                  const lData = st.candidates.find((c) => c.candidateId === "lula");

                  return (
                    <tr
                      key={st.uf}
                      onClick={() => onSelectState(st.uf)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-100/90 font-medium" : ""
                      }`}
                    >
                      {/* UF e Nome do Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {st.uf}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {st.name}
                          </span>
                        </div>
                      </td>

                      {/* Região */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {st.region}
                      </td>

                      {/* Vencedor no Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {winner && (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: winner.color }}
                            />
                            <span className="font-bold text-slate-900">
                              {winner.popularName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({winner.party})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Flávio Bolsonaro % */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-blue-900 whitespace-nowrap text-sm">
                        {formatPercentBR(fData?.percentage || 0)}
                      </td>

                      {/* Lula % */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-red-900 whitespace-nowrap text-sm">
                        {formatPercentBR(lData?.percentage || 0)}
                      </td>

                      {/* Margem / Vantagem */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap font-medium">
                        +{formatPercentBR(st.marginPercentage)}
                      </td>

                      {/* Votos Válidos */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatVotesBR(st.validVotes)}
                      </td>

                      {/* Comparecimento */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatPercentBR(st.turnoutPercentage)}
                      </td>

                      {/* Botão de ação para abrir o painel */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectState(st.uf);
                          }}
                          className="text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Ver apuração deste estado"
                        >
                          <ChevronRight className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
