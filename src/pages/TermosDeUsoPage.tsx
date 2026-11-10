import React from "react";
import { PortalLink } from "../components/PortalLink";
import {
  FileText,
  ShieldAlert,
  Scale,
  Landmark,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Info,
  Mail,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const TermosDeUsoPage: React.FC = () => {
  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegação Estruturada (Breadcrumbs) */}
        <nav
          aria-label="Caminho de navegação"
          className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium"
        >
          <PortalLink route="home" className="hover:text-blue-900 transition-colors">
            Início
          </PortalLink>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800 font-semibold" aria-current="page">
            Termos de Uso
          </span>
        </nav>

        {/* Cabeçalho Editorial */}
        <header className="mb-10 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            <Scale className="w-4 h-4 text-blue-700" />
            <span>Governança &amp; Condições Gerais de Acesso</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Termos de Uso do Sociedade Ativa
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-3xl leading-relaxed">
            Diretrizes gerais, finalidade institucional, parâmetros de propriedade intelectual, responsabilidade editorial e regras de utilização aceitável do portal de dados cívicos e jornalismo do Brasil.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
              <span>Última revisão formal:</span>
              <strong className="text-slate-900">10 de novembro de 2026</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-medium">
              <span>Jurisdição:</span>
              <strong className="text-blue-950">República Federativa do Brasil</strong>
            </span>
          </div>
        </header>

        {/* Aviso de Transparência sobre Dados Cadastrais */}
        <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold text-amber-900 block text-sm">
                Nota de Transparência Institucional &amp; Dados Cadastrais
              </strong>
              <p className="text-amber-900/90">
                O <strong className="text-amber-950">Sociedade Ativa</strong> é mantido como uma iniciativa digital independente de jornalismo cívico e consolidação de dados públicos abertos. Informações cadastrais complementares eventualmente exigíveis para fins corporativos ou societários formais (como número de CNPJ, endereço físico de sede e representantes estatutários) dependem de confirmação direta e registro por parte do proprietário e mantenedor da plataforma. Para qualquer esclarecimento institucional ou notificação, o canal oficial e verificado de atendimento é <a href="mailto:redacao.sociedadeativa@gmail.com" className="font-mono font-semibold underline hover:text-amber-950">redacao.sociedadeativa@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Corpo dos Termos de Uso em Seções Claras */}
        <article className="space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Seção 1 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                1
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Objeto e Finalidade da Plataforma
              </h2>
            </div>
            <p>
              Estes Termos de Uso regem o acesso e a utilização dos serviços, conteúdos, mapas, estatísticas e ferramentas disponibilizados pelo portal <strong className="text-slate-900">Sociedade Ativa</strong> (acessível no endereço <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">https://sociedadeativa.github.io/</code>).
            </p>
            <p>
              A finalidade precípua do portal é o exercício do jornalismo cívico, o incentivo à transparência pública e a democratização do acesso a estatísticas governamentais primárias relativas a eleições, poderes da República, indicadores econômicos oficiais, dinâmica do Congresso Nacional e dados estaduais do Brasil.
            </p>
            <p>
              Ao navegar, acessar ou utilizar qualquer seção deste portal, o usuário declara ter lido, compreendido e concordado com as condições dispostas nestes Termos de Uso e na nossa{" "}
              <PortalLink route="politica-de-privacidade" className="text-blue-800 font-semibold underline hover:text-blue-900">
                Política de Privacidade
              </PortalLink>.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                2
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Natureza do Conteúdo Editorial e Fontes Primárias
              </h2>
            </div>
            <p>
              O Sociedade Ativa atua como curador e sintetizador factual de informações de interesse público. A base de dados estruturados exibida no portal decorre exclusivamente de fontes primárias oficiais mantidas pelo Estado brasileiro, incluindo:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm">
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">TSE:</strong> Dados eleitorais, totalizações e DivulgaCandContas.</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">IBGE:</strong> Séries históricas, inflação (IPCA) e estatísticas territoriais.</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Banco Central (BCB):</strong> Taxa Selic, cotação PTAX e Boletim Focus.</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Comunicação Oficial:</strong> Agência Brasil (EBC), Agência Câmara, Senado e STF.</span>
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              O portal preserva rigorosa neutralidade partidária: eventuais distinções visuais por cores em seções temáticas representam critérios taxonômicos organizacionais, sem qualquer conotação ideológica.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                3
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Propriedade Intelectual e Licenciamento
              </h2>
            </div>
            <p>
              A identidade visual, layout, marca Sociedade Ativa, compilações editoriais, códigos-fonte de visualização interativa e textos de síntese autoral são protegidos pela legislação de direitos autorais e propriedade intelectual (Lei Federal nº 9.610/1998).
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Dados Públicos Abertos:</strong>
                Os dados estatísticos governamentais primários (TSE, IBGE, BCB) obedecem ao princípio da publicidade e à Lei de Acesso à Informação (Lei nº 12.527/2011), pertencendo ao domínio público ou sendo regidos por termos abertos estatais.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Citação e Reprodução Justa:</strong>
                É permitida a citação de análises ou sínteses do portal para fins educacionais, científicos ou jornalísticos, desde que atribuída expressamente a autoria ao <strong className="text-slate-900">Sociedade Ativa</strong> com a inclusão de hiperlink canônico para a matéria original.
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                4
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Regras de Uso Aceitável e Vedações Técnicas
              </h2>
            </div>
            <p>
              Ao utilizar o Sociedade Ativa, o usuário compromete-se a fazê-lo de maneira ética, lícita e consoante com as boas práticas da internet e com o Marco Civil da Internet (Lei nº 12.965/2014). São expressamente proibidas as seguintes condutas:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Praticar raspagem de dados excessiva (scraping abusivo) ou disparar requisições automatizadas em frequência desproporcional que degradem a estabilidade da infraestrutura ou sobrecarreguem APIs públicas integradas.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Tentar violar mecanismos de segurança, injetar código malicioso, realizar ataques de negação de serviço (DoS/DDoS) ou adulterar conteúdos estáticos e dinâmicos do portal.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Utilizar o nome ou a marca da Sociedade Ativa para disseminar desinformação, notícias fraudulentas (fake news) ou associar indevidamente o portal a candidaturas políticas específicas.</span>
              </li>
            </ul>
          </section>

          {/* Seção 5 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                5
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Links Externos e Serviços de Terceiros
              </h2>
            </div>
            <p>
              O portal inclui links que direcionam o usuário a portais governamentais, agências oficiais de notícias e serviços de terceiros (como visualização de documentos da Câmara dos Deputados, Tribunal Superior Eleitoral e redes de distribuição de conteúdo).
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              O Sociedade Ativa não tem controle sobre as políticas de privacidade, termos de uso ou conteúdos de sites de terceiros, não assumindo responsabilidade por eventuais indisponibilidades, alterações em URLs governamentais externas ou alterações de informações em seus servidores de origem.
            </p>
          </section>

          {/* Seção 6 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                6
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Exatidão das Informações e Política de Retificação
              </h2>
            </div>
            <p>
              Empregamos esforços contínuos e procedimentos automatizados de validação de dados para assegurar que as estatísticas reflitam com exatidão as publicações dos órgãos estatais. Contudo, em virtude de possíveis revisões ordinárias de dados por órgãos como IBGE ou Banco Central, eventuais defasagens temporais podem ocorrer entre a revisão oficial e a ingestão no portal.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              O portal adota política de transparência e retificação ágil: caso qualquer inconsistência seja verificada pela comunidade de leitores, as correções pertinentes serão introduzidas prontamente após validação junto à fonte primária oficial.
            </p>
          </section>

          {/* Seção 7 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                7
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Limitação de Responsabilidade
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
              <p className="font-semibold text-slate-900">
                Isenção para Fins de Aconselhamento Financeiro, Jurídico ou Decisório:
              </p>
              <p className="text-slate-600">
                O conteúdo econômico (incluindo cotações do Dólar PTAX, projeções de inflação, taxa Selic ou índices da B3) tem natureza estritamente informativa e de jornalismo público. Nenhuma informação exibida no Sociedade Ativa deve ser interpretada como consultoria de investimentos, recomendação de compra ou venda de ativos financeiros, consultoria jurídica ou orientação partidária eleitoral. O portal isenta-se expressamente de quaisquer perdas, danos ou prejuízos advindos de decisões individuais tomadas com base nas informações veiculadas.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              O serviço é disponibilizado no estado em que se encontra (&quot;as is&quot;), sem garantias implícitas de disponibilidade ininterrupta, visto que a infraestrutura depende de provedores de hospedagem estática e de conectividade pública.
            </p>
          </section>

          {/* Seção 8 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                8
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Alterações dos Termos de Uso
              </h2>
            </div>
            <p>
              O Sociedade Ativa reserva-se o direito de atualizar, revisar ou modificar estes Termos de Uso a qualquer momento para refletir novas funcionalidades do portal, alterações regulatórias ou avanços técnicos. Toda alteração substancial terá sua data de vigência atualizada no topo desta página. A continuidade no uso dos serviços após a publicação de modificações configura anuência aos novos termos.
            </p>
          </section>

          {/* Seção 9 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                9
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Legislação Aplicável e Foro
              </h2>
            </div>
            <p>
              Estes Termos de Uso são regidos, interpretados e executados segundo a legislação da República Federativa do Brasil, em particular a Lei nº 12.965/2014 (Marco Civil da Internet), a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD) e a Lei nº 9.610/1998 (Direitos Autorais).
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Para a resolução de eventuais controvérsias decorrentes da interpretação destes termos, as partes elegem preferencialmente o diálogo extrajudicial consensual via contato direto com a redação.
            </p>
          </section>

          {/* Seção 10 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 font-heading font-black text-sm flex items-center justify-center border border-blue-100">
                10
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Canal Oficial de Contato
              </h2>
            </div>
            <p>
              Para dúvidas sobre estes Termos de Uso, solicitação de esclarecimentos ou reporte de inconsistências em dados:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="w-4 h-4 text-blue-800 shrink-0" />
                <span className="font-semibold">Redação &amp; Governança:</span>
                <a
                  href="mailto:redacao.sociedadeativa@gmail.com"
                  className="font-mono text-blue-900 font-bold hover:underline"
                >
                  redacao.sociedadeativa@gmail.com
                </a>
              </div>
              <PortalLink
                route="sobre"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium underline underline-offset-2"
              >
                <span>Conheça a Metodologia Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          </section>
        </article>

        {/* Rodapé Interno com Links Rápidos */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Sociedade Ativa &copy; {new Date().getFullYear()} · Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <PortalLink route="politica-de-privacidade" className="text-blue-800 hover:underline font-medium">
              Política de Privacidade (LGPD)
            </PortalLink>
            <span aria-hidden="true">·</span>
            <PortalLink route="sobre" className="text-slate-700 hover:underline">
              Sobre o Projeto
            </PortalLink>
          </div>
        </div>
      </div>
    </div>
  );
};
