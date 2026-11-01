import React, { useState, useEffect } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { getArticleUrl } from "../utils/router";
import { Calendar, ArrowRight, Sparkles, Clock } from "lucide-react";

export interface NewsCardProps {
  article: NewsItem;
  isFeatured?: boolean;
  variant?: "primary" | "compact" | "ranked";
  rankNumber?: number;
  onOpenDetails: (article: NewsItem) => void;
}

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
  Clima: EDITORIAL_IMAGES.dadosPublicos,
};

// 1. Primary Card: Imagem 16:9, label de categoria, manchete de até 3 linhas, resumo curto, fonte e tempo
export const PrimaryNewsCard: React.FC<NewsCardProps> = ({
  article,
  isFeatured = false,
  onOpenDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const isSociedadeAtiva = article.source.includes("Sociedade Ativa");

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

        <h3
          className={`font-heading font-black text-slate-950 leading-snug group-hover:text-blue-800 transition-colors line-clamp-3 ${
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

        <p className="text-base text-slate-700 leading-relaxed line-clamp-3 mb-4">
          {article.summary}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <span className="text-slate-400">Fonte:</span>
          <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
            {article.source}
          </span>
        </div>

        <div className="font-bold text-blue-700 group-hover:text-blue-900 flex items-center gap-1">
          <span>Ler matéria</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
};

// 2. Compact Card: Imagem pequena à esquerda, manchete à direita, categoria e tempo de publicação
export const CompactNewsCard: React.FC<NewsCardProps> = ({
  article,
  onOpenDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const institutionalFallback = categoryFallbackMap[article.category] || EDITORIAL_IMAGES.congresso;
  const isUsingFallback = Boolean(imageError && article.imageUrl);
  const imageSrc = isUsingFallback ? institutionalFallback.src : (article.imageUrl || institutionalFallback.src);
  const imageAlt = isUsingFallback ? institutionalFallback.alt : (article.imageAlt || article.title);

  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  return (
    <article
      onClick={() => onOpenDetails(article)}
      className="group bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 items-center hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
        <img
          src={imageSrc}
          alt={imageAlt}
          width={640}
          height={360}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
          <span className="font-bold uppercase tracking-wider text-blue-900">
            {article.category}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{article.publishedAt.split(" às ")[0]}</span>
          </span>
        </div>

        <h4 className="font-heading font-bold text-sm sm:text-base text-slate-950 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">
          {article.title}
        </h4>

        <div className="mt-1 text-xs text-slate-500 font-medium truncate">
          {article.source}
        </div>
      </div>
    </article>
  );
};

// 3. Ranked List Card: Número editorial proeminente (01-05), manchete, categoria e tempo
export const RankedNewsCard: React.FC<NewsCardProps> = ({
  article,
  rankNumber = 1,
  onOpenDetails,
}) => {
  const formattedRank = String(rankNumber).padStart(2, "0");

  return (
    <li
      onClick={() => onOpenDetails(article)}
      className="group py-3.5 sm:py-4 first:pt-0 last:pb-0 cursor-pointer flex items-start gap-3.5 sm:gap-4"
    >
      <span className="font-heading font-black text-2xl sm:text-3xl text-slate-300 group-hover:text-blue-900 transition-colors shrink-0 tabular-nums select-none leading-none mt-0.5">
        {formattedRank}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
          <span className="font-bold text-blue-900 uppercase tracking-wider">
            {article.category}
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="text-slate-600 truncate">{article.source}</span>
        </div>

        <h4 className="font-heading text-sm sm:text-base font-bold text-slate-950 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">
          {article.title}
        </h4>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-medium">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{article.publishedAt.split(" às ")[0]}</span>
        </div>
      </div>
    </li>
  );
};

// Componente Genérico que despacha para as variantes mantendo compatibilidade
export const NewsCard: React.FC<NewsCardProps> = (props) => {
  if (props.variant === "compact") {
    return <CompactNewsCard {...props} />;
  }
  if (props.variant === "ranked") {
    return <RankedNewsCard {...props} />;
  }
  return <PrimaryNewsCard {...props} />;
};
