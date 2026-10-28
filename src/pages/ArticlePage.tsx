import React, { useState, useEffect } from "react";
import { NewsItem, NewsCategory } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { getArticleUrl, navigateToArticle } from "../utils/router";
import { PortalLink } from "../components/PortalLink";
import { AffiliateSection } from "../components/AffiliateSection";
import { isValidImageUrl } from "../services/newsService";
import {
  Calendar,
  Clock,
  Share2,
  Check,
  ExternalLink,
  ArrowLeft,
  Tag,
  Sparkles,
  ShieldCheck,
  Building2,
  Newspaper,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface ArticlePageProps {
  article: NewsItem;
  allArticles: NewsItem[];
  onNavigateBack: () => void;
  onSelectArticle: (article: NewsItem) => void;
}

const CATEGORY_STYLES: Record<NewsCategory, { kicker: string; bg: string; border: string }> = {
  Política: { kicker: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  Eleições: { kicker: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  Governo: { kicker: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  Congresso: { kicker: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" },
  Justiça: { kicker: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  Economia: { kicker: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Brasil: { kicker: "text-cyan-800", bg: "bg-cyan-50", border: "border-cyan-200" },
  Mundo: { kicker: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
  Esportes: { kicker: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Tecnologia: { kicker: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
};

export const ArticlePage: React.FC<ArticlePageProps> = ({
  article,
  allArticles,
  onNavigateBack,
  onSelectArticle,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  const catStyle = CATEGORY_STYLES[article.category] || CATEGORY_STYLES["Política"];
  const isSociedadeAtiva =
    article.source?.includes("Sociedade Ativa") ||
    article.author?.includes("Sociedade Ativa");

  const categoryFallbackMap: Record<string, typeof EDITORIAL_IMAGES.congresso> = {
    Eleições: EDITORIAL_IMAGES.urna,
    Economia: EDITORIAL_IMAGES.economia,
    Brasil: EDITORIAL_IMAGES.dadosPublicos,
    Congresso: EDITORIAL_IMAGES.congresso,
    Política: EDITORIAL_IMAGES.congresso,
    Governo: EDITORIAL_IMAGES.congresso,
    Justiça: EDITORIAL_IMAGES.congresso,
    Mundo: EDITORIAL_IMAGES.congresso,
    Esportes: EDITORIAL_IMAGES.congresso,
    Tecnologia: EDITORIAL_IMAGES.dadosPublicos,
  };
  const institutionalFallback = categoryFallbackMap[article.category] || EDITORIAL_IMAGES.congresso;
  const hasValidOriginal = Boolean(article.imageUrl && isValidImageUrl(article.imageUrl) && !imageError);
  const heroImageSrc = hasValidOriginal ? article.imageUrl! : institutionalFallback.src;
  const heroImageAlt = hasValidOriginal ? (article.imageAlt || article.title) : institutionalFallback.alt;
  const heroImageCaption = hasValidOriginal ? (article.imageCaption || article.title) : institutionalFallback.caption;
  const heroImageCredit = hasValidOriginal ? article.imageCredit : "Acervo Institucional Sociedade Ativa";

  // Atualiza título, meta description e canonical dinamicamente no cliente
  useEffect(() => {
    if (typeof document !== "undefined") {
      const pageTitle = `${article.title} — Sociedade Ativa | Notícias`;
      document.title = pageTitle;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", article.summary.slice(0, 160));
      }

      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", `https://sociedadeativa.github.io${getArticleUrl(article.id)}`);
      }
    }
  }, [article]);

  const handleShare = () => {
    const canonicalUrl = `https://sociedadeativa.github.io${getArticleUrl(article.id)}`;
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.summary,
          url: canonicalUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Notícias relacionadas (preferencialmente mesma categoria, excluindo a atual)
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  // Se houver menos de 3 na mesma categoria, complementa com as mais recentes gerais
  const additionalArticles =
    relatedArticles.length < 3
      ? allArticles
          .filter(
            (a) =>
              a.id !== article.id &&
              !relatedArticles.some((r) => r.id === a.id)
          )
          .slice(0, 3 - relatedArticles.length)
      : [];

  const finalRelated = [...relatedArticles, ...additionalArticles];

  return (
    <article className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegação Superior e Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center justify-between gap-3 text-xs mb-6 pb-4 border-b border-slate-200"
        >
          <div className="flex items-center gap-1.5 text-slate-500 overflow-hidden">
            <PortalLink
              route="home"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Início
            </PortalLink>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <button
              onClick={onNavigateBack}
              className="hover:text-slate-900 transition-colors font-medium cursor-pointer whitespace-nowrap"
            >
              Notícias
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className={`font-bold ${catStyle.kicker} whitespace-nowrap`}>
              {article.category}
            </span>
          </div>

          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Notícias</span>
          </button>
        </nav>

        {/* Cabeçalho do Artigo */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
            <span className={`font-bold uppercase tracking-wider ${catStyle.kicker}`}>
              {article.category}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-500 font-medium">
              {article.readTime || "3 min de leitura"}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            {isSociedadeAtiva ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3 text-blue-700" />
                Reportagem Especial &amp; Análise
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                <Building2 className="w-3 h-3 text-slate-500" />
                Súmula Institucional Oficial
              </span>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-4 text-balance">
            {article.title}
          </h1>

          {/* Resumo Oficial em Destaque */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 mb-6 shadow-2xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>
                {article.content && article.content.length > 0
                  ? "Resumo do Fato"
                  : "Nota de Síntese Factual Oficial"}
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Barra de Metadados e Atribuição de Fonte */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Fonte: {article.source}
                </span>
                {isSociedadeAtiva && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    Verificado
                  </span>
                )}
              </div>
              {article.author && article.author !== article.source && (
                <div className="text-[11px] text-slate-500">
                  Autoria / Apuração: {article.author}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Publicado em {article.publishedAt}</span>
              </div>

              {article.updatedAt && article.updatedAt !== article.publishedAt && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>Atualizado em {article.updatedAt}</span>
                </div>
              )}

              {(!article.updatedAt || article.updatedAt === article.publishedAt) && article.ingestedAt && article.ingestedAt !== article.publishedAt && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>Recebido pelo portal em {article.ingestedAt}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Imagem Oficial com Atribuição Transparente */}
        <figure className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
          <div className="aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-slate-100 relative">
            <img
              src={heroImageSrc}
              alt={heroImageAlt}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
            {!hasValidOriginal && (
              <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-slate-950/85 px-2 py-0.5 rounded backdrop-blur-xs">
                Acervo Oficial
              </span>
            )}
          </div>
          <figcaption className="p-3 text-xs text-slate-600 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 leading-relaxed">
            <span>{heroImageCaption}</span>
            {heroImageCredit && (
              <span className="font-semibold text-slate-500 shrink-0">
                {heroImageCredit.startsWith("Foto:") ? heroImageCredit : `Foto: ${heroImageCredit}`}
              </span>
            )}
          </figcaption>
        </figure>

        {/* Corpo do Conteúdo Autorizado */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-xs">
          {article.content && article.content.length > 0 ? (
            /* Artigos proprietários ou com texto estruturado */
            <div className="space-y-4 text-sm sm:text-base text-slate-800 leading-relaxed font-serif">
              {article.content.map((paragraph, idx) => {
                const isHeading =
                  (paragraph.length < 90 && paragraph.endsWith(":") && !paragraph.includes("http")) ||
                  paragraph.startsWith("Fontes Oficiais Consultadas") ||
                  paragraph.startsWith("Metodologia e Limitações") ||
                  paragraph.startsWith("Constatações e Integridade");

                if (isHeading) {
                  return (
                    <h2
                      key={idx}
                      className="font-heading font-black text-lg sm:text-xl text-slate-900 mt-8 mb-3 pt-4 border-t border-slate-100 flex items-center gap-2 font-sans"
                    >
                      <span>{paragraph}</span>
                    </h2>
                  );
                }

                // Parser de links para tornar URLs oficiais clicáveis
                const renderWithLinks = (text: string) => {
                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                  const parts = text.split(urlRegex);
                  return parts.map((part, pIdx) => {
                    if (part.match(/^https?:\/\//)) {
                      let cleanUrl = part;
                      let trailing = "";
                      const punctMatch = cleanUrl.match(/[.,;)]+$/);
                      if (punctMatch) {
                        trailing = punctMatch[0];
                        cleanUrl = cleanUrl.slice(0, -trailing.length);
                      }
                      return (
                        <React.Fragment key={pIdx}>
                          <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 underline font-sans font-medium break-all inline-flex items-center gap-1 group/link"
                          >
                            <span>{cleanUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 inline text-blue-500 group-hover/link:text-blue-800 shrink-0" />
                          </a>
                          {trailing}
                        </React.Fragment>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  });
                };

                const isListItem = /^(?:\d+\.|\•|\-)\s+/.test(paragraph);
                if (isListItem) {
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans flex items-start gap-2.5 my-2.5 shadow-2xs"
                    >
                      <span className="text-blue-700 font-bold shrink-0 mt-0.5">•</span>
                      <div className="flex-1 leading-relaxed">
                        {renderWithLinks(paragraph.replace(/^(?:\d+\.|\•|\-)\s+/, ""))}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={idx} className="mb-4">
                    {renderWithLinks(paragraph)}
                  </p>
                );
              })}
            </div>
          ) : (
            /* Despachos oficiais distribuídos por agências públicas parceiras */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Diretriz de Transparência e Integridade da Informação</span>
                </div>
                <p>
                  Esta é uma súmula factual oficial distribuída por <strong>{article.source}</strong>. Para preservar os direitos autorais da agência e garantir a integridade de notas técnicas, tabelas ou documentos originais, a íntegra da reportagem está disponível diretamente no portal oficial da agência responsável.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={article.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                  <span>Acessar reportagem completa em {article.source}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Tags do Artigo */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 mr-1">Temas:</span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Barra de Ações do Artigo */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link canônico copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Compartilhar matéria</span>
                </>
              )}
            </button>

            {!isSociedadeAtiva && (
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                <span>Ver no portal {article.source}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* Módulo de Produtos Recomendados para Matérias de Tecnologia e Inovação */}
        {article.category === "Tecnologia" && (
          <div className="mb-10">
            <AffiliateSection
              category="tecnologia"
              compact={false}
              title="Dispositivos & Equipamentos Relacionados"
              subtitle="Recomendações e produtos tecnológicos certificados disponíveis nos marketplaces parceiros."
            />
          </div>
        )}

        {/* Seção de Notícias Relacionadas */}
        {finalRelated.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-200">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>Notícias Relacionadas &amp; Recomendadas</span>
              </h2>
              <button
                onClick={onNavigateBack}
                className="text-xs font-bold text-blue-800 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Ver todas &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {finalRelated.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <span className="text-blue-700">{rel.category}</span>
                      <span>{rel.publishedAt.split(" às ")[0]}</span>
                    </div>
                    <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900 group-hover:text-blue-900 line-clamp-2 leading-snug mb-2 transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {rel.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">{rel.source}</span>
                    <span className="text-blue-700 font-bold group-hover:underline">Ler &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé de Navegação */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-black text-base sm:text-lg">
              Quer acompanhar mais atualizações?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Acesse o caderno completo de notícias oficiais com apuração direta das agências públicas.
            </p>
          </div>
          <button
            onClick={onNavigateBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Acessar Caderno de Notícias
          </button>
        </div>
      </div>
    </article>
  );
};
