import React, { useMemo, useState, useEffect } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { Clock, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { PortalLink } from "./PortalLink";
import { PortalRoute } from "../utils/router";
import { sortNewsItems, deduplicateNewsItems, isValidImageUrl } from "../services/newsService";

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
  const [leadImageError, setLeadImageError] = useState(false);

  // Garante ordenação cronológica decrescente estrita (mais recente primeiro) e ausência de duplicatas
  const validArticles = useMemo(() => {
    return sortNewsItems(deduplicateNewsItems(Array.isArray(articles) ? articles : []));
  }, [articles]);

  // Encontra artigo principal (Lead): prioriza fixação intencional, depois o mais recente (articles[0])
  const pinnedArticle = PINNED_LEAD_ARTICLE_ID
    ? validArticles.find((a) => a.id === PINNED_LEAD_ARTICLE_ID)
    : null;
  const leadArticle = pinnedArticle || validArticles[0] || null;

  // Reseta estado de erro se o artigo principal mudar
  useEffect(() => {
    setLeadImageError(false);
  }, [leadArticle?.id, leadArticle?.imageUrl]);

  // Remove o lead selecionado da lista restante para evitar qualquer sobreposição
  const remainingArticles = leadArticle
    ? validArticles.filter((a) => a.id !== leadArticle.id)
    : validArticles;

  // Destaques secundários (3 matérias) e Radar Cívico (5 matérias seguintes) sem sobreposição
  const secondaryArticles = remainingArticles.slice(0, 3);
  const civicWireArticles = remainingArticles.slice(3, 8);

  // Tratamento da imagem da matéria principal: prioriza fotojornalismo original comprovado
  const hasValidArticleImage = Boolean(
    leadArticle?.imageUrl && isValidImageUrl(leadArticle.imageUrl)
  );

  const categoryFallbackMap: Record<string, typeof EDITORIAL_IMAGES.congresso> = {
    Eleições: EDITORIAL_IMAGES.urna,
    Economia: EDITORIAL_IMAGES.economia,
    Brasil: EDITORIAL_IMAGES.dadosPublicos,
    Congresso: EDITORIAL_IMAGES.congresso,
    Política: EDITORIAL_IMAGES.congresso,
    Governo: EDITORIAL_IMAGES.congresso,
    Justiça: EDITORIAL_IMAGES.congresso,
    Mundo: EDITORIAL_IMAGES.congresso,
  };
  const institutionalFallback = categoryFallbackMap[leadArticle?.category || ""] || EDITORIAL_IMAGES.congresso;

  const isUsingOriginalPhoto = Boolean(hasValidArticleImage && !leadImageError);

  const leadImageSrc = isUsingOriginalPhoto
    ? leadArticle!.imageUrl!
    : institutionalFallback.src;

  const leadImageAlt = isUsingOriginalPhoto
    ? (leadArticle!.imageAlt || leadArticle!.title)
    : institutionalFallback.alt;

  let leadImageCaption = institutionalFallback.caption;
  if (isUsingOriginalPhoto && leadArticle) {
    if (leadArticle.imageCaption && leadArticle.imageCredit) {
      leadImageCaption = `${leadArticle.imageCaption} (${leadArticle.imageCredit})`;
    } else if (leadArticle.imageCaption) {
      leadImageCaption = leadArticle.imageCaption;
    } else if (leadArticle.imageCredit) {
      leadImageCaption = `Foto: ${leadArticle.imageCredit}`;
    } else {
      leadImageCaption = leadArticle.title || institutionalFallback.caption;
    }
  }

  // Mapa de estilos sutis para badges com tipografia navy consistente (text-slate-900)
  const categoryBadgeMap: Record<string, { bg: string; border: string }> = {
    Eleições: { bg: "bg-blue-50/80", border: "border-blue-200/70" },
    Economia: { bg: "bg-emerald-50/80", border: "border-emerald-200/70" },
    Política: { bg: "bg-rose-50/80", border: "border-rose-200/70" },
    Congresso: { bg: "bg-amber-50/80", border: "border-amber-200/70" },
    Justiça: { bg: "bg-indigo-50/80", border: "border-indigo-200/70" },
    Governo: { bg: "bg-slate-100", border: "border-slate-200/80" },
    Brasil: { bg: "bg-cyan-50/80", border: "border-cyan-200/70" },
    Mundo: { bg: "bg-stone-100", border: "border-stone-200/80" },
    Esportes: { bg: "bg-emerald-50/80", border: "border-emerald-200/70" },
    Tecnologia: { bg: "bg-sky-50/80", border: "border-sky-200/70" },
  };

  const getCategoryBadgeClass = (category: string, isSmall = false) => {
    const badge = categoryBadgeMap[category] || { bg: "bg-slate-100", border: "border-slate-200/80" };
    const size = isSmall ? "text-[10px]" : "text-[11px]";
    return `inline-flex items-center px-2 py-0.5 rounded ${size} font-bold tracking-wider uppercase border text-slate-900 ${badge.bg} ${badge.border}`;
  };

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

        {/* Grade Editorial Principal: Lead Story + Destaques Secundários Separados */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Coluna Principal: Matéria Líder com Imagem Horizontal e Destaque Editorial */}
          {leadArticle && (
            <div className="md:col-span-7 flex flex-col">
              <article
                onClick={() => onOpenArticleDetails(leadArticle)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Imagem Editorial de Alta Definição (Horizontal Lead-Story Image com enquadramento 16:9) */}
                <div className="relative rounded-2xl overflow-hidden mb-4 bg-slate-100 aspect-[16/9] shadow-xs border border-slate-200/80">
                  <img
                    src={leadImageSrc}
                    alt={leadImageAlt}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={() => setLeadImageError(true)}
                  />
                  {/* Gradiente de alto contraste preservando a composição e visibilidade da foto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
                  
                  {/* Legenda e Crédito da Foto com tipografia ampliada e contraste absoluto */}
                  <div className="absolute bottom-0 inset-x-0 p-3 sm:px-4 sm:py-3 text-white flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-medium text-white leading-snug line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] tracking-normal">
                        {leadImageCaption}
                      </p>
                    </div>
                    <span className="shrink-0 hidden sm:inline-flex items-center bg-slate-950/85 border border-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded text-[11px] text-white uppercase font-bold tracking-wider shadow-xs">
                      {isUsingOriginalPhoto ? "Fotojornalismo" : "Institucional"}
                    </span>
                  </div>
                </div>

                {/* Metadados e Kicker Editorial Padronizado (Cores Sutis + Tipografia Navy) */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                  <span className={getCategoryBadgeClass(leadArticle.category)}>
                    {leadArticle.category}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-700 font-medium">{leadArticle.source}</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{leadArticle.publishedAt}</span>
                  {leadArticle.readTime && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{leadArticle.readTime}</span>
                    </>
                  )}
                </div>

                {/* Manchete Principal (Dominant Visual Anchor) */}
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 leading-tight sm:leading-[1.18] group-hover:text-blue-900 transition-colors mb-2.5 sm:mb-3 text-balance break-words">
                  {leadArticle.title}
                </h1>

                {/* Lead / Subtítulo */}
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-3 sm:mb-4 break-words">
                  {leadArticle.summary}
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-900 group-hover:text-blue-700 transition-colors pt-2 border-t border-slate-100 sm:border-0 sm:pt-0">
                  <span>Ler cobertura completa e dados da totalização</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </article>
            </div>
          )}

          {/* Coluna Separada: Destaques Secundários e Radar Cívico */}
          <div className="md:col-span-5 flex flex-col pt-8 border-t border-slate-200 md:pt-0 md:border-t-0 md:border-l md:border-slate-200 md:pl-6 lg:pl-8 xl:pl-10 space-y-6">
            {/* Bloco de Notícias Secundárias com Hierarquia Visual Clara */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-blue-900 rounded-xs" />
                  <span className="font-heading text-xs font-black uppercase tracking-wider text-slate-900">
                    Destaques Editoriais
                  </span>
                </div>
                <PortalLink
                  route="noticias"
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <span>Ver todas</span>
                  <span aria-hidden="true">&rarr;</span>
                </PortalLink>
              </div>

              <div className="divide-y divide-slate-100">
                {secondaryArticles.map((art) => (
                  <article
                    key={art.id}
                    onClick={() => onOpenArticleDetails(art)}
                    className="group cursor-pointer py-3.5 first:pt-1 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 mb-1.5 font-medium">
                      <span className={getCategoryBadgeClass(art.category, true)}>
                        {art.category}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="text-slate-700 font-medium truncate max-w-[140px] sm:max-w-none">{art.source}</span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{art.publishedAt.split(" às ")[0]}</span>
                    </div>

                    <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors mb-1.5 text-balance break-words">
                      {art.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed break-words">
                      {art.summary}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* Radar Cívico / Boletim em Tempo Real com Linha do Tempo Vertical Sutil */}
            <div className="pt-2">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60">
                  <span className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                    <span>Radar Cívico · Despachos Oficiais</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200/70">
                    Hoje
                  </span>
                </div>

                {civicWireArticles.length > 0 ? (
                  <ol className="relative ml-0.5 space-y-0">
                    {civicWireArticles.map((item, idx) => {
                      const isLast = idx === civicWireArticles.length - 1;
                      const timeString = item.publishedAt.includes(" às ")
                        ? item.publishedAt.split(" às ")[1]
                        : item.publishedAt;

                      return (
                        <li
                          key={item.id}
                          onClick={() => onOpenArticleDetails(item)}
                          className="group relative pl-5 pb-3.5 last:pb-0 cursor-pointer"
                        >
                          {/* Linha vertical conectando os nós da timeline */}
                          {!isLast && (
                            <div
                              className="absolute left-[3px] top-2.5 bottom-0 w-px bg-slate-200 group-hover:bg-blue-300 transition-colors"
                              aria-hidden="true"
                            />
                          )}

                          {/* Ponto / nó da timeline */}
                          <div
                            className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-slate-300 ring-2 ring-slate-50 group-hover:bg-blue-900 group-hover:ring-blue-100 transition-all"
                            aria-hidden="true"
                          />

                          {/* Cabeçalho do despacho: horário e órgão oficial */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-0.5 min-w-0">
                            <span className="font-bold text-slate-700 tabular-nums shrink-0">
                              {timeString}
                            </span>
                            <span className="text-slate-300 font-sans" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-medium text-slate-500 font-sans truncate">
                              {item.source}
                            </span>
                          </div>

                          {/* Conteúdo / Título do Despacho */}
                          <p className="text-xs font-medium text-slate-800 group-hover:text-blue-900 leading-snug line-clamp-2 transition-colors break-words">
                            {item.title}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Nenhum despacho recente disponível no momento.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
