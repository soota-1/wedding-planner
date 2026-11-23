import { supabase } from '../config/supabase';
import { VendorStatus } from '../types/vendor';

const STATUS_ORDER: Record<VendorStatus, number> = {
  researching: 1,
  shortlisted: 2,
  contacted: 3,
  negotiating: 4,
  booked: 5,
  paid: 6,
  completed: 7,
  cancelled: 99,
};

export function isValidStatusTransition(current: VendorStatus, next: VendorStatus): boolean {
  if (current === next) return true;
  if (current === 'completed' || current === 'cancelled') return false;
  if (next === 'cancelled') return true;

  const currentOrder = STATUS_ORDER[current];
  const nextOrder = STATUS_ORDER[next];

  // Progressive forward transition
  return nextOrder > currentOrder;
}

export class VendorService {
  static async getVendorsByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      throw error;
    }

    return data;
  }

  static async updateVendorStatus(
    vendorId: string,
    nextStatus: VendorStatus,
    currentStatus?: VendorStatus
  ) {
    if (currentStatus && !isValidStatusTransition(currentStatus, nextStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }

    const { data, error } = await supabase
      .from('vendors')
      .update({ status: nextStatus })
      .eq('id', vendorId);

    if (error) {
      throw error;
    }

    return { success: true, data };
  }

  static async linkVendorToCategory(vendorId: string, categoryId: string) {
    const { data, error } = await supabase
      .from('vendors')
      .update({ budget_category_id: categoryId })
      .eq('id', vendorId);

    if (error) {
      throw error;
    }

    return { success: true, data };
  }
}
