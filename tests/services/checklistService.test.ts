import { generateTaskDueDates, shiftUncompletedDueDates } from '../../src/services/checklistService';

describe('checklistService date calculations', () => {
  it('calculates due dates based on offset_days from wedding date', () => {
    const weddingDate = new Date('2027-10-10T00:00:00.000Z');
    const tasks = [
      { id: 't1', title: 'Kursus Persiapan Perkawinan (KPP)', offsetDays: -180 },
      { id: 't2', title: 'Penyelidikan Kanonik', offsetDays: -90 }
    ];

    const result = generateTaskDueDates(weddingDate, tasks);
    expect(result[0].dueDate).toEqual(new Date('2027-04-13T00:00:00.000Z'));
    expect(result[1].dueDate).toEqual(new Date('2027-07-12T00:00:00.000Z'));
  });

  it('only shifts uncompleted template tasks when wedding date is changed', () => {
    const newWeddingDate = new Date('2027-12-10T00:00:00.000Z');
    const currentTasks = [
      { id: 't1', title: 'KPP Selesai', status: 'done' as const, dueDate: new Date('2027-04-13T00:00:00.000Z'), offsetDays: -180, isTemplateItem: true },
      { id: 't2', title: 'Kanonik Belum', status: 'todo' as const, dueDate: new Date('2027-07-12T00:00:00.000Z'), offsetDays: -90, isTemplateItem: true },
      { id: 't3', title: 'Fitting Custom', status: 'todo' as const, dueDate: new Date('2027-07-12T00:00:00.000Z'), offsetDays: -90, isTemplateItem: false }, // Custom user task should NOT shift
    ];

    const shifted = shiftUncompletedDueDates(newWeddingDate, currentTasks);
    expect(shifted[0].dueDate).toEqual(new Date('2027-04-13T00:00:00.000Z')); // Unchanged because status == 'done'
    expect(shifted[1].dueDate).toEqual(new Date('2027-09-11T00:00:00.000Z')); // Shifted (template item)
    expect(shifted[2].dueDate).toEqual(new Date('2027-07-12T00:00:00.000Z')); // Unchanged because isTemplateItem == false
  });
});
