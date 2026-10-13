import { TaskParticipantLog, Task, TaskParticipant } from "../../../db/ModelSceham/project/client";

export const getPerTaskSummaryByStaffAndProject = async (
  staffId: string,
  projectCode: string,
  startDate?: string,
  endDate?: string
) => {
  let logFilter: any = { staff_id: staffId, project_code: projectCode };

  if (startDate && endDate) {
    logFilter.check_out = {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
      $lte: new Date(`${endDate}T23:59:59.999Z`)
    };
  } else if (startDate) {
    logFilter.check_out = { $gte: new Date(`${startDate}T00:00:00.000Z`) };
  } else if (endDate) {
    logFilter.check_out = { $lte: new Date(`${endDate}T23:59:59.999Z`) };
  }

  const logs = await TaskParticipantLog.find(logFilter).lean();

  const summaryMap = new Map<string, any>();

  for (const log of logs as any[]) {
    const key = `${log.task_id}_${log.participants_id}`;
    if (!summaryMap.has(key)) {
      const taskDoc = await Task.findOne({ _id: log.task_id }).lean() as any;
      const partDoc = await TaskParticipant.findOne({ participants_id: log.participants_id }).lean() as any;

      summaryMap.set(key, {
        task_id: log.task_id,
        task_title: taskDoc?.task_title || '',
        task_priority: taskDoc?.task_priority || '',
        task_status: taskDoc?.status || '',
        participants_id: log.participants_id,
        participant_status: partDoc?.status || '',
        subtask_title: partDoc?.subtask_title || '',
        subtask_priority: partDoc?.subtask_priority || '',
        rating: partDoc?.rating || '',
        delay_reason: partDoc?.delay_reason || '',
        delay_by: partDoc?.delay_by || '',
        close_reason: partDoc?.close_reason || '',
        total_checkins: 0,
        total_duration_minutes: 0,
        last_check_in: null,
        last_check_out: null
      });
    }

    const item = summaryMap.get(key);
    item.total_checkins += 1;
    item.total_duration_minutes += (log.duration || 0);

    if (!item.last_check_in || (log.check_in && new Date(log.check_in) > new Date(item.last_check_in))) {
      item.last_check_in = log.check_in;
    }
    if (!item.last_check_out || (log.check_out && new Date(log.check_out) > new Date(item.last_check_out))) {
      item.last_check_out = log.check_out;
    }
  }

  const summary = Array.from(summaryMap.values()).sort((a, b) => b.total_duration_minutes - a.total_duration_minutes);

  return {
    project_code: projectCode,
    start_date: startDate || null,
    end_date: endDate || null,
    summary
  };
};
