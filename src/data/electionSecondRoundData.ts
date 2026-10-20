// Dataset Oficial do 2º Turno da Eleição Presidencial de 2026 (TSE)
// Gerado automaticamente pelo pipeline oficial (scripts/update-election-second-round-data.mjs).
// NÃO MODIFIQUE MANUALMENTE ESTE ARQUIVO.

export interface SecondRoundCandidate {
  ballotNumber: number;
  candidateId: string;
  name: string;
  popularName: string;
  party: string;
  coalition: string;
  viceName: string;
  vicePopularName: string;
  viceParty: string;
  seq: number;
  votes: number;
  percentage: number;
  elected: boolean;
  situation: string;
  color: string;
  colorMuted: string;
  photoUrl: string;
  photoAttribution: string;
  photoSourceUrl: string;
  tseSourceUrl: string;
}

export interface SecondRoundTotalization {
  electionCode: string;
  round: number;
  environment: string;
  scope: string;
  officeCode: string;
  officeName: string;
  generatedDate: string;
  generatedTime: string;
  totalizationDate: string;
  totalizationTime: string;
  isFinal: boolean;
  countingStarted: boolean;
  countingProgress: number;
  sectionsTotal: number;
  sectionsCounted: number;
  sectionsRemaining: number;
  electorateTotal: number;
  turnout: number;
  turnoutPercentage: number;
  abstention: number;
  abstentionPercentage: number;
  validVotes: number;
  validVotesPercentage: number;
  blankVotes: number;
  blankVotesPercentage: number;
  nullVotes: number;
  nullVotesPercentage: number;
  totalVotes: number;
  candidates: SecondRoundCandidate[];
  statusLabel: string;
  lastUpdated: string;
}

export const SECOND_ROUND_DATA: SecondRoundTotalization = {
  "electionCode": "6258",
  "round": 2,
  "environment": "o",
  "scope": "br",
  "officeCode": "1",
  "officeName": "Presidente",
  "generatedDate": "15/10/2026",
  "generatedTime": "09:38:12",
  "totalizationDate": "",
  "totalizationTime": "",
  "isFinal": false,
  "countingStarted": false,
  "countingProgress": 0,
  "sectionsTotal": 499248,
  "sectionsCounted": 0,
  "sectionsRemaining": 499248,
  "electorateTotal": 158745502,
  "turnout": 0,
  "turnoutPercentage": 0,
  "abstention": 0,
  "abstentionPercentage": 0,
  "validVotes": 0,
  "validVotesPercentage": 0,
  "blankVotes": 0,
  "blankVotesPercentage": 0,
  "nullVotes": 0,
  "nullVotesPercentage": 0,
  "totalVotes": 0,
  "candidates": [
    {
      "ballotNumber": 13,
      "candidateId": "280002542548",
      "name": "LUIZ INÁCIO LULA DA SILVA",
      "popularName": "Lula",
      "party": "PT",
      "coalition": "BRASIL PRONTO PRA MAIS",
      "viceName": "GERALDO JOSE RODRIGUES ALCKMIN FILHO",
      "vicePopularName": "GERALDO ALCKMIN",
      "viceParty": "PSB",
      "seq": 1,
      "votes": 0,
      "percentage": 0,
      "elected": false,
      "situation": "",
      "color": "#DC2626",
      "colorMuted": "#FCA5A5",
      "photoUrl": "/assets/candidates/lula.jpg",
      "photoAttribution": "Foto Oficial da Presidência da República / Ricardo Stuckert / PR (CC BY 3.0 BR)",
      "photoSourceUrl": "https://www.gov.br/planalto",
      "tseSourceUrl": "https://divulgacandcontas.tse.jus.br"
    },
    {
      "ballotNumber": 22,
      "candidateId": "280002551544",
      "name": "FLAVIO NANTES BOLSONARO",
      "popularName": "Flávio Bolsonaro",
      "party": "PL",
      "coalition": "PARTIDO LIBERAL",
      "viceName": "ALFREDO GASPAR DE MENDONÇA NETO",
      "vicePopularName": "ALFREDO GASPAR",
      "viceParty": "PL",
      "seq": 2,
      "votes": 0,
      "percentage": 0,
      "elected": false,
      "situation": "",
      "color": "#1D4ED8",
      "colorMuted": "#93C5FD",
      "photoUrl": "/assets/candidates/flavio.jpg",
      "photoAttribution": "Foto Oficial do Senado Federal / Agência Senado / Pedro França (CC BY 2.0)",
      "photoSourceUrl": "https://www.senado.leg.br",
      "tseSourceUrl": "https://divulgacandcontas.tse.jus.br"
    }
  ],
  "statusLabel": "Aguardando apuração oficial",
  "lastUpdated": "2026-10-20T13:30:30.567Z"
};
