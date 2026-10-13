import React from "react";
import { ElectionDataSet } from "../data/electionData";
import { NewsItem } from "../types/news";
import { FeaturedEditorial } from "../components/FeaturedEditorial";
import { NationalBanner } from "../components/NationalBanner";
import { BrazilMap } from "../components/BrazilMap";
import { RegionalCharts } from "../components/RegionalCharts";
import { NewsSection } from "../components/NewsSection";
import { EconomySection } from "../components/EconomySection";
import { BolsaSection } from "../components/BolsaSection";
import { StateTable } from "../components/StateTable";
import { AdBanner } from "../components/AdBanner";
import { PortalLink } from "../components/PortalLink";
import { ArrowRight, MapPin, TrendingUp, Newspaper, Landmark } from "lucide-react";

interface HomePageProps {
  dataset: ElectionDataSet;
  articles: NewsItem[];
  selectedStateUf: string | null;
  candidateFilter: string | null;
  onSelectState: (uf: string | null) => void;
  onSelectCandidateFilter: (id: string | null) => void;
  onOpenMethodology: () => void;
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  dataset,
  articles,
  selectedStateUf,
  candidateFilter,
  onSelectState,
  onSelectCandidateFilter,
  onOpenMethodology,
  onOpenArticleDetails,
}) => {
  const activeFilteredCandidate = dataset.candidates.find(
    (c) => c.id === candidateFilter
  );

  return (
    <div className="space-y-0">
      {/* 1. Destaques Editoriais do Portal (Salience Tier 1 & 2 + Radar Cívico) */}
      <FeaturedEditorial
        articles={articles}
        onOpenArticleDetails={onOpenArticleDetails}
      />

      {/* 2. Painel Nacional das Eleições 2026 (Apuração 1º Turno) */}
      <div id="eleicoes-nacional">
        <NationalBanner
          dataset={dataset}
          onOpenMethodology={onOpenMethodology}
          selectedCandidateFilter={candidateFilter}
          onSelectCandidateFilter={onSelectCandidateFilter}
        />
      </div>

      {/* 3. Espaço Publicitário Superior */}
      <AdBanner format="leaderboard" />

      {/* 4. Seção do Mapa Interativo de Votação (Brasil por Estado) */}
      <section id="mapa-brasil" className="py-8 sm:py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Geografia Eleitoral · 26 Estados e Distrito Federal</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Mapa Interativo de Votação por Estado
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Navegue pelas unidades da federação para conferir o resultado oficial do 1º turno, margem de vitória, votos nominais e comparecimento eleitoral.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeFilteredCandidate && (
                <div className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span>Filtro ativo:</span>
                  <strong className="font-extrabold text-slate-900">
                    {activeFilteredCandidate.popularName}
                  </strong>
                  <button
                    onClick={() => onSelectCandidateFilter(null)}
                    className="ml-1 text-slate-500 hover:text-slate-900 font-black cursor-pointer text-sm"
                    title="Remover filtro"
                  >
                    &times;
                  </button>
                </div>
              )}

              <PortalLink
                route="estados"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <span>Ver página dedicada aos estados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          </div>

          {/* Componente do Mapa SVG com Controles */}
          <BrazilMap
            dataset={dataset}
            selectedStateUf={selectedStateUf}
            onSelectState={(uf) => onSelectState(uf)}
            candidateFilter={candidateFilter}
            onSelectCandidateFilter={onSelectCandidateFilter}
          />
        </div>
      </section>

      {/* 5. Gráficos Comparativos Regionais e Estados Decisivos */}
      <RegionalCharts dataset={dataset} />

      {/* 6. Seção de Economia: Indicadores Oficiais IBGE e Banco Central + Bolsa de Valores (B3) */}
      <div id="indicadores-economia">
        <EconomySection />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12">
          <BolsaSection />
        </div>
      </div>

      {/* 7. Espaço Publicitário In-Feed */}
      <AdBanner format="in-feed" />

      {/* 8. Seção de Notícias e Análises Jornalísticas */}
      <div id="cobertura-noticias">
        <NewsSection articles={articles} />
      </div>

      {/* 9. Tabela Geral de Resultados por Estado (26 Estados + DF) */}
      <div id="tabela-apuracao-estados">
        <StateTable
          dataset={dataset}
          selectedStateUf={selectedStateUf}
          onSelectState={(uf) => onSelectState(uf)}
        />
      </div>
    </div>
  );
};
