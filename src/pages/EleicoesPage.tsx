import React from "react";
import { ElectionDataSet } from "../data/electionData";
import { NewsItem } from "../types/news";
import { NationalBanner } from "../components/NationalBanner";
import { CandidateResultsView } from "../components/CandidateResultsView";
import { RegionalCharts } from "../components/RegionalCharts";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { NewsCard } from "../components/NewsCard";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import { isElectionArticle } from "../utils/electionNewsFilter";
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  IdCard,
  Smartphone,
  FileCheck,
  ExternalLink,
  AlertCircle
} from "lucide-react";

interface EleicoesPageProps {
  dataset: ElectionDataSet;
  articles: NewsItem[];
  selectedCandidateFilter: string | null;
  onSelectCandidateFilter: (id: string | null) => void;
  onOpenMethodology: () => void;
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const EleicoesPage: React.FC<EleicoesPageProps> = ({
  dataset,
  articles,
  selectedCandidateFilter,
  onSelectCandidateFilter,
  onOpenMethodology,
  onOpenArticleDetails,
}) => {
  const electionArticles = articles.filter(isElectionArticle);

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Eleições */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
            <Vote className="w-4 h-4" />
            <span>Caderno Especial · Eleições Presidenciais 2026</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Totalização Oficial do 1º Turno &amp; Disputa do 2º Turno
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Resultados consolidados em 100% das urnas eletrônicas pelo Tribunal Superior Eleitoral (TSE). Análise da votação nominal dos candidatos a presidente, abstenções e parâmetros legais do 2º turno previstos no Artigo 77 da Constituição Federal.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Veja também:</span>
            <PortalLink
              route="estados"
              className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Mapa por Estado &rarr;
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Bancadas do Congresso &rarr;
            </PortalLink>
            <button
              onClick={onOpenMethodology}
              className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Metodologia de Votos Válidos &rarr;
            </button>
          </div>
        </div>

        {/* SERVIÇO AO ELEITOR — GUIA PRÁTICO DO 2º TURNO (TSE) */}
        <section
          aria-labelledby="guia-eleitor-titulo"
          className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
        >
          {/* Top Bar / Header do Guia */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-700/70 border border-blue-400/30 text-xs font-bold uppercase tracking-wider text-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Serviço ao Cidadão · Justiça Eleitoral</span>
              </div>
              <span className="text-xs font-medium text-blue-200">
                Resoluções Oficiais do Tribunal Superior Eleitoral (TSE)
              </span>
            </div>

            <h2
              id="guia-eleitor-titulo"
              className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white mb-2"
            >
              Guia Prático do Eleitor — 2º Turno Presidencial 2026
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-3xl leading-relaxed">
              Consulte seu local de votação, documentos válidos com foto, funcionamento do aplicativo e-Título e prazos oficiais para justificativa de ausência no pleito de 25 de outubro.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Bloco de Indicadores Rápidos: Data, Horário e Local de Votação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Data */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Data do Pleito
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    Domingo, 25 de Outubro de 2026
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Votação para Presidente da República e governadores em estados com 2º turno.
                </p>
              </div>

              {/* Card 2: Horário */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Horário de Votação
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    08h00 às 17h00
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Horário unificado pelo fuso de Brasília. Eleitores na fila às 17h recebem senha para votar.
                </p>
              </div>

              {/* Card 3: Consulta de Local de Votação (Destaque Proeminente TSE) */}
              <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-300 flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-200/80 px-2.5 py-0.5 rounded-full">
                      Link Oficial TSE
                    </span>
                  </div>
                  <div className="text-base font-black text-slate-900">
                    Onde Votar: Consulta de Seção e Zona Eleitoral
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mais de 130 mil eleitores tiveram locais de votação alterados para o 2º turno. Consulte com antecedência seu local exato no Autoatendimento Eleitoral informando CPF ou título.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200/80">
                  <a
                    href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <span>Consultar Local de Votação no Autoatendimento Eleitoral</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Painéis Detalhados: Documentos Aceitos, e-Título e Justificativa */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Documentos Aceitos */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <h3 className="font-heading text-lg font-bold">
                      Documentos Aceitos no Dia da Eleição
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Para votar, é <strong className="text-slate-900">obrigatório apresentar um documento oficial com foto</strong>. O título de eleitor de papel não é indispensável se você souber sua seção e portar um dos seguintes documentos válidos:
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Carteira de Identidade (RG) ou Carteira de Identidade Nacional (CIN);</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Carteira Nacional de Habilitação (CNH física ou digital com foto);</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Passaporte brasileiro válido;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Carteira de Trabalho física ou carteira de conselho profissional (OAB, CRM, CREA, etc.);</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Certificado de reservista;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>e-Título digital</strong>: Válido como documento de identificação APENAS se contiver a foto do eleitor (biometria cadastrada).</span>
                    </li>
                  </ul>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Não são aceitas:</strong> Certidões de nascimento ou certidões de casamento não são aceitas para votar, pois não possuem foto.
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <a
                    href="https://www.tse.jus.br/servicos-eleitorais/titulo-e-local-de-votacao/o-que-levar-para-votar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <span>Consultar regras completas de identificação no portal do TSE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* e-Título & Justificativa Eleitoral */}
              <div className="space-y-6 flex flex-col justify-between">
                {/* e-Título */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <h3 className="font-heading text-base font-bold">
                      Aplicativo Oficial e-Título
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    Via digital do título de eleitor desenvolvida pela Justiça Eleitoral (disponível gratuitamente para Android e iOS).
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-3">
                    <strong className="text-slate-900 block mb-1">
                      Instalação e validação prévia recomendada:
                    </strong>
                    <span className="text-slate-600">
                      O TSE assegura a possibilidade de baixar e acessar o e-Título inclusive no dia da eleição. Recomenda-se, no entanto, fazer a instalação e a emissão antecipada do aplicativo para garantir maior agilidade, evitando eventuais picos de conexão no domingo de votação.
                    </span>
                  </div>
                  <a
                    href="https://www.tse.jus.br/servicos-eleitorais/servicos-do-e-titulo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <span>Informações e download oficial do e-Título (TSE)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Justificativa Eleitoral */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-heading text-base font-bold">
                      Como Justificar a Ausência no 2º Turno
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed mb-3">
                    <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100">
                      <strong className="text-purple-950 block mb-0.5">
                        No dia da eleição (25/10, das 08h às 17h):
                      </strong>
                      <span>
                        Se estiver fora do seu domicílio eleitoral, justifique preferencialmente pelo app <strong>e-Título</strong> (usando a localização por GPS) ou compareça a qualquer mesa receptora de justificativa nas seções eleitorais com o formulário RJE preenchido e documento oficial com foto.
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">
                        Após o dia da votação (prazo oficial: até 08/01/2027):
                      </strong>
                      <span>
                        O eleitor que não votar nem justificar no domingo do 2º turno tem até <strong>8 de janeiro de 2027</strong> para apresentar a justificativa pelo app e-Título ou pelo portal <strong>Sistema Justifica</strong> do TSE. A justificativa pós-eleição exige obrigatoriamente a apresentação de <strong>documentação comprobatória</strong> que fundamente a ausência (como atestado médico, comprovante de viagem ou escala de trabalho).
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://www.tse.jus.br/servicos-eleitorais/justificativa-eleitoral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <span>Orientações oficiais de Justificativa Eleitoral no TSE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Painel Nacional Oficial (100% Totalizado) */}
        <div className="mb-10">
          <NationalBanner
            dataset={dataset}
            onOpenMethodology={onOpenMethodology}
            selectedCandidateFilter={selectedCandidateFilter}
            onSelectCandidateFilter={onSelectCandidateFilter}
          />
        </div>

        {/* 2. Quadro Individual de Candidatos à Presidência (Fotografias Oficiais e Busca/Filtros) */}
        <div className="mb-12">
          <CandidateResultsView
            dataset={dataset}
            onSelectCandidate={onSelectCandidateFilter}
            selectedCandidateId={selectedCandidateFilter}
          />
        </div>

        {/* 3. Banner Editorial com Fotografia e Regras do 2º Turno */}
        <div className="mb-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8 items-center">
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200/80">
                <img
                  src={EDITORIAL_IMAGES.urna.src}
                  alt={EDITORIAL_IMAGES.urna.alt}
                  className="w-full h-full object-cover"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
                  {EDITORIAL_IMAGES.urna.caption}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Auditoria e Transparência do Sufrágio</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-3">
                Como funciona a convocação do 2º Turno no Brasil?
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                <p>
                  Conforme o <strong className="text-slate-900">&sect; 2º do Artigo 77 da Carta Magna</strong>, se nenhum candidato alcançar mais da metade dos votos válidos nominais no primeiro turno (excluídos brancos e nulos), convoca-se uma nova votação entre os dois concorrentes mais votados.
                </p>
                <p>
                  No pleito de 2026, com 119,3 milhões de votos válidos nominais (119.297.583 votos apurados), <strong className="text-slate-900">Flávio Bolsonaro (47,03%)</strong> e <strong className="text-slate-900">Luiz Inácio Lula da Silva (45,16%)</strong> avançaram para o segundo turno no último domingo de outubro.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenMethodology}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ver critérios constitucionais completos</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Gráficos Comparativos Regionais */}
        <div className="mb-12">
          <RegionalCharts dataset={dataset} />
        </div>

        {/* 4. Notícias e Resoluções sobre o Processo Eleitoral */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Notícias da Cobertura Eleitoral e Atos do TSE
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {electionArticles.length} matérias cadastradas
            </span>
          </div>

          {electionArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {electionArticles.map((art) => (
                <NewsCard
                  key={art.id}
                  article={art}
                  onOpenDetails={onOpenArticleDetails}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Nenhuma matéria da cobertura eleitoral encontrada no momento.
            </div>
          )}
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
