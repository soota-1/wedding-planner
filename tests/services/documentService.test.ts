import { isBaptismCertificateValid, calculateDocumentCompliance, DocumentService, mapDocumentRow } from '../../src/services/documentService';
import { WeddingDocument, DocumentStatus, DocumentType } from '../../src/types/document';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('mapDocumentRow', () => {
  it('correctly maps snake_case database row to camelCase WeddingDocument model', () => {
    const row = {
      id: 'd1',
      workspace_id: 'w1',
      title: 'Surat Baptis',
      document_type: 'baptism_certificate',
      category: 'church_canonical',
      owner: 'groom',
      file_url: 'https://storage/doc.pdf',
      file_type: 'application/pdf',
      status: 'verified',
      issue_date: '2027-07-12',
      expiry_date: null,
      notes: 'Sah',
      created_at: '2027-01-01T00:00:00Z',
    };

    const doc = mapDocumentRow(row);
    expect(doc.id).toBe('d1');
    expect(doc.workspaceId).toBe('w1');
    expect(doc.documentType).toBe('baptism_certificate');
    expect(doc.fileUrl).toBe('https://storage/doc.pdf');
    expect(doc.issueDate).toBe('2027-07-12');
  });
});

describe('Document Compliance & Baptism Validation', () => {
  const weddingDate = new Date('2027-10-10T00:00:00.000Z');

  it('validates baptism certificate within 180 days limit', () => {
    // 90 days before wedding -> Valid
    const validIssueDate = new Date('2027-07-12T00:00:00.000Z');
    expect(isBaptismCertificateValid(validIssueDate, weddingDate)).toBe(true);

    // Exactly 180 days before wedding (2027-04-13) -> Valid
    const exact180Days = new Date('2027-04-13T00:00:00.000Z');
    expect(isBaptismCertificateValid(exact180Days, weddingDate)).toBe(true);

    // 181 days before wedding (2027-04-12) -> Expired / Invalid
    const expiredIssueDate = new Date('2027-04-12T00:00:00.000Z');
    expect(isBaptismCertificateValid(expiredIssueDate, weddingDate)).toBe(false);

    // Future date after wedding -> Invalid
    const futureDate = new Date('2027-10-11T00:00:00.000Z');
    expect(isBaptismCertificateValid(futureDate, weddingDate)).toBe(false);
  });

  it('aggregates document compliance summary correctly and preserves explicit rejected status', () => {
    const docs: WeddingDocument[] = [
      { id: 'd1', workspaceId: 'w1', title: 'Surat Baptis Octa', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'groom', status: 'verified', issueDate: '2027-07-12' },
      { id: 'd2', workspaceId: 'w1', title: 'Surat Baptis Jenesia', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'bride', status: 'pending', issueDate: '2027-02-01' }, // Expired (>180 days)
      { id: 'd3', workspaceId: 'w1', title: 'Sertifikat KPP', documentType: 'kpp_certificate', category: 'church_canonical', owner: 'both', status: 'verified' },
      { id: 'd4', workspaceId: 'w1', title: 'Surat Baptis Palsu/Rusak', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'groom', status: 'rejected', issueDate: '2026-01-01' }, // Explicitly rejected
    ];

    const summary = calculateDocumentCompliance(docs, weddingDate);
    expect(summary.totalDocuments).toBe(4);
    expect(summary.verifiedCount).toBe(2);
    expect(summary.expiredCount).toBe(1); // Surat Baptis Jenesia is expired
    expect(summary.rejectedCount).toBe(1); // Surat Baptis Palsu retains rejected status
    expect(summary.complianceRate).toBe(50); // 2 of 4 = 50%
  });

  it('handles empty document list gracefully', () => {
    const summary = calculateDocumentCompliance([], weddingDate);
    expect(summary.totalDocuments).toBe(0);
    expect(summary.complianceRate).toBe(0);
  });
});

describe('DocumentService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches documents by workspace returning mapped models', async () => {
    const mockDbRows = [{ id: 'd1', workspace_id: 'w1', title: 'Surat Baptis', document_type: 'baptism_certificate' }];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: mockDbRows, error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await DocumentService.getDocumentsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('wedding_documents');
    expect(result.length).toBe(1);
    expect(result[0].documentType).toBe('baptism_certificate');
    expect(result[0].workspaceId).toBe('w1');
  });

  it('registers a new document and returns mapped model', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'd1', workspace_id: 'w1', title: 'KPP Certificate', document_type: 'kpp_certificate' }],
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await DocumentService.registerDocument('w1', {
      title: 'KPP Certificate',
      documentType: 'kpp_certificate',
      category: 'church_canonical',
      owner: 'both',
    });
    expect(result.title).toBe('KPP Certificate');
    expect(result.documentType).toBe('kpp_certificate');
  });

  it('verifies document status returning mapped model', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'd1', workspace_id: 'w1', title: 'Surat Baptis', status: 'verified' }],
          error: null,
        }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await DocumentService.verifyDocument('d1', 'verified');
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('verified');
  });
});
