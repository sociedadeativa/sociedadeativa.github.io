import React from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { Clock, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { PortalLink } from "./PortalLink";
import { PortalRoute } from "../utils/router";

interface FeaturedEditorialProps {
  articles: NewsItem[];
  onOpenArticleDetails: (article: NewsItem) => void;
}

export const FeaturedEditorial: React.FC<FeaturedEditorialProps> = ({
  articles,
  onOpenArticleDetails,
}) => {
  // Configuração editorial: definir ID de artigo para fixar manualmente, ou null para seleção dinâmica automática
  const PINNED_LEAD_ARTICLE_ID: string | null = null;

  const validArticles = Array.isArray(articles) ? articles : [];

  // Encontra artigo principal (Lead): prioriza fixação intencional, depois o mais recente (articles[0])
  const pinnedArticle = PINNED_LEAD_ARTICLE_ID
    ? validArticles.find((a) => a.id === PINNED_LEAD_ARTICLE_ID)
    : null;
  const leadArticle = pinnedArticle || validArticles[0] || null;

  // Remove o lead selecionado da lista restante para evitar qualquer sobreposição
  const remainingArticles = leadArticle
    ? validArticles.filter((a) => a.id !== leadArticle.id)
    : validArticles;

  // Destaques secundários (3 matérias) e Radar Cívico (5 matérias seguintes) sem sobreposição
  const secondaryArticles = remainingArticles.slice(0, 3);
  const civicWireArticles = remainingArticles.slice(3, 8);

  // Tratamento da imagem da matéria principal com suporte a imagem do artigo e fallback editorial
  const hasValidArticleImage = Boolean(
    leadArticle?.imageUrl && leadArticle.imageUrl.trim().startsWith("https://")
  );

  const leadImageSrc = hasValidArticleImage
    ? leadArticle!.imageUrl!
    : EDITORIAL_IMAGES.congresso.src;

  const leadImageAlt = hasValidArticleImage
    ? (leadArticle!.imageAlt || leadArticle!.title)
    : EDITORIAL_IMAGES.congresso.alt;

  let leadImageCaption = EDITORIAL_IMAGES.congresso.caption;
  if (hasValidArticleImage && leadArticle) {
    if (leadArticle.imageCaption && leadArticle.imageCredit) {
      leadImageCaption = `${leadArticle.imageCaption} (${leadArticle.imageCredit})`;
    } else if (leadArticle.imageCaption) {
      leadImageCaption = leadArticle.imageCaption;
    } else if (leadArticle.imageCredit) {
      leadImageCaption = `Foto: ${leadArticle.imageCredit}`;
    } else {
      leadImageCaption = leadArticle.title || EDITORIAL_IMAGES.congresso.caption;
    }
  }

  return (
    <section className="py-8 sm:py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tópicos em Destaque (Civic Topics Ribbon) */}
        <div className="flex items-center gap-2 pb-5 mb-6 border-b border-slate-100 overflow-x-auto scrollbar-none text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] shrink-0 mr-1">
            Em Foco:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <PortalLink
              route="eleicoes"
              className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 transition-colors"
            >
              Apuração Presidencial 2026
            </PortalLink>
            <PortalLink
              route="economia"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 font-semibold hover:bg-emerald-100 transition-colors"
            >
              Inflação IPCA &amp; Meta Selic
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-900 font-semibold hover:bg-red-100 transition-colors"
            >
              Renovação do Congresso
            </PortalLink>
            <PortalLink
              route="estados"
              className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition-colors"
            >
              Colégios Eleitorais Estaduais
            </PortalLink>
            <PortalLink
              route="dados-publicos"
              className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 font-semibold hover:bg-purple-100 transition-colors"
            >
              Auditoria dos Boletins de Urna
            </PortalLink>
          </div>
        </div>

        {/* Grade Editorial Principal: Lead Story + Destaques Secundários + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Coluna 1 & 2: Lead Story (7 colunas no desktop) */}
          {leadArticle && (
            <div className="lg:col-span-7 flex flex-col justify-between">
              <article
                onClick={() => onOpenArticleDetails(leadArticle)}
                className="group cursor-pointer flex flex-col h-full"
              >
                {/* Imagem Editorial de Alta Definição */}
                <div className="relative rounded-2xl overflow-hidden mb-5 bg-slate-100 aspect-16/9 shadow-xs border border-slate-200/80">
                  <img
                    src={leadImageSrc}
                    alt={leadImageAlt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white text-[11px] font-medium flex items-center justify-between">
                    <span className="opacity-90">{leadImageCaption}</span>
                    <span className="hidden sm:inline bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      Fotojornalismo
                    </span>
                  </div>
                </div>

                {/* Metadados e Kicker Editorial */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                  <span className="text-red-700 font-bold uppercase tracking-wider text-[11px]">
                    {leadArticle.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.publishedAt}</span>
                  {leadArticle.readTime && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle.readTime}</span>
                    </>
                  )}
                </div>

                {/* Manchete Principal */}
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 leading-tight group-hover:text-blue-900 transition-colors mb-3 text-balance">
                  {leadArticle.title}
                </h1>

                {/* Lead / Subtítulo */}
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
                  {leadArticle.summary}
                </p>

                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 group-hover:text-blue-700 mt-auto pt-2">
                  <span>Ler cobertura completa e dados da totalização</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </article>
            </div>
          )}

          {/* Coluna 3: Destaques Secundários e Radar Brasil (5 colunas no desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-slate-100">
            {/* Bloco de Notícias Secundárias */}
            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Destaques Editoriais
                </span>
                <PortalLink
                  route="noticias"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Ver todas as notícias &rarr;
                </PortalLink>
              </div>

              {secondaryArticles.map((art, idx) => {
                const categoryColorMap: Record<string, string> = {
                  Eleições: "text-blue-700",
                  Economia: "text-emerald-700",
                  Política: "text-red-700",
                  Congresso: "text-amber-800",
                  Justiça: "text-purple-700",
                };
                const catColor = categoryColorMap[art.category] || "text-slate-700";

                return (
                  <article
                    key={art.id}
                    onClick={() => onOpenArticleDetails(art)}
                    className="group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5 font-medium">
                      <span className={`font-bold uppercase tracking-wider ${catColor}`}>
                        {art.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{art.source}</span>
                      <span aria-hidden="true">·</span>
                      <span>{art.publishedAt.split(" às ")[0]}</span>
                    </div>

                    <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors mb-1.5 text-balance">
                      {art.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Radar Cívico / Boletim em Tempo Real */}
            <div className="pt-6">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    <span>Radar Cívico · Despachos Oficiais</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    Hoje
                  </span>
                </div>

                <ul className="space-y-3 text-xs">
                  {civicWireArticles.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => onOpenArticleDetails(item)}
                      className="group cursor-pointer hover:text-blue-900 transition-colors flex items-start gap-2"
                    >
                      <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                      <div className="min-w-0">
                        <span className="text-slate-800 font-medium group-hover:text-blue-900 leading-snug line-clamp-2">
                          {item.title}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          <span>{item.source}</span>
                          <span className="mx-1" aria-hidden="true">·</span>
                          <span>{item.publishedAt.includes(" às ") ? item.publishedAt.split(" às ")[1] : item.publishedAt}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
