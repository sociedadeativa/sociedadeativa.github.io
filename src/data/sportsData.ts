/**
 * Dados de Demonstração e Estrutura da Seção de Esportes
 * Sociedade Ativa — Cobertura Esportiva Nacional e Internacional
 * 
 * AVISO OBRIGATÓRIO:
 * Todos os placares, tabelas de classificação, estatísticas e notícias esportivas
 * contidas neste arquivo são estritamente para DEMONSTRAÇÃO E PROTOTIPAGEM VISUAL.
 * NÃO representam dados oficiais em tempo real ou apuração factual ao vivo.
 */

export const DEMO_NOTICE = "DEMONSTRAÇÃO — DADOS FICTÍCIOS";

export interface SportTournament {
  id: string;
  name: string;
  shortName: string;
  category: "nacional" | "continental" | "internacional" | "estadual" | "selecoes";
  badgeColor: string;
  season: string;
}

export const TOURNAMENTS: SportTournament[] = [
  { id: "brasileirao-a", name: "Brasileirão Série A", shortName: "Série A", category: "nacional", badgeColor: "bg-emerald-600 text-white", season: "2026" },
  { id: "brasileirao-b", name: "Brasileirão Série B", shortName: "Série B", category: "nacional", badgeColor: "bg-blue-600 text-white", season: "2026" },
  { id: "copa-do-brasil", name: "Copa do Brasil", shortName: "Copa do Brasil", category: "nacional", badgeColor: "bg-amber-600 text-white", season: "2026" },
  { id: "libertadores", name: "CONMEBOL Libertadores", shortName: "Libertadores", category: "continental", badgeColor: "bg-slate-900 text-amber-400", season: "2026" },
  { id: "sul-americana", name: "CONMEBOL Sul-Americana", shortName: "Sul-Americana", category: "continental", badgeColor: "bg-blue-900 text-blue-200", season: "2026" },
  { id: "champions", name: "UEFA Champions League", shortName: "Champions League", category: "internacional", badgeColor: "bg-indigo-950 text-indigo-200", season: "2026/27" },
  { id: "estaduais", name: "Campeonatos Estaduais", shortName: "Estaduais", category: "estadual", badgeColor: "bg-teal-700 text-white", season: "2026" },
  { id: "selecao", name: "Seleção & Eliminatórias", shortName: "Copa do Mundo / Seleção", category: "selecoes", badgeColor: "bg-yellow-500 text-slate-950", season: "2026" },
];

export interface MatchScore {
  id: string;
  tournamentId: string;
  tournamentName: string;
  phase: string;
  status: "ao_vivo" | "encerrado" | "hoje" | "amanha" | "agendado";
  minute?: string;
  homeTeam: {
    name: string;
    shortName: string;
    score?: number;
    penalties?: number;
    initials: string;
    color: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
    score?: number;
    penalties?: number;
    initials: string;
    color: string;
  };
  date: string;
  time: string;
  venue: string;
  city: string;
  broadcast: string;
  roundOrLeg: string;
  keyEvents?: string[];
  disclaimer: string;
}

export const MATCHES_DATA: MatchScore[] = [
  {
    id: "match-1",
    tournamentId: "libertadores",
    tournamentName: "CONMEBOL Libertadores",
    phase: "Semifinal — Jogo de Ida",
    status: "ao_vivo",
    minute: "72'",
    homeTeam: { name: "Fluminense", shortName: "Fluminense", score: 1, initials: "FLU", color: "bg-rose-900 text-emerald-200" },
    awayTeam: { name: "Palmeiras", shortName: "Palmeiras", score: 1, initials: "PAL", color: "bg-emerald-800 text-white" },
    date: "14/10/2026",
    time: "21:30",
    venue: "Estádio do Maracanã",
    city: "Rio de Janeiro, RJ",
    broadcast: "Rádio Nacional · Globo · ESPN · Disney+",
    roundOrLeg: "Ida",
    keyEvents: ["28' Gol do Fluminense", "54' Gol do Palmeiras", "67' Cartão Amarelo"],
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-2",
    tournamentId: "copa-do-brasil",
    tournamentName: "Copa do Brasil",
    phase: "Semifinal — Volta",
    status: "ao_vivo",
    minute: "41'",
    homeTeam: { name: "Corinthians", shortName: "Corinthians", score: 1, initials: "COR", color: "bg-neutral-900 text-white" },
    awayTeam: { name: "Flamengo", shortName: "Flamengo", score: 0, initials: "FLA", color: "bg-red-800 text-neutral-100" },
    date: "14/10/2026",
    time: "21:45",
    venue: "Neo Química Arena",
    city: "São Paulo, SP",
    broadcast: "Globo · SporTV · Premiere · Prime Video",
    roundOrLeg: "Volta (Ida: 0x0)",
    keyEvents: ["19' Gol do Corinthians"],
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-3",
    tournamentId: "brasileirao-a",
    tournamentName: "Brasileirão Série A",
    phase: "30ª Rodada",
    status: "encerrado",
    homeTeam: { name: "Botafogo", shortName: "Botafogo", score: 2, initials: "BOT", color: "bg-slate-950 text-white" },
    awayTeam: { name: "São Paulo", shortName: "São Paulo", score: 1, initials: "SAO", color: "bg-red-700 text-white" },
    date: "13/10/2026",
    time: "19:00",
    venue: "Estádio Nilton Santos",
    city: "Rio de Janeiro, RJ",
    broadcast: "Premiere · SporTV",
    roundOrLeg: "30ª Rodada",
    keyEvents: ["15' Gol do Botafogo", "39' Gol do São Paulo", "83' Gol da vitória do Botafogo"],
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-4",
    tournamentId: "brasileirao-a",
    tournamentName: "Brasileirão Série A",
    phase: "30ª Rodada",
    status: "encerrado",
    homeTeam: { name: "Internacional", shortName: "Internacional", score: 1, initials: "INT", color: "bg-red-600 text-white" },
    awayTeam: { name: "Grêmio", shortName: "Grêmio", score: 0, initials: "GRE", color: "bg-sky-600 text-white" },
    date: "13/10/2026",
    time: "16:00",
    venue: "Estádio Beira-Rio",
    city: "Porto Alegre, RS",
    broadcast: "Globo · Premiere",
    roundOrLeg: "Clássico Gre-Nal",
    keyEvents: ["67' Gol do Internacional"],
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-5",
    tournamentId: "selecao",
    tournamentName: "Eliminatórias Sul-Americanas",
    phase: "10ª Rodada",
    status: "hoje",
    homeTeam: { name: "Brasil", shortName: "Brasil", initials: "BRA", color: "bg-yellow-400 text-emerald-900" },
    awayTeam: { name: "Peru", shortName: "Peru", initials: "PER", color: "bg-red-600 text-white" },
    date: "14/10/2026",
    time: "21:45",
    venue: "Estádio Mané Garrincha",
    city: "Brasília, DF",
    broadcast: "TV Brasil · Globo · SporTV",
    roundOrLeg: "Rodada 10",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-6",
    tournamentId: "champions",
    tournamentName: "UEFA Champions League",
    phase: "Fase de Liga — 3ª Rodada",
    status: "encerrado",
    homeTeam: { name: "Real Madrid", shortName: "Real Madrid", score: 3, initials: "RMA", color: "bg-slate-100 text-slate-900" },
    awayTeam: { name: "Borussia Dortmund", shortName: "B. Dortmund", score: 2, initials: "BVB", color: "bg-amber-400 text-slate-950" },
    date: "14/10/2026",
    time: "16:00",
    venue: "Santiago Bernabéu",
    city: "Madri, Espanha",
    broadcast: "SBT · TNT Sports · Max",
    roundOrLeg: "3ª Rodada",
    keyEvents: ["30' Gol BVB", "34' Gol BVB", "60' Gol RMA", "62' Gol RMA", "86' Gol RMA"],
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-7",
    tournamentId: "brasileirao-b",
    tournamentName: "Brasileirão Série B",
    phase: "32ª Rodada",
    status: "amanha",
    homeTeam: { name: "Santos", shortName: "Santos", initials: "SAN", color: "bg-slate-900 text-white" },
    awayTeam: { name: "Ceará", shortName: "Ceará", initials: "CEA", color: "bg-neutral-800 text-white" },
    date: "15/10/2026",
    time: "20:00",
    venue: "Vila Belmiro",
    city: "Santos, SP",
    broadcast: "SporTV · Premiere · TV Brasil",
    roundOrLeg: "Disputa pelo G-4",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "match-8",
    tournamentId: "sul-americana",
    tournamentName: "CONMEBOL Sul-Americana",
    phase: "Semifinal — Jogo de Ida",
    status: "amanha",
    homeTeam: { name: "Cruzeiro", shortName: "Cruzeiro", initials: "CRU", color: "bg-blue-700 text-white" },
    awayTeam: { name: "Lanús", shortName: "Lanús", initials: "LAN", color: "bg-rose-900 text-white" },
    date: "15/10/2026",
    time: "19:00",
    venue: "Estádio Mineirão",
    city: "Belo Horizonte, MG",
    broadcast: "ESPN · Paramount+",
    roundOrLeg: "Semifinal",
    disclaimer: DEMO_NOTICE,
  },
];

export interface StandingRow {
  position: number;
  club: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  percentage: string;
  form: ("V" | "E" | "D")[];
  zone: "libertadores_direta" | "pre_libertadores" | "sulamericana" | "meio" | "rebaixamento" | "acesso";
}

export const STANDINGS_SERIE_A: StandingRow[] = [
  { position: 1, club: "Botafogo", points: 63, played: 29, won: 19, drawn: 6, lost: 4, goalsFor: 49, goalsAgainst: 24, goalDiff: 25, percentage: "72.4%", form: ["V", "V", "E", "V", "V"], zone: "libertadores_direta" },
  { position: 2, club: "Palmeiras", points: 60, played: 29, won: 18, drawn: 6, lost: 5, goalsFor: 51, goalsAgainst: 23, goalDiff: 28, percentage: "68.9%", form: ["V", "E", "V", "V", "E"], zone: "libertadores_direta" },
  { position: 3, club: "Fortaleza", points: 56, played: 29, won: 16, drawn: 8, lost: 5, goalsFor: 39, goalsAgainst: 27, goalDiff: 12, percentage: "64.3%", form: ["V", "E", "D", "V", "V"], zone: "libertadores_direta" },
  { position: 4, club: "Flamengo", points: 52, played: 29, won: 15, drawn: 7, lost: 7, goalsFor: 47, goalsAgainst: 34, goalDiff: 13, percentage: "59.7%", form: ["E", "V", "D", "V", "V"], zone: "libertadores_direta" },
  { position: 5, club: "São Paulo", points: 48, played: 29, won: 14, drawn: 6, lost: 9, goalsFor: 38, goalsAgainst: 30, goalDiff: 8, percentage: "55.1%", form: ["D", "V", "V", "D", "V"], zone: "pre_libertadores" },
  { position: 6, club: "Internacional", points: 46, played: 28, won: 12, drawn: 10, lost: 6, goalsFor: 38, goalsAgainst: 26, goalDiff: 12, percentage: "54.7%", form: ["V", "E", "V", "V", "V"], zone: "pre_libertadores" },
  { position: 7, club: "Bahia", points: 45, played: 29, won: 13, drawn: 6, lost: 10, goalsFor: 39, goalsAgainst: 33, goalDiff: 6, percentage: "51.7%", form: ["D", "V", "E", "D", "V"], zone: "sulamericana" },
  { position: 8, club: "Cruzeiro", points: 44, played: 29, won: 12, drawn: 8, lost: 9, goalsFor: 35, goalsAgainst: 29, goalDiff: 6, percentage: "50.5%", form: ["E", "E", "D", "E", "V"], zone: "sulamericana" },
  { position: 9, club: "Atlético-MG", points: 41, played: 28, won: 10, drawn: 11, lost: 7, goalsFor: 40, goalsAgainst: 40, goalDiff: 0, percentage: "48.8%", form: ["E", "V", "D", "V", "E"], zone: "sulamericana" },
  { position: 10, club: "Vasco da Gama", points: 38, played: 29, won: 10, drawn: 8, lost: 11, goalsFor: 32, goalsAgainst: 39, goalDiff: -7, percentage: "43.6%", form: ["D", "E", "E", "V", "E"], zone: "sulamericana" },
  { position: 11, club: "Grêmio", points: 36, played: 29, won: 10, drawn: 6, lost: 13, goalsFor: 33, goalsAgainst: 37, goalDiff: -4, percentage: "41.3%", form: ["D", "V", "D", "E", "V"], zone: "sulamericana" },
  { position: 12, club: "Criciúma", points: 35, played: 29, won: 9, drawn: 8, lost: 12, goalsFor: 35, goalsAgainst: 41, goalDiff: -6, percentage: "40.2%", form: ["V", "D", "V", "D", "E"], zone: "sulamericana" },
  { position: 13, club: "Red Bull Bragantino", points: 34, played: 29, won: 8, drawn: 10, lost: 11, goalsFor: 34, goalsAgainst: 38, goalDiff: -4, percentage: "39.0%", form: ["E", "E", "D", "E", "D"], zone: "meio" },
  { position: 14, club: "Juventude", points: 34, played: 29, won: 8, drawn: 10, lost: 11, goalsFor: 34, goalsAgainst: 41, goalDiff: -7, percentage: "39.0%", form: ["E", "D", "D", "V", "E"], zone: "meio" },
  { position: 15, club: "Athletico-PR", points: 32, played: 27, won: 8, drawn: 8, lost: 11, goalsFor: 27, goalsAgainst: 31, goalDiff: -4, percentage: "39.5%", form: ["D", "D", "E", "D", "D"], zone: "meio" },
  { position: 16, club: "Fluminense", points: 31, played: 29, won: 8, drawn: 7, lost: 14, goalsFor: 23, goalsAgainst: 31, goalDiff: -8, percentage: "35.6%", form: ["V", "V", "D", "D", "D"], zone: "meio" },
  { position: 17, club: "Vitória", points: 29, played: 29, won: 8, drawn: 5, lost: 16, goalsFor: 30, goalsAgainst: 45, goalDiff: -15, percentage: "33.3%", form: ["E", "D", "V", "V", "D"], zone: "rebaixamento" },
  { position: 18, club: "Corinthians", points: 29, played: 29, won: 6, drawn: 11, lost: 12, goalsFor: 29, goalsAgainst: 39, goalDiff: -10, percentage: "33.3%", form: ["E", "D", "V", "D", "V"], zone: "rebaixamento" },
  { position: 19, club: "Cuiabá", points: 27, played: 28, won: 6, drawn: 9, lost: 13, goalsFor: 25, goalsAgainst: 39, goalDiff: -14, percentage: "32.1%", form: ["D", "V", "E", "E", "D"], zone: "rebaixamento" },
  { position: 20, club: "Atlético-GO", points: 22, played: 29, won: 5, drawn: 7, lost: 17, goalsFor: 22, goalsAgainst: 46, goalDiff: -24, percentage: "25.2%", form: ["D", "D", "V", "D", "D"], zone: "rebaixamento" },
];

export const STANDINGS_SERIE_B: StandingRow[] = [
  { position: 1, club: "Santos", points: 58, played: 31, won: 17, drawn: 7, lost: 7, goalsFor: 48, goalsAgainst: 26, goalDiff: 22, percentage: "62.3%", form: ["V", "E", "V", "V", "V"], zone: "acesso" },
  { position: 2, club: "Novorizontino", points: 55, played: 31, won: 16, drawn: 7, lost: 8, goalsFor: 37, goalsAgainst: 26, goalDiff: 11, percentage: "59.1%", form: ["D", "V", "D", "V", "V"], zone: "acesso" },
  { position: 3, club: "Sport Recife", points: 54, played: 30, won: 15, drawn: 9, lost: 6, goalsFor: 43, goalsAgainst: 28, goalDiff: 15, percentage: "60.0%", form: ["V", "V", "E", "V", "E"], zone: "acesso" },
  { position: 4, club: "Mirassol", points: 50, played: 31, won: 14, drawn: 8, lost: 9, goalsFor: 30, goalsAgainst: 23, goalDiff: 7, percentage: "53.7%", form: ["D", "V", "V", "D", "V"], zone: "acesso" },
  { position: 5, club: "Ceará", points: 49, played: 31, won: 14, drawn: 7, lost: 10, goalsFor: 50, goalsAgainst: 38, goalDiff: 12, percentage: "52.6%", form: ["V", "D", "V", "V", "D"], zone: "meio" },
  { position: 6, club: "Vila Nova", points: 49, played: 31, won: 14, drawn: 7, lost: 10, goalsFor: 36, goalsAgainst: 40, goalDiff: -4, percentage: "52.6%", form: ["V", "D", "D", "E", "V"], zone: "meio" },
  { position: 7, club: "América-MG", points: 48, played: 31, won: 12, drawn: 12, lost: 7, goalsFor: 41, goalsAgainst: 27, goalDiff: 14, percentage: "51.6%", form: ["E", "D", "V", "V", "D"], zone: "meio" },
  { position: 8, club: "Coritiba", points: 45, played: 31, won: 12, drawn: 9, lost: 10, goalsFor: 33, goalsAgainst: 31, goalDiff: 2, percentage: "48.3%", form: ["V", "E", "E", "D", "V"], zone: "meio" },
];

export interface SportsNewsCard {
  id: string;
  title: string;
  summary: string;
  category: string;
  championship: string;
  source: string;
  publishedAt: string;
  readTime: string;
  disclaimer: string;
}

export const SPORTS_EDITORIAL_NEWS: SportsNewsCard[] = [
  {
    id: "ebc-1705282",
    title: "Libertadores: Rádio Nacional transmite Fluminense x Palmeiras pela semifinal",
    summary: "Duelo de ida entre Fluminense e Palmeiras no Maracanã abre disputa por vaga na grande final continental. Transmissão com comentários e análise tática.",
    category: "Libertadores",
    championship: "CONMEBOL Libertadores",
    source: "Rádio Nacional / Agência Brasil",
    publishedAt: "14/10/2026 às 06:45",
    readTime: "3 min de leitura",
    disclaimer: "Fonte Oficial EBC",
  },
  {
    id: "demo-sport-1",
    title: "Reta final do Brasileirão: matemática aponta briga acirrada pelo título entre três clubes",
    summary: "Simulações estatísticas mostram chances de Botafogo, Palmeiras e Fortaleza na reta decisiva da Série A, com confrontos diretos nas rodadas finais.",
    category: "Brasileirão",
    championship: "Brasileirão Série A",
    source: "Redação Esportiva (Simulação)",
    publishedAt: "14/10/2026 às 08:15",
    readTime: "4 min de leitura",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "demo-sport-2",
    title: "Copa do Brasil: decisão de finalistas terá VAR calibrado e transmissão em rede aberta",
    summary: "Entenda os critérios de desempate, distribuição de cotas de premiação da CBF e o planejamento de segurança para os jogos de volta nas capitais.",
    category: "Copa do Brasil",
    championship: "Copa do Brasil",
    source: "Redação Esportiva (Simulação)",
    publishedAt: "14/10/2026 às 07:50",
    readTime: "5 min de leitura",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "demo-sport-3",
    title: "Série B: Santos consolida liderança e matemáticos calculam pontuação de corte para acesso",
    summary: "Disputa acirrada pelo G-4 coloca Novorizontino, Sport, Mirassol e Ceará separados por poucos pontos a sete rodadas do encerramento da temporada.",
    category: "Brasileirão",
    championship: "Brasileirão Série B",
    source: "Redação Esportiva (Simulação)",
    publishedAt: "13/10/2026 às 21:00",
    readTime: "3 min de leitura",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "demo-sport-4",
    title: "Champions League: novo formato de Liga única eleva competitividade na fase inicial",
    summary: "Com oito rodadas no modelo suíço, gigantes europeus disputam vaga direta no mata-mata em calendário com jogos simultâneos e alta média de gols.",
    category: "Futebol Internacional",
    championship: "UEFA Champions League",
    source: "Redação Esportiva (Simulação)",
    publishedAt: "13/10/2026 às 18:30",
    readTime: "4 min de leitura",
    disclaimer: DEMO_NOTICE,
  },
  {
    id: "demo-sport-5",
    title: "Eliminatórias da Copa 2026: Seleção Brasileira faz ajustes táticos para encarar o Peru",
    summary: "Em Brasília, equipe nacional busca consolidar sequência positiva e encaminhar classificação antecipada para a Copa do Mundo de 2026.",
    category: "Seleção",
    championship: "Eliminatórias da Copa",
    source: "Redação Esportiva (Simulação)",
    publishedAt: "13/10/2026 às 17:15",
    readTime: "3 min de leitura",
    disclaimer: DEMO_NOTICE,
  },
];
