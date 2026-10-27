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
        hostname === "amazon.com.br" ||
        hostname.endsWith(".amazon.com.br") ||
        hostname === "amazon.com" ||
        hostname.endsWith(".amazon.com");
      const isAmazonShortener =
        hostname === "amzn.to" ||
        hostname.endsWith(".amzn.to") ||
        hostname === "link.amazon" ||
        hostname.endsWith(".link.amazon");

      if (!isAmazonStandard && !isAmazonShortener) {
        return {
          isValid: false,
          status: "disabled",
          reviewStatus: "invalid",
          reason: `Domínio incompatível para Amazon Brasil: "${hostname}". Esperado amazon.com.br, amzn.to ou link.amazon.`,
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
          reason: "Link encurtador oficial da Amazon (amzn.to / link.amazon) com formato válido; sinalizado para verificação manual do destino final.",
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
    id: "ml-dell-i5",
    name: "Notebook Dell i5",
    description: "Notebook portátil Dell equipado com processador Intel Core i5 para alta produtividade, estudos e trabalho corporativo.",
    imageUrl: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/dell/dell-15-intel-3530/media-gallery/laptop-dell-dc15250nt-bk-plastic-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&wid=4582&hei=2686&qlt=100,0&resMode=sharp2&size=4582,2686",
    affiliateUrl: "https://meli.la/1yBrTcP",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "hardware", "notebook"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "ml-kingston-nv3-1tb",
    name: "SSD Kingston NV3 1TB",
    description: "Unidade de estado sólido NVMe M.2 de alta velocidade para carregamento ágil do sistema operacional e aplicações.",
    imageUrl: "https://media.kingston.com/kingston/product/SNV3S_1000GB_pkg-zm-lg.jpg",
    affiliateUrl: "https://meli.la/1eimyfJ",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "hardware", "armazenamento"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "ml-kingston-fury-beast-ddr5-16gb",
    name: "Memória RAM Kingston Fury Beast DDR5 16GB",
    description: "Módulo de memória RAM de alto desempenho DDR5 para estabilidade e velocidade em multitarefas e jogos.",
    imageUrl: "https://media.kingston.com/kingston/product/FURY_Beast_Black_DDR5_1-zm-lg.jpg",
    affiliateUrl: "https://meli.la/2JpxZ2G",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "hardware", "memoria"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "ml-tplink-ex1500",
    name: "Roteador TP-Link EX1500",
    description: "Roteador com tecnologia Wi-Fi 6 de última geração para máxima cobertura e estabilidade de conexão de rede.",
    imageUrl: "https://static.tp-link.com/upload/image-line/Front_large_20230331034453h.jpg",
    affiliateUrl: "https://meli.la/168szhH",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "internet-telecom", "redes", "roteador"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "ml-samsung-odyssey-g40",
    name: "Monitor Samsung Odyssey G40 27 polegadas",
    description: "Monitor gamer IPS com taxa de atualização de 240Hz e tempo de resposta de 1ms para fluidez e fidelidade visual.",
    imageUrl: "https://images.samsung.com/is/image/samsung/p6pim/br/ls27bg400elmzd/gallery/br-gaming-ls27bg400elmzd-ls--bg---elxzd-548310344?$1164_776_PNG$",
    affiliateUrl: "https://meli.la/2nGDQZd",
    merchant: "Mercado Livre",
    categories: ["tecnologia", "computacao", "perifericos", "monitores"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador meli.la com formato válido; sinalizado para verificação manual do destino final.",
  },

  // --- 5 Produtos Amazon Brasil ---
  {
    id: "amz-dell-15-i5-1334u",
    name: "Notebook Dell 15 i5-1334U",
    description: "Notebook Dell 15 polegadas com processador Intel Core i5 de 13ª geração para excelente performance multitarefa.",
    imageUrl: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/dell/dell-15-intel-3530/media-gallery/laptop-dell-dc15250nt-bk-plastic-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&wid=4535&hei=2908&qlt=100,0&resMode=sharp2&size=4535,2908",
    affiliateUrl: "https://link.amazon/B03AAtQeg",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "hardware", "notebook"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador link.amazon com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "amz-kingston-nv3-1tb",
    name: "SSD Kingston NV3 1TB",
    description: "Armazenamento SSD interno Kingston NV3 de 1TB com tecnologia PCIe 4.0 NVMe de rápida transferência.",
    imageUrl: "https://media.kingston.com/kingston/product/SNV3S_1000GB-zm-lg.jpg",
    affiliateUrl: "https://link.amazon/B0bY7jItD",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "hardware", "armazenamento"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador link.amazon com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "amz-kingston-fury-beast-ddr4-16gb",
    name: "Kit Kingston Fury Beast DDR4 16GB",
    description: "Kit de memória RAM Kingston Fury Beast DDR4 para upgrade de performance em sistemas desktop.",
    imageUrl: "https://www.kingstonstore.com.br/cdn/shop/products/DDR4FBKK21_7b235660-af7f-4653-a30a-777ab67994e8.jpg?v=1627489262&width=990",
    affiliateUrl: "https://link.amazon/B0bsPX8hM",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "hardware", "memoria"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador link.amazon com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "amz-logitech-m170",
    name: "Mouse Logitech M170",
    description: "Mouse óptico sem fio ergonômico e confiável com autonomia de até 12 meses de bateria.",
    imageUrl: "https://www.logitechstore.com.br/media/catalog/product/cache/105e6f420716e0751863c4b81f527d17/l/o/logitech_m170.webp",
    affiliateUrl: "https://link.amazon/B0gw4A1QN",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "perifericos", "mouse"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador link.amazon com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "amz-usb-c-7em1",
    name: "Hub USB-C 7 em 1",
    description: "Adaptador multifuncional USB-C com portas USB 3.0, HDMI 4K e leitor de cartões para conectividade completa.",
    imageUrl: "https://m.media-amazon.com/images/I/71meNHlW9LL._AC_SL1500_.jpg",
    affiliateUrl: "https://link.amazon/B03tbdDCd",
    merchant: "Amazon Brasil",
    categories: ["tecnologia", "computacao", "acessorios", "hub"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador link.amazon com formato válido; sinalizado para verificação manual do destino final.",
  },

  // --- 4 Produtos Shopee ---
  {
    id: "shp-tgt-m60-a1",
    name: "Teclado TGT M60 A1",
    description: "Teclado mecânico compacto no layout ABNT2 com iluminação e acionamento preciso de teclas.",
    imageUrl: "https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/t/g/tgt-m60a1-rbw01.jpg",
    affiliateUrl: "https://s.shopee.com.br/7Ky5D9KZD3",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "perifericos", "teclado"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador da Shopee com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "shp-tplink-ub500",
    name: "Adaptador TP-Link UB500 Bluetooth 5.3",
    description: "Nano adaptador USB com tecnologia Bluetooth 5.3 para conexão estável de periféricos e áudio sem fio.",
    imageUrl: "https://static.tp-link.com/upload/image-line/Overview_UB500_US_2312_01_large_20240105034224g.jpg",
    affiliateUrl: "https://s.shopee.com.br/30p63RUju2",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "acessorios", "bluetooth"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador da Shopee com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "shp-suporte-aluminio",
    name: "Suporte Articulado de Alumínio para Notebook",
    description: "Suporte ergonômico ajustável em liga de alumínio para ventilação térmica e alinhamento postural.",
    imageUrl: "https://down-br.img.susercontent.com/file/br-11134207-820m8-ml62cvdmyzuu02.webp",
    affiliateUrl: "https://s.shopee.com.br/9V2ZnSv2Jr",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "ergonomia", "acessorios"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador da Shopee com formato válido; sinalizado para verificação manual do destino final.",
  },
  {
    id: "shp-hub-usb-4portas",
    name: "Hub USB 4 Portas",
    description: "Hub extensor compacto com 4 portas USB para expansão rápida de periféricos em computadores e notebooks.",
    imageUrl: "https://down-br.img.susercontent.com/file/br-11134207-7qukw-lgrxdphnm8zve4.webp",
    affiliateUrl: "https://s.shopee.com.br/3LRwSHNg2J",
    merchant: "Shopee",
    categories: ["tecnologia", "computacao", "acessorios", "hub"],
    status: "active",
    needsReview: true,
    reviewStatus: "flagged_for_manual_review",
    reviewReason: "Link encurtador da Shopee com formato válido; sinalizado para verificação manual do destino final.",
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
    const isValid = isFormatValid && hasName && hasDescription && item.status === "active";

    let reason: string | undefined = undefined;
    if (!urlValidation.isValid) {
      reason = urlValidation.reason;
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
 * - Produtos desativados (status: 'disabled') ou com URL inválida são filtrados.
 * - Produtos com links válidos mas sinalizados para revisão manual (ex: encurtadores amzn.to/meli.la/link.amazon)
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
