import React, { useState, useEffect } from "react";
import { NewsItem, NewsCategory } from "../types/news";
import { getArticleUrl } from "../utils/router";
import { Calendar, ExternalLink, Sparkles } from "lucide-react";

interface NewsCardProps {
  article: NewsItem;
  isFeatured?: boolean;
  onOpenDetails: (article: NewsItem) => void;
}

const CATEGORY_STYLES: Record<NewsCategory, { bg: string; border: string }> = {
  Política: { bg: "bg-rose-50/80", border: "border-rose-200/70" },
  Eleições: { bg: "bg-blue-50/80", border: "border-blue-200/70" },
  Governo: { bg: "bg-slate-100", border: "border-slate-200/80" },
  Congresso: { bg: "bg-amber-50/80", border: "border-amber-200/70" },
  Justiça: { bg: "bg-indigo-50/80", border: "border-indigo-200/70" },
  Economia: { bg: "bg-emerald-50/80", border: "border-emerald-200/70" },
  Brasil: { bg: "bg-cyan-50/80", border: "border-cyan-200/70" },
  Mundo: { bg: "bg-stone-100", border: "border-stone-200/80" },
  Esportes: { bg: "bg-emerald-50/80", border: "border-emerald-200/70" },
  Tecnologia: { bg: "bg-sky-50/80", border: "border-sky-200/70" },
};

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  isFeatured = false,
  onOpenDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const catStyle = CATEGORY_STYLES[article.category] || CATEGORY_STYLES["Política"];
  const isSociedadeAtiva = article.source.includes("Sociedade Ativa");

  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  return (
    <article
      onClick={() => onOpenDetails(article)}
      className={`group bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all duration-200 cursor-pointer relative ${
        isFeatured
          ? "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 border-blue-200"
          : ""
      }`}
    >
      <div>
        {/* Imagem Editorial Oficial (quando disponível e válida) */}
        {article.imageUrl && !imageError && (
          <div className="mb-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] relative">
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Cabeçalho do Card: Badge Padronizado com Cores Sutis e Tipografia Navy Consistente */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border text-slate-900 ${catStyle.bg} ${catStyle.border}`}
            >
              {article.category}
            </span>

            {isSociedadeAtiva ? (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-blue-900 font-bold text-[11px] inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Especial
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{article.publishedAt.split(" às ")[0]}</span>
          </div>
        </div>

        {/* Título Principal */}
        <h3
          className={`font-heading font-black text-slate-900 leading-snug group-hover:text-blue-900 transition-colors ${
            isFeatured ? "text-xl sm:text-2xl mb-3" : "text-base sm:text-lg mb-2"
          }`}
        >
          <a
            href={getArticleUrl(article.id)}
            onClick={(e) => {
              e.preventDefault();
              onOpenDetails(article);
            }}
            className="hover:underline"
          >
            {article.title}
          </a>
        </h3>

        {/* Resumo da Notícia */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
          {article.summary}
        </p>
      </div>

      {/* Rodapé e Atribuição Transparente de Fonte */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-400">Fonte:</span>
          <span
            className={`font-bold ${
              isSociedadeAtiva ? "text-slate-900" : "text-slate-700"
            }`}
          >
            {article.source}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-slate-400">
            {article.publishedAt.includes(" às ") ? article.publishedAt.split(" às ")[1] : ""}
          </span>
        </div>

        {/* Ação Direta para a Notícia Original */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-semibold text-[11px] border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
            title={`Abrir reportagem completa em ${article.source}`}
          >
            <span>Leia a notícia original</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-700" />
          </a>
        </div>
      </div>
    </article>
  );
};
