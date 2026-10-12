import React from "react";
import { PortalLink } from "../components/PortalLink";
import { AdBanner } from "../components/AdBanner";
import {
  ShieldCheck,
  BookOpen,
  Scale,
  Landmark,
  FileCheck2,
  ExternalLink,
  Database,
  ArrowRight,
} from "lucide-react";

interface SobrePageProps {
  onOpenDataInspector: () => void;
  onOpenMethodology: () => void;
}

export const SobrePage: React.FC<SobrePageProps> = ({
  onOpenDataInspector,
  onOpenMethodology,
}) => {
  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Página Sobre & Metodologia */}
        <div className="mb-10 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <span>Transparência Institucional &amp; Governança Editorial</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Sobre o Sociedade Ativa &amp; Metodologia de Dados
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Conheça o compromisso factual, os critérios constitucionais de apuração eleitoral, os pipelines automáticos de dados econômicos e os princípios editoriais do portal.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            <button
              onClick={onOpenMethodology}
              className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Ver Modal de Metodologia Eleitoral</span>
            </button>
            <button
              onClick={onOpenDataInspector}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspecionar Esquema JSON (TSE)</span>
            </button>
          </div>
        </div>

        {/* 1. Missão Editorial e Neutralidade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
            <div>
              <h2 className="font-heading text-2xl font-black text-slate-900 mb-3">
                1. Missão Editorial e Posicionamento Cívico
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                O <strong className="text-slate-900">Sociedade Ativa</strong> é um portal independente e apartidário de jornalismo de dados e transparência pública. Nosso objetivo é democratizar o acesso às informações sobre a política, as eleições, a economia e as estatísticas estaduais do Brasil.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                Pilares Fundamentais:
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">Fontes Primárias Estatais:</strong> Todos os dados exibidos provêm diretamente de órgãos oficiais — Tribunal Superior Eleitoral (TSE), Instituto Brasileiro de Geografia e Estatística (IBGE), Banco Central do Brasil (BCB), Agência Brasil (EBC), Agência Câmara, Agência Senado e Supremo Tribunal Federal (STF).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">Neutralidade Factual:</strong> As cores utilizadas nas categorias (vermelho para Política, azul para Eleições, verde para Economia, âmbar para Estados e roxo para Dados Públicos) são indicadores estritamente taxonômicos de editoria, não representando endosso a agremiações político-partidárias.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">Reprodutibilidade Aberta:</strong> Não utilizamos dados proprietários fechados ou estimativas amostrais sem metodologia documentada.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Identidade Institucional
              </span>
              <h3 className="font-heading text-lg font-black mb-3">
                Sociedade Ativa
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                &quot;Política, eleições, notícias e dados do Brasil.&quot;
              </p>
              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Domínio de Produção:</div>
                <div className="font-mono text-white text-xs">https://sociedadeativa.github.io/</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Contato da Redação
              </span>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                Expediente &amp; Comunicação
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Para correções factuais, dúvidas sobre metodologias ou sugestões de novas fontes abertas:
              </p>
              <a
                href="mailto:redacao.sociedadeativa@gmail.com"
                className="font-mono text-xs font-bold text-blue-900 hover:underline"
              >
                redacao.sociedadeativa@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* 2. Metodologia Eleitoral Constitucional */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 mb-12">
          <h2 className="font-heading text-2xl font-black text-slate-900 mb-4">
            2. Critérios Constitucionais de Totalização Eleitoral (Art. 77 da CF/88)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="space-y-3">
              <p>
                A apuração do pleito presidencial segue estritamente o estabelecido pelo <strong className="text-slate-900">Artigo 77 da Constituição Federal de 1988</strong> e pelas Resoluções do TSE:
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">
                  Cálculo dos Votos Válidos Nominais:
                </span>
                <p>
                  Votos Válidos Nominais = Total de Votos Depositados &minus; (Votos em Branco + Votos Nulos). Os percentuais individuais de cada candidato são calculados dividindo-se seus votos nominais pelo total de votos válidos nominais.
                </p>
              </div>
              <p>
                A Constituição exige a maioria absoluta de votos válidos nominais (mais de 50%) para eleição em 1º turno. Caso nenhum concorrente atinja esse limiar, realiza-se o segundo turno entre os dois primeiros colocados.
              </p>
            </div>

            <div className="space-y-3">
              <p>
                Nas <strong className="text-slate-900">Eleições Gerais de 2026</strong>, foram registrados:
              </p>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span>Eleitorado Apto Total:</span>
                  <strong className="font-mono text-slate-900">156.454.011 eleitores</strong>
                </li>
                <li className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span>Comparecimento às Urnas:</span>
                  <strong className="font-mono text-slate-900">131.247.443 (83,89%)</strong>
                </li>
                <li className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span>Taxa de Abstenção Oficial:</span>
                  <strong className="font-mono text-slate-900">25.206.568 (16,11%)</strong>
                </li>
                <li className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span>Votos Válidos Nominais:</span>
                  <strong className="font-mono text-slate-900">125.234.619 (95,42%)</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. Pipeline de Dados Econômicos e Fontes Governamentais */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 mb-12">
          <h2 className="font-heading text-2xl font-black text-slate-900 mb-4">
            3. Pipeline Automatizado de Dados Econômicos (IBGE e Banco Central)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-heading text-base font-bold text-slate-900">
                IBGE — SIDRA (Sistema de Recuperação Automática)
              </h3>
              <p>
                Consumido via script agendado duas vezes ao dia (10:00 UTC e 13:00 UTC). Captura o IPCA oficial mensal da Tabela 7060, o Produto Interno Bruto trimestral da Tabela 1846 e a taxa de desocupação da PNAD Contínua da Tabela 4099.
              </p>
              <a
                href="https://sidra.ibge.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>Documentação do SIDRA / IBGE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Banco Central do Brasil — SGS &amp; PTAX
              </h3>
              <p>
                A Taxa Selic Meta fixada pelo Copom é auditada pela Série SGS 432. O câmbio comercial de fechamento do Dólar Americano em Reais é consultado diretamente do serviço oficial PTAX (Série SGS 10813), garantindo conformidade com as cotações de referência do mercado.
              </p>
              <a
                href="https://dadosabertos.bcb.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>Catálogo de Dados Abertos do BCB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <AdBanner format="in-feed" />
      </div>
    </div>
  );
};
