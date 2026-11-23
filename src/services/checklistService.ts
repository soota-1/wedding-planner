import { TemplateTask, Task, TaskWithDueDate } from '../types/checklist';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateDateWithOffset(baseDate: Date, offsetDays: number): Date {
  return new Date(baseDate.getTime() + offsetDays * MS_PER_DAY);
}

export function generateTaskDueDates(weddingDate: Date, tasks: TemplateTask[]): TaskWithDueDate[] {
  return tasks.map((task) => ({
    ...task,
    dueDate: calculateDateWithOffset(weddingDate, task.offsetDays),
  }));
}

export function shiftUncompletedDueDates(newWeddingDate: Date, currentTasks: Task[]): Task[] {
  return currentTasks.map((task) => {
    // Hanya geser tugas yang belum selesai dan memiliki offsetDays
    if (task.status !== 'done' && typeof task.offsetDays === 'number') {
      return {
        ...task,
        dueDate: calculateDateWithOffset(newWeddingDate, task.offsetDays),
      };
    }
    return { ...task };
  });
}
