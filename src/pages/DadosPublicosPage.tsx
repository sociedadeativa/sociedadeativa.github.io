import React from "react";
import { ElectionDataSet } from "../data/electionData";
import { RegionalCharts } from "../components/RegionalCharts";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import { Database, ShieldCheck, FileCode, ExternalLink, BarChart3, ArrowRight } from "lucide-react";

interface DadosPublicosPageProps {
  dataset: ElectionDataSet;
  onOpenDataInspector: () => void;
  onOpenMethodology: () => void;
}

export const DadosPublicosPage: React.FC<DadosPublicosPageProps> = ({
  dataset,
  onOpenDataInspector,
  onOpenMethodology,
}) => {
  const publicDataEndpoints = [
    {
      agency: "Tribunal Superior Eleitoral (TSE)",
      name: "Portal de Dados Abertos do TSE & DivulgaCandContas",
      description: "Boletins de Urna (BU), registro de candidaturas, prestação de contas eleitorais e arquivos RDV (Registro Digital do Voto).",
      url: "https://dadosabertos.tse.jus.br",
      format: "JSON, CSV, REST",
    },
    {
      agency: "IBGE (Instituto Brasileiro de Geografia e Estatística)",
      name: "Sistema SIDRA & API de Agregados",
      description: "Pesquisas oficiais do Censo Demográfico, IPCA, PIB trimestral, PNAD Contínua e estatísticas territoriais.",
      url: "https://servicodados.ibge.gov.br/api/docs/agregados?versao=3",
      format: "REST API, JSON",
    },
    {
      agency: "Banco Central do Brasil (BCB)",
      name: "Sistema Gerenciador de Séries Temporais (SGS) & API de Cotações",
      description: "Taxa Selic Over e Meta, cotação diária do Dólar Comercial PTAX, balanço de pagamentos e agregados monetários.",
      url: "https://dadosabertos.bcb.gov.br",
      format: "ODATA, JSON, CSV",
    },
    {
      agency: "Controladoria-Geral da União (CGU)",
      name: "Portal da Transparência do Governo Federal",
      description: "Execução orçamentária da União, transferências constitucionais para estados e municípios, contratos e convênios federais.",
      url: "https://portaldatransparencia.gov.br",
      format: "API REST, CSV",
    },
  ];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Dados Públicos */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
            <Database className="w-4 h-4" />
            <span>Caderno Especial · Jornalismo de Dados, Estatística &amp; Transparência</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Dados Públicos e Séries Estatísticas Oficiais
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Metodologia, auditoria aberta e catálogo de dados governamentais do Brasil. Acesse microdados eleitorais, pesquisas do IBGE, séries do Banco Central e inspecione os arquivos JSON utilizados pelo portal.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <button
              onClick={onOpenDataInspector}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Inspecionar JSON Oficial (TSE)</span>
            </button>
            <button
              onClick={onOpenMethodology}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
            >
              Auditoria &amp; Metodologia &rarr;
            </button>
            <PortalLink
              route="economia"
              className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Painel de Indicadores Macroeconômicos &rarr;
            </PortalLink>
          </div>
        </div>

        {/* 1. Imagem e Manifesto da Transparência */}
        <div className="mb-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8 items-center">
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200/80">
                <img
                  src={EDITORIAL_IMAGES.dadosPublicos.src}
                  alt={EDITORIAL_IMAGES.dadosPublicos.alt}
                  width={640}
                  height={360}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
                  {EDITORIAL_IMAGES.dadosPublicos.caption}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Lei de Acesso à Informação (Lei 12.527/2011)</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-3">
                Compromisso com o Sufrágio Auditável e Dados Abertos
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                <p>
                  O Sociedade Ativa atua estritamente na compilação, normalização e visualização de dados produzidos por órgãos oficiais do Estado brasileiro. Não aplicamos estimativas subjetivas nem dados amostrais não identificados.
                </p>
                <p>
                  Qualquer cidadão, pesquisador ou veículo de comunicação pode inspecionar os esquemas JSON originais, comparar os Boletins de Urna com a totalização do TSE e auditar os números apresentados.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenDataInspector}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Abrir visualizador do JSON do TSE</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Visualizações Estatísticas Comparativas */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Visualização de Agregados Eleitorais por Região
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Comparações de volume de votos válidos nominais e desvios de comparecimento eleitoral.
            </p>
          </div>
          <RegionalCharts dataset={dataset} />
        </div>

        {/* 3. Diretório de APIs Oficiais do Governo Federal */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Diretório de APIs e Endpoints Primários do Brasil
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Links diretos para as fontes públicas primárias que alimentam os gráficos e painéis deste portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicDataEndpoints.map((ep) => (
              <div
                key={ep.name}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                      {ep.agency}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {ep.format}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                    {ep.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {ep.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={ep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                  >
                    <span>Acessar portal oficial da agência</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
