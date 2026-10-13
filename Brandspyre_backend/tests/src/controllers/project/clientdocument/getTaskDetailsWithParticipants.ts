import { Task, TaskParticipant } from "../../../db/ModelSceham/project/client";

export const getTaskDetailsWithParticipants = async (task_id: string) => {
  const task = await Task.findById(task_id).lean();
  if (!task) return null;
  const participants = await TaskParticipant.find({ task_id }).lean();
  return { ...task, participants };
};