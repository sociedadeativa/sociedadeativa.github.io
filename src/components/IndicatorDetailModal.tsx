import React, { useEffect, useState } from "react";
import { EconomicIndicator } from "../types/economy";
import {
  X,
  Calendar,
  ExternalLink,
  Building2,
  Landmark,
  Share2,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Info,
} from "lucide-react";

interface IndicatorDetailModalProps {
  indicator: EconomicIndicator | null;
  onClose: () => void;
}

export const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({
  indicator,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (indicator) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [indicator, onClose]);

  if (!indicator) return null;

  const handleShare = async () => {
    const shareText = `${indicator.shortName} (${indicator.name}): ${indicator.formattedValue} [Ref: ${indicator.referencePeriod}]. Fonte: ${indicator.source} via Sociedade Ativa.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${indicator.shortName} - Indicador Oficial`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignora erro de clipboard se bloqueado
    }
  };

  const values = indicator.historicalData.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const valRange = maxVal - minVal || 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-indicator-title"
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {indicator.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {indicator.source === "Banco Central do Brasil" ? (
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                ) : indicator.source === "B3" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{indicator.source}</span>
              </span>
              {indicator.marketStatus && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    indicator.marketStatus === "aberto"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      indicator.marketStatus === "aberto" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {indicator.marketStatusText ||
                      (indicator.marketStatus === "aberto" ? "Pregão Aberto" : "Mercado Fechado")}
                  </span>
                </span>
              )}
              {indicator.officialSeriesCode && (
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                  {indicator.officialSeriesCode}
                </span>
              )}
            </div>

            <h2
              id="modal-indicator-title"
              className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight"
            >
              {indicator.shortName} — {indicator.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Alerta de Defasagem Regulatória e Status para B3 */}
          {(indicator.delayNotice || indicator.marketStatus) && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Condição da Cotação e Defasagem de Mercado (B3)</span>
              </div>
              <p className="leading-relaxed">
                {indicator.delayNotice ||
                  "Cotações públicas da B3 possuem defasagem regulatória mínima de 15 minutos durante o pregão. Fora do horário de negociação, exibe o último fechamento consolidado verificado."}
              </p>
              {indicator.quoteTimestamp && (
                <p className="font-mono text-[11px] text-amber-800 pt-0.5">
                  Horário registrado da cotação: <strong>{indicator.quoteTimestamp}</strong>
                </p>
              )}
            </div>
          )}

          {/* Card de Valor Atual */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {indicator.marketStatus === "fechado" ? "Último Fechamento" : "Valor Registrado"} ({indicator.unit})
                </span>
                <div className="text-3xl sm:text-4xl font-black font-heading tracking-tight mt-1 text-white">
                  {indicator.formattedValue}
                </div>
              </div>

              {indicator.variation !== null && (
                <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Variação Diária
                  </span>
                  <div className="text-sm font-bold mt-0.5 flex items-center gap-1 justify-end text-emerald-400">
                    {indicator.variation > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : indicator.variation < 0 ? (
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {indicator.variation > 0 ? "+" : ""}
                      {indicator.variation.toFixed(2).replace(".", ",")}
                      {indicator.unit.includes("%") ? "%" : "%"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Período de Referência: <strong>{indicator.referencePeriod}</strong></span>
              </span>
              <span>Periodicidade: <strong>{indicator.frequency}</strong></span>
              <span>Última atualização: <strong>{indicator.quoteTimestamp || indicator.updatedAt}</strong></span>
            </div>
          </div>

          {/* O que mede este indicador */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>O que mede este indicador</span>
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {indicator.description}
            </p>
          </div>

          {/* Metodologia Oficial */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Metodologia &amp; Órgão Responsável</span>
            </h3>
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <p className="leading-relaxed">
                <strong>Órgão:</strong> {indicator.sourceAgency}
              </p>
              <p className="leading-relaxed">
                {indicator.methodologySummary}
              </p>
            </div>
          </div>

          {/* Série Histórica Recente */}
          {indicator.historicalData && indicator.historicalData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Série Histórica Recente
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {indicator.historicalData.length} períodos
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                {/* Visual Bars */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-end h-32 pt-6 pb-2 px-1 border-b border-slate-200">
                  {indicator.historicalData.map((pt, idx) => {
                    const normalized =
                      valRange > 0 ? (pt.value - minVal) / valRange : 0.5;
                    const heightPercent = Math.max(14, Math.round(normalized * 100));

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-end h-full group"
                      >
                        <span className="text-[10px] font-bold text-slate-700 opacity-80 group-hover:opacity-100 mb-1">
                          {pt.formattedValue || pt.value}
                        </span>
                        <div
                          className="w-full max-w-[24px] bg-blue-600 rounded-t-sm group-hover:bg-blue-800 transition-colors"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                          {pt.period}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tabela de valores */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-200 text-[10px] uppercase font-bold">
                        <th className="pb-1.5 font-bold">Período</th>
                        <th className="pb-1.5 text-right font-bold">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {indicator.historicalData.slice().reverse().map((pt, idx) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1.5 font-medium">{pt.period}</td>
                          <td className="py-1.5 text-right font-bold font-mono">
                            {pt.formattedValue || pt.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={indicator.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3.5 py-2 rounded-xl border border-blue-200/80 shadow-2xs transition-colors"
            >
              <span>Acessar {indicator.source} Oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {indicator.quotationUrl && (
              <a
                href={indicator.quotationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs transition-colors"
              >
                <span>Cotações B3 (15 min defasagem)</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
