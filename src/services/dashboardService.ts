import { startOfDay } from 'date-fns';
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
  const todayStart = startOfDay(today).getTime();
  const weddingDateStart = startOfDay(weddingDate).getTime();
  const msDiff = weddingDateStart - todayStart;
  const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueCount = tasks.filter((t) => {
    if (t.status === 'done' || !t.dueDate) return false;
    const dueStart = startOfDay(new Date(t.dueDate)).getTime();
    return dueStart < todayStart;
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
    const [workspaceRes, tasksRes, budgetRes, categoriesRes, vendorsRes, transactionsRes] =
      await Promise.all([
        supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
        supabase.from('budgets').select('*').eq('workspace_id', workspaceId).single(),
        supabase.from('budget_categories').select('*').eq('workspace_id', workspaceId),
        supabase.from('vendors').select('*').eq('workspace_id', workspaceId),
        supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
      ]);

    if (workspaceRes.error) throw workspaceRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (budgetRes.error) throw budgetRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (vendorsRes.error) throw vendorsRes.error;
    if (transactionsRes.error) throw transactionsRes.error;

    const workspace = workspaceRes.data;
    const tasks = tasksRes.data || [];
    const budget = budgetRes.data || { total_target_budget: 0 };
    const categories = categoriesRes.data || [];
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
        budgetCategoryId: v.budget_category_id,
      })),
      transactions.map((t: any) => ({
        id: t.id,
        vendorId: t.vendor_id,
        budgetCategoryId: t.budget_category_id,
        amount: Number(t.amount) || 0,
        paymentStatus: t.payment_status,
        paidBy: t.paid_by,
      })),
      categories.map((c: any) => ({
        id: c.id,
        workspaceId: c.workspace_id,
        name: c.name,
        allocatedAmount: Number(c.allocated_amount) || 0,
      }))
    );

    return {
      workspace,
      taskMetrics,
      budgetSummary,
    };
  }
}
