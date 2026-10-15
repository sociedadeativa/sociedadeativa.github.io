import React, { useState, useEffect } from "react";
import { B3MarketRankings, StockQuote } from "../types/market";
import { OFFICIAL_B3_MARKET_DATA } from "../data/marketData";
import { fetchMarketRankings, normalizeMarketRankings } from "../services/marketService";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Clock,
  ShieldAlert,
  BarChart3,
  Flame,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
  RefreshCw,
} from "lucide-react";

export const BolsaSection: React.FC = () => {
  // Inicialização instantânea com dados oficiais compilados para evitar qualquer tela em branco
  const [marketData, setMarketData] = useState<B3MarketRankings>(() =>
    normalizeMarketRankings(OFFICIAL_B3_MARKET_DATA)
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"mostTraded" | "gainers" | "decliners">(
    "mostTraded"
  );
  const [forceUnavailable, setForceUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchMarketRankings().then((data) => {
      if (isMounted && data) {
        setMarketData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const renderChangeBadge = (pct: number) => {
    const isPos = pct > 0;
    const isZero = pct === 0;
    const sign = isPos ? "+" : "";

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
          isPos
            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
            : isZero
            ? "text-slate-600 bg-slate-100 border border-slate-200"
            : "text-rose-700 bg-rose-50 border border-rose-200"
        }`}
      >
        {isPos ? (
          <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
        ) : isZero ? (
          <Minus className="w-3 h-3 text-slate-500 shrink-0" />
        ) : (
          <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
        )}
        <span>{`${sign}${pct.toFixed(2).replace(".", ",")}%`}</span>
      </span>
    );
  };

  const renderStockTable = (
    stocks: StockQuote[],
    metricLabel: string,
    emptyMessage: string
  ) => {
    if (!stocks || stocks.length === 0) {
      return (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
              <th className="py-2.5 px-3">Papel / Empresa</th>
              <th className="py-2.5 px-3 text-right">Cotação</th>
              <th className="py-2.5 px-3 text-right">Var. Diária</th>
              <th className="py-2.5 px-3 text-right">Vol. Financeiro (R$)</th>
              <th className="py-2.5 px-3 text-right hidden sm:table-cell">Sessão / Horário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stocks.map((item, idx) => (
              <tr
                key={item.ticker}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[11px] font-bold w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-mono font-black text-slate-900 group-hover:text-blue-900 text-xs block">
                        {item.ticker}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        {item.companyName}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {item.formattedPrice}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {renderChangeBadge(item.changePercent)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                  {item.formattedFinancialVolume}
                </td>
                <td className="py-2.5 px-3 text-right text-[11px] text-slate-500 font-mono hidden sm:table-cell">
                  {item.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Se o usuário alternar para estado indisponível ou ocorrer erro no carregamento
  if (forceUnavailable || (!loading && !marketData)) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-12">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
              B3 - Brasil, Bolsa, Balcão
            </span>
            <h2 className="font-heading text-2xl font-black text-slate-950">
              Bolsa de Valores (B3)
            </h2>
          </div>
          <button
            onClick={() => setForceUnavailable(false)}
            className="text-xs text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer"
          >
            Restaurar painel
          </button>
        </div>

        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-heading font-black text-base text-slate-900 mb-1">
            Feed de Cotações Indisponível no Momento
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-5">
            Não foi possível estabelecer integração em tempo real com o provedor de market data
            autorizado. Para garantir integridade e evitar valores defasados apresentados como atuais,
            consulte o painel oficial da B3.
          </p>
          <a
            href="https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Acessar Cotações no Portal Oficial B3</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (loading || !marketData) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-12 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-24 bg-slate-100 rounded-xl mb-6" />
        <div className="h-48 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  const { ibov, mostTraded, gainers, decliners } = marketData;
  const isMarketOpen = marketData.marketStatus === "aberto";

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-12">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mercado de Capitais Brasileiro</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              B3 · Brasil, Bolsa, Balcão
            </span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Bolsa de Valores (B3)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Acompanhamento oficial do Ibovespa (IBOV) e rankings diários das ações mais negociadas,
            maiores altas e maiores baixas do mercado acionário brasileiro.
          </p>
        </div>

        {/* Status de Pregão e Transparência */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isMarketOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
              aria-hidden="true"
            />
            <span>
              {isMarketOpen ? "Pregão Aberto (15 min defasagem)" : "Mercado Fechado"}
            </span>
          </div>

          {marketData.isStale && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Base Preservada</span>
            </div>
          )}

          <a
            href={marketData.quotationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Acessar cotações públicas na B3 com defasagem regulatória mínima de 15 min"
          >
            <span>Portal B3</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Alerta de Dados Preservados (quando o feed externo falhar) */}
      {marketData.isStale && (
        <div className="mb-6 p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-950 mb-0.5">Aviso de Dados Preservados (Conexão Indisponível)</h4>
            <p className="text-amber-800 leading-relaxed">
              {marketData.staleNotice ||
                `Exibindo último fechamento oficial consolidado do pregão de ${marketData.tradingSession}. A comunicação em tempo real com a B3 está temporariamente indisponível. Nenhum valor de cotação ou variação foi fabricado.`}
            </p>
          </div>
        </div>
      )}

      {/* PAINEL A: Ibovespa (IBOV) */}
      <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Lado Esquerdo: Identificação e Pontos do IBOV */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {ibov.ticker}
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                {ibov.indexName}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                {isMarketOpen ? "Pregão em Andamento" : "Último Fechamento Consolidado"}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4 mt-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white font-mono">
                {ibov.formattedPoints}
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-sm font-black border ${
                    ibov.changePercent > 0
                      ? "text-emerald-300 bg-emerald-950/70 border-emerald-500/40"
                      : ibov.changePercent === 0
                      ? "text-slate-300 bg-slate-800 border-slate-700"
                      : "text-rose-300 bg-rose-950/70 border-rose-500/40"
                  }`}
                >
                  {ibov.changePercent > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : ibov.changePercent === 0 ? (
                    <Minus className="w-4 h-4 text-slate-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{ibov.formattedChangePercent}</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">no dia</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Metadados, Fechamento Anterior e Timestamp */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between text-xs space-y-2">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Fechamento Anterior (D-1):</span>
              <span className="font-mono font-bold text-white">
                {ibov.formattedPreviousClose}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Data e Hora da Cotação:</span>
              <span className="font-mono text-slate-200">
                {ibov.timestamp}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400">Regime de Cotação:</span>
              <span className="text-slate-300">
                {isMarketOpen
                  ? "Cotação pública com defasagem de 15 min"
                  : `Fechamento de ${ibov.tradingSession}`}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Fonte Oficial Primária:</span>
              <a
                href={ibov.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 font-semibold"
              >
                <span>B3 Índices Amplos</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Aviso de Não-Simulação e Defasagem Regulatória */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isMarketOpen
              ? "Cotações públicas possuem defasagem mínima de 15 minutos em cumprimento à regulação da B3."
              : `O mercado está fechado neste momento. O valor exibido corresponde ao fechamento oficial da sessão de ${ibov.tradingSession}. Não tratamos o fechamento anterior como cotação ao vivo.`}
          </p>
        </div>
      </div>

      {/* PAINÉIS B, C e D: Rankings do Mercado (Mais Negociadas, Maiores Altas, Maiores Baixas) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          {/* Navegação entre Abas de Rankings */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("mostTraded")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "mostTraded"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>B. Mais Negociadas ({mostTraded.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("gainers")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "gainers"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>C. Maiores Altas ({gainers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("decliners")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "decliners"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span>D. Maiores Baixas ({decliners.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Sessão: {marketData.tradingSession}
          </span>
        </div>

        {/* Detalhe da Metodologia de cada Ranking */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">
              {activeTab === "mostTraded" && "Metodologia: Ações Mais Negociadas"}
              {activeTab === "gainers" && "Metodologia: Maiores Altas do Pregão"}
              {activeTab === "decliners" && "Metodologia: Maiores Baixas do Pregão"}
            </span>
            <p className="mt-0.5 text-slate-600 leading-relaxed text-[11px]">
              {activeTab === "mostTraded" && marketData.rankingMethodology.mostTradedMetric}
              {activeTab === "gainers" && marketData.rankingMethodology.gainersMetric}
              {activeTab === "decliners" && marketData.rankingMethodology.declinersMetric}
            </p>
          </div>
        </div>

        {/* Tabela do Ranking Ativo */}
        {activeTab === "mostTraded" &&
          renderStockTable(
            mostTraded,
            "Volume Financeiro (R$)",
            "Nenhuma ação registrada para o critério de volume financeiro."
          )}

        {activeTab === "gainers" &&
          renderStockTable(
            gainers,
            "Variação Diária (%)",
            "Nenhuma ação em alta registrada nesta sessão."
          )}

        {activeTab === "decliners" &&
          renderStockTable(
            decliners,
            "Variação Diária (%)",
            "Nenhuma ação em baixa registrada nesta sessão."
          )}
      </div>

      {/* Nota de Governança, Regulação e Termos de Uso da B3 */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Pregão de referência: <strong>{marketData.tradingSession}</strong> · Fechamento oficial às{" "}
              <strong>{marketData.timestamp.split(" ")[1] || "18:00"}</strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Última atualização com sucesso:{" "}
              <strong>{marketData.lastSuccessfulUpdate || marketData.timestamp}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
          >
            <span>Quadro de Cotações B3</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => setForceUnavailable(true)}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-[11px]"
            title="Simular visualização em caso de falha de dados externos"
          >
            Testar indisponibilidade
          </button>
        </div>
      </div>
    </section>
  );
};
