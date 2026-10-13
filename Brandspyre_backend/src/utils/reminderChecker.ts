import cron from 'node-cron';
import { Meeting, MeetingParticipant, MeetingReminder } from '../db/ModelSceham/meetingSchema';
import { sendNotification } from '../controllers/notifications/create';

/**
 * Meeting Reminder Background Engine
 * Checks scheduled meetings for 24h, 1h, and 15m intervals and dispatches notifications
 */
cron.schedule('* * * * *', async () => {
  const now = new Date();
  
  try {
    // 1. Query upcoming SCHEDULED meetings within the next 25 hours
    const next25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const upcomingMeetings = await Meeting.find({
      status: { $in: ['SCHEDULED', 'scheduled'] },
      scheduled_start_time: { $gte: now, $lte: next25Hours }
    }).lean();

    for (const meeting of upcomingMeetings) {
      const startTime = new Date(meeting.scheduled_start_time).getTime();
      const diffMinutes = Math.round((startTime - now.getTime()) / 60000);

      // Determine which reminder trigger applies:
      // 24 Hours (between 1410 and 1440 mins)
      // 1 Hour (between 50 and 60 mins)
      // 15 Minutes (between 10 and 15 mins)
      let reminderType: '24_HOURS' | '1_HOUR' | '15_MINUTES' | null = null;
      let label = '';

      if (diffMinutes <= 15 && diffMinutes >= 1) {
        reminderType = '15_MINUTES';
        label = '15 minutes';
      } else if (diffMinutes <= 60 && diffMinutes > 50) {
        reminderType = '1_HOUR';
        label = '1 hour';
      } else if (diffMinutes <= 1440 && diffMinutes > 1410) {
        reminderType = '24_HOURS';
        label = '24 hours';
      }

      if (!reminderType) continue;

      // Get participants
      const participants = await MeetingParticipant.find({
        meeting_id: meeting.meeting_id,
        response_status: { $ne: 'DECLINED' }
      }).lean();

      for (const p of participants) {
        const existing = await MeetingReminder.findOne({
          meeting_id: meeting.meeting_id,
          user_id: p.user_id,
          reminder_type: reminderType
        });

        if (!existing) {
          await MeetingReminder.create({
            meeting_id: meeting.meeting_id,
            user_id: p.user_id,
            reminder_time: now,
            reminder_type: reminderType,
            status: 'SENT',
            sent_at: now,
            created_at: now
          });

          try {
            await sendNotification({
              tenant_id: (p.tenant_id || meeting.tenant_id).toString(),
              from: 'system',
              meeting_id: meeting.meeting_id,
              type: 'meeting',
              action: 'MEETING_REMINDER',
              content: `Your meeting "${meeting.title}" starts in ${label} at ${new Date(meeting.scheduled_start_time).toLocaleTimeString()}`,
              recipients: [{
                person_id: p.user_id.toString(),
                role_type: 'staff' as const,
                tenant_id: (p.tenant_id || meeting.tenant_id).toString()
              }]
            });
          } catch (notifErr) {
            // Non-blocking notification dispatch
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Meeting reminder check error:', err.message);
  }
});