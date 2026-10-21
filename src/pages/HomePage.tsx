import React, { useMemo, useState } from "react";
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
import { ArrowRight, MapPin, Trophy, Clock } from "lucide-react";
import { sortNewsItems, deduplicateNewsItems, isValidImageUrl } from "../services/newsService";

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

const SportsNewsCard: React.FC<{
  article: NewsItem;
  onOpenArticleDetails: (article: NewsItem) => void;
}> = ({ article, onOpenArticleDetails }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <article
      onClick={() => onOpenArticleDetails(article)}
      className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div>
        {article.imageUrl && !imageError && isValidImageUrl(article.imageUrl) && (
          <div className="mb-3.5 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] relative">
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <span className="font-bold uppercase tracking-wider text-emerald-700">
            {article.category || "Esportes"}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{article.publishedAt}</span>
          </span>
        </div>

        <h3 className="font-heading font-black text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>

        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      </div>

      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
          {article.source}
        </span>
        <span className="font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1">
          <span>Ler notícia</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </article>
  );
};

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

  const sportsArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    const filtered = articles.filter(
      (a) =>
        (a.category as string) === "Esportes" ||
        a.tags?.some((t) => ["Esportes", "Futebol"].includes(t))
    );
    return sortNewsItems(deduplicateNewsItems(filtered));
  }, [articles]);

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
        <NewsSection
          articles={articles}
          onOpenArticleDetails={onOpenArticleDetails}
        />
      </div>

      {/* 9. Preview do Caderno de Esportes */}
      <section id="esportes-preview" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                <span>Caderno de Esportes · Cobertura &amp; Modalidades</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Esportes &amp; Competições Nacionais
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Acompanhe as notícias apuradas do esporte brasileiro pela Agência Brasil e fontes oficiais, com cobertura de modalidades e competições.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <PortalLink
                route="esportes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-100/70 transition-colors shadow-xs"
              >
                <span>Ver caderno completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </PortalLink>
            </div>
          </div>

          {sportsArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsArticles.slice(0, 3).map((art) => (
                <SportsNewsCard
                  key={art.id}
                  article={art}
                  onOpenArticleDetails={onOpenArticleDetails}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                Nenhuma notícia esportiva oficial disponível no momento
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
                Novas reportagens esportivas apuradas pela Agência Brasil e fontes oficiais serão exibidas aqui automaticamente assim que publicadas.
              </p>
              <PortalLink
                route="esportes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-colors"
              >
                <span>Acessar Caderno de Esportes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          )}

          {/* Rodapé da Seção com Link Direto */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Acesse a central com cobertura esportiva, modalidades e caderno dedicado.</span>
            </div>
            <PortalLink
              route="esportes"
              className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Ir para a Central de Esportes</span>
              <ArrowRight className="w-3 h-3" />
            </PortalLink>
          </div>
        </div>
      </section>

      {/* 10. Tabela Geral de Resultados por Estado (26 Estados + DF) */}
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
