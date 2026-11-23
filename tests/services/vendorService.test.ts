import { isValidStatusTransition, VendorService } from '../../src/services/vendorService';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Vendor Lifecycle Transitions', () => {
  it('allows valid progressive transitions', () => {
    expect(isValidStatusTransition('researching', 'shortlisted')).toBe(true);
    expect(isValidStatusTransition('shortlisted', 'contacted')).toBe(true);
    expect(isValidStatusTransition('contacted', 'negotiating')).toBe(true);
    expect(isValidStatusTransition('negotiating', 'booked')).toBe(true);
    expect(isValidStatusTransition('booked', 'paid')).toBe(true);
    expect(isValidStatusTransition('paid', 'completed')).toBe(true);
  });

  it('allows cancelling from any active status', () => {
    expect(isValidStatusTransition('researching', 'cancelled')).toBe(true);
    expect(isValidStatusTransition('negotiating', 'cancelled')).toBe(true);
    expect(isValidStatusTransition('booked', 'cancelled')).toBe(true);
  });

  it('disallows invalid backwards or completed transitions', () => {
    expect(isValidStatusTransition('completed', 'researching')).toBe(false);
    expect(isValidStatusTransition('cancelled', 'booked')).toBe(false);
  });
});

describe('VendorService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches vendors by workspace', async () => {
    const mockVendors = [{ id: 'v1', name: 'Vendor 1' }];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: mockVendors, error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await VendorService.getVendorsByWorkspace('w1');
    expect(result).toEqual(mockVendors);
    expect(supabase.from).toHaveBeenCalledWith('vendors');
  });

  it('updates vendor status with validation check and returns selected row', async () => {
    const selectMock = jest.fn().mockResolvedValue({ data: [{ id: 'v1', status: 'booked' }], error: null });
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: selectMock,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await VendorService.updateVendorStatus('v1', 'booked', 'negotiating');
    expect(result.success).toBe(true);
    expect(selectMock).toHaveBeenCalled();
  });

  it('throws error on invalid status transition in updateVendorStatus', async () => {
    await expect(
      VendorService.updateVendorStatus('v1', 'researching', 'completed')
    ).rejects.toThrow('Invalid status transition from completed to researching');
  });
});
