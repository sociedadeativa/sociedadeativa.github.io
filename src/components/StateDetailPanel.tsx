import React from "react";
import {
  ElectionDataSet,
  StateElectionResult,
  Candidate,
  formatVotesBR,
  formatPercentBR,
} from "../data/electionData";
import { CandidateImage } from "./CandidateImage";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Award,
  BarChart2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Info,
} from "lucide-react";

interface StateDetailPanelProps {
  dataset: ElectionDataSet;
  uf: string | null;
  onClose: () => void;
  onSelectState: (uf: string) => void;
}

export const StateDetailPanel: React.FC<StateDetailPanelProps> = ({
  dataset,
  uf,
  onClose,
  onSelectState,
}) => {
  if (!uf) return null;

  const stateData: StateElectionResult | undefined = dataset.states[uf];
  if (!stateData) return null;

  const candidatesMap = Object.fromEntries(
    dataset.candidates.map((c) => [c.id, c])
  );

  const sortedCandidates = [...stateData.candidates].sort((a, b) => b.votes - a.votes);
  const winner: Candidate | undefined = candidatesMap[stateData.winnerId] || candidatesMap[sortedCandidates[0]?.candidateId];
  const runnerUpResult = sortedCandidates[1];
  const runnerUp: Candidate | undefined = runnerUpResult
    ? candidatesMap[runnerUpResult.candidateId]
    : undefined;

  // Candidatos que não estão presentes individualmente nesta apuração estadual
  const otherCandidates = dataset.candidates.filter(
    (c) => !stateData.candidates.some((sc) => sc.candidateId === c.id)
  );

  // Lista ordenada alfabeticamente para navegação anterior/próximo
  const allUfs = Object.keys(dataset.states).sort();
  const currentIndex = allUfs.indexOf(uf);
  const prevUf = currentIndex > 0 ? allUfs[currentIndex - 1] : allUfs[allUfs.length - 1];
  const nextUf = currentIndex < allUfs.length - 1 ? allUfs[currentIndex + 1] : allUfs[0];

  return (
    <>
      {/* Backdrop para fechar ao tocar fora no mobile */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Cabeçalho do Painel Lateral */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base text-white bg-slate-950 px-2.5 py-0.5 rounded-lg shadow-xs">
                {stateData.uf}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Região {stateData.region} · Capital: {stateData.capital}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectState(prevUf)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title={`Estado anterior (${prevUf})`}
                aria-label={`Ver estado anterior: ${prevUf}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelectState(nextUf)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title={`Próximo estado (${nextUf})`}
                aria-label={`Ver próximo estado: ${nextUf}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="h-5 w-px bg-slate-300 mx-0.5" />
              <button
                onClick={onClose}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title="Fechar painel"
                aria-label="Fechar painel de detalhes do estado"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stateData.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              100,00% apuradas ({formatVotesBR(stateData.sectionsCounted)} seções eleitorais)
            </span>
          </div>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Destaque do Candidato Vencedor no Estado com Fotografia Oficial */}
          {winner && (
            <div
              className="p-5 rounded-2xl border relative overflow-hidden shadow-xs"
              style={{
                borderColor: `${winner.color}40`,
                backgroundColor: `${winner.color}08`,
              }}
            >
              <div
                className="absolute top-0 left-0 bottom-0 w-2"
                style={{ backgroundColor: winner.color }}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-16 sm:w-20 shrink-0">
                    <CandidateImage
                      src={winner.photoUrl}
                      alt={`Fotografia oficial de ${winner.popularName}, vencedor em ${stateData.name}`}
                      candidateName={winner.popularName}
                      ballotNumber={winner.ballotNumber}
                      partyColor={winner.color}
                      aspectRatio="portrait"
                      size="md"
                      className="rounded-xl shadow-xs"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Vencedor na Unidade Federativa
                    </span>
                    <h3 className="font-heading text-xl font-black text-slate-900">
                      {winner.popularName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span
                        className="px-2 py-0.5 rounded text-white font-mono text-xs font-bold shadow-2xs shrink-0"
                        style={{ backgroundColor: winner.color }}
                      >
                        nº {winner.ballotNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                        {winner.party}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-1 mt-1 block">
                      {winner.coalition}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-2xl font-black text-slate-950 block">
                    {formatPercentBR(sortedCandidates[0]?.percentage || 0)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium block">
                    {formatVotesBR(sortedCandidates[0]?.votes || 0)} votos
                  </span>
                </div>
              </div>

              {runnerUp && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
                  <span>
                    Vantagem sobre {runnerUp.popularName} ({runnerUp.party}):
                  </span>
                  <span className="font-mono font-extrabold text-slate-900">
                    +{formatPercentBR(stateData.marginPercentage)} ({formatVotesBR(stateData.marginVotes)} votos)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 1. Quadro de Votação Nominal Oficial no Estado */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-slate-500" />
                Votos Válidos no Estado ({stateData.uf})
              </h4>
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                Base Constitucional: {formatVotesBR(stateData.validVotes)} votos
              </span>
            </div>

            <div className="space-y-3">
              {stateData.candidates.map((cr, idx) => {
                const cand = candidatesMap[cr.candidateId];
                const isWinner = idx === 0;

                if (!cand && cr.candidateId === "outros") {
                  return (
                    <div
                      key="outros"
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 w-4">
                            #{idx + 1}
                          </span>

                          <div className="w-10 h-12 shrink-0 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-mono font-black text-xs shadow-2xs">
                            DIV
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-slate-700 bg-slate-200 text-[10px] font-mono font-bold border border-slate-300">
                                TSE
                              </span>
                              <span className="font-bold text-slate-900 text-xs block leading-tight">
                                Demais Candidatos Homologados
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Cury, Santos, Caiado, Zema e demais siglas
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-extrabold text-sm text-slate-900 block">
                            {formatPercentBR(cr.percentage)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatVotesBR(cr.votes)} votos
                          </span>
                        </div>
                      </div>

                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-slate-500"
                          style={{ width: `${cr.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }

                if (!cand) return null;

                return (
                  <div
                    key={cr.candidateId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWinner
                        ? "border-slate-300 bg-slate-50/70 shadow-2xs"
                        : "border-slate-100 bg-white hover:bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400 w-4">
                          #{idx + 1}
                        </span>

                        <div className="w-10 h-12 shrink-0 rounded-lg overflow-hidden">
                          <CandidateImage
                            src={cand.photoUrl}
                            alt={`Retrato oficial de ${cand.popularName}`}
                            candidateName={cand.popularName}
                            ballotNumber={cand.ballotNumber}
                            partyColor={cand.color}
                            aspectRatio="portrait"
                            size="sm"
                            className="rounded-lg"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded text-white text-[10px] font-mono font-bold shrink-0 shadow-2xs"
                              style={{ backgroundColor: cand.color }}
                            >
                              nº {cand.ballotNumber}
                            </span>
                            <span className="font-bold text-slate-900 text-xs block leading-tight truncate">
                              {cand.popularName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {cand.party} · {cand.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-sm text-slate-900 block">
                          {formatPercentBR(cr.percentage)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatVotesBR(cr.votes)} votos
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cr.percentage}%`,
                          backgroundColor: cand.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Demais Candidaturas Homologadas no TSE (Totalização Nacional Certificada) */}
          {otherCandidates.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Demais Candidaturas Registradas no TSE
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {otherCandidates.length} concorrentes homologados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {otherCandidates.map((oc) => (
                  <div
                    key={oc.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5"
                  >
                    <div className="w-9 h-11 shrink-0 rounded-md overflow-hidden">
                      <CandidateImage
                        src={oc.photoUrl}
                        alt={`Retrato oficial de ${oc.popularName}`}
                        candidateName={oc.popularName}
                        ballotNumber={oc.ballotNumber}
                        partyColor={oc.color}
                        aspectRatio="portrait"
                        size="sm"
                        className="rounded-md"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 rounded text-white text-[9px] font-mono font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: oc.color }}
                        >
                          nº {oc.ballotNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {oc.popularName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {oc.party} · {formatVotesBR(oc.nationalVotes)} votos
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-blue-700 font-mono font-bold">
                          {formatPercentBR(oc.nationalPercentage)} nacional
                        </span>
                        <a
                          href={oc.tseSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-slate-500 hover:text-blue-700 inline-flex items-center gap-0.5 font-semibold"
                          title={`Ver ficha oficial de ${oc.popularName} no DivulgaCandContas do TSE`}
                        >
                          <span>TSE</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nota de Integridade e Transparência Eleitoral Obrigatória */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Documentação de Integridade Factual:</strong> No âmbito estadual, o relatório de totalização preliminar por UF agrupa os votos das candidaturas que não alcançaram o 2º turno. Em conformidade com o rigor de não extrapolar ou redistribuir dados matematicamente sem certificação do TSE, os resultados nominais individuais auditados de cada concorrente são apresentados no escopo nacional consolidado.
                </p>
              </div>
            </div>
          )}

          {/* 3. Estatísticas e Participação Eleitoral: Distinção Rigorosa de Votos Válidos, Brancos e Nulos */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Estatísticas de Comparecimento e Apuração (TSE)
            </h4>

            {/* Grupo 1: Participação do Eleitorado */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Eleitorado Apto</span>
                <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                  {formatVotesBR(stateData.electorate)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  100% dos eleitores cadastrados
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Comparecimento às Urnas</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatPercentBR(stateData.turnoutPercentage)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatVotesBR(stateData.turnout)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Eleitores presentes
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-900 font-bold">Abstenção Eleitoral</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-bold text-sm text-amber-950">
                      {formatPercentBR(stateData.abstentionPercentage)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono">
                      ({formatVotesBR(stateData.abstention)} eleitores ausentes)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grupo 2: Distinção Constitucional entre Votos Válidos vs. Brancos e Nulos */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-950 font-black block">
                      Votos Válidos Nominais (Base Oficial)
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Base de cálculo estrita dos percentuais dos candidatos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-emerald-950 block">
                      {formatPercentBR(stateData.validVotesPercentage)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      {formatVotesBR(stateData.validVotes)} votos
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Votos em Branco</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {formatPercentBR(stateData.blankVotesPercentage)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatVotesBR(stateData.blankVotes)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Excluídos dos válidos
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Votos Nulos</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {formatPercentBR(stateData.nullVotesPercentage)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatVotesBR(stateData.nullVotes)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Excluídos dos válidos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Previsão Constitucional do Artigo 77 */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-200/80">
            <p>
              <strong>Regra Constitucional (Artigo 77, § 2º da CF/88):</strong> Será considerado eleito o candidato que obtiver a maioria absoluta de votos, não computados os em branco e os nulos. Caso nenhum alcance mais de 50%, realiza-se o segundo turno entre os dois mais votados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
