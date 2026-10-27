export type AffiliateMerchant = 'Mercado Livre' | 'Amazon Brasil' | 'Shopee';

export type AffiliateStatus = 'active' | 'disabled';

export type ReviewStatus = 'verified' | 'flagged_for_manual_review' | 'invalid';

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  merchant: AffiliateMerchant;
  categories: string[];
  status: AffiliateStatus;
  needsReview: boolean;
  reviewStatus?: ReviewStatus;
  reviewReason?: string;
  lastValidatedAt?: string;
}

export interface AffiliateValidationResult {
  productId: string;
  merchant: AffiliateMerchant;
  name: string;
  url: string;
  isValid: boolean;
  status: AffiliateStatus;
  needsReview: boolean;
  reviewStatus: ReviewStatus;
  reason?: string;
}
