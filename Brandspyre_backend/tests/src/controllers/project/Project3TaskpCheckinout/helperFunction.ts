import { Task, TaskParticipant, TaskParticipantLog } from '../../../db/ModelSceham/project/client';

export const recalculateTaskDurations = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const taskStart = new Date(task.start_date);
  const taskEnd = new Date(task.end_date);
  const expectedMinutes = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60));

  const participants = await TaskParticipant.find({
    task_id: taskId,
    status: { $in: ['inprocess', 'archived'] }
  });

  let totalMinutes = 0;

  for (const participant of participants) {
    const durationResult = await TaskParticipantLog.aggregate([
      { $match: { participants_id: participant._id } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$duration", 0] } } } }
    ]);
    const duration = durationResult[0]?.total || 0;

    totalMinutes += duration;

    await TaskParticipant.findByIdAndUpdate(
      participant._id,
      { task_duration: duration, updated_on: new Date() }
    );
  }

  const excess = totalMinutes > expectedMinutes ? totalMinutes - expectedMinutes : 0;
  const durationDays = Math.ceil(totalMinutes / 60);

  await Task.findByIdAndUpdate(
    taskId,
    { duration_days: durationDays, excess_duration: excess }
  );

  return {
    task_id: taskId,
    participants_updated: participants.length,
    total_minutes_worked: totalMinutes,
    expected_minutes: expectedMinutes,
    excess_minutes: excess,
    duration_days: durationDays,
  };
};