import { addDays } from 'date-fns';
import { TemplateTask, Task, TaskWithDueDate } from '../types/checklist';

export function calculateDateWithOffset(baseDate: Date, offsetDays: number): Date {
  return addDays(baseDate, offsetDays);
}

export function generateTaskDueDates(weddingDate: Date, tasks: TemplateTask[]): TaskWithDueDate[] {
  return tasks.map((task) => ({
    ...task,
    dueDate: calculateDateWithOffset(weddingDate, task.offsetDays),
  }));
}

export function shiftUncompletedDueDates(newWeddingDate: Date, currentTasks: Task[]): Task[] {
  return currentTasks.map((task) => {
    // Hanya geser tugas bawaan templat yang belum selesai dan memiliki offsetDays
    const isTemplate = task.isTemplateItem !== false;
    if (task.status !== 'done' && isTemplate && typeof task.offsetDays === 'number') {
      return {
        ...task,
        dueDate: calculateDateWithOffset(newWeddingDate, task.offsetDays),
      };
    }
    return { ...task };
  });
}
