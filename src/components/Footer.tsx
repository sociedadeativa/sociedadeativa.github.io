import React from "react";
import { ArrowUp, ShieldCheck, ExternalLink, FileText, Database, Landmark, BookOpen } from "lucide-react";
import { PortalLink } from "./PortalLink";

interface FooterProps {
  onOpenMethodology: () => void;
  onOpenDataInspector: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenMethodology,
  onOpenDataInspector,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 py-12 sm:py-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bloco Superior: Marca e Propósito Editorial */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          {/* Coluna 1 & 2: Identidade e Manifesto */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-heading font-black text-xs tracking-wider border border-blue-500 shadow-xs">
                SA
              </div>
              <span className="font-heading text-lg font-black text-white uppercase tracking-tight">
                Sociedade Ativa
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mb-4">
              Portal independente de jornalismo cívico e transparência de dados públicos do Brasil. Cobertura apartidária das eleições presidenciais, dinâmica do Congresso Nacional, atos dos Três Poderes e indicadores econômicos oficiais do Estado brasileiro.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Compromisso com fontes primárias oficiais e neutralidade factual.</span>
            </div>
          </div>

          {/* Coluna 3: Navegação do Portal */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
              Cadernos Editoriais
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <PortalLink route="home" className="hover:text-white transition-colors">
                  Início (Capa Geral)
                </PortalLink>
              </li>
              <li>
                <PortalLink route="politica" className="hover:text-white transition-colors">
                  Política &amp; Poderes
                </PortalLink>
              </li>
              <li>
                <PortalLink route="eleicoes" className="hover:text-white transition-colors">
                  Eleições &amp; Apuração
                </PortalLink>
              </li>
              <li>
                <PortalLink route="economia" className="hover:text-white transition-colors">
                  Economia &amp; Indicadores
                </PortalLink>
              </li>
              <li>
                <PortalLink route="estados" className="hover:text-white transition-colors">
                  Brasil por Estado
                </PortalLink>
              </li>
              <li>
                <PortalLink route="dados-publicos" className="hover:text-white transition-colors">
                  Dados Públicos
                </PortalLink>
              </li>
              <li>
                <PortalLink route="noticias" className="hover:text-white transition-colors">
                  Últimas Notícias
                </PortalLink>
              </li>
              <li>
                <PortalLink route="esportes" className="hover:text-white transition-colors">
                  Esportes &amp; Futebol
                </PortalLink>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Transparência e Métodos */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
              Metodologia &amp; Dados
            </h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <PortalLink route="sobre" className="hover:text-white transition-colors">
                  Sobre o Projeto
                </PortalLink>
              </li>
              <li>
                <button
                  onClick={onOpenMethodology}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Critérios de Totalização TSE
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenDataInspector}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Inspeção JSON dos Dados
                </button>
              </li>
              <li>
                <a
                  href="https://divulgacandcontas.tse.jus.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Portal DivulgaCandContas</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://sidra.ibge.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>IBGE SIDRA (Estatísticas)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.bcb.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Banco Central (SGS/PTAX)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 5: Institucional e Contato */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white mb-3">
              Institucional
            </h3>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <span className="block text-slate-300 font-semibold">Contato Editorial:</span>
                <a
                  href="mailto:redacao.sociedadeativa@gmail.com"
                  className="text-slate-400 hover:text-white font-mono text-[11px] transition-colors"
                >
                  redacao.sociedadeativa@gmail.com
                </a>
              </li>
              <li className="pt-2">
                <span className="block text-slate-300 font-semibold">Auditoria Pública:</span>
                <span className="text-slate-400">Dados abertos com total rastreabilidade governamental.</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs font-medium"
                >
                  <span>Voltar ao topo</span>
                  <ArrowUp className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bloco Inferior: Direitos, Atribuições e Licença */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            <span>
              &copy; {new Date().getFullYear()} Sociedade Ativa. Conteúdo jornalístico e visualização cívica de dados abertos brasileiros.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span>Fontes Oficiais: TSE · IBGE · BCB · EBC · Agência Câmara · Agência Senado · STF</span>
            <span className="text-slate-700 hidden sm:inline" aria-hidden="true">·</span>
            <PortalLink route="sobre" className="hover:text-white underline underline-offset-2">
              Política de Transparência
            </PortalLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
