import React from "react";
import { AffiliateProduct } from "../types/affiliate";
import {
  AFFILIATE_PRODUCTS,
  getActiveAffiliateProducts,
  AFFILIATE_DISCLOSURE_TEXT,
} from "../data/affiliateProducts";
import { AffiliateProductCard } from "./AffiliateProductCard";
import { ShoppingBag, Info, CheckCircle2 } from "lucide-react";

interface AffiliateSectionProps {
  products?: AffiliateProduct[];
  category?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  maxItems?: number;
  showWhenEmpty?: boolean;
}

export const AffiliateSection: React.FC<AffiliateSectionProps> = ({
  products,
  category,
  title = "Dispositivos & Tecnologia Recomendada",
  subtitle = "Produtos e equipamentos de tecnologia selecionados nos principais marketplaces parceiros.",
  compact = false,
  maxItems,
  showWhenEmpty = true,
}) => {
  // Se produtos forem injetados explicitamente (ex: em testes ou seleções dinâmicas), utiliza-os.
  // Caso contrário, busca estritamente os produtos ativos e validados.
  const activeProducts =
    products !== undefined
      ? products
      : getActiveAffiliateProducts(AFFILIATE_PRODUCTS, category);

  const displayedProducts =
    maxItems && maxItems > 0 ? activeProducts.slice(0, maxItems) : activeProducts;

  if (displayedProducts.length === 0 && !showWhenEmpty) {
    return null;
  }

  return (
    <section
      aria-labelledby="affiliate-section-heading"
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
    >
      {/* Cabeçalho da Seção de Afiliados */}
      <div className="flex items-center gap-2 mb-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
        <ShoppingBag className="w-4 h-4 text-indigo-600" />
        <span>Parcerias &amp; Afiliados</span>
      </div>

      <h2
        id="affiliate-section-heading"
        className="font-heading font-black text-base text-slate-950 mb-1.5"
      >
        {title}
      </h2>

      {subtitle && (
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Divulgação Legal Obrigatória em Português do Brasil */}
      <div
        data-testid="affiliate-disclosure"
        className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5 leading-relaxed"
      >
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="font-medium">
          {AFFILIATE_DISCLOSURE_TEXT}
        </p>
      </div>

      {/* Grid de Produtos */}
      {displayedProducts.length > 0 ? (
        <div
          className={
            compact
              ? "space-y-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
          }
        >
          {displayedProducts.map((prod) => (
            <AffiliateProductCard
              key={prod.id}
              product={prod}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        /* Estado informativo quando os links estiverem em processo de validação editorial pelo proprietário */
        <div className="py-5 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
          <h3 className="font-heading font-bold text-xs text-slate-800 mb-1">
            Recomendações em Auditoria Técnica
          </h3>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            Os links e produtos deste caderno estão passando por validação de integridade e conformidade de afiliados antes de serem publicados.
          </p>
        </div>
      )}
    </section>
  );
};
