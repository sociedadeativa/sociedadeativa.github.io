/**
 * Utilitários de Horário de Negociação e Status de Mercado da B3 (Brasil, Bolsa, Balcão)
 * Sociedade Ativa — Política, eleições, notícias e dados do Brasil.
 *
 * Referências Oficiais da B3:
 * - Metodologia do Ibovespa: https://b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm
 * - Cotações B3: https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/
 *
 * Regras do Pregão B3:
 * 1. Horário regular de negociação: Segunda a Sexta, das 10h00 às 17h55 (BRT / UTC-3).
 * 2. Fechamento e after-market: a partir das 18h00.
 * 3. Fins de semana e feriados nacionais brasileiros: pregão fechado.
 * 4. Cotações públicas da B3 possuem defasagem mínima de 15 minutos durante o pregão.
 * 5. Fora do horário de negociação, exibe o último fechamento oficial consolidado
 *    e nunca trata valores de fechamento como cotações em tempo real.
 */

export interface B3MarketStatusInfo {
  isOpen: boolean;
  status: "aberto" | "fechado";
  statusShortLabel: string;
  statusDetailedText: string;
  delayNotice: string;
  isDelayed: boolean;
  sourceUrl: string;
  quotationUrl: string;
  currentBrtTime: string;
}

export interface DataSourceContext {
  tradingSession?: string;
  timestamp?: string;
  marketStatus?: string;
}

/**
 * Calcula dinamicamente o status do pregão da B3 no horário oficial de Brasília,
 * cruzando o calendário de negociação com a sessão e carimbo de data/hora da fonte de dados.
 */
export function getB3MarketStatus(
  referenceDate: Date = new Date(),
  dataContext?: DataSourceContext
): B3MarketStatusInfo {
  const sourceUrl =
    "https://b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm";
  const quotationUrl =
    "https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/";
  const delayNotice =
    "Cotações públicas com defasagem regulatória mínima de 15 minutos (B3). Valores de fechamento não constituem cotação em tempo real.";

  try {
    // Formatação em horário de Brasília (America/Sao_Paulo)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Sao_Paulo",
      hour12: false,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(referenceDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

    const day = parseInt(getPart("day"), 10);
    const month = parseInt(getPart("month"), 10);
    const year = parseInt(getPart("year"), 10);
    const hour = parseInt(getPart("hour"), 10);
    const minute = parseInt(getPart("minute"), 10);
    const weekday = getPart("weekday"); // Mon, Tue, Wed, Thu, Fri, Sat, Sun

    const todayBrtDate = `${String(day).padStart(2, "0")}/${String(month).padStart(
      2,
      "0"
    )}/${year}`;

    const currentBrtTime = `${String(day).padStart(2, "0")}/${String(month).padStart(
      2,
      "0"
    )} às ${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`;

    // 1. Finais de Semana
    const isWeekend = weekday === "Sat" || weekday === "Sun";

    // 2. Feriados Nacionais Brasileiros (B3 fechada)
    const isHoliday =
      (month === 1 && day === 1) || // Ano Novo
      (month === 4 && day === 21) || // Tiradentes
      (month === 5 && day === 1) || // Dia do Trabalho
      (month === 9 && day === 7) || // Independência
      (month === 10 && day === 12) || // N. Sra Aparecida
      (month === 11 && day === 2) || // Finados
      (month === 11 && day === 15) || // Proclamação da República
      (month === 11 && day === 20) || // Consciência Negra
      (month === 12 && day === 25); // Natal

    const timeInMinutes = hour * 60 + minute;
    // Horário oficial do pregão B3: das 10h00 (600 min) às 17h55 (1075 min)
    const isTradingHours = timeInMinutes >= 600 && timeInMinutes <= 1075;
    const isCalendarOpen = !isWeekend && !isHoliday && isTradingHours;

    // Avaliação da natureza e consistência dos dados da fonte:
    const rawTimestamp = String(dataContext?.timestamp || "").trim();
    const rawSession = String(dataContext?.tradingSession || "").trim();
    const rawStatus = String(dataContext?.marketStatus || "").trim().toLowerCase();

    // 1. Dados marcados com horário de fechamento oficial (18:00 ou posterior) ou palavra-chave fechamento
    // NUNCA devem ser rotulados como pregão ao vivo ou sessão ativa.
    const is1800OrAfterClosing =
      /(?:18:\d\d|18h\d\d|19:\d\d|19h\d\d|20:\d\d|20h\d\d)/i.test(rawTimestamp) ||
      /fechamento/i.test(rawTimestamp) ||
      /fechamento/i.test(rawSession);

    // 2. Status explícito de mercado fechado informado pela fonte de dados
    const isExplicitFechado = rawStatus === "fechado";

    // 3. Se a sessão de dados pertence a uma data anterior à data corrente em Brasília (ex: dados de 15/10 quando hoje é 16/10)
    const sessionDateClean = rawSession.split(" ")[0].replace(/[^0-9/]/g, "");
    const isPreviousDateSession = Boolean(sessionDateClean && sessionDateClean !== todayBrtDate);

    // Consolidação: se qualquer um dos critérios indicar fechamento, os dados representam o último fechamento oficial
    const isClosingData = is1800OrAfterClosing || isExplicitFechado || isPreviousDateSession;

    // O status do pregão só é "aberto" se:
    // a) O calendário estiver em horário regular (seg-sex, 10h00 às 17h55 BRT, sem feriados);
    // b) Os dados da fonte NÃO forem de fechamento (não sejam 18:00, não tenham status fechado, não sejam de sessão anterior);
    // c) Houver carimbo de data/hora válido confirmando cotação intradiária de hoje.
    const isOpen = isCalendarOpen && !isClosingData && Boolean(rawTimestamp);

    if (isOpen) {
      return {
        isOpen: true,
        status: "aberto",
        statusShortLabel: "Pregão Aberto (15m)",
        statusDetailedText: "Pregão Aberto (Cotação com defasagem de 15 min)",
        delayNotice,
        isDelayed: true,
        sourceUrl,
        quotationUrl,
        currentBrtTime,
      };
    }

    let statusDetailedText = "Mercado Fechado (Último Fechamento Consolidado)";
    let statusShortLabel = "Mercado Fechado";

    if (isClosingData) {
      const displayDate = sessionDateClean || todayBrtDate;
      const displayTime = rawTimestamp.split(" ")[1] || (rawTimestamp.includes(":") ? rawTimestamp : "18:00");
      statusDetailedText = `Último Fechamento Oficial (${displayDate} às ${displayTime})`;
      statusShortLabel = isCalendarOpen ? "Fechamento Oficial" : "Mercado Fechado";
    } else if (isWeekend) {
      statusDetailedText = "Mercado Fechado (Fim de semana)";
    } else if (isHoliday) {
      statusDetailedText = "Mercado Fechado (Feriado)";
    } else if (timeInMinutes < 600) {
      statusDetailedText = "Mercado Fechado (Abertura às 10h00 BRT)";
    } else {
      statusDetailedText = "Mercado Fechado (Pregão Encerrado às 17h55 BRT)";
    }

    return {
      isOpen: false,
      status: "fechado",
      statusShortLabel,
      statusDetailedText,
      delayNotice,
      isDelayed: true,
      sourceUrl,
      quotationUrl,
      currentBrtTime,
    };
  } catch {
    return {
      isOpen: false,
      status: "fechado",
      statusShortLabel: "Mercado Fechado",
      statusDetailedText: "Mercado Fechado (Último Fechamento Oficial)",
      delayNotice,
      isDelayed: true,
      sourceUrl,
      quotationUrl,
      currentBrtTime: "Horário de Brasília",
    };
  }
}

/**
 * Formata pontos do Ibovespa com separador de milhares em português brasileiro.
 */
export function formatIbovPoints(points: number | null): string {
  if (points === null || isNaN(points)) {
    return "Dados indisponíveis no momento.";
  }
  return `${Math.round(points).toLocaleString("pt-BR")} pts`;
}

/**
 * Formata variação percentual com sinal explícito neutro (+, -, 0).
 */
export function formatDailyVariation(variation: number | null): {
  formatted: string;
  type: "positive" | "negative" | "zero" | "unavailable";
} {
  if (variation === null || isNaN(variation)) {
    return { formatted: "--", type: "unavailable" };
  }
  if (variation > 0) {
    return {
      formatted: `+${variation.toFixed(2).replace(".", ",")}%`,
      type: "positive",
    };
  }
  if (variation < 0) {
    return {
      formatted: `${variation.toFixed(2).replace(".", ",")}%`,
      type: "negative",
    };
  }
  return {
    formatted: `0,00%`,
    type: "zero",
  };
}
