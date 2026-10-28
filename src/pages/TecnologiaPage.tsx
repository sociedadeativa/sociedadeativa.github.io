import React, { useState, useMemo } from "react";
import { NewsItem } from "../types/news";
import { PortalLink } from "../components/PortalLink";
import { AffiliateSection } from "../components/AffiliateSection";
import { sortNewsItems, deduplicateNewsItems } from "../services/newsService";
import {
  Cpu,
  ShieldCheck,
  Globe,
  Smartphone,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Radio,
  FileText,
  Lock,
  Layers,
  Building,
  Info,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface TecnologiaPageProps {
  articles?: NewsItem[];
  onOpenArticleDetails?: (article: NewsItem) => void;
}

export type TechTopicId =
  | "todos"
  | "ia"
  | "ciberseguranca"
  | "internet-telecom"
  | "computacao"
  | "inovacao";

interface TechTopic {
  id: TechTopicId;
  label: string;
  icon: React.ElementType;
  description: string;
  keywords: RegExp;
}

const TECH_TOPICS: TechTopic[] = [
  {
    id: "todos",
    label: "Todos os Tópicos",
    icon: Layers,
    description: "Visão consolidada de todas as matérias sobre tecnologia e inovação.",
    keywords: /.*/,
  },
  {
    id: "ia",
    label: "Inteligência Artificial",
    icon: Sparkles,
    description: "Modelos generativos, regulação algorítmica, automação e aprendizado de máquina.",
    keywords:
      /\b(ia|inteligência artificial|inteligencia artificial|algoritmo|algoritmos|aprendizado de máquina|machine learning|generativa|llm|deep learning)\b/i,
  },
  {
    id: "ciberseguranca",
    label: "Cibersegurança & Dados",
    icon: Lock,
    description: "Segurança da informação, privacidade, LGPD, criptografia e proteção digital.",
    keywords:
      /\b(cibersegurança|ciber|segurança digital|seguranca cibernética|seguranca cibernetica|lgpd|privacidade|vazamento|dados pessoais|criptografia|fraude digital)\b/i,
  },
  {
    id: "internet-telecom",
    label: "Internet & Telecom (5G)",
    icon: Globe,
    description: "Infraestrutura de redes, expansão da faixa 5G, banda larga e normas da Anatel.",
    keywords:
      /\b(internet|5g|telecom|telecomunicações|telecomunicacoes|anatel|banda larga|fibra óptica|fibra optica|conectividade|redes)\b/i,
  },
  {
    id: "computacao",
    label: "Computação & Dispositivos",
    icon: Smartphone,
    description: "Smartphones, semicondutores, sistemas operacionais e hardware de computação.",
    keywords:
      /\b(smartphone|smartphones|celular|celulares|computação|computacao|computador|computadores|chip|semicondutores|hardware|dispositivos|aplicativo|software)\b/i,
  },
  {
    id: "inovacao",
    label: "Inovação Pública & Gov.br",
    icon: Building,
    description: "Transformação digital do Estado, Pix, dados abertos e serviços públicos eletrônicos.",
    keywords:
      /\b(inovação|inovacao|transformação digital|transformacao digital|gov\.br|pix|dados abertos|serviços públicos digitais|sistema digital|modernização|modernizacao)\b/i,
  },
];

// RegEx geral para capturar artigos com relevância comprovada em Tecnologia
const GENERAL_TECH_REGEX =
  /\b(tecnologia|tecnologias|inovação|inovacao|inteligência artificial|inteligencia artificial|\bia\b|algoritmo|cibersegurança|cibernética|cibernetica|segurança digital|computação|computacao|computador|smartphone|celular|internet|banda larga|5g|telecom|dados abertos|transformação digital|pix|sistema digital|automação|automacao|software|hardware|semicondutores|biometria|criptografia|lgpd)\b/i;

export const TecnologiaPage: React.FC<TecnologiaPageProps> = ({
  articles = [],
  onOpenArticleDetails,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<TechTopicId>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Filtra notícias genuínas de tecnologia a partir do acervo do portal
  const allTechArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];

    const filtered = articles.filter((article) => {
      // 1.1 Categoria explícita Tecnologia
      if ((article.category as string) === "Tecnologia") return true;

      // 1.2 Tags de tecnologia
      if (
        article.tags?.some((t) =>
          [
            "Tecnologia",
            "Inovação",
            "Inteligência Artificial",
            "IA",
            "Cibersegurança",
            "Segurança Digital",
            "Internet",
            "Computação",
            "Smartphones",
            "Telecomunicações",
            "Ciência e Tecnologia",
          ].includes(t)
        )
      ) {
        return true;
      }

      // 1.3 Verificação contextual de termos no título ou resumo
      const contentText = `${article.title || ""} ${article.summary || ""}`;
      return GENERAL_TECH_REGEX.test(contentText);
    });

    return sortNewsItems(deduplicateNewsItems(filtered));
  }, [articles]);

  // 2. Aplica filtro de tópico específico e busca de texto
  const displayedArticles = useMemo(() => {
    let result = allTechArticles;

    // Filtro por tópico
    if (selectedTopic !== "todos") {
      const topicConfig = TECH_TOPICS.find((t) => t.id === selectedTopic);
      if (topicConfig) {
        result = result.filter((article) => {
          const contentText = `${article.title || ""} ${article.summary || ""} ${(article.tags || []).join(" ")}`;
          return topicConfig.keywords.test(contentText);
        });
      }
    }

    // Filtro por termo de busca
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(q) ||
          article.summary.toLowerCase().includes(q) ||
          article.source.toLowerCase().includes(q) ||
          article.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allTechArticles, selectedTopic, searchQuery]);

  const activeTopicConfig = TECH_TOPICS.find((t) => t.id === selectedTopic) || TECH_TOPICS[0];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Cabeçalho Editorial do Caderno de Tecnologia */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Caderno de Tecnologia &amp; Inovação · Sociedade Ativa</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Tecnologia, Inovação &amp; Transformação Digital
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Acompanhe a cobertura de inteligência artificial, computação em nuvem, cibersegurança, telecomunicações (5G), smartphones e diretrizes de inovação pública e regulação digital no Brasil, com base em fontes oficiais e documentação primária.
          </p>

          {/* Atalhos Rápidos entre Seções */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <span className="text-slate-500">Navegue por Caderno:</span>
            <PortalLink
              route="home"
              className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
            >
              Capa Principal &rarr;
            </PortalLink>
            <PortalLink
              route="noticias"
              className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Últimas Notícias &rarr;
            </PortalLink>
            <PortalLink
              route="economia"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Economia &amp; B3 &rarr;
            </PortalLink>
            <PortalLink
              route="politica"
              className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
            >
              Política &rarr;
            </PortalLink>
            <PortalLink
              route="esportes"
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              Esportes &rarr;
            </PortalLink>
          </div>
        </div>

        {/* 2. Barra de Tópicos e Busca Temática */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar por Área Tecnológica:</span>
            </div>

            {/* Campo de Busca Rápida de Notícias de Tecnologia */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar termos em tecnologia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar termos e notícias em tecnologia"
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-slate-600 text-xs font-bold rounded-md cursor-pointer"
                  title="Limpar busca"
                  aria-label="Limpar busca de tecnologia"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Abas de Tópicos Responsivas */}
          <div role="tablist" aria-label="Áreas tecnológicas" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TECH_TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isActive = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Filtrar por área tecnológica: ${topic.label}`}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-3 min-h-[44px] rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "bg-indigo-900 text-white border-indigo-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-300" : "text-indigo-600"}`} />
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    )}
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs block leading-tight">
                      {topic.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Grade Principal: Lista de Notícias Oficiais & Painel Informativo Lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Coluna Principal: Matérias Reais da Editoria */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span>{activeTopicConfig.label}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTopicConfig.description}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
                  {displayedArticles.length}{" "}
                  {displayedArticles.length === 1 ? "matéria verificada" : "matérias verificadas"}
                </span>
              </div>

              {/* Lista de Artigos Genuínos */}
              {displayedArticles.length > 0 ? (
                <div className="space-y-4 divide-y divide-slate-100">
                  {displayedArticles.map((art, idx) => (
                    <article
                      key={art.id}
                      className={`flex flex-col justify-between gap-3 ${idx > 0 ? "pt-4" : ""}`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {art.category || "Tecnologia"}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{art.publishedAt}</span>
                          </span>
                        </div>

                        <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 hover:text-indigo-700 transition-colors">
                          <button
                            onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                            className="text-left cursor-pointer hover:underline"
                          >
                            {art.title}
                          </button>
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                          {art.summary}
                        </p>

                        <div className="text-[11px] text-slate-500 mt-2.5 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-50">
                          <span>
                            <strong>Fonte:</strong> {art.source}
                          </span>
                          {art.articleUrl && (
                            <>
                              <span>&middot;</span>
                              <a
                                href={art.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-700 hover:underline font-medium"
                              >
                                <span>Ver na fonte primária</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => onOpenArticleDetails && onOpenArticleDetails(art)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span>Ler Matéria Completa</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                /* Estado Vazio Neutro Sem Fabricações */
                <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Radio className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-800 mb-1">
                    Nenhuma matéria oficial de tecnologia encontrada para este filtro
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-4">
                    O portal Sociedade Ativa trabalha exclusivamente com apurações e dados de fontes públicas oficiais (EBC, Ministérios, Anatel, Banco Central e órgãos de pesquisa).
                  </p>
                  {(selectedTopic !== "todos" || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedTopic("todos");
                        setSearchQuery("");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 transition-colors cursor-pointer shadow-2xs"
                    >
                      Limpar Filtros e Ver Todas as Matérias
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral: Guias Regulatórios, Indicadores e Transparência Pública */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bloco 1: Radar Regulatório e Políticas Digitais do Brasil */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Radar Regulatório Digital</span>
              </div>
              <h3 className="font-heading font-black text-base text-slate-950 mb-2">
                Marcos Normativos &amp; Diretrizes
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Acompanhamento factual das principais legislações e políticas públicas tecnológicas em vigor ou tramitação no Congresso Nacional:
              </p>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="pt-2">
                  <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                    <span>Regulação da IA (PL 2338/2023)</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                      Senado
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Marco Legal de Inteligência Artificial: categorização de risco, governança de dados e salvaguardas de direitos autorais e civis.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                    <span>Segurança Cibernética (PNCiber)</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                      Decreto 11.856
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Política Nacional de Cibersegurança: coordenação de resposta a incidentes críticos e cooperação entre órgãos federais e Defesa.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                    <span>Expansão 5G &amp; Anatel</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono">
                      3,5 GHz
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Liberação de radiofrequências para operadoras móveis e compromissos de cobertura e conectividade escolar em áreas remotas.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                    <span>LGPD &amp; ANPD</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                      Lei 13.709
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Fiscalização do tratamento de dados pessoais, sanções administrativas e normas de transparência para agentes de tratamento.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco de Afiliados e Recomendações Tecnológicas */}
            <AffiliateSection compact={true} />

            {/* Bloco 2: Diretrizes de Jornalismo Tecnológico e Fontes Verificadas */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Metodologia &amp; Fontes</span>
              </div>
              <h3 className="font-heading font-black text-base text-white mb-2">
                Fontes Primárias Auditáveis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                O Sociedade Ativa não publica rumores de mercado nem gera notícias sintéticas. As apurações baseiam-se em:
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Atos normativos e publicações do Diário Oficial da União (DOU).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Despachos da Agência Brasil, EBC e canais de imprensa oficiais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Relatórios técnicos do Comitê Gestor da Internet no Brasil (CGI.br / NIC.br).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Resoluções técnicas da Anatel e do Banco Central do Brasil.</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Auditoria pública de dados e transparência governamental.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
