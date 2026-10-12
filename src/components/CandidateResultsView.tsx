import React, { useState, useMemo } from "react";
import {
  Candidate,
  ElectionDataSet,
  formatVotesBR,
  formatPercentBR,
} from "../data/electionData";
import { CandidateImage } from "./CandidateImage";
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Award,
  Vote,
  Info,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface CandidateResultsViewProps {
  dataset: ElectionDataSet;
  selectedStateUf?: string | null;
  onSelectCandidate?: (candidateId: string | null) => void;
  selectedCandidateId?: string | null;
  onClearStateSelection?: () => void;
}

type SortOption = "votes-desc" | "votes-asc" | "name-asc" | "ballot-asc";

export const CandidateResultsView: React.FC<CandidateResultsViewProps> = ({
  dataset,
  selectedStateUf,
  onSelectCandidate,
  selectedCandidateId,
  onClearStateSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("votes-desc");

  // Lista única de partidos para os botões de filtro
  const parties = useMemo(() => {
    const list = Array.from(new Set(dataset.candidates.map((c) => c.party)));
    return ["all", ...list];
  }, [dataset.candidates]);

  // Se houver um estado selecionado, busca os dados da UF
  const selectedStateData = selectedStateUf ? dataset.states[selectedStateUf] : null;

  // Filtra e ordena candidatos
  const displayedCandidates = useMemo(() => {
    let list = [...dataset.candidates];

    // Busca por nome ou nome popular
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.popularName.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.party.toLowerCase().includes(q) ||
          String(c.ballotNumber).includes(q)
      );
    }

    // Filtro por sigla partidária
    if (partyFilter !== "all") {
      list = list.filter((c) => c.party === partyFilter);
    }

    // Ordenação (ferramenta estrita de navegação e busca, não ranking valorativo)
    list.sort((a, b) => {
      const getVotes = (c: Candidate) => {
        if (selectedStateData) {
          const sc = selectedStateData.candidates.find((x) => x.candidateId === c.id);
          if (sc) return sc.votes;
        }
        return c.nationalVotes;
      };

      switch (sortOption) {
        case "votes-desc":
          return getVotes(b) - getVotes(a);
        case "votes-asc":
          return getVotes(a) - getVotes(b);
        case "name-asc":
          return a.popularName.localeCompare(b.popularName, "pt-BR");
        case "ballot-asc":
          return a.ballotNumber - b.ballotNumber;
        default:
          return 0;
      }
    });

    return list;
  }, [dataset.candidates, searchQuery, partyFilter, sortOption, selectedStateData]);

  const scopeLabel = selectedStateData
    ? `${selectedStateData.name} (${selectedStateData.uf})`
    : "Brasil (Totalização Nacional Oficial)";

  return (
    <section
      id="candidatos-resultado"
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 lg:p-8 shadow-xs my-8"
      aria-labelledby="titulo-painel-candidatos"
    >
      {/* Cabeçalho Editorial da Seção */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            <Vote className="w-4 h-4" />
            <span>Tribunal Superior Eleitoral · Apuração Nominal Completa</span>
          </div>
          <h2
            id="titulo-painel-candidatos"
            className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900"
          >
            Quadro Individual de Candidatos à Presidência
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Resultados nominais detalhados de todas as candidaturas registradas e homologadas no 1º turno das Eleições Presidenciais de 2026. Fotografias autênticas dos registros oficiais do TSE e órgãos públicos.
          </p>
        </div>

        {/* Indicador de Escopo Geográfico Atual */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Escopo Geográfico em Exibição
              </span>
              <span className="font-heading font-extrabold text-sm text-slate-900 block">
                {scopeLabel}
              </span>
            </div>
          </div>
          {selectedStateData && onClearStateSelection && (
            <button
              onClick={onClearStateSelection}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2 cursor-pointer ml-2"
              title="Voltar para exibição do total nacional"
            >
              Ver Brasil
            </button>
          )}
        </div>
      </div>

      {/* Controles de Navegação: Busca, Filtro Partidário e Ordenação */}
      <div className="pt-6 pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca por Nome */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar candidato por nome ou número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar candidato por nome ou número"
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controle de Ordenação */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <label htmlFor="select-ordenacao-candidatos" className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              id="select-ordenacao-candidatos"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700/20 cursor-pointer"
            >
              <option value="votes-desc">Total de Votos (Maior para menor)</option>
              <option value="votes-asc">Total de Votos (Menor para maior)</option>
              <option value="name-asc">Nome do Candidato (A-Z)</option>
              <option value="ballot-asc">Número de Urna (Crescente)</option>
            </select>
          </div>
        </div>

        {/* Filtro por Partido (Abas / Pílulas discretas) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Partido:
          </span>
          {parties.map((party) => {
            const isActive = partyFilter === party;
            const label = party === "all" ? "Todos os Partidos" : party;
            return (
              <button
                key={party}
                onClick={() => setPartyFilter(party)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Aviso de Transparência Cívica e Neutralidade Informativa */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Transparência Informativa:</strong> A busca, a filtragem partidária e a ordenação são estritamente ferramentas instrumentais de navegação e acessibilidade documental. Não constituem recomendações políticas, ranqueamentos de mérito ou juízos de valor editorial.
          </p>
        </div>
      </div>

      {/* Grade de Cartões Individuais dos Candidatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {displayedCandidates.map((cand, index) => {
          const isWinner1st = cand.id === "flavio";
          const isRunnerUp1st = cand.id === "lula";
          const isSelected = selectedCandidateId === cand.id;

          // Se estiver com estado selecionado, busca os votos daquele estado se disponíveis
          let votesToShow = cand.nationalVotes;
          let pctToShow = cand.nationalPercentage;
          let isStateGranular = false;

          if (selectedStateData) {
            const stateCand = selectedStateData.candidates.find((c) => c.candidateId === cand.id);
            if (stateCand) {
              votesToShow = stateCand.votes;
              pctToShow = stateCand.percentage;
              isStateGranular = true;
            }
          }

          return (
            <article
              key={cand.id}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between bg-white relative group ${
                isSelected
                  ? "ring-2 ring-blue-700 shadow-md border-blue-600 bg-blue-50/20"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Barra superior colorida com cor oficial do partido */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: cand.color }}
              />

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Topo do Card: Fotografia Oficial + Informações Básicas */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Retrato oficial do candidato */}
                    <div className="shrink-0 w-20 sm:w-24">
                      <CandidateImage
                        src={cand.photoUrl}
                        alt={`Fotografia oficial de ${cand.popularName}, candidato a Presidente da República em 2026`}
                        candidateName={cand.popularName}
                        ballotNumber={cand.ballotNumber}
                        partyColor={cand.color}
                        aspectRatio="portrait"
                        size="md"
                        showAttributionBadge={true}
                        attribution={cand.photoAttribution}
                        className="rounded-xl"
                      />
                    </div>

                    {/* Dados Nominais e Partidários */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className="font-mono font-black text-xs px-2 py-0.5 rounded text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: cand.color }}
                        >
                          nº {cand.ballotNumber}
                        </span>
                        <span className="font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {cand.party}
                        </span>
                        {isWinner1st && (
                          <span className="text-[10px] font-extrabold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Award className="w-3 h-3 text-blue-700" />
                            1º Lugar
                          </span>
                        )}
                        {isRunnerUp1st && (
                          <span className="text-[10px] font-extrabold text-red-900 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-red-700" />
                            2º Turno
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading text-lg font-black text-slate-950 leading-snug truncate">
                        {cand.popularName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight line-clamp-1 mt-0.5">
                        {cand.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {cand.coalition}
                      </p>
                    </div>
                  </div>

                  {/* Bloco de Votos e Percentual Válido */}
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 mb-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isStateGranular ? `Votos em ${selectedStateData?.uf}` : "Votos Válidos"}
                      </span>
                      <span className="font-mono font-black text-xl text-slate-950">
                        {formatPercentBR(pctToShow)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                      <span>Total Nominal:</span>
                      <strong className="font-extrabold text-slate-900">
                        {formatVotesBR(votesToShow)} votos
                      </strong>
                    </div>

                    {/* Barra de Progresso Visual */}
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(3, pctToShow))}%`,
                          backgroundColor: cand.color,
                        }}
                      />
                    </div>

                    {/* Transparência e integridade de dados para candidatos consolidados na UF */}
                    {selectedStateData && !isStateGranular && (
                      <div className="mt-2 text-[10px] text-slate-500 bg-white p-1.5 rounded border border-slate-200 leading-tight">
                        <span className="font-semibold text-slate-700">Total Nacional Homologado</span> · Na UF {selectedStateData.uf}, votos registrados no bloco oficial de candidaturas concorrentes.
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card: Escopo, Ano, Pleito e Link Oficial do TSE */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Ano 2026 · 1º Turno
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {isStateGranular ? selectedStateData?.uf : "Brasil"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={cand.tseSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 transition-colors text-xs"
                      title={`Consultar registro oficial de ${cand.popularName} no DivulgaCandContas do TSE`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registro no TSE</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </a>

                    {onSelectCandidate && (
                      <button
                        onClick={() =>
                          onSelectCandidate(isSelected ? null : cand.id)
                        }
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-950 cursor-pointer underline underline-offset-2"
                      >
                        {isSelected ? "Limpar destaque" : "Destacar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {displayedCandidates.length === 0 && (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 mt-4">
          <p className="font-semibold text-sm">Nenhum candidato encontrado com os filtros atuais.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setPartyFilter("all");
            }}
            className="mt-2 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
          >
            Limpar busca e filtros
          </button>
        </div>
      )}
    </section>
  );
};
