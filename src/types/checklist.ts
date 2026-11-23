export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TemplateTask {
  id?: string;
  title: string;
  description?: string;
  offsetDays: number;
  priority?: TaskPriority;
}

export interface Task {
  id: string;
  workspaceId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  offsetDays?: number;
  dueDate?: Date | string | null;
  estimatedCost?: number;
  actualCost?: number;
  isTemplateItem?: boolean;
  completedAt?: Date | string | null;
}

export interface TaskWithDueDate extends TemplateTask {
  dueDate: Date;
}
