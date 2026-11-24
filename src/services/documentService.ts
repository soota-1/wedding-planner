import { differenceInCalendarDays } from 'date-fns';
import { supabase } from '../config/supabase';
import { WeddingDocument, ComplianceSummary, DocumentStatus } from '../types/document';

export function isBaptismCertificateValid(issueDate: Date, weddingDate: Date): boolean {
  const diffDays = differenceInCalendarDays(weddingDate, issueDate);
  // Surat baptis Katolik valid jika diterbitkan maksimal 180 hari sebelum hari H dan tidak di masa depan setelah hari H
  return diffDays >= 0 && diffDays <= 180;
}

export function calculateDocumentCompliance(
  documents: WeddingDocument[],
  weddingDate: Date
): ComplianceSummary {
  const totalDocuments = documents.length;
  let verifiedCount = 0;
  let pendingCount = 0;
  let expiredCount = 0;
  let rejectedCount = 0;

  documents.forEach((doc) => {
    let effectiveStatus: DocumentStatus = doc.status;

    // Evaluasi otomatis masa berlaku surat baptis jika tanggal terbit ada
    if (doc.documentType === 'baptism_certificate' && doc.issueDate) {
      const isValid = isBaptismCertificateValid(new Date(doc.issueDate), weddingDate);
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
  static async getDocumentsByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('wedding_documents')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data;
  }

  static async registerDocument(workspaceId: string, doc: Partial<WeddingDocument>) {
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
    return data?.[0];
  }

  static async verifyDocument(documentId: string, status: DocumentStatus) {
    const { data, error } = await supabase
      .from('wedding_documents')
      .update({ status })
      .eq('id', documentId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  }
}
