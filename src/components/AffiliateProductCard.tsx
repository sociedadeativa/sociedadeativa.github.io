import React, { useState } from "react";
import { AffiliateProduct } from "../types/affiliate";
import { ExternalLink, ShoppingBag, ShieldAlert } from "lucide-react";

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  compact?: boolean;
}

const MERCHANT_STYLES: Record<
  AffiliateProduct["merchant"],
  { badge: string; border: string; buttonBg: string; text: string }
> = {
  "Mercado Livre": {
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    border: "hover:border-amber-400",
    buttonBg: "bg-amber-500 hover:bg-amber-600 text-slate-950",
    text: "Mercado Livre",
  },
  "Amazon Brasil": {
    badge: "bg-orange-100 text-orange-900 border-orange-300",
    border: "hover:border-orange-400",
    buttonBg: "bg-orange-500 hover:bg-orange-600 text-white",
    text: "Amazon Brasil",
  },
  Shopee: {
    badge: "bg-rose-100 text-rose-900 border-rose-300",
    border: "hover:border-rose-400",
    buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
    text: "Shopee",
  },
};

export const AffiliateProductCard: React.FC<AffiliateProductCardProps> = ({
  product,
  compact = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const merchantStyle = MERCHANT_STYLES[product.merchant] || {
    badge: "bg-slate-100 text-slate-800 border-slate-300",
    border: "hover:border-slate-400",
    buttonBg: "bg-slate-900 hover:bg-slate-800 text-white",
    text: product.merchant,
  };

  const hasValidImage = Boolean(product.imageUrl && product.imageUrl.trim() && !imgError);

  return (
    <div
      data-testid={`affiliate-card-${product.id}`}
      className={`bg-white rounded-xl border border-slate-200 transition-all duration-200 hover:shadow-sm flex flex-col justify-between ${
        merchantStyle.border
      } ${compact ? "p-3.5" : "p-4 sm:p-5"}`}
    >
      <div>
        {/* Cabeçalho do Card: Selo do Marketplace */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${merchantStyle.badge}`}
          >
            <ShoppingBag className="w-3 h-3 shrink-0" />
            <span>{merchantStyle.text}</span>
          </span>
          <span className="text-[10px] text-slate-600 font-medium">Link Patrocinado</span>
        </div>

        {/* Mídia / Imagem com dimensões e aspect ratio estritos para zero Cumulative Layout Shift (CLS) */}
        <div className="mb-3 w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center aspect-square max-h-36 relative">
          {hasValidImage ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              width={144}
              height={144}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain p-2 transition-transform duration-200 hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mb-1 text-slate-300" />
              <span className="text-[11px] font-medium text-slate-500">Imagem do Produto</span>
            </div>
          )}
        </div>

        {/* Título e Descrição (Sem exibição de preços, estritamente conforme especificado) */}
        <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug mb-1.5">
          {product.name}
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>
      </div>

      {/* Ação: Link Seguro com noopener, noreferrer e nofollow */}
      <div className="pt-2 border-t border-slate-100 mt-auto">
        {product.affiliateUrl ? (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`Ver ${product.name} na loja ${product.merchant} em nova aba`}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs ${merchantStyle.buttonBg}`}
          >
            <span>Ver na {product.merchant}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded bg-slate-100 text-slate-500 text-[11px] font-medium">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Link em validação editorial</span>
          </div>
        )}
      </div>
    </div>
  );
};
