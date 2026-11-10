import React from "react";
import { PortalLink } from "../components/PortalLink";
import {
  ShieldCheck,
  Lock,
  Cookie,
  BarChart3,
  DollarSign,
  Server,
  UserCheck,
  FileText,
  Mail,
  Info,
  ExternalLink,
  ArrowRight,
  EyeOff,
} from "lucide-react";

export const PoliticaPrivacidadePage: React.FC = () => {
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
            Política de Privacidade
          </span>
        </nav>

        {/* Cabeçalho Editorial */}
        <header className="mb-10 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Privacidade, Proteção de Dados &amp; Conformidade LGPD</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
            Política de Privacidade do Sociedade Ativa
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-3xl leading-relaxed">
            Informações transparentes sobre o tratamento de dados pessoais, uso de cookies e métricas analíticas (GA4), veiculação de publicidade programática (Google AdSense e Google Reader Revenue Manager) e garantia dos direitos dos titulares conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
              <span>Última revisão formal:</span>
              <strong className="text-slate-900">10 de novembro de 2026</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              <span>Marco Legal:</span>
              <strong className="text-emerald-950">Lei Federal nº 13.709/2018 (LGPD)</strong>
            </span>
          </div>
        </header>

        {/* Aviso de Transparência sobre Agente de Tratamento e DPO */}
        <div className="mb-10 p-5 sm:p-6 rounded-2xl bg-slate-100/90 border border-slate-300 text-slate-900">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold text-slate-950 block text-sm">
                Nota de Transparência sobre Controlador e Encarregado pelo Tratamento de Dados (DPO)
              </strong>
              <p className="text-slate-700">
                O portal <strong className="text-slate-950">Sociedade Ativa</strong> é uma iniciativa digital aberta e independente dedicada ao jornalismo cívico e dados públicos. O tratamento de dados decorre estritamente da infraestrutura técnica necessária à veiculação do portal. Dados societários formais de registro de pessoa jurídica (como CNPJ de controladora, endereço postal e nomeação formal de encarregado externo com certificação) demandam confirmação e providência direta pelo proprietário da iniciativa. Para todas as demandas atinentes à privacidade, o canal de atendimento e encarregatura é: <a href="mailto:redacao.sociedadeativa@gmail.com" className="font-mono font-semibold underline text-blue-900 hover:text-blue-950">redacao.sociedadeativa@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Corpo da Política em Seções Claras e Estruturadas */}
        <article className="space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Seção 1 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                1
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Compromisso com a Privacidade e Marco Legal (LGPD)
              </h2>
            </div>
            <p>
              O Sociedade Ativa está comprometido com a proteção dos dados pessoais de seus leitores e usuários, pautando sua atuação pelos princípios de finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação e responsabilização, insculpidos no artigo 6º da Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 - LGPD).
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Esta Política de Privacidade descreve de forma clara e acessível como as informações são tratadas quando você visita e interage com nosso portal estático hospedado no GitHub Pages (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">https://sociedadeativa.github.io/</code>).
            </p>
          </section>

          {/* Seção 2 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                2
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Tratamento Mínimo e Dados que Coletamos
              </h2>
            </div>
            <p>
              Adotamos o princípio da minimização de dados (<em className="text-slate-800">privacy by default</em>). O Sociedade Ativa é um portal de livre acesso público para leitura de notícias e visualização de dados abertos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <EyeOff className="w-4 h-4 text-emerald-600" />
                  <span>Sem Cadastro ou Login</span>
                </div>
                <p className="text-slate-600">
                  Não exigimos criação de contas de usuário, login com senha, inserção de CPF, dados bancários ou número de telefone para navegar nas páginas e matérias.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Não Comercialização de Dados</span>
                </div>
                <p className="text-slate-600">
                  O Sociedade Ativa não comercializa, não aluga e não repassa bancos de dados pessoais para terceiros, corretores de dados (data brokers) ou finalidades de telemarketing.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Caso você entre em contato voluntariamente com nossa equipe por e-mail, utilizaremos seu endereço de correio eletrônico exclusivamente para responder à sua mensagem e dirimir sua dúvida ou solicitação.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                3
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Cookies e Armazenamento Local (localStorage)
              </h2>
            </div>
            <p>
              Cookies são pequenos arquivos de texto gravados no navegador do usuário para permitir o funcionamento adequado da aplicação web ou registrar preferências funcionais de interface.
            </p>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Cookies Técnicos e Estritamente Necessários:</strong>
                Garantem a navegação segura, carregamento de rotas e entrega das páginas web. Não podem ser desativados nos nossos sistemas sem prejudicar o funcionamento essencial do portal.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Armazenamento Local no Navegador (localStorage):</strong>
                Utilizado de forma mínima e exclusivamente local pelo cliente para preservar estados de usabilidade — como preferências de visualização de mapas, filtros eleitorais e memorização de modais já fechados pelo leitor. Essas informações permanecem no seu próprio dispositivo e não são transmitidas a servidores proprietários do Sociedade Ativa.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block mb-1">Cookies de Terceiros:</strong>
                Podem ser gerados por serviços integrados como o Google Analytics (para medição agregada de tráfego) e o Google AdSense (para veiculação de publicidade programática), conforme detalhado nas seções a seguir.
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                4
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Métricas e Análise de Audiência (Google Analytics 4)
              </h2>
            </div>
            <p>
              Para compreender o alcance editorial do portal e otimizar a experiência de leitura, utilizamos a ferramenta <strong className="text-slate-900">Google Analytics 4 (GA4)</strong>, vinculada ao identificador de medição oficial verificado <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono font-semibold">G-FVHPGPZTSL</code>.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Anonimização de IP:</strong> No Google Analytics 4, os endereços IP dos usuários são automaticamente truncados e não são armazenados de forma completa pelo Google, impedindo a identificação direta do indivíduo.</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Dados Coletados de Forma Agregada:</strong> Registram-se apenas métricas estatísticas globais, como páginas acessadas, tempo médio de permanência, tipo de dispositivo (desktop ou mobile), sistema operacional, navegador utilizado e região geográfica aproximada (nível de cidade/país).</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Carregamento Otimizado:</strong> O script da Google Tag é carregado de forma diferida (após a renderização crítica do conteúdo) para priorizar a velocidade de navegação e respeitar conexões móveis lentas.</span>
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              Para desativar o rastreamento do Google Analytics em todos os sites da internet, o usuário pode instalar o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline hover:text-blue-900 inline-flex items-center gap-1">Complemento de Desativação do Google Analytics <ExternalLink className="w-3 h-3" /></a> fornecido gratuitamente pelo Google.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                5
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Publicidade Digital e Monetização (Google AdSense &amp; Reader Revenue Manager)
              </h2>
            </div>
            <p>
              A sustentabilidade do Sociedade Ativa como veículo independente apoia-se em soluções de monetização digital fornecidas pelo Google, incluindo a plataforma <strong className="text-slate-900">Google AdSense</strong> (identificador de conta de editor comprovado <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono font-semibold">ca-pub-6825003561232826</code>) e recursos de apoio editorial através do <strong className="text-slate-900">Google Reader Revenue Manager</strong>.
            </p>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="text-slate-900 block font-bold">Cookies de Publicidade do Google e Parceiros:</strong>
                <p className="text-slate-600">
                  O Google e seus parceiros terceirizados utilizam cookies para exibir anúncios com base nas visitas anteriores dos usuários a este e a outros websites na internet. O uso de cookies de publicidade permite ao Google e a seus parceiros veicular anúncios contextuais ou personalizados para os usuários com base em seus interesses de navegação.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="text-slate-900 block font-bold">Gerenciamento e Desativação de Anúncios Personalizados:</strong>
                <p className="text-slate-600">
                  Você pode desativar a publicidade personalizada a qualquer momento acessando a página oficial de{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 underline hover:text-blue-900 font-medium inline-flex items-center gap-1"
                  >
                    Configurações de Anúncios do Google <ExternalLink className="w-3 h-3" />
                  </a>.
                  Alternativamente, é possível desativar cookies de publicidade comportamental de fornecedores terceirizados visitando portais como o{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 underline hover:text-blue-900 font-medium inline-flex items-center gap-1"
                  >
                    aboutads.info <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  ou a iniciativa{" "}
                  <a
                    href="https://www.youronlinechoices.com/br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 underline hover:text-blue-900 font-medium inline-flex items-center gap-1"
                  >
                    Your Online Choices Brasil <ExternalLink className="w-3 h-3" />
                  </a>.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 6 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                6
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Serviços e Provedores Terceirizados Integrados
              </h2>
            </div>
            <p>
              Para viabilizar a hospedagem, distribuição rápida de conteúdo e estética tipográfica, utilizamos os seguintes provedores técnicos verificados:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Hospedagem GitHub Pages (Microsoft Corporation):</strong> A infraestrutura física que serve os arquivos estáticos compilados do portal opera sob os padrões de segurança global do GitHub/Microsoft, que pode manter registros técnicos de conexão (logs de servidor) para proteção contra ataques cibernéticos e garantia de estabilidade.</span>
              </li>
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Google Fonts (Google LLC):</strong> As fontes tipográficas do portal (Plus Jakarta Sans, Manrope, JetBrains Mono) são carregadas via rede de entrega de conteúdo (CDN) do Google, sujeitas aos termos de privacidade daquela plataforma.</span>
              </li>
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Feeds e APIs Governamentais:</strong> Sincronizamos dados de canais abertos oficiais de órgãos estatais brasileiros (como EBC, Agência Câmara, IBGE e BCB) por meio de requisições de dados públicos.</span>
              </li>
            </ul>
          </section>

          {/* Seção 7 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                7
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Retenção de Informações
              </h2>
            </div>
            <p>
              Como o Sociedade Ativa não mantém banco de dados cadastral de leitores, não há retenção de dados pessoais identificáveis em servidores próprios.
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Os dados estatísticos agregados coletados pelo Google Analytics são retidos conforme as janelas padrão configuradas na ferramenta (geralmente entre 2 e 14 meses para eventos analíticos de navegação), após os quais são agregados de forma anônima ou descartados automaticamente pelo fornecedor.
            </p>
          </section>

          {/* Seção 8 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                8
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Direitos dos Titulares de Dados (Art. 18 da LGPD)
              </h2>
            </div>
            <p>
              Em observância ao artigo 18 da LGPD, todo titular de dados pessoais possui o direito de obter do controlador, a qualquer momento e mediante requisição formal:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700">
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Confirmação da existência de tratamento de dados;</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Acesso aos dados coletados;</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Correção de dados incompletos, inexatos ou desatualizados;</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Informação sobre entidades públicas e privadas com as quais o controlador compartilhou dados;</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Revogação do consentimento nos termos da lei.</span>
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-slate-600">
              Para exercer quaisquer desses direitos junto à equipe editorial, basta enviar mensagem para <a href="mailto:redacao.sociedadeativa@gmail.com" className="font-mono font-semibold text-blue-900 underline hover:text-blue-950">redacao.sociedadeativa@gmail.com</a>.
            </p>
          </section>

          {/* Seção 9 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                9
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Segurança da Informação
              </h2>
            </div>
            <p>
              Implementamos salvaguardas técnicas e organizacionais condizentes com a estrutura de um portal de notícias estático para proteger os dados contra acessos não autorizados ou destruição ilícita:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Criptografia HTTPS/TLS:</strong> Toda a transmissão de dados entre seu navegador e os servidores de distribuição do GitHub Pages é protegida por criptografia de ponta a ponta via certificado TLS/SSL.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Cabeçalhos de Segurança HTTP:</strong> Implementação de diretivas como <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">X-Content-Type-Options: nosniff</code> e políticas de referrer restritas para mitigar vulnerabilidades e ataques de MIME-sniffing.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Arquitetura Jamstack Estática:</strong> A ausência de banco de dados SQL conectado ao cliente reduz a superfície de vulnerabilidades convencionais da web (como SQL injection).</span>
              </li>
            </ul>
          </section>

          {/* Seção 10 */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-heading font-black text-sm flex items-center justify-center border border-emerald-100">
                10
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                Canal do Encarregado de Proteção de Dados (DPO) &amp; Contato
              </h2>
            </div>
            <p>
              Para esclarecer dúvidas sobre esta Política de Privacidade, solicitar a aplicação de direitos da LGPD ou enviar comunicações pertinentes à proteção de dados:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold">Encarregado / Redação:</span>
                <a
                  href="mailto:redacao.sociedadeativa@gmail.com"
                  className="font-mono text-emerald-900 font-bold hover:underline"
                >
                  redacao.sociedadeativa@gmail.com
                </a>
              </div>
              <PortalLink
                route="termos-de-uso"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium underline underline-offset-2"
              >
                <span>Consultar Termos de Uso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </PortalLink>
            </div>
          </section>
        </article>

        {/* Rodapé Interno com Links Rápidos */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Sociedade Ativa &copy; {new Date().getFullYear()} · Conformidade com a Lei Federal nº 13.709/2018 (LGPD).</span>
          <div className="flex items-center gap-4">
            <PortalLink route="termos-de-uso" className="text-blue-800 hover:underline font-medium">
              Termos de Uso
            </PortalLink>
            <span aria-hidden="true">·</span>
            <PortalLink route="sobre" className="text-slate-700 hover:underline">
              Sobre &amp; Metodologia
            </PortalLink>
          </div>
        </div>
      </div>
    </div>
  );
};
