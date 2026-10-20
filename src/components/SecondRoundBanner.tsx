import React from "react";
import {
  ExternalLink,
  ShieldCheck,
  Clock,
  Calendar,
  AlertCircle,
  Info,
  Vote,
  Radio,
} from "lucide-react";
import { CANDIDATES_2026, Candidate } from "../data/electionData";
import { CandidateImage } from "./CandidateImage";

interface SecondRoundBannerProps {
  candidates?: Candidate[];
  onOpenMethodology?: () => void;
}

/**
 * Painel informativo dedicado ao 2º Turno da Eleição Presidencial de 2026 (25 de outubro de 2026).
 *
 * Diretrizes estritas de integridade:
 * - Não exibe números, percentuais, barras de progresso ou totalizações fictícias.
 * - Não reutiliza dados numéricos do 1º turno como se fossem do 2º turno.
 * - Informa de forma transparente que a publicação de votos do 2º turno depende de fonte e
 *   protocolo oficial verificado do TSE.
 * - Disponibiliza link proeminente, acessível e seguro para o portal oficial do TSE (resultados.tse.jus.br).
 */
export const SecondRoundBanner: React.FC<SecondRoundBannerProps> = ({
  candidates,
  onOpenMethodology,
}) => {
  // Obtém os dois candidatos do 2º turno para a disputa presidencial
  const finalists: Candidate[] = (candidates && candidates.length >= 2
    ? candidates
    : CANDIDATES_2026.filter((c) => c.id === "flavio" || c.id === "lula")
  ).slice(0, 2);

  return (
    <section
      aria-labelledby="segundo-turno-titulo"
      className="mb-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden"
    >
      {/* Top Banner / Cabeçalho do 2º Turno */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-8 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>2º Turno Presidencial 2026</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Aguardando Apuração Oficial (25/10/2026)</span>
          </div>
        </div>

        <h2
          id="segundo-turno-titulo"
          className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3"
        >
          Apuração e Resultados do 2º Turno Presidencial 2026
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Acompanhe a disputa e consulte a apuração oficial no portal do TSE. A votação ocorre no domingo, <strong>25 de outubro de 2026</strong>, das <strong>08h00 às 17h00</strong> (horário de Brasília).
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Aviso de Transparência e Integridade de Dados */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="text-white block font-semibold mb-1">
                Compromisso com Dados Oficiais Verificados do TSE
              </strong>
              <span>
                Os totais e boletins de urna do 2º turno serão disponibilizados nesta central exclusivamente mediante o estabelecimento de fonte e protocolo oficial e verificado do Tribunal Superior Eleitoral (TSE). A apuração oficial tem início a partir das 17h00 de 25 de outubro. Não divulgamos projeções extraoficiais ou dados simulados.
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <a
              href="https://resultados.tse.jus.br"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Acessar o portal oficial de divulgação de resultados do TSE (abre em nova aba)"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer w-full md:w-auto"
            >
              <Vote className="w-4 h-4" />
              <span>Acessar Portal Oficial de Resultados (TSE)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quadro dos Candidatos Concorrentes no 2º Turno */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Candidatos do 2º Turno
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                Candidatos à Presidência da República no 2º Turno
              </h3>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Ordem alfabética pelo nome de urna</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {finalists.map((cand) => (
              <div
                key={cand.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {/* Retrato oficial do candidato sem sobreposição no rosto */}
                    <div className="w-20 h-24 sm:w-24 sm:h-30 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
                      <CandidateImage
                        src={cand.photoUrl}
                        alt={`Fotografia oficial de ${cand.popularName} no TSE`}
                        candidateName={cand.name}
                        partyColor={cand.color}
                        aspectRatio="portrait"
                        size="md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2.5 py-0.5 rounded-md text-xs font-black text-white"
                          style={{ backgroundColor: cand.color }}
                        >
                          Nº {cand.ballotNumber}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-700/70 px-2 py-0.5 rounded-md">
                          {cand.party}
                        </span>
                      </div>

                      <h4 className="font-heading text-lg sm:text-xl font-black text-white truncate">
                        {cand.popularName}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {cand.name}
                      </p>
                    </div>
                  </div>

                  {/* Bloco de Status da Totalização */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400 font-medium">Status da Totalização:</span>
                      <span className="text-amber-300 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Não iniciada</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Aguardando o início da totalização oficial. A votação ocorre em 25 de outubro, das 8h às 17h, no horário de Brasília.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <a
                    href={cand.tseSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <span>Consulta no DivulgaCandContas (TSE)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {onOpenMethodology && (
                    <button
                      type="button"
                      onClick={onOpenMethodology}
                      className="hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      Regras do 2º turno
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informações Práticas e Cronograma da Apuração */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Data da Eleição</span>
            </div>
            <div className="text-sm font-bold text-white">25 de outubro de 2026</div>
            <p className="text-xs text-slate-400 mt-1">
              Segundo turno em todo o território nacional e no exterior.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Início da Totalização</span>
            </div>
            <div className="text-sm font-bold text-white">A partir das 17h00 (Brasília)</div>
            <p className="text-xs text-slate-400 mt-1">
              Transmissão imediata dos boletins de urna após o encerramento da votação.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Fonte Oficial</span>
            </div>
            <div className="text-sm font-bold text-white">Tribunal Superior Eleitoral</div>
            <p className="text-xs text-slate-400 mt-1">
              Sistemas oficiais de divulgação e repositório oficial de dados abertos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
