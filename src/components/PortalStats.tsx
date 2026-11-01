import React, { useMemo } from "react";
import { NewsItem } from "../types/news";
import { Newspaper, Archive, FolderTree, ShieldCheck } from "lucide-react";

interface PortalStatsProps {
  articles: NewsItem[];
}

export const PortalStats: React.FC<PortalStatsProps> = ({ articles }) => {
  const stats = useMemo(() => {
    const list = Array.isArray(articles) ? articles : [];

    // 1. Notícias publicadas hoje / na edição mais recente do portal
    const latestDate = list[0]?.publishedAt?.split(" às ")[0] || "";
    const publishedTodayCount = list.filter(
      (a) => a.publishedAt && a.publishedAt.split(" às ")[0] === latestDate
    ).length;

    // 2. Total de artigos no acervo
    const totalArticles = list.length;

    // 3. Seções editoriais ativas
    const activeSections = new Set(
      list.map((a) => a.category).filter(Boolean)
    ).size;

    // 4. Fontes oficiais monitoradas (Agência Brasil, Câmara, Senado, TSE, IBGE, etc.)
    const monitoredSources = new Set(
      list.map((a) => a.source).filter(Boolean)
    ).size;

    return {
      publishedTodayCount: publishedTodayCount || 0,
      latestDateLabel: latestDate ? `Edição de ${latestDate}` : "Edição do dia",
      totalArticles,
      activeSections,
      monitoredSources,
    };
  }, [articles]);

  return (
    <section
      aria-label="Estatísticas e transparência do acervo editorial"
      className="border-y border-slate-200 bg-slate-50/70 py-4 my-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {/* Métrica 1: Notícias publicadas hoje / edição recente */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3 first:pt-0 first:px-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-900 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-slate-950 tabular-nums">
                {stats.publishedTodayCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-tight">
                Notícias na edição
              </div>
            </div>
          </div>

          {/* Métrica 2: Total de artigos no acervo */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-900 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-slate-950 tabular-nums">
                {stats.totalArticles}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-tight">
                Artigos no acervo
              </div>
            </div>
          </div>

          {/* Métrica 3: Seções editoriais ativas */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-900 flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-slate-950 tabular-nums">
                {stats.activeSections}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-tight">
                Editorias ativas
              </div>
            </div>
          </div>

          {/* Métrica 4: Fontes oficiais monitoradas */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-slate-950 tabular-nums">
                {stats.monitoredSources}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-tight">
                Fontes monitoradas
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
