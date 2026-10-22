import React from "react";
import { NewsItem } from "../types/news";
import { EconomySection } from "../components/EconomySection";
import { BolsaSection } from "../components/BolsaSection";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { NewsCard } from "../components/NewsCard";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import { TrendingUp, Landmark, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";

interface EconomiaPageProps {
  articles: NewsItem[];
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const EconomiaPage: React.FC<EconomiaPageProps> = ({
  articles,
  onOpenArticleDetails,
}) => {
  const economiaArticles = articles.filter((a) =>
    ["Economia", "Governo"].includes(a.category) ||
    a.tags?.some((t) => ["Economia", "PIX", "Dólar", "Ibovespa", "Orçamento"].includes(t))
  );

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Economia */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Caderno Especial · Economia &amp; Macroeconomia Brasileira</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Indicadores Econômicos Oficiais do Brasil
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Painel macroeconômico com métricas auditadas diretamente das fontes primárias do Estado brasileiro: IBGE (Sistema SIDRA), Banco Central do Brasil (SGS e PTAX) e B3 (Brasil, Bolsa, Balcão — Ibovespa e cotações públicas com defasagem de 15 minutos).
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Veja também:</span>
            <PortalLink
              route="dados-publicos"
              className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
            >
              Auditoria de Dados Abertos &rarr;
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Execução Orçamentária Federal &rarr;
            </PortalLink>
            <a
              href="https://www.bcb.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Portal do Banco Central</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a
              href="https://b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/cotacoes/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors inline-flex items-center gap-1 font-semibold"
            >
              <span>Cotações B3 (Ibovespa)</span>
              <ExternalLink className="w-3 h-3 text-emerald-700" />
            </a>
          </div>
        </div>

        {/* 1. Componente Completo dos Indicadores Econômicos */}
        <div className="mb-12">
          <EconomySection />
        </div>

        {/* 2. Seção da Bolsa de Valores (B3): Ibovespa, Mais Negociadas, Altas e Baixas */}
        <div className="mb-12">
          <BolsaSection />
        </div>

        {/* 2. Banner Editorial com Contexto sobre Fontes Primárias do Estado */}
        <div className="mb-12 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-6 sm:p-8 items-center">
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200/80">
                <img
                  src={EDITORIAL_IMAGES.economia.src}
                  alt={EDITORIAL_IMAGES.economia.alt}
                  width={640}
                  height={360}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-medium">
                  {EDITORIAL_IMAGES.economia.caption}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Metodologia &amp; Fontes Oficiais</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-3">
                Como os dados econômicos são coletados e auditados?
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                <p>
                  O pipeline de dados do Sociedade Ativa consome exclusivamente os endpoints públicos de dados abertos do governo brasileiro. A inflação é extraída das tabelas oficiais do <strong className="text-slate-900">IBGE SIDRA (Tabela 1737 e Tabela 7060)</strong>, sem projeções ou estimativas privadas.
                </p>
                <p>
                  A taxa de juros básica da economia (<strong className="text-slate-900">Selic Meta</strong>) e a taxa de câmbio comercial de fechamento (<strong className="text-slate-900">Dólar PTAX</strong>) são colhidas diretamente do Sistema SGS do <strong className="text-slate-900">Banco Central do Brasil</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <PortalLink
                  route="sobre"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Conhecer o pipeline de dados</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </PortalLink>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Notícias Econômicas e de Mercado Financeiro */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-black text-slate-900">
              Notícias Econômicas e Atos Fazendários
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {economiaArticles.length} matérias registradas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {economiaArticles.map((art) => (
              <NewsCard
                key={art.id}
                article={art}
                onOpenDetails={onOpenArticleDetails}
              />
            ))}
          </div>
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
