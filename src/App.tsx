import React, { useState, Suspense, lazy } from "react";
import { DATASET_2026, ElectionDataSet } from "./data/electionData";
import { OFFICIAL_NEWS_ARTICLES } from "./data/newsData";
import { useNews } from "./hooks/useNews";
import { useEconomy } from "./hooks/useEconomy";
import { usePortalRoute } from "./hooks/usePortalRoute";
import { NewsItem } from "./types/news";

// Componentes Globais de Layout
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// Páginas Dedicadas do Portal com Divisão em Chunks (Route-Level Code Splitting)
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PoliticaPage = lazy(() => import("./pages/PoliticaPage").then((m) => ({ default: m.PoliticaPage })));
const EleicoesPage = lazy(() => import("./pages/EleicoesPage").then((m) => ({ default: m.EleicoesPage })));
const EconomiaPage = lazy(() => import("./pages/EconomiaPage").then((m) => ({ default: m.EconomiaPage })));
const EstadosPage = lazy(() => import("./pages/EstadosPage").then((m) => ({ default: m.EstadosPage })));
const DadosPublicosPage = lazy(() => import("./pages/DadosPublicosPage").then((m) => ({ default: m.DadosPublicosPage })));
const NoticiasPage = lazy(() => import("./pages/NoticiasPage").then((m) => ({ default: m.NoticiasPage })));
const EsportesPage = lazy(() => import("./pages/EsportesPage").then((m) => ({ default: m.EsportesPage })));
const TecnologiaPage = lazy(() => import("./pages/TecnologiaPage").then((m) => ({ default: m.TecnologiaPage })));
const ClimaPage = lazy(() => import("./pages/ClimaPage").then((m) => ({ default: m.ClimaPage })));
const SobrePage = lazy(() => import("./pages/SobrePage").then((m) => ({ default: m.SobrePage })));
const ArticlePage = lazy(() => import("./pages/ArticlePage").then((m) => ({ default: m.ArticlePage })));

// Modais e Painéis Carregados Sob Demanda (Zero impacto no carregamento inicial)
const StateDetailPanel = lazy(() => import("./components/StateDetailPanel").then((m) => ({ default: m.StateDetailPanel })));
const MethodologyModal = lazy(() => import("./components/MethodologyModal").then((m) => ({ default: m.MethodologyModal })));
const DataInspectorModal = lazy(() => import("./components/DataInspectorModal").then((m) => ({ default: m.DataInspectorModal })));
const SearchModal = lazy(() => import("./components/SearchModal").then((m) => ({ default: m.SearchModal })));
const ArticleModal = lazy(() => import("./components/ArticleModal").then((m) => ({ default: m.ArticleModal })));

const PageLoadingFallback: React.FC = () => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-busy="true" aria-label="Carregando seção do portal">
    <div className="h-5 w-32 bg-slate-200 rounded-md mb-3" />
    <div className="h-9 w-2/3 max-w-xl bg-slate-200 rounded-lg mb-4" />
    <div className="h-4 w-1/2 max-w-md bg-slate-200 rounded-md mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64 bg-slate-200/80 rounded-2xl" />
      <div className="h-64 bg-slate-200/80 rounded-2xl" />
      <div className="h-64 bg-slate-200/80 rounded-2xl" />
    </div>
  </div>
);

export default function App() {
  const [currentDataset, setCurrentDataset] = useState<ElectionDataSet>(DATASET_2026);
  const [selectedStateUf, setSelectedStateUf] = useState<string | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<string | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isDataInspectorOpen, setIsDataInspectorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  // Hook de Rota do Portal (Início, Política, Eleições, Economia, Estados, Dados Públicos, Notícias, Sobre, Artigo)
  const { currentRoute, articleId, goTo, goToArticle } = usePortalRoute();

  // Hooks de Dados (Notícias e Indicadores Econômicos Oficiais)
  const { articles, loading: isNewsLoading, error: newsError, refreshNews } = useNews({ initialArticles: OFFICIAL_NEWS_ARTICLES });
  const { indicators } = useEconomy();

  // Atualização customizada via JSON do TSE
  const handleUpdateDataset = (customDataset: ElectionDataSet) => {
    setCurrentDataset(customDataset);
    setCandidateFilter(null);
  };

  // Restaurar dados padrão de 2026
  const handleResetToDefault = () => {
    setCurrentDataset(DATASET_2026);
    setCandidateFilter(null);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* 1. Barra Superior Editorial e Navegação Thematic Menu */}
      <Header
        dataset={currentDataset}
        currentRoute={currentRoute}
        indicators={indicators}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenDataInspector={() => setIsDataInspectorOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Conteúdo Principal Orientado a Rota com Suspense */}
      <main className="flex-1 w-full overflow-x-hidden">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentRoute === "home" && (
            <HomePage
              dataset={currentDataset}
              articles={articles}
              isLoading={isNewsLoading}
              error={newsError}
              onRetry={refreshNews}
              selectedStateUf={selectedStateUf}
              candidateFilter={candidateFilter}
              onSelectState={(uf) => setSelectedStateUf(uf)}
              onSelectCandidateFilter={(id) => setCandidateFilter(id)}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "politica" && (
            <PoliticaPage
              articles={articles}
              isLoading={isNewsLoading}
              error={newsError}
              onRetry={refreshNews}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "eleicoes" && (
            <EleicoesPage
              dataset={currentDataset}
              articles={articles}
              selectedCandidateFilter={candidateFilter}
              onSelectCandidateFilter={(id) => setCandidateFilter(id)}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "economia" && (
            <EconomiaPage
              articles={articles}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "estados" && (
            <EstadosPage
              dataset={currentDataset}
              selectedStateUf={selectedStateUf}
              candidateFilter={candidateFilter}
              onSelectState={(uf) => setSelectedStateUf(uf)}
              onSelectCandidateFilter={(id) => setCandidateFilter(id)}
            />
          )}

          {currentRoute === "dados-publicos" && (
            <DadosPublicosPage
              dataset={currentDataset}
              onOpenDataInspector={() => setIsDataInspectorOpen(true)}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}

          {currentRoute === "noticias" && (
            <NoticiasPage
              initialArticles={articles}
              isLoading={isNewsLoading}
              error={newsError}
              onRetry={refreshNews}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "esportes" && (
            <EsportesPage
              articles={articles}
              isLoading={isNewsLoading}
              error={newsError}
              onRetry={refreshNews}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "tecnologia" && (
            <TecnologiaPage
              articles={articles}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "clima" && (
            <ClimaPage
              articles={articles}
              onOpenArticleDetails={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "artigo" && (
            <ArticlePage
              article={
                articles.find((a) => a.id === articleId) ||
                OFFICIAL_NEWS_ARTICLES.find((a) => a.id === articleId) || {
                  id: articleId || "noticia",
                  title: "Notícia Oficial",
                  summary: "Acompanhe as apurações e dados oficiais no portal Sociedade Ativa.",
                  source: "Sociedade Ativa",
                  sourceUrl: "https://sociedadeativa.github.io/noticias/",
                  articleUrl: "https://sociedadeativa.github.io/noticias/",
                  publishedAt: "13/10/2026",
                  category: "Brasil" as const,
                }
              }
              allArticles={articles}
              onNavigateBack={() => goTo("noticias")}
              onSelectArticle={(art) => goToArticle(art.id)}
            />
          )}

          {currentRoute === "sobre" && (
            <SobrePage
              onOpenDataInspector={() => setIsDataInspectorOpen(true)}
              onOpenMethodology={() => setIsMethodologyOpen(true)}
            />
          )}
        </Suspense>
      </main>

      {/* 3. Painel Lateral com Detalhamento do Estado Selecionado (Carregamento Sob Demanda) */}
      {selectedStateUf && (
        <Suspense fallback={null}>
          <StateDetailPanel
            dataset={currentDataset}
            uf={selectedStateUf}
            onClose={() => setSelectedStateUf(null)}
            onSelectState={(uf) => setSelectedStateUf(uf)}
          />
        </Suspense>
      )}

      {/* 4. Modal de Metodologia Oficial e Transparência Eleitoral (Carregamento Sob Demanda) */}
      {isMethodologyOpen && (
        <Suspense fallback={null}>
          <MethodologyModal
            dataset={currentDataset}
            isOpen={isMethodologyOpen}
            onClose={() => setIsMethodologyOpen(false)}
          />
        </Suspense>
      )}

      {/* 5. Modal de Inspeção e Ingestão de Dados JSON do TSE (Carregamento Sob Demanda) */}
      {isDataInspectorOpen && (
        <Suspense fallback={null}>
          <DataInspectorModal
            dataset={currentDataset}
            isOpen={isDataInspectorOpen}
            onClose={() => setIsDataInspectorOpen(false)}
            onUpdateDataset={handleUpdateDataset}
            onResetToDefault={handleResetToDefault}
          />
        </Suspense>
      )}

      {/* 6. Modal de Busca Rápida e Navegação (Carregamento Sob Demanda) */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            news={articles}
            dataset={currentDataset}
            indicators={indicators}
            onSelectArticle={(art) => goToArticle(art.id)}
            onSelectState={(uf) => setSelectedStateUf(uf)}
          />
        </Suspense>
      )}

      {/* 7. Modal de Leitura de Matéria e Compartilhamento (Carregamento Sob Demanda) */}
      {activeArticle && (
        <Suspense fallback={null}>
          <ArticleModal
            article={activeArticle}
            onClose={() => setActiveArticle(null)}
          />
        </Suspense>
      )}

      {/* 8. Rodapé Editorial do Portal em Português */}
      <Footer
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenDataInspector={() => setIsDataInspectorOpen(true)}
      />
    </div>
  );
}
