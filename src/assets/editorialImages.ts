import congressoImg from "./images/editorial_congresso_brasilia_1791575832620.webp";
import urnaImg from "./images/editorial_urna_eleicoes_1791575843949.webp";
import economiaImg from "./images/editorial_economia_brasil_1791575854174.webp";
import dadosImg from "./images/editorial_dados_publicos_1791575864014.webp";

export const EDITORIAL_IMAGES = {
  congresso: {
    src: congressoImg,
    alt: "Congresso Nacional em Brasília com as cúpulas e torres gêmeas ao entardecer",
    caption: "Congresso Nacional, Brasília — Centro das deliberações legislativas e tramitação orçamentária.",
  },
  urna: {
    src: urnaImg,
    alt: "Eleitores e mesários em seção eleitoral oficial brasileira durante a votação",
    caption: "Seção eleitoral oficial brasileira durante o processo de votação e fiscalização democrática.",
  },
  economia: {
    src: economiaImg,
    alt: "Edifício sede do Banco Central do Brasil e setor financeiro em Brasília",
    caption: "Banco Central do Brasil e setor econômico — Condução da política monetária e metas de inflação.",
  },
  dadosPublicos: {
    src: dadosImg,
    alt: "Mesa de pesquisa com relatórios estatísticos demográficos do IBGE e mapas regionais",
    caption: "Pesquisa e jornalismo de dados públicos — Séries estatísticas oficiais do Estado brasileiro.",
  },
};
