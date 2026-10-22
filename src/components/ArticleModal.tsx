import React, { useState, useEffect } from "react";
import { NewsItem } from "../types/news";
import { EDITORIAL_IMAGES } from "../assets/editorialImages";
import { isValidImageUrl, getFullArticleById } from "../services/newsService";
import { X, Calendar, Clock, Share2, Check, ExternalLink, ShieldCheck, Tag } from "lucide-react";

interface ArticleModalProps {
  article: NewsItem | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<string[] | null>(
    article?.content && article.content.length > 0 ? article.content : null
  );

  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  // Carrega o conteúdo integral assincronamente caso o artigo tenha sido carregado apenas com metadados
  useEffect(() => {
    if (article?.content && article.content.length > 0) {
      setDynamicContent(article.content);
    } else if (article?.id) {
      let isMounted = true;
      getFullArticleById(article.id)
        .then((full) => {
          if (isMounted && full?.content && full.content.length > 0) {
            setDynamicContent(full.content);
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [article?.id, article?.content]);

  if (!article) return null;

  const activeContent = dynamicContent || (article.content && article.content.length > 0 ? article.content : null);

  const handleShare = () => {
    const shareUrl = article.articleUrl || window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.summary,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSociedadeAtivaAuthor =
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
  const hasValidImage = Boolean(
    article.imageUrl && isValidImageUrl(article.imageUrl) && !imageError
  );
  const displayImageSrc = hasValidImage ? article.imageUrl! : institutionalFallback.src;
  const displayImageAlt = hasValidImage ? (article.imageAlt || article.title) : institutionalFallback.alt;
  const displayCaption = hasValidImage ? (article.imageCaption || article.title) : institutionalFallback.caption;
  const displayCredit = hasValidImage ? article.imageCredit : "Acervo Institucional";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          title="Fechar matéria"
          aria-label="Fechar matéria"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Kicker e Categoria */}
        <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
          <span className="font-bold uppercase tracking-wider text-blue-800">
            {article.category}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-medium">
            {article.readTime || "3 min de leitura"}
          </span>
          <span className="text-slate-300">·</span>
          {isSociedadeAtivaAuthor ? (
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Reportagem Especial
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Súmula Oficial
            </span>
          )}
        </div>

        {/* Título Principal */}
        <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-tight">
          {article.title}
        </h2>

        {/* Imagem Editorial Oficial Verificada ou Acervo Institucional */}
        {(article.imageUrl || imageError) && (
          <figure className="mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <div className="w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-slate-100 relative">
              <img
                src={displayImageSrc}
                alt={displayImageAlt}
                width={800}
                height={450}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
              {!hasValidImage && (
                <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Acervo Oficial
                </span>
              )}
            </div>
            <figcaption className="p-2.5 text-[10px] sm:text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <span>{displayCaption}</span>
              {displayCredit && (
                <span className="font-semibold text-slate-700">
                  {displayCredit.startsWith("Foto:") ? displayCredit : `Foto: ${displayCredit}`}
                </span>
              )}
            </figcaption>
          </figure>
        )}

        {/* Resumo ou Síntese Oficial */}
        <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>
              {activeContent && activeContent.length > 0
                ? "Resumo do Fato"
                : "Nota de Síntese Factual Oficial"}
            </span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-700 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Informações de Autoria e Publicação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-4 mb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800">
                Fonte: {article.source}
              </span>
              {isSociedadeAtivaAuthor && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                  Oficial
                </span>
              )}
            </div>
            {article.author && article.author !== article.source && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                Por: {article.author}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Publicado em {article.publishedAt}</span>
            </span>
            {article.updatedAt && article.updatedAt !== article.publishedAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Atualizado em {article.updatedAt}</span>
              </span>
            )}
            {(!article.updatedAt || article.updatedAt === article.publishedAt) && article.ingestedAt && article.ingestedAt !== article.publishedAt && (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Recebido pelo portal em {article.ingestedAt}</span>
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo Completo (quando disponível) ou Transparência de Súmula */}
        {activeContent && activeContent.length > 0 ? (
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed mb-6 font-serif">
            {activeContent.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-600 bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 mb-6 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Diretriz Editorial de Transparência</span>
            </div>
            <p>
              Esta publicação é uma súmula factual oficial distribuída por <strong>{article.source}</strong>. Para acessar a íntegra dos anexos, fotos ou documentos oficiais, utilize o link de acesso direto abaixo.
            </p>
          </div>
        )}

        {/* Tags Temáticas */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-6 pt-3 border-t border-slate-100">
            <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Ações: Compartilhar e Link da Notícia Original */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleShare}
            aria-label={copied ? "Link copiado para a área de transferência" : "Compartilhar matéria"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors text-xs font-bold cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Compartilhar</span>
              </>
            )}
          </button>

          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition-colors text-xs font-bold shadow-xs cursor-pointer"
          >
            <span>Acessar notícia original na íntegra</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
