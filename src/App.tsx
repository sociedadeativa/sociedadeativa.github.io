import React, { useState } from "react";
import { DATASET_2026, ElectionDataSet } from "./data/electionData";
import { OFFICIAL_NEWS_ARTICLES } from "./data/newsData";
import { useNews } from "./hooks/useNews";
import { useEconomy } from "./hooks/useEconomy";
import { usePortalRoute } from "./hooks/usePortalRoute";
import { NewsItem } from "./types/news";

// Componentes Globais de Layout
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// Páginas Dedicadas do Portal
import { HomePage } from "./pages/HomePage";
import { PoliticaPage } from "./pages/PoliticaPage";
import { EleicoesPage } from "./pages/EleicoesPage";
import { EconomiaPage } from "./pages/EconomiaPage";
import { EstadosPage } from "./pages/EstadosPage";
import { DadosPublicosPage } from "./pages/DadosPublicosPage";
import { NoticiasPage } from "./pages/NoticiasPage";
import { EsportesPage } from "./pages/EsportesPage";
import { ClimaPage } from "./pages/ClimaPage";
import { SobrePage } from "./pages/SobrePage";
import { ArticlePage } from "./pages/ArticlePage";

// Modais e Painéis
import { StateDetailPanel } from "./components/StateDetailPanel";
import { MethodologyModal } from "./components/MethodologyModal";
import { DataInspectorModal } from "./components/DataInspectorModal";
import { SearchModal } from "./components/SearchModal";
import { ArticleModal } from "./components/ArticleModal";

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
  const { articles } = useNews({ initialArticles: OFFICIAL_NEWS_ARTICLES });
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

      {/* 2. Conteúdo Principal Orientado a Rota */}
      <main className="flex-1 w-full overflow-x-hidden">
        {currentRoute === "home" && (
          <HomePage
            dataset={currentDataset}
            articles={articles}
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
            onOpenArticleDetails={(art) => goToArticle(art.id)}
          />
        )}

        {currentRoute === "esportes" && (
          <EsportesPage
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
      </main>

      {/* 3. Painel Lateral com Detalhamento do Estado Selecionado */}
      <StateDetailPanel
        dataset={currentDataset}
        uf={selectedStateUf}
        onClose={() => setSelectedStateUf(null)}
        onSelectState={(uf) => setSelectedStateUf(uf)}
      />

      {/* 4. Modal de Metodologia Oficial e Transparência Eleitoral */}
      <MethodologyModal
        dataset={currentDataset}
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* 5. Modal de Inspeção e Ingestão de Dados JSON do TSE */}
      <DataInspectorModal
        dataset={currentDataset}
        isOpen={isDataInspectorOpen}
        onClose={() => setIsDataInspectorOpen(false)}
        onUpdateDataset={handleUpdateDataset}
        onResetToDefault={handleResetToDefault}
      />

      {/* 6. Modal de Busca Rápida e Navegação */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        news={articles}
        dataset={currentDataset}
        indicators={indicators}
        onSelectArticle={(art) => goToArticle(art.id)}
        onSelectState={(uf) => setSelectedStateUf(uf)}
      />

      {/* 7. Modal de Leitura de Matéria e Compartilhamento */}
      <ArticleModal
        article={activeArticle}
        onClose={() => setActiveArticle(null)}
      />

      {/* 8. Rodapé Editorial do Portal em Português */}
      <Footer
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenDataInspector={() => setIsDataInspectorOpen(true)}
      />
    </div>
  );
}
