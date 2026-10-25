import React, { useState, useEffect, useRef } from "react";
import {
  ExternalLink,
  ShieldCheck,
  Clock,
  Calendar,
  Info,
  Vote,
  Radio,
  CheckCircle2,
  Users
} from "lucide-react";
import {
  SECOND_ROUND_DATA,
  SecondRoundCandidate,
  SecondRoundTotalization
} from "../data/electionSecondRoundData";
import { CandidateImage } from "./CandidateImage";

export interface SecondRoundBannerProps {
  data?: SecondRoundTotalization;
  onOpenMethodology?: () => void;
  pollingIntervalMs?: number;
}

const formatNumberBR = (num: number): string => {
  return new Intl.NumberFormat("pt-BR").format(num);
};

const formatPercentBR = (num: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num) + "%";
};

const formatTimestampBR = (isoOrDateStr?: string): string => {
  if (!isoOrDateStr) return "";
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo"
    }).format(d);
  } catch {
    return isoOrDateStr;
  }
};

/**
 * Painel informativo e de apuração dedicado ao 2º Turno da Eleição Presidencial de 2026.
 *
 * Diretrizes estritas de integridade:
 * - Não exibe números, percentuais, barras de progresso ou totalizações fictícias.
 * - Não reutiliza dados numéricos do 1º turno como se fossem do 2º turno.
 * - Estado de pré-eleição (0 votos, 0 seções) é tratado explicitamente como "Aguardando apuração oficial".
 * - Dados consumidos exclusivamente do dataset oficial e isolado do 2º turno gerado a partir do TSE (EA20).
 * - Sincronização dinâmica via polling de 60s durante a apuração com cancelamento via AbortController.
 * - Disponibiliza link proeminente, acessível e seguro para o portal oficial do TSE (resultados.tse.jus.br).
 */
/**
 * Validação rigorosa e monotônica de payload de totalização do 2º turno.
 * Rejeita formatos inválidos e qualquer regressão de dados (stale CDN cache):
 * - Regressão de finalização (isFinal: true -> false)
 * - Regressão de início de apuração (countingStarted: true -> false)
 * - Regressão de seções apuradas (sectionsCounted menor)
 * - Respostas obsoletas com contagem de seções inalterada mas timestamp anterior
 * - Regressão de votos totais ou válidos
 */
export function validateSecondRoundPayload(
  payload: unknown,
  current?: SecondRoundTotalization
): SecondRoundTotalization {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as any).candidates) ||
    (payload as any).candidates.length === 0 ||
    typeof (payload as any).sectionsTotal !== "number" ||
    (payload as any).round !== 2
  ) {
    throw new Error("Payload de totalização recebido possui formato inválido.");
  }

  const json = payload as SecondRoundTotalization;

  if (current) {
    // 1. Defesa contra regressão de apuração já finalizada
    if (current.isFinal && !json.isFinal) {
      throw new Error("Payload recebido regrediu de apuração finalizada para não-finalizada (stale cache). Preservando dados mais recentes.");
    }

    // 2. Defesa contra regressão para estado de pré-apuração
    if (current.countingStarted && !json.countingStarted) {
      throw new Error("Payload recebido regrediu para estado pré-eleição (stale cache). Preservando dados mais recentes.");
    }

    // 3. Defesa contra regressão no número de seções apuradas
    if (typeof json.sectionsCounted === "number" && typeof current.sectionsCounted === "number") {
      if (json.sectionsCounted < current.sectionsCounted) {
        throw new Error("Payload recebido possui contagem anterior à já totalizada (stale cache). Preservando dados mais recentes.");
      }
    }

    // 4. Defesa contra respostas obsoletas (incluindo quando seções apuradas não mudaram):
    // Verifica carimbos de data/hora oficiais (lastUpdated)
    const currentUpdatedMs = current.lastUpdated ? Date.parse(current.lastUpdated) : 0;
    const incomingUpdatedMs = json.lastUpdated ? Date.parse(json.lastUpdated) : 0;
    if (!isNaN(currentUpdatedMs) && !isNaN(incomingUpdatedMs) && currentUpdatedMs > 0 && incomingUpdatedMs > 0) {
      if (incomingUpdatedMs < currentUpdatedMs) {
        throw new Error("Payload recebido possui data/hora anterior aos dados atuais (stale cache). Preservando dados mais recentes.");
      }
    }

    // 5. Defesa contra decréscimo de votos computados
    if (typeof json.totalVotes === "number" && typeof current.totalVotes === "number") {
      if (json.totalVotes < current.totalVotes) {
        throw new Error("Payload recebido possui total de votos inferior ao já totalizado (stale cache). Preservando dados mais recentes.");
      }
    }
    if (typeof json.validVotes === "number" && typeof current.validVotes === "number") {
      if (json.validVotes < current.validVotes) {
        throw new Error("Payload recebido possui votos válidos inferiores ao já totalizado (stale cache). Preservando dados mais recentes.");
      }
    }
  }

  return json;
}

export const SecondRoundBanner: React.FC<SecondRoundBannerProps> = ({
  data: initialData = SECOND_ROUND_DATA,
  onOpenMethodology,
  pollingIntervalMs = 60000,
}) => {
  const [data, setData] = useState<SecondRoundTotalization>(initialData);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const dataRef = useRef<SecondRoundTotalization>(data);
  dataRef.current = data;

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Se a apuração já estiver finalizada, não executa polling contínuo
    if (data.isFinal) {
      return;
    }

    let isMounted = true;
    let inFlightController: AbortController | null = null;

    const fetchLatestData = async () => {
      if (inFlightController) {
        inFlightController.abort();
      }
      inFlightController = new AbortController();
      const signal = inFlightController.signal;

      try {
        const response = await fetch(`/data/electionSecondRoundData.json?_t=${Date.now()}`, {
          cache: "no-store",
          signal,
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawJson = await response.json();
        const validJson = validateSecondRoundPayload(rawJson, dataRef.current);

        if (isMounted) {
          setData(validJson);
          setFetchError(null);
          setLastCheckTime(new Date());
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
        if (isMounted) {
          // Preserva os dados válidos anteriores em caso de falha de rede/servidor ou stale cache
          setFetchError((err as Error)?.message || "Falha na sincronização");
          setLastCheckTime(new Date());
        }
      }
    };

    // 1. Busca imediata ao montar
    fetchLatestData();

    // 2. Polling contínuo a cada 60s antes do início da apuração, durante a apuração e até isFinal === true
    const intervalId = setInterval(() => {
      fetchLatestData();
    }, pollingIntervalMs);

    return () => {
      isMounted = false;
      if (inFlightController) {
        inFlightController.abort();
      }
      clearInterval(intervalId);
    };
  }, [data.isFinal, pollingIntervalMs]);

  const candidates: SecondRoundCandidate[] = data.candidates || [];
  const countingStarted = Boolean(data.countingStarted);
  const isFinal = Boolean(data.isFinal);

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

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isFinal
                ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                : countingStarted
                ? "bg-blue-500/20 border border-blue-400/40 text-blue-300"
                : "bg-amber-500/10 border border-amber-400/30 text-amber-300"
            }`}
          >
            {isFinal ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {isFinal
                ? "Totalização Definitiva Concluída"
                : countingStarted
                ? `Apuração em Andamento (${formatPercentBR(data.countingProgress)})`
                : "Aguardando Apuração Oficial (25/10/2026)"}
            </span>
          </div>
        </div>

        <h2
          id="segundo-turno-titulo"
          className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3"
        >
          Apuração e Resultados do 2º Turno Presidencial 2026
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {countingStarted
            ? "Acompanhe os resultados oficiais totalizados pelo Tribunal Superior Eleitoral (TSE) em tempo real para a disputa presidencial do 2º Turno."
            : "Acompanhe a disputa e consulte a apuração oficial no portal do TSE. A votação ocorre no domingo, 25 de outubro de 2026, das 08h00 às 17h00 (horário de Brasília)."}
        </p>

        {/* Indicadores de Atualização e Horário Oficial */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
          {data.totalizationTime ? (
            <span className="inline-flex items-center gap-1.5 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Totalização oficial no TSE: <strong>{data.totalizationDate} às {data.totalizationTime}</strong> (Horário de Brasília)
              </span>
            </span>
          ) : data.lastUpdated ? (
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Última checagem oficial: <strong>{formatTimestampBR(data.lastUpdated)}</strong> (Horário de Brasília)
              </span>
            </span>
          ) : null}

          {!isFinal && (
            <span className="inline-flex items-center gap-1.5 text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/50">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>Atualização automática a cada 60s</span>
            </span>
          )}

          {fetchError && (
            <span
              className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-800/50"
              title={fetchError}
            >
              <span>Conexão com servidor instável — exibindo últimos dados confirmados</span>
            </span>
          )}
        </div>

        {/* Barra de Progresso Real quando a Apuração Iniciou */}
        {countingStarted && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-300 mb-2">
              <span className="font-semibold text-white">Progresso da Totalização Nacional:</span>
              <span className="font-bold text-blue-400">
                {formatPercentBR(data.countingProgress)} das seções apuradas
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, data.countingProgress))}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2">
              <span>
                {formatNumberBR(data.sectionsCounted)} de {formatNumberBR(data.sectionsTotal)} seções
              </span>
              <span>
                {formatNumberBR(data.validVotes)} votos válidos apurados
              </span>
            </div>
          </div>
        )}
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
                Dados oficiais do TSE
              </strong>
              <span>
                Dados de candidatos e totalização obtidos dos arquivos oficiais do Tribunal Superior Eleitoral (TSE). A atualização do site depende da publicação dos dados oficiais e do processamento do sistema.
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
                Candidatos Oficiais Habilitados
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-white">
                Disputa Presidencial no 2º Turno
              </h3>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {countingStarted
                  ? "Classificação por votos apurados válidos"
                  : "Ordem oficial de registro no TSE"}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.candidateId || String(cand.ballotNumber)}
                className="p-5 sm:p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {/* Retrato oficial do candidato */}
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
                        {cand.elected && (
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-md">
                            Eleito
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading text-lg sm:text-xl font-black text-white truncate">
                        {cand.popularName}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mb-1">
                        {cand.name}
                      </p>
                      {cand.vicePopularName && (
                        <p className="text-xs text-slate-400 truncate">
                          <span className="text-slate-500">Vice:</span> {cand.vicePopularName}{" "}
                          {cand.viceParty ? `(${cand.viceParty})` : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bloco de Status da Totalização / Votação */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-3">
                    {countingStarted ? (
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs text-slate-400 font-medium">Votos Válidos:</span>
                          <span className="font-heading text-xl sm:text-2xl font-black text-white">
                            {formatPercentBR(cand.percentage)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Total apurado:</span>
                          <span className="font-bold text-slate-200">
                            {formatNumberBR(cand.votes)} votos
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: cand.color,
                              width: `${Math.min(100, Math.max(0, cand.percentage))}%`
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
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
                    )}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
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
              Sistemas oficiais de divulgação (EA20 unificado, Pleito 3221, Eleição 6258).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Eleitorado Apto</span>
            </div>
            <div className="text-sm font-bold text-white">
              {formatNumberBR(data.electorateTotal)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total de eleitores aptos no Brasil e no exterior homologados no TSE.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

