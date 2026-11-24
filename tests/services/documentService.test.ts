import { isBaptismCertificateValid, calculateDocumentCompliance, DocumentService } from '../../src/services/documentService';
import { WeddingDocument, DocumentStatus, DocumentType } from '../../src/types/document';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

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

  it('aggregates document compliance summary correctly', () => {
    const docs: WeddingDocument[] = [
      { id: 'd1', workspaceId: 'w1', title: 'Surat Baptis Octa', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'groom', status: 'verified', issueDate: '2027-07-12' },
      { id: 'd2', workspaceId: 'w1', title: 'Surat Baptis Jenesia', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'bride', status: 'pending', issueDate: '2027-02-01' }, // Expired (>180 days)
      { id: 'd3', workspaceId: 'w1', title: 'Sertifikat KPP', documentType: 'kpp_certificate', category: 'church_canonical', owner: 'both', status: 'verified' },
    ];

    const summary = calculateDocumentCompliance(docs, weddingDate);
    expect(summary.totalDocuments).toBe(3);
    expect(summary.verifiedCount).toBe(2);
    expect(summary.expiredCount).toBe(1); // Surat Baptis Jenesia is expired
    expect(summary.complianceRate).toBe(67); // 2 of 3 = 67%
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

  it('fetches documents by workspace', async () => {
    const mockDocs = [{ id: 'd1', title: 'Surat Baptis' }];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: mockDocs, error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await DocumentService.getDocumentsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('wedding_documents');
    expect(result).toEqual(mockDocs);
  });

  it('registers a new document', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ id: 'd1', title: 'KPP Certificate' }], error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await DocumentService.registerDocument('w1', {
      title: 'KPP Certificate',
      documentType: 'kpp_certificate',
      category: 'church_canonical',
      owner: 'both',
    });
    expect(result.title).toBe('KPP Certificate');
  });

  it('verifies document status', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'd1', status: 'verified' }], error: null }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await DocumentService.verifyDocument('d1', 'verified');
    expect(result.success).toBe(true);
  });
});
