import React from "react";
import {
  ElectionDataSet,
  calculateNationalSummary,
  formatVotesBR,
  formatPercentBR,
} from "../data/electionData";
import { CandidateImage } from "./CandidateImage";
import {
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Award,
  Vote,
  Users,
  AlertCircle,
  TrendingUp,
  Percent,
} from "lucide-react";

interface NationalBannerProps {
  dataset: ElectionDataSet;
  onOpenMethodology: () => void;
  selectedCandidateFilter: string | null;
  onSelectCandidateFilter: (candidateId: string | null) => void;
}

export const NationalBanner: React.FC<NationalBannerProps> = ({
  dataset,
  onOpenMethodology,
  selectedCandidateFilter,
  onSelectCandidateFilter,
}) => {
  const summary = calculateNationalSummary(dataset);
  const candidatesMap = Object.fromEntries(dataset.candidates.map((c) => [c.id, c]));

  const flavio = candidatesMap["flavio"];
  const lula = candidatesMap["lula"];

  const flavioTotal = summary.candidateTotals.find((c) => c.candidateId === "flavio");
  const lulaTotal = summary.candidateTotals.find((c) => c.candidateId === "lula");
  const otherCandidatesTotals = summary.candidateTotals.filter(
    (c) => c.candidateId !== "flavio" && c.candidateId !== "lula"
  );
  const otherVotesSum = otherCandidatesTotals.reduce((acc, c) => acc + c.votes, 0);
  const otherPctSum = summary.validVotes > 0
    ? Number(((otherVotesSum / summary.validVotes) * 100).toFixed(2))
    : 7.81;

  // Diferença em votos nominais entre os dois primeiros
  const voteDiff = (flavioTotal?.votes || 0) - (lulaTotal?.votes || 0);

  return (
    <section id="dashboard-nacional" className="border-b border-slate-200 bg-white pt-8 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Editorial com Fonte e Data Oficiais — Arquivo Eleições 2026 */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                Arquivo Eleições 2026 · Resultado Homologado TSE
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                1º Turno (04/10/2026) · 2º Turno (25/10/2026)
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {dataset.title}
            </h2>
            <p className="mt-1.5 text-base sm:text-xl font-heading font-semibold text-slate-600">
              Histórico consolidado da apuração oficial e resultados por estado
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Acervo de dados oficiais do Tribunal Superior Eleitoral (TSE). Consulta à votação consolidada para Presidente da República discriminada por estado e Distrito Federal, com índices de comparecimento e abstenção homologados.
            </p>
          </div>

          {/* Cartão de Identificação da Fonte Oficial */}
          <div className="flex flex-col items-start lg:items-end text-xs text-slate-600 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Fonte: Tribunal Superior Eleitoral (TSE)</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-medium">
              Dados oficiais e definitivos homologados
            </span>
            <button
              onClick={onOpenMethodology}
              className="mt-2 text-blue-700 hover:text-blue-900 underline underline-offset-2 cursor-pointer font-bold text-xs"
            >
              Critérios de apuração e votos válidos →
            </button>
          </div>
        </div>

        {/* Painel do Acervo Eleitoral Homologado */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B132B] text-white flex items-center justify-center font-heading font-black text-lg shrink-0 mt-0.5 shadow-xs">
              TSE
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-slate-900 text-base sm:text-lg">
                Resultado Oficial Homologado: Flávio Bolsonaro vs. Lula
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                Totalização concluída em 100,00% das seções eleitorais do país e exterior. Conforme preconiza o Artigo 77 da Constituição Federal, <strong>Flávio Bolsonaro ({formatPercentBR(flavioTotal?.percentage || 47.03)})</strong> e <strong>Lula ({formatPercentBR(lulaTotal?.percentage || 45.16)})</strong> disputaram o 2º turno da eleição presidencial.
              </p>
            </div>
          </div>
          <div className="self-start lg:self-center shrink-0">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
              Pleito Concluído · 2026
            </span>
          </div>
        </div>

        {/* GRÁFICO COMPARATIVO HORIZONTAL DIRETO (LULA VS. FLÁVIO BOLSONARO) */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Comparativo Nacional Direto
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-extrabold text-slate-900">
                Disputa Presidencial: Flávio Bolsonaro vs. Lula
              </h3>
            </div>
            <div className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              Total Votos Válidos: {formatVotesBR(summary.validVotes)}
            </div>
          </div>

          {/* Barras e Estatísticas Lado a Lado */}
          <div className="space-y-4">
            {/* Linha Flávio Bolsonaro */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                    <CandidateImage
                      src={flavio?.photoUrl || "/assets/candidates/flavio.jpg"}
                      alt="Retrato oficial de Flávio Bolsonaro"
                      candidateName="Flávio Bolsonaro"
                      ballotNumber={22}
                      partyColor="#1D4ED8"
                      aspectRatio="portrait"
                      size="sm"
                      className="rounded-lg"
                    />
                  </div>
                  <span className="w-5 h-5 rounded-md bg-blue-700 text-white text-[11px] font-black flex items-center justify-center font-mono shrink-0">
                    22
                  </span>
                  <span className="font-bold text-slate-900">
                    Flávio Bolsonaro
                  </span>
                  <span className="text-slate-500 text-xs">
                    (PL · 1º Lugar)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-blue-900">
                    {formatPercentBR(flavioTotal?.percentage || 47.03)}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    ({formatVotesBR(flavioTotal?.votes || 0)} votos)
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all duration-500"
                  style={{ width: `${flavioTotal?.percentage || 47.03}%` }}
                />
              </div>
            </div>

            {/* Linha Lula */}
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                    <CandidateImage
                      src={lula?.photoUrl || "/assets/candidates/lula.jpg"}
                      alt="Retrato oficial de Lula"
                      candidateName="Lula"
                      ballotNumber={13}
                      partyColor="#DC2626"
                      aspectRatio="portrait"
                      size="sm"
                      className="rounded-lg"
                    />
                  </div>
                  <span className="w-5 h-5 rounded-md bg-red-600 text-white text-[11px] font-black flex items-center justify-center font-mono shrink-0">
                    13
                  </span>
                  <span className="font-bold text-slate-900">
                    Lula
                  </span>
                  <span className="text-slate-500 text-xs">
                    (PT · 2º Lugar)
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-red-900">
                    {formatPercentBR(lulaTotal?.percentage || 45.16)}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    ({formatVotesBR(lulaTotal?.votes || 0)} votos)
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${lulaTotal?.percentage || 45.16}%` }}
                />
              </div>
            </div>

            {/* Barra Combinada com Linha de Corte de 50% */}
            <div className="pt-4 sm:pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6 sm:mb-5">
                <span>Distribuição dos {formatVotesBR(summary.validVotes)} votos válidos</span>
                <span className="text-blue-800">
                  Diferença: +{formatVotesBR(voteDiff)} votos (+{((flavioTotal?.percentage || 0) - (lulaTotal?.percentage || 0)).toFixed(2).replace(".", ",")} p.p.)
                </span>
              </div>
              <div className="relative h-6 bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
                {/* Segmento Flávio */}
                <div
                  className="h-full bg-blue-700 transition-all duration-300"
                  style={{ width: `${flavioTotal?.percentage || 47.03}%` }}
                  title={`Flávio Bolsonaro: ${formatPercentBR(flavioTotal?.percentage || 47.03)}`}
                />
                {/* Segmento Lula */}
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${lulaTotal?.percentage || 45.16}%` }}
                  title={`Lula: ${formatPercentBR(lulaTotal?.percentage || 45.16)}`}
                />
                {/* Segmento Demais Candidatos */}
                <div
                  className="h-full bg-slate-500 transition-all duration-300"
                  style={{ width: `${otherPctSum}%` }}
                  title={`Demais Candidatos: ${formatPercentBR(otherPctSum)}`}
                />

                {/* Marcador Constitucional de 50% */}
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-950 z-10 pointer-events-none"
                  style={{ left: "50%" }}
                >
                  <div className="absolute -top-6 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                    50% (Maioria Absoluta)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                <span>0%</span>
                <span className="font-semibold text-slate-700">
                  Linha de corte para eleição no 1º turno: 50% + 1 voto válido
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRANDES CARDS KPI REQUISITADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* KPI 1: Total de Votos Válidos */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total de Votos Válidos
            </span>
            <span className="font-mono text-3xl font-black text-slate-950 block tracking-tight">
              {formatVotesBR(summary.validVotes)}
            </span>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Base constitucional (Art. 77)</span>
              <span className="font-mono font-bold text-slate-800">100,00%</span>
            </div>
          </div>

          {/* KPI 2: Flávio Bolsonaro */}
          <div
            onClick={() =>
              onSelectCandidateFilter(
                selectedCandidateFilter === "flavio" ? null : "flavio"
              )
            }
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedCandidateFilter === "flavio"
                ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                : "bg-white border-slate-200 hover:border-blue-400 shadow-xs"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-700" />
            <div className="flex items-start gap-3.5 mb-2">
              <div className="w-14 h-16 shrink-0 rounded-xl overflow-hidden shadow-2xs border border-slate-200/80">
                <CandidateImage
                  src={flavio?.photoUrl || "/assets/candidates/flavio.jpg"}
                  alt="Fotografia oficial de Flávio Bolsonaro"
                  candidateName="Flávio Bolsonaro"
                  ballotNumber={22}
                  partyColor="#1D4ED8"
                  aspectRatio="portrait"
                  size="sm"
                  className="rounded-xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block truncate">
                    Flávio Bolsonaro (PL)
                  </span>
                  <span className="text-[10px] font-bold font-mono text-white bg-blue-700 px-1.5 py-0.5 rounded shrink-0">
                    nº 22
                  </span>
                </div>
               <div className="flex flex-col gap-0.5">
  <span className="font-mono text-2xl sm:text-3xl font-black text-blue-950 block tracking-tight leading-tight">
    {formatPercentBR(flavioTotal?.percentage || 47.03)}
  </span>
  <span className="font-mono text-xs font-bold text-slate-600 truncate">
    {formatVotesBR(flavioTotal?.votes || 56104268)} votos
  </span>
</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1 font-bold text-blue-900">
                <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="truncate">Venceu em 15 UFs (14 estados + DF)</span>
              </span>
              <span className="text-[11px] text-blue-700 font-semibold group-hover:underline shrink-0 ml-1">
                {selectedCandidateFilter === "flavio" ? "Limpar" : "Filtrar →"}
              </span>
            </div>
          </div>

          {/* KPI 3: Lula */}
          <div
            onClick={() =>
              onSelectCandidateFilter(
                selectedCandidateFilter === "lula" ? null : "lula"
              )
            }
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedCandidateFilter === "lula"
                ? "bg-red-50/70 border-red-600 ring-2 ring-red-600/20 shadow-md"
                : "bg-white border-slate-200 hover:border-red-400 shadow-xs"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />
            <div className="flex items-start gap-3.5 mb-2">
              <div className="w-14 h-16 shrink-0 rounded-xl overflow-hidden shadow-2xs border border-slate-200/80">
                <CandidateImage
                  src={lula?.photoUrl || "/assets/candidates/lula.jpg"}
                  alt="Fotografia oficial de Lula"
                  candidateName="Lula"
                  ballotNumber={13}
                  partyColor="#DC2626"
                  aspectRatio="portrait"
                  size="sm"
                  className="rounded-xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-900 block truncate">
                    Lula (PT)
                  </span>
                  <span className="text-[10px] font-bold font-mono text-white bg-red-600 px-1.5 py-0.5 rounded shrink-0">
                    nº 13
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
  <span className="font-mono text-2xl sm:text-3xl font-black text-red-950 block tracking-tight leading-tight">
    {formatPercentBR(lulaTotal?.percentage || 45.16)}
  </span>
  <span className="font-mono text-xs font-bold text-slate-600 truncate">
    {formatVotesBR(lulaTotal?.votes || 53876617)} votos
  </span>
</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1 font-bold text-red-900">
                <Award className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span className="truncate">Venceu em {lulaTotal?.statesWon || 12} estados</span>
              </span>
              <span className="text-[11px] text-red-700 font-semibold group-hover:underline shrink-0 ml-1">
                {selectedCandidateFilter === "lula" ? "Limpar" : "Filtrar →"}
              </span>
            </div>
          </div>

          {/* KPI 4: Outros Candidatos */}
          <div
            onClick={() =>
              onSelectCandidateFilter(
                selectedCandidateFilter === "outros" ? null : "outros"
              )
            }
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedCandidateFilter === "outros"
                ? "bg-slate-100 border-slate-700 ring-2 ring-slate-700/20 shadow-md"
                : "bg-white border-slate-200 hover:border-slate-400 shadow-xs"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-500" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Demais Candidatos
              </span>
              <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {otherCandidatesTotals.length} concorrentes
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="font-mono text-3xl font-black text-slate-900 block tracking-tight">
                {formatPercentBR(otherPctSum)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-600">
                {formatVotesBR(otherVotesSum)} votos
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-700">Demais agremiações somadas</span>
              <span className="text-[11px] text-slate-500 group-hover:underline">
                {otherCandidatesTotals.length} candidatos ↓
              </span>
            </div>
          </div>
        </div>

        {/* Discriminação Nominal dos Demais Candidatos Homologados pelo TSE */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Demais Candidaturas Registradas no TSE (Discriminação Nominal)
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Total: {formatVotesBR(otherVotesSum)} votos ({formatPercentBR(otherPctSum)})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Fotografias e dados homologados pelo TSE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherCandidatesTotals.map((item) => {
              const cand = candidatesMap[item.candidateId];
              if (!cand) return null;
              const isSelected = selectedCandidateFilter === cand.id;

              return (
                <div
                  key={cand.id}
                  onClick={() =>
                    onSelectCandidateFilter(isSelected ? null : cand.id)
                  }
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden group ${
                    isSelected
                      ? "bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                  title={`Clique para selecionar ${cand.popularName} (${cand.party})`}
                >
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1"
                    style={{ backgroundColor: cand.color }}
                  />
                  <div className="w-10 h-12 shrink-0 rounded-lg overflow-hidden ml-1">
                    <CandidateImage
                      src={cand.photoUrl}
                      alt={`Fotografia oficial de ${cand.popularName}`}
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
                        className="px-1.5 py-0.5 rounded text-white text-[9px] font-mono font-bold shrink-0 shadow-2xs"
                        style={{ backgroundColor: cand.color }}
                      >
                        nº {cand.ballotNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-xs truncate block">
                        {cand.popularName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {cand.party} · {formatVotesBR(item.votes)} votos
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                      {formatPercentBR(item.percentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha Secundária de KPIs: Votos Brancos, Votos Nulos e Abstenção */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* KPI 5: Votos Brancos */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Votos em Branco
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-black text-slate-900">
                {formatVotesBR(summary.blankVotes)}
              </span>
              <span className="font-mono text-sm font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {formatPercentBR(summary.blankVotesPercentage)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Calculado sobre o comparecimento
            </span>
          </div>

          {/* KPI 6: Votos Nulos */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Votos Nulos
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-black text-slate-900">
                {formatVotesBR(summary.nullVotes)}
              </span>
              <span className="font-mono text-sm font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {formatPercentBR(summary.nullVotesPercentage)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Calculado sobre o comparecimento
            </span>
          </div>

          {/* KPI 7: Abstenção */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Abstenção Eleitoral
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-black text-slate-900">
                {formatVotesBR(summary.abstention)}
              </span>
              <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {formatPercentBR(summary.abstentionPercentage)}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Comparecimento total: {formatVotesBR(summary.turnout)} ({formatPercentBR(summary.turnoutPercentage)})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
