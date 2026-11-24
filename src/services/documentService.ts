import { differenceInCalendarDays, parseISO } from 'date-fns';
import { supabase } from '../config/supabase';
import { WeddingDocument, ComplianceSummary, DocumentStatus } from '../types/document';

export function mapDocumentRow(row: any): WeddingDocument {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    documentType: row.document_type,
    category: row.category,
    owner: row.owner,
    fileUrl: row.file_url ?? null,
    fileType: row.file_type ?? null,
    status: row.status,
    issueDate: row.issue_date ?? null,
    expiryDate: row.expiry_date ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}

export function isBaptismCertificateValid(issueDate: Date, weddingDate: Date): boolean {
  const diffDays = differenceInCalendarDays(weddingDate, issueDate);
  // Surat baptis Katolik valid jika diterbitkan maksimal 180 hari sebelum hari H dan tidak di masa depan setelah hari H
  return diffDays >= 0 && diffDays <= 180;
}

export function calculateDocumentCompliance(
  documents: WeddingDocument[] = [],
  weddingDate: Date
): ComplianceSummary {
  const totalDocuments = documents.length;
  let verifiedCount = 0;
  let pendingCount = 0;
  let expiredCount = 0;
  let rejectedCount = 0;

  documents.forEach((doc) => {
    let effectiveStatus: DocumentStatus = doc.status;

    // Evaluasi otomatis masa berlaku surat baptis jika tanggal terbit ada dan belum di-reject secara eksplisit
    if (doc.documentType === 'baptism_certificate' && doc.issueDate && doc.status !== 'rejected') {
      const issueDateParsed = typeof doc.issueDate === 'string' ? parseISO(doc.issueDate) : doc.issueDate;
      const isValid = isBaptismCertificateValid(issueDateParsed, weddingDate);
      if (!isValid) {
        effectiveStatus = 'expired';
      }
    }

    if (effectiveStatus === 'verified') {
      verifiedCount++;
    } else if (effectiveStatus === 'expired') {
      expiredCount++;
    } else if (effectiveStatus === 'rejected') {
      rejectedCount++;
    } else {
      pendingCount++;
    }
  });

  const complianceRate =
    totalDocuments > 0 ? Math.round((verifiedCount / totalDocuments) * 100) : 0;

  return {
    totalDocuments,
    verifiedCount,
    pendingCount,
    expiredCount,
    rejectedCount,
    complianceRate,
  };
}

export class DocumentService {
  static async getDocumentsByWorkspace(workspaceId: string): Promise<WeddingDocument[]> {
    const { data, error } = await supabase
      .from('wedding_documents')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return (data || []).map(mapDocumentRow);
  }

  static async registerDocument(workspaceId: string, doc: Partial<WeddingDocument>): Promise<WeddingDocument> {
    const { data, error } = await supabase
      .from('wedding_documents')
      .insert({
        workspace_id: workspaceId,
        title: doc.title,
        document_type: doc.documentType || 'other',
        category: doc.category || 'other',
        owner: doc.owner || 'both',
        file_url: doc.fileUrl,
        file_type: doc.fileType,
        status: doc.status || 'pending',
        issue_date: doc.issueDate,
        expiry_date: doc.expiryDate,
        notes: doc.notes,
      })
      .select();

    if (error) throw error;
    return mapDocumentRow(data?.[0]);
  }

  static async verifyDocument(documentId: string, status: DocumentStatus) {
    const { data, error } = await supabase
      .from('wedding_documents')
      .update({ status })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] ? mapDocumentRow(data[0]) : null };
  }
}
