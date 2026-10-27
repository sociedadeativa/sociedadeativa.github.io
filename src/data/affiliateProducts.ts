import {
  AffiliateProduct,
  AffiliateMerchant,
  AffiliateValidationResult,
  AffiliateStatus,
  ReviewStatus,
} from "../types/affiliate";

export const AFFILIATE_DISCLOSURE_TEXT =
  "Este conteúdo contém links de afiliados. Podemos receber uma comissão pelas compras realizadas, sem custo adicional para você.";

/**
 * Validador de formato e destino de URLs de afiliados.
 * - Mantém desativados (status: 'disabled') apenas produtos com links genuinamente inválidos ou incompatíveis.
 * - URLs encurtadas oficiais (amzn.to, meli.la, s.shopee.com.br, shope.ee) cujo redirecionamento
 *   externo não pode ser auditado automaticamente permanecem ATIVAS e são sinalizadas para
 *   revisão manual (reviewStatus: 'flagged_for_manual_review').
 */
export function validateAffiliateUrl(
  url: string | undefined | null,
  merchant: AffiliateMerchant
): {
  isValid: boolean;
  status: AffiliateStatus;
  reviewStatus: ReviewStatus;
  reason?: string;
  isRedirectUncertain?: boolean;
} {
  if (!url || typeof url !== "string" || !url.trim()) {
    return {
      isValid: false,
      status: "disabled",
      reviewStatus: "invalid",
      reason: "URL vazia ou não fornecida.",
    };
  }

  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      status: "disabled",
      reviewStatus: "invalid",
      reason: "URL com formato/sintaxe inválido.",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      status: "disabled",
      reviewStatus: "invalid",
      reason: "Protocolo inseguro: links de afiliados devem utilizar estritamente HTTPS.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  switch (merchant) {
    case "Mercado Livre": {
      const isMeliStandard =
        hostname === "mercadolivre.com.br" ||
        hostname.endsWith(".mercadolivre.com.br") ||
        hostname === "mercadolivre.com" ||
        hostname.endsWith(".mercadolivre.com");
      const isMeliShortener = hostname === "meli.la" || hostname.endsWith(".meli.la");

      if (!isMeliStandard && !isMeliShortener) {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: `Domínio incompatível para Mercado Livre: "${hostname}". Esperado mercadolivre.com.br ou meli.la.`,
        };
      }

      if (parsed.pathname === "/" || parsed.pathname === "") {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: "URL aponta para a raiz genérica do Mercado Livre sem apontamento para produto específico.",
        };
      }

      if (isMeliShortener) {
        return {
          isValid: true,
          status: "active",
          reviewStatus: "flagged_for_manual_review",
          isRedirectUncertain: true,
          reason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
        };
      }

      return {
        isValid: true,
        status: "active",
        reviewStatus: "verified",
      };
    }

    case "Amazon Brasil": {
      const isAmazonStandard =
        hostname === "amazon.com.br" || hostname.endsWith(".amazon.com.br");
      const isAmazonShortener = hostname === "amzn.to" || hostname.endsWith(".amzn.to");

      if (!isAmazonStandard && !isAmazonShortener) {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: `Domínio incompatível para Amazon Brasil: "${hostname}". Esperado amazon.com.br ou amzn.to.`,
        };
      }

      if (parsed.pathname === "/" || parsed.pathname === "") {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: "URL aponta para a página inicial genérica da Amazon sem direcionamento de produto ou tag de afiliado.",
        };
      }

      if (isAmazonShortener) {
        return {
          isValid: true,
          status: "active",
          reviewStatus: "flagged_for_manual_review",
          isRedirectUncertain: true,
          reason: "Link encurtador amzn.to com formato válido; sinalizado para verificação manual do destino final.",
        };
      }

      return {
        isValid: true,
        status: "active",
        reviewStatus: "verified",
      };
    }

    case "Shopee": {
      const isShopeeStandard =
        hostname === "shopee.com.br" || hostname.endsWith(".shopee.com.br");
      const isShopeeShortener =
        hostname === "s.shopee.com.br" ||
        hostname.endsWith(".s.shopee.com.br") ||
        hostname === "shope.ee" ||
        hostname.endsWith(".shope.ee");

      if (!isShopeeStandard && !isShopeeShortener) {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: `Domínio incompatível para Shopee: "${hostname}". Esperado shopee.com.br, s.shopee.com.br ou shope.ee.`,
        };
      }

      if (parsed.pathname === "/" || parsed.pathname === "") {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: "URL aponta para a página principal genérica da Shopee sem código de produto ou afiliado.",
        };
      }

      if (isShopeeShortener) {
        return {
          isValid: true,
          status: "active",
          reviewStatus: "flagged_for_manual_review",
          isRedirectUncertain: true,
          reason: "Link encurtador da Shopee com formato válido; sinalizado para verificação manual do destino final.",
        };
      }

      return {
        isValid: true,
        status: "active",
        reviewStatus: "verified",
      };
    }

    default:
      return {
        isValid: false,
        status: "disabled",
        reviewStatus: "invalid",
        reason: `Marketplace desconhecido: "${merchant}".`,
      };
  }
}

/**
 * 14 Registros de Produtos de Afiliados (5 Mercado Livre, 5 Amazon Brasil, 4 Shopee).
 * 
 * Estrutura oficial fonte da verdade. Não inventa, substitui nem modifica silenciosamente qualquer URL.
 * Preços estritamente omitidos (nenhum preço exibido).
 */
export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // --- 5 Produtos Mercado Livre ---
  {
    id: "ml-item-1",
    name: "Smartphone 5G com Processador Octa-Core",
    description: "Dispositivo móvel com suporte às novas faixas de conectividade 5G liberadas pela Anatel e homologação oficial.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "smartphone", "5g", "dispositivos"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "ml-item-2",
    name: "Roteador Wi-Fi 6 Gigabit Dual-Band",
    description: "Equipamento de rede para alta largura de banda e estabilidade em fibra óptica residencial e corporativa.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "internet-telecom", "redes"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "ml-item-3",
    name: "Câmera de Segurança Inteligente Wi-Fi Full HD",
    description: "Sistema de monitoramento com visão noturna, criptografia ponto a ponto e aplicativo de controle.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "ciberseguranca", "seguranca"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "ml-item-4",
    name: "Notebook Ultrafino com SSD NVMe e 16GB RAM",
    description: "Computador portátil para trabalho remoto, desenvolvimento de software e navegação com autonomia de bateria.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "hardware"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "ml-item-5",
    name: "No-break Interativo 1200VA com Estabilizador",
    description: "Proteção elétrica e autonomia para roteadores, servidores domésticos e computadores de teletrabalho.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "energia"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },

  // --- 5 Produtos Amazon Brasil ---
  {
    id: "amz-item-1",
    name: "Smart Speaker com Assistente de Voz Inteligente",
    description: "Hub de automação residencial compatível com comandos de voz, reprodução de notícias e gestão de rotinas.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "ia", "automacao", "dispositivos"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "amz-item-2",
    name: "Leitor Digital com Tela Antirreflexo e Luz Ajustável",
    description: "Dispositivo de leitura para documentos, legislação comentada e obras técnicas com baixo consumo energético.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "dispositivos", "produtividade"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "amz-item-3",
    name: "Chave de Segurança FIDO2 / U2F para Autenticação 2FA",
    description: "Dispositivo físico de criptografia para proteção de contas digitais e prevenção de ataques cibernéticos.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "ciberseguranca", "seguranca"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "amz-item-4",
    name: "SSD Externo Portátil 1TB USB 3.2 Tipo-C",
    description: "Armazenamento veloz e resistente a impactos para backup de dados sensíveis e grandes volumes de informação.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "armazenamento"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "amz-item-5",
    name: "Teclado Mecânico Ergonômico com Conexão Sem Fio",
    description: "Periférico para digitação prolongada com switches táteis de precisão e emparelhamento multi-dispositivo.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "acessorios"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },

  // --- 4 Produtos Shopee ---
  {
    id: "shp-item-1",
    name: "Cabo de Rede Patch Cord Cat6 Blindado 10 Metros",
    description: "Cabeamento estruturado de alta fidelidade para conexão direta ao modem, eliminando latências e interferências.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Shopee",
    categories: ["tecnologia", "internet-telecom", "redes"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "shp-item-2",
    name: "Adaptador USB-C Multiportas 7 em 1 com Saída HDMI 4K",
    description: "Hub de expansão para laptops e tablets modernos com portas USB 3.0, leitor de cartões e alimentação PD.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "acessorios"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "shp-item-3",
    name: "Suporte Articulado de Mesa com Ajuste de Altura para Monitor",
    description: "Acessório ergonômico com padrão VESA para alinhamento postural em jornadas intensivas de informática.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "ergonomia"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
  {
    id: "shp-item-4",
    name: "Filtro de Linha DPS Clamper com 5 Tomadas e Proteção contra Surtos",
    description: "Protetor eletrônico certificado para proteção de modems, roteadores e computadores contra descargas atmosféricas.",
    imageUrl: "",
    affiliateUrl: "",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "energia"],
    status: "disabled",
    needsReview: true,
    reviewStatus: "invalid",
    reviewReason: "URL e imagem do produto pendentes de fornecimento direto pelo proprietário na conversa.",
  },
];

/**
 * Executa auditoria em lote sobre todos os registros de afiliados.
 */
export function auditAffiliateProducts(
  products: AffiliateProduct[] = AFFILIATE_PRODUCTS
): AffiliateValidationResult[] {
  return products.map((item) => {
    const urlValidation = validateAffiliateUrl(item.affiliateUrl, item.merchant);
    const hasImage = Boolean(item.imageUrl && item.imageUrl.trim());
    const hasName = Boolean(item.name && item.name.trim());
    const hasDescription = Boolean(item.description && item.description.trim());

    // Não desativa produtos apenas porque redirecionamentos externos não podem ser auditados automaticamente
    const isFormatValid = urlValidation.isValid && urlValidation.status === "active";
    const isValid = isFormatValid && hasImage && hasName && hasDescription && item.status === "active";

    let reason: string | undefined = undefined;
    if (!urlValidation.isValid) {
      reason = urlValidation.reason;
    } else if (!hasImage) {
      reason = "Imagem do produto não fornecida.";
    } else if (!hasName || !hasDescription) {
      reason = "Nome ou descrição do produto incompletos.";
    } else if (item.status === "disabled") {
      reason = item.reviewReason || "Produto desativado no inventário.";
    } else if (urlValidation.isRedirectUncertain) {
      reason = urlValidation.reason;
    }

    return {
      productId: item.id,
      merchant: item.merchant,
      name: item.name,
      url: item.affiliateUrl,
      isValid,
      status: item.status,
      needsReview: item.needsReview || urlValidation.reviewStatus === "flagged_for_manual_review",
      reviewStatus: urlValidation.reviewStatus,
      reason,
    };
  });
}

/**
 * Retorna exclusivamente os produtos ativos e validados.
 * - Produtos desativados (status: 'disabled') ou com URL/imagem inválidos são filtrados.
 * - Produtos com links válidos mas sinalizados para revisão manual (ex: encurtadores amzn.to/meli.la)
 *   NÃO são bloqueados automaticamente se status === 'active'.
 */
export function getActiveAffiliateProducts(
  products: AffiliateProduct[] = AFFILIATE_PRODUCTS,
  categoryFilter?: string
): AffiliateProduct[] {
  return products.filter((item) => {
    if (item.status === "disabled") {
      return false;
    }

    if (!item.affiliateUrl || !item.affiliateUrl.trim()) {
      return false;
    }

    if (!item.imageUrl || !item.imageUrl.trim()) {
      return false;
    }

    const urlCheck = validateAffiliateUrl(item.affiliateUrl, item.merchant);
    if (!urlCheck.isValid || urlCheck.status === "disabled") {
      return false;
    }

    if (categoryFilter && categoryFilter !== "todos") {
      return item.categories.includes(categoryFilter.toLowerCase());
    }

    return true;
  });
}
