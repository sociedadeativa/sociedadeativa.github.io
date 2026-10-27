import React from "react";
import { ElectionDataSet, StateElectionResult } from "../data/electionData";
import { BrazilMap } from "../components/BrazilMap";
import { CandidateResultsView } from "../components/CandidateResultsView";
import { StateTable } from "../components/StateTable";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import { MapPin, ArrowRight, Building, Users, CheckCircle2 } from "lucide-react";

interface EstadosPageProps {
  dataset: ElectionDataSet;
  selectedStateUf: string | null;
  candidateFilter: string | null;
  onSelectState: (uf: string | null) => void;
  onSelectCandidateFilter: (id: string | null) => void;
}

export const EstadosPage: React.FC<EstadosPageProps> = ({
  dataset,
  selectedStateUf,
  candidateFilter,
  onSelectState,
  onSelectCandidateFilter,
}) => {
  const activeCandidate = dataset.candidates.find((c) => c.id === candidateFilter);

  // Agrupamento por região
  const regions = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] as const;

  const allStates: StateElectionResult[] = Object.values(dataset.states);

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Estados */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
            <MapPin className="w-4 h-4" />
            <span>Caderno Especial · Federalismo &amp; Radiografia por Unidade da Federação</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Brasil por Estado: Mapa, Colégios Eleitorais e Resultados
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Explore a votação presidencial do 1º turno em cada um dos 26 estados brasileiros e no Distrito Federal. Veja comparecimento eleitoral, taxas de abstenção, votação nominal por candidato e margens de vitória.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Veja também:</span>
            <PortalLink
              route="eleicoes"
              className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
            >
              Apuração Nacional Consolidada &rarr;
            </PortalLink>
            <PortalLink
              route="dados-publicos"
              className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
            >
              Microdados e Gráficos Regionais &rarr;
            </PortalLink>
          </div>
        </div>

        {/* 1. Mapa Interativo do Brasil */}
        <div className="mb-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Visualização Cartográfica Oficial
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                Mapa de Votação por Estado (TSE 2026)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Passe o cursor ou toque em uma unidade da federação para inspecionar os votos válidos nominais e a margem de apuração.
              </p>
            </div>

            {activeCandidate && (
              <div className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span>Filtro de visualização:</span>
                <strong className="font-extrabold text-slate-900">
                  {activeCandidate.popularName}
                </strong>
                <button
                  onClick={() => onSelectCandidateFilter(null)}
                  className="ml-1 text-slate-500 hover:text-slate-900 font-black cursor-pointer text-sm"
                  title="Remover filtro"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          <BrazilMap
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectState={onSelectState}
            candidateFilter={candidateFilter}
            onSelectCandidateFilter={onSelectCandidateFilter}
          />
        </div>

        {/* 2. Quadro Individual de Candidatos à Presidência (Totalização ou Filtrado por UF) */}
        <div className="mb-12">
          <CandidateResultsView
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectCandidate={onSelectCandidateFilter}
            selectedCandidateId={candidateFilter}
            onClearStateSelection={() => onSelectState(null)}
          />
        </div>

        {/* 3. Destaques das 5 Grandes Regiões Brasileiras */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Panorama Político por Grande Região
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Consolidação de votos válidos e liderança eleitoral nas cinco regiões geográficas do IBGE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {regions.map((region) => {
              const statesInRegion = allStates.filter((s: StateElectionResult) => s.region === region);
              const totalElectorate = statesInRegion.reduce((acc: number, s: StateElectionResult) => acc + s.electorate, 0);
              const totalTurnout = statesInRegion.reduce((acc: number, s: StateElectionResult) => acc + s.turnout, 0);
              const turnoutPct = totalElectorate > 0 ? (totalTurnout / totalElectorate) * 100 : 0;
              const flavioWins = statesInRegion.filter((s: StateElectionResult) => s.winnerId === "flavio" || s.winnerId === "flavio-bolsonaro").length;
              const lulaWins = statesInRegion.filter((s: StateElectionResult) => s.winnerId === "lula").length;

              return (
                <div
                  key={region}
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                      {statesInRegion.length} UFs
                    </span>
                    <h3 className="font-heading text-lg font-black text-slate-900 mb-2">
                      {region}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div className="flex justify-between">
                        <span>Eleitorado:</span>
                        <strong className="text-slate-900 font-mono">
                          {(totalElectorate / 1000000).toFixed(1)}M
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Comparecimento:</span>
                        <strong className="text-slate-900 font-mono">
                          {turnoutPct.toFixed(1)}%
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span>Placar de estados:</span>
                        <strong className="text-slate-900">
                          {flavioWins} PL × {lulaWins} PT
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                    {statesInRegion.map((s) => (
                      <button
                        key={s.uf}
                        onClick={() => onSelectState(s.uf)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          selectedStateUf === s.uf
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title={`Abrir apuração de ${s.name}`}
                      >
                        {s.uf}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Tabela Geral de Apuração dos 26 Estados + DF */}
        <div className="mb-12">
          <StateTable
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectState={onSelectState}
          />
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
