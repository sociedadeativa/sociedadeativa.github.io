import React, { useState, useEffect } from "react";
import { NewsItem, NewsCategory } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { getArticleUrl } from "../utils/router";
import { Calendar, ArrowRight, Sparkles } from "lucide-react";

interface NewsCardProps {
  article: NewsItem;
  isFeatured?: boolean;
  onOpenDetails: (article: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  isFeatured = false,
  onOpenDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const isSociedadeAtiva = article.source.includes("Sociedade Ativa");

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
  const isUsingFallback = Boolean(imageError && article.imageUrl);
  const imageSrc = isUsingFallback ? institutionalFallback.src : article.imageUrl;
  const imageAlt = isUsingFallback ? institutionalFallback.alt : (article.imageAlt || article.title);

  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  return (
    <article
      onClick={() => onOpenDetails(article)}
      className={`group bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer relative ${
        isFeatured
          ? "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 border-slate-300"
          : ""
      }`}
    >
      <div>
        {/* Imagem Editorial Oficial (quando disponível) */}
        {article.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] relative">
            <img
              src={imageSrc}
              alt={imageAlt}
              width={640}
              height={360}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
            {isUsingFallback && (
              <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-xs">
                Acervo Oficial
              </span>
            )}
          </div>
        )}

        {/* Metadados do Card: Clean Unboxed Metadata */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-blue-900">
            <span>{article.category}</span>
            {isSociedadeAtiva && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-amber-800 inline-flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Especial
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{article.publishedAt.split(" às ")[0]}</span>
          </div>
        </div>

        {/* Título Principal */}
        <h3
          className={`font-heading font-black text-slate-950 leading-snug group-hover:text-blue-800 transition-colors ${
            isFeatured ? "text-xl sm:text-2xl mb-3" : "text-lg mb-2"
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

        {/* Resumo da Notícia (Corpo com legibilidade $\ge$ 16px para padrão editorial) */}
        <p className="text-base text-slate-700 leading-relaxed line-clamp-3 mb-4">
          {article.summary}
        </p>
      </div>

      {/* Rodapé do Card com Atribuição Transparente e Botão de Ação */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="text-slate-400">Fonte:</span>
          <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
            {article.source}
          </span>
        </div>

        <div className="font-bold text-blue-700 group-hover:text-blue-900 flex items-center gap-1">
          <span>Leia mais</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
};
