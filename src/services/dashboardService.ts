import { supabase } from '../config/supabase';
import { calculateBudgetSummary } from './budgetCalculator';

export interface DashboardMetrics {
  daysRemaining: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueCount: number;
}

export function calculateDashboardMetrics(
  today: Date,
  weddingDate: Date,
  tasks: Array<{ id: string; status: string; dueDate?: Date | string | null }>
): DashboardMetrics {
  const msDiff = weddingDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayTime = today.getTime();
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'done' || !t.dueDate) return false;
    const dueTime = new Date(t.dueDate).getTime();
    return dueTime < todayTime;
  }).length;

  return {
    daysRemaining,
    totalTasks,
    completedTasks,
    completionRate,
    overdueCount,
  };
}

export class DashboardService {
  static async getDashboardSummary(workspaceId: string) {
    const [workspaceRes, tasksRes, budgetRes, vendorsRes, transactionsRes] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
      supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
      supabase.from('budgets').select('*').eq('workspace_id', workspaceId).single(),
      supabase.from('vendors').select('*').eq('workspace_id', workspaceId),
      supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
    ]);

    if (workspaceRes.error) throw workspaceRes.error;

    const workspace = workspaceRes.data;
    const tasks = tasksRes.data || [];
    const budget = budgetRes.data || { total_target_budget: 0 };
    const vendors = vendorsRes.data || [];
    const transactions = transactionsRes.data || [];

    const now = new Date();
    const weddingDate = new Date(workspace.wedding_date);
    const taskMetrics = calculateDashboardMetrics(now, weddingDate, tasks);

    const budgetSummary = calculateBudgetSummary(
      { targetBudget: Number(budget.total_target_budget) || 0 },
      vendors.map((v: any) => ({
        id: v.id,
        name: v.name,
        contractValue: Number(v.contract_value) || 0,
        status: v.status,
      })),
      transactions.map((t: any) => ({
        id: t.id,
        vendorId: t.vendor_id,
        amount: Number(t.amount) || 0,
        paymentStatus: t.payment_status,
        paidBy: t.paid_by,
      }))
    );

    return {
      workspace,
      taskMetrics,
      budgetSummary,
    };
  }
}
