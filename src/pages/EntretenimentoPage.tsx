import React, { useState, useMemo } from "react";
import { NewsItem } from "../types/news";
import { PortalLink } from "../components/PortalLink";
import { NewsCard } from "../components/NewsCard";
import { AdBanner } from "../components/AdBanner";
import {
  Film,
  Tv,
  Music,
  Sparkles,
  Globe,
  Clapperboard,
  Layers,
  Search,
  X,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Info,
} from "lucide-react";
import { handleTabKeyDown } from "../utils/a11yTabs";

interface EntretenimentoPageProps {
  articles?: NewsItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenArticleDetails?: (article: NewsItem) => void;
}

export type EntertainmentTopicId =
  | "todos"
  | "cinema"
  | "tv"
  | "streaming"
  | "musica"
  | "celebridades"
  | "cultura-digital";

interface EntertainmentTopic {
  id: EntertainmentTopicId;
  label: string;
  icon: React.ElementType;
  description: string;
  keywords: RegExp;
}

const ENTERTAINMENT_TOPICS: EntertainmentTopic[] = [
  {
    id: "todos",
    label: "Todos",
    icon: Layers,
    description: "Visão consolidada de todas as publicações de entretenimento e cultura.",
    keywords: /.*/,
  },
  {
    id: "cinema",
    label: "Cinema",
    icon: Film,
    description: "Estreias nas salas de cinema, bilheterias, festivais e premiações.",
    keywords: /\b(cinema|filme|filmes|hollywood|oscar|bilheteria|cineasta|longa-metragem)\b/i,
  },
  {
    id: "streaming",
    label: "Streaming & Séries",
    icon: Clapperboard,
    description: "Séries, minisséries e lançamentos na Netflix, Max, Prime Video, Disney+ e Globoplay.",
    keywords: /\b(streaming|série|series|temporada|netflix|prime video|max|disney\+|globoplay|episódio)\b/i,
  },
  {
    id: "tv",
    label: "Televisão",
    icon: Tv,
    description: "Bastidores da teledramaturgia, novelas, programas e audiência de TV aberta e fechada.",
    keywords: /\b(televisão|televisao|tv|novela|novelas|emissora|apresentador|teledramaturgia)\b/i,
  },
  {
    id: "musica",
    label: "Música",
    icon: Music,
    description: "Lançamentos de álbuns, singles, turnês, festivais e paradas de sucesso.",
    keywords: /\b(música|musica|álbum|album|show|shows|cantor|cantora|banda|rock in rio|lollapalooza|the town|spotify)\b/i,
  },
  {
    id: "celebridades",
    label: "Celebridades",
    icon: Sparkles,
    description: "Notícias e acontecimentos verificados sobre personalidades da cultura e das artes.",
    keywords: /\b(celebridade|celebridades|famosos|artista|artistas|ator|atriz|red carpet|tapete vermelho)\b/i,
  },
  {
    id: "cultura-digital",
    label: "Cultura Digital",
    icon: Globe,
    description: "Tendências das redes sociais, criadores de conteúdo e fenômenos da internet.",
    keywords: /\b(cultura digital|redes sociais|influenciador|influenciadores|youtube|tiktok|instagram|podcast)\b/i,
  },
];

// Regex geral para capturar artigos genuínos de entretenimento
const ENTERTAINMENT_REGEX =
  /\b(entretenimento|cinema|filme|filmes|streaming|série|series|novela|novelas|música|musica|show|shows|álbum|album|televisão|televisao|\btv\b|celebridade|celebridades|hollywood|oscar|emmy|grammy|cineasta|teledramaturgia|cultura pop|rock in rio|lollapalooza)\b/i;

export const EntretenimentoPage: React.FC<EntretenimentoPageProps> = ({
  articles = [],
  isLoading = false,
  error = null,
  onRetry,
  onOpenArticleDetails,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<EntertainmentTopicId>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtra matérias categorizadas ou identificadas como entretenimento genuíno
  const entertainmentArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];

    return articles.filter((art) => {
      // 1. Categoria nativa
      if (art.category === "Entretenimento") return true;

      // 2. Tags que contenham entretenimento
      if (Array.isArray(art.tags) && art.tags.some((t) => ENTERTAINMENT_REGEX.test(t))) {
        return true;
      }

      // 3. Título expressivo de entretenimento sem falso-positivo de política/economia
      if (art.title && ENTERTAINMENT_REGEX.test(art.title)) {
        // Evita falsos positivos com leis de incentivo econômico puro
        const isTaxLawOnly = /\b(reforma tributária|alíquota|arrecadação|tributação)\b/i.test(art.title);
        if (!isTaxLawOnly) return true;
      }

      return false;
    });
  }, [articles]);

  // Aplica filtro por subtópico e pesquisa textual
  const filteredArticles = useMemo(() => {
    let result = [...entertainmentArticles];

    // Filtro por subtópico
    if (selectedTopic !== "todos") {
      const topicConfig = ENTERTAINMENT_TOPICS.find((t) => t.id === selectedTopic);
      if (topicConfig) {
        result = result.filter((art) => {
          const inTitle = topicConfig.keywords.test(art.title);
          const inSummary = topicConfig.keywords.test(art.summary);
          const inTags = Array.isArray(art.tags) && art.tags.some((t) => topicConfig.keywords.test(t));
          return inTitle || inSummary || inTags;
        });
      }
    }

    // Filtro por busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((art) => {
        return (
          art.title.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q) ||
          (Array.isArray(art.tags) && art.tags.some((t) => t.toLowerCase().includes(q)))
        );
      });
    }

    return result;
  }, [entertainmentArticles, selectedTopic, searchQuery]);

  const activeTopicConfig = ENTERTAINMENT_TOPICS.find((t) => t.id === selectedTopic) || ENTERTAINMENT_TOPICS[0];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Caderno de Entretenimento */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
            <Film className="w-4 h-4" />
            <span>Caderno Especial · Cultura, Audiovisual &amp; Artes</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Entretenimento, Cultura Pop e Audiovisual
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Acompanhe as estreias do cinema, produções do streaming, bastidores da televisão, lançamentos musicais, premiações artísticas e tendências da cultura digital checadas pela redação.
          </p>

          {/* Atalhos Rápidos entre Cadernos */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Veja também:</span>
            <PortalLink
              route="tecnologia"
              className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              Tecnologia &amp; Games &rarr;
            </PortalLink>
            <PortalLink
              route="esportes"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Esportes &amp; Futebol &rarr;
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Política &amp; Poderes &rarr;
            </PortalLink>
            <PortalLink
              route="noticias"
              className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            >
              Todas as Notícias &rarr;
            </PortalLink>
          </div>
        </div>

        {/* Barra de Filtros por Subtópico */}
        <div className="mb-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Campo de Busca no Caderno */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por filme, série, artista, música ou canal..."
                aria-label="Buscar matérias de entretenimento"
                className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 focus-visible:outline-hidden text-slate-800 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer"
                  title="Limpar busca"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contador de Matérias */}
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap self-end sm:self-center">
              {filteredArticles.length} {filteredArticles.length === 1 ? "matéria encontrada" : "matérias encontradas"}
            </div>
          </div>

          {/* Abas de Subtópicos */}
          <div
            role="tablist"
            aria-label="Tópicos de entretenimento"
            onKeyDown={(e) => handleTabKeyDown(e, '[role="tab"]')}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100"
          >
            {ENTERTAINMENT_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  role="tab"
                  id={`tab-entretenimento-${topic.id}`}
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  aria-controls="panel-entretenimento-list"
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-rose-200" : "text-slate-500"}`} />
                  <span>{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estado de Carregamento */}
        {isLoading && (
          <div className="py-12 text-center animate-pulse space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-200" />
            <div className="h-4 bg-slate-200 rounded max-w-xs mx-auto" />
            <div className="h-3 bg-slate-200 rounded max-w-sm mx-auto" />
          </div>
        )}

        {/* Estado de Erro */}
        {!isLoading && error && (
          <div className="mb-10 p-8 bg-white rounded-3xl border border-amber-200 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="font-heading text-lg font-bold text-slate-900">
                Não foi possível carregar as publicações de entretenimento
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {error || "Erro de conexão com os serviços editoriais."}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            )}
          </div>
        )}

        {/* ESTADO VAZIO LIMPO (CLEAN EMPTY STATE - Conforme Requisito 3) */}
        {!isLoading && !error && filteredArticles.length === 0 && (
          <div id="panel-entretenimento-list" className="space-y-8">
            {/* Bloco Central de Aviso Editorial */}
            <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-700 mb-4 shadow-2xs">
                <Film className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Caderno Editorial em Estruturação</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Nenhuma matéria de entretenimento disponível no momento
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
                Novas publicações sobre cinema, streaming, TV, música e cultura digital serão integradas conforme apuração editorial e confirmação de fontes públicas.
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <PortalLink
                  route="noticias"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Ver Notícias Recentes
                </PortalLink>
                <PortalLink
                  route="home"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Voltar para a Página Inicial
                </PortalLink>
              </div>
            </div>

            {/* Grade Explicativa dos Tópicos que Serão Cobertos */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-4 h-4 text-slate-500" />
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                  O que você acompanhará nesta editoria:
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Film className="w-4 h-4" />
                    <span>Cinema &amp; Mostras</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Estreias nas salas brasileiras, bilheterias do fim de semana, festivais de cinema nacionais e premiações como o Oscar e Festival de Cannes.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Clapperboard className="w-4 h-4" />
                    <span>Streaming &amp; Séries</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lançamentos e renovações nas plataformas Netflix, Max, Prime Video, Disney+, Globoplay e Apple TV+, além de minisséries e documentários.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Tv className="w-4 h-4" />
                    <span>Televisão Brasileira</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Novelas, programas de auditório, telejornais, dados oficiais de audiência (Kantar Ibope) e movimentações nas principais emissoras.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Music className="w-4 h-4" />
                    <span>Música &amp; Festivais</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lançamentos da MPB, pop, sertanejo e rap, paradas musicais, turnês pelo Brasil e cobertura de festivais como Rock in Rio e The Town.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Celebridades &amp; Artes</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Acontecimentos apurados e verificados sobre personalidades da cultura, premiações e tapetes vermelhos sem fabricação de boatos.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Cultura Digital</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Grandes tendências da internet brasileira, debates nas redes sociais, podcasts em alta e novos formatos de entretenimento online.
                  </p>
                </div>
              </div>

              {/* Compromisso com Fatos Reais */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Diretriz de Neutralidade:</strong> O Sociedade Ativa não publica conteúdos ficcionais ou boatos não confirmados. Todas as matérias passam por checagem editorial prévia.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LISTAGEM DE ARTIGOS (Quando houver matérias cadastradas) */}
        {!isLoading && !error && filteredArticles.length > 0 && (
          <div id="panel-entretenimento-list" className="space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Publicações em {activeTopicConfig.label}
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredArticles.length} {filteredArticles.length === 1 ? "artigo" : "artigos"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((art) => (
                <NewsCard
                  key={art.id}
                  article={art}
                  onOpenDetails={(a) => onOpenArticleDetails?.(a)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Publicidade Responsiva */}
        <div className="mt-12">
          <AdBanner format="in-feed" />
        </div>
      </div>
    </div>
  );
};
