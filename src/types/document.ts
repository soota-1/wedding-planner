export type DocumentType = 'baptism_certificate' | 'kpp_certificate' | 'civil_n1_n4' | 'other';

export type DocumentCategory = 'church_canonical' | 'civil_disdukcapil' | 'vendor_contract' | 'other';

export type DocumentOwner = 'groom' | 'bride' | 'both';

export type DocumentStatus = 'pending' | 'verified' | 'expired' | 'rejected';

export interface WeddingDocument {
  id: string;
  workspaceId: string;
  title: string;
  documentType: DocumentType;
  category: DocumentCategory;
  owner: DocumentOwner;
  fileUrl?: string | null;
  fileType?: string | null;
  status: DocumentStatus;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface ComplianceSummary {
  totalDocuments: number;
  verifiedCount: number;
  pendingCount: number;
  expiredCount: number;
  rejectedCount: number;
  complianceRate: number;
}
