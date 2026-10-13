// import React, { useState, useEffect } from "react";
// import { Calendar, momentLocalizer } from "react-big-calendar";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import { useAuthStore } from "src/stores/authStore";
// import { useNavigate } from "react-router-dom";
// const localizer = momentLocalizer(moment);

// const MyCalendar = () => {
//   const token = useAuthStore((state: any) => state.accessToken);
//   const [events, setEvents] = useState<any[]>([]);
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(new Date());
//    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
//   const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         const [meetingsRes, followupsRes] = await Promise.all([
//           fetch("http://localhost:3000/api/doc_meet/read?comm_type=meeting", {
//
//           }),
//           fetch("http://localhost:3000/api/campaign/followup/read", {
//
//           }),
//         ]);

//         const meetingsData = await meetingsRes.json();
//         const followupsData = await followupsRes.json();
//         const formattedMeetings =
//           meetingsData?.data?.map((item: any) => ({
//             id: item.meet_id,
//             title: item.title,
//             start: new Date(item.start_date_time),
//             end: new Date(item.end_date_time),
//             type: "meeting",
//             priority: item.category === "custom" ? "High" : "Normal",
//             notes: item.notes,
//             link: item.meet_link,
//           })) || [];

//         const formattedFollowups =
//           followupsData?.data?.map((item: any) => ({
//             id: item.id,
//             title: `Follow-up: Lead #${item.lead_id}`,
//             start: new Date(item.next_date),
//             end: new Date(item.next_date),
//             allDay: true,
//             type: "followup",
//             priority: "Normal",
//             notes: item.notes || "Lead follow-up",
//             campaign: item.campaign_code,
//           })) || [];

//         setEvents([...formattedMeetings, ...formattedFollowups]);
//       } catch (err) {
//         console.error("Failed to fetch data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (token) fetchData();
//   }, [token]);

//   const goToNextMonth = () => {
//     setCurrentDate(moment(currentDate).add(1, "month").toDate());
//   };

//   const goToPrevMonth = () => {
//     setCurrentDate(moment(currentDate).subtract(1, "month").toDate());
//   };

//   return (
//     <div
//       style={{
//         height: "100vh",
//         padding: "20px",
//         backgroundColor: "#f5f5f5",
//       }}
//     >
   

//       <div
//         style={{
//           background: "white",
//           height: "calc(100% - 40px)",
//           borderRadius: "8px",
//           boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//           padding: "20px",
//         }}
//       >
// {loading ? (
//   <p>Loading calendar...</p>
// ) : (
//   <>
//     <Calendar
//       localizer={localizer}
//       events={events}
//       date={currentDate}
//       onNavigate={setCurrentDate}
//       view={view}
//       onView={setView}
//       startAccessor="start"
//       endAccessor="end"
//       defaultView="month"
//       views={["month", "week", "day", "agenda"]}
//       popup
//       style={{ height: "100%" }}
//       eventPropGetter={(event) => ({
//         style: {
//           backgroundColor: event.priority === "High" ? "#ff6b6b" : "#51cf66",
//           borderRadius: "4px",
//           color: "white",
//           border: "none",
//         },
//       })}
//       onSelectEvent={(event) => setSelectedEvent(event)}
//     />

//     {/* Modal for event details */}
//     {selectedEvent && (
//       <div className="fixed inset-0 flex items-center justify-center bg-black/50">
//         <div className="bg-white p-6 rounded-xl shadow-lg w-96">
//           <h2 className="text-lg font-semibold mb-2">{selectedEvent.title}</h2>
//           <p>
//             🕒 {moment(selectedEvent.start).format("HH:mm")} -{" "}
//             {moment(selectedEvent.end).format("HH:mm")}
//           </p>
//           <p>🔗 {selectedEvent.link || "None"}</p>
//           <p>📝 {selectedEvent.notes || "No notes"}</p>

//           <div className="mt-4 flex justify-end gap-3">
//             <button
//               className="px-4 py-2 rounded-lg bg-gray-300"
//               onClick={() => setSelectedEvent(null)}
//             >
//               Close
//             </button>
//             <button
//               className="px-4 py-2 rounded-lg bg-blue-600 text-white"
//               onClick={() => navigate(`/meetings/${selectedEvent.id}`)}
//             >
//               Edit
//             </button>
//             <button
//               className="px-4 py-2 rounded-lg bg-blue-600 text-white"
//               onClick={() => navigate(`/meeting_view/${selectedEvent.id}`)}
//             >
//               View
//             </button>
//           </div>
//         </div>
//       </div>
//     )}
//   </>
// )}

//       </div>
//     </div>
//   );
// };

// export default MyCalendar;

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuthStore } from "src/stores/authStore";
import { useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import EditProjectReasonForm from "./EditProjectReasonForm"; // adjust path
import EditMilestoneReasonForm from "./EditMilestoneReasonForm"; // adjust path

import { isPlatformAdminRole, isTenantAdminRole } from "src/utils/roleUtils";

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
  const token = useAuthStore((state: any) => state.accessToken);
  const user = useAuthStore((state: any) => state.user);
  const role = useAuthStore((state: any) => state.role);
  const staff_id = useAuthStore((state: any) => state.staff_id);

  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">(
    "month"
  );

   const [showReasonForm, setShowReasonForm] = useState(false);
      const [showmReasonForm, setShowmReasonForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedDate = moment().format("YYYY-MM-DD");

        // Unified canonical meeting calendar + other event sources
        const [calendarMeetingsRes, followupsRes, overdueProjRes, overdueMileRes, overdueTaskRes] =
          await Promise.all([
            apiClient.get(`/meetings/calendar`).catch((err) => {
              console.warn("Could not fetch calendar meetings:", err);
              return { data: { data: [] } };
            }),
            apiClient.get(`/campaign/followup/read`).catch((err) => {
              console.warn("Could not fetch followups:", err);
              return { data: { data: [] } };
            }),
            apiClient.get(`/project/overview/read?overdue=${formattedDate}`).catch((err) => {
              console.warn("Could not fetch overdue projects:", err);
              return { data: { data: [] } };
            }),
            apiClient.get(`/project/milestone/read?overdue=${formattedDate}`).catch((err) => {
              console.warn("Could not fetch overdue milestones:", err);
              return { data: { data: [] } };
            }),
            apiClient.get(`/project/task/read?overdue=${formattedDate}`).catch((err) => {
              console.warn("Could not fetch overdue tasks:", err);
              return { data: { data: [] } };
            }),
          ]);

        const calendarMeetingsData = calendarMeetingsRes.data;
        const followupsData = followupsRes.data;
        const overdueProjData = overdueProjRes.data;
        const overdueMileData = overdueMileRes.data;
        const overdueTaskData = overdueTaskRes.data;

        // ---------- Format unified meeting events from canonical calendar API ----------
        const formattedMeetings =
          (calendarMeetingsData?.data || []).map((item: any) => ({
            id: item.meeting_id || item.id,
            title: item.title,
            start: new Date(item.start),
            end: new Date(item.end),
            type: item.meeting_type === 'INTER_ORGANIZATION' ? "video_meeting" : "meeting",
            meeting_type: item.meeting_type,
            notes: item.description,
            link: item.meeting_link,
            host_name: item.host_name,
            host_user_id: item.host_user_id,
            host_tenant: item.host_tenant,
            status: item.status,
            color: item.color,
            can_edit: item.can_edit,
            can_join: item.can_join,
            related_lead: item.related_lead,
            related_project: item.related_project,
          }));

        const formattedFollowups =
          followupsData?.data?.map((item: any) => ({
            id: item.id,
            title: `Follow-up: Lead #${item.lead_id}`,
            start: new Date(item.next_date),
            end: new Date(item.next_date),
            allDay: true,
            type: "followup",
            notes: item.notes || "Lead follow-up",
            campaign: item.campaign_code,
            related_staff: item.related_staff,
          })) || [];

        const formattedOverdueProjects =
          overdueProjData?.data?.map((item: any) => ({
            id: `proj-${item.project_code}`,
            title: `Overdue Project: ${item.title}`,
            start: new Date(item.end_date),
            end: new Date(item.end_date),
            allDay: true,
            type: "overdue_project",
            project_code: item.project_code,
            handler_by: item.handler_by,
            status: item.status,
            reason: item.reason,
            notes: item.notes,
          })) || [];

        const formattedOverdueMilestones =
          overdueMileData?.data?.map((item: any) => ({
            id: `mile-${item.milestone_code}`,
            title: `Overdue Milestone: ${item.miles_title}`,
            start: new Date(item.end_date),
            end: new Date(item.end_date),
            allDay: true,
            type: "overdue_milestone",
            milestone_code: item.milestone_code,
            project_code: item.project_code,
            handler_by: item.handler_by,
            status: item.status,
            revision_reason: item.revision_reason,
            task_count: item.task_count,
            reason : item.reason,
          })) || [];

        const formattedOverdueTasks =
          overdueTaskData?.data?.map((item: any) => ({
            id: `task-${item.id}`,
            title: `Overdue Task: ${item.task_title}`,
            start: new Date(item.end_date),
            end: new Date(item.end_date),
            allDay: true,
            type: "overdue_task",
            task_id: item.id,
            project_code: item.project_code,
            milestone_code: item.milestone_code,
            handler_by: item.handler_by,
            handlername: item.handlername,
            priority: item.task_priority,
            notes: item.notes,
            participants: item.participantdetails || [],
          })) || [];

        let allEvents = [
          ...formattedMeetings,
          ...formattedFollowups,
          ...formattedOverdueProjects,
          ...formattedOverdueMilestones,
          ...formattedOverdueTasks,
        ];

        // ---------- Apply Role / Staff Filtering ----------
        // if (!["superadmin", "admin", "hr"].includes(role)) {
        //   allEvents = allEvents.filter((event) => {
        //     if (event.type === "meeting") {
        //       return (
        //         event.creator_id === staff_id ||
        //         (event.participants && event.participants.includes(staff_id))
        //       );
        //     }
        //     if (event.type === "followup") {
        //       return event.related_staff === staff_id;
        //     }
        //     if (
        //       ["overdue_project", "overdue_milestone", "overdue_task"].includes(
        //         event.type
        //       )
        //     ) {
        //       return event.handler_by === staff_id;
        //     }
        //     return false;
        //   });
        // }

        const isPrivileged = isPlatformAdminRole(role) || isTenantAdminRole(role) || role === "hr";
        if (!isPrivileged) {
  allEvents = allEvents.filter((event) => {
    if (event.type === "video_meeting") {
      return true;
    }

    if (event.type === "meeting") {
      // ✅ Check if current staff is creator or a participant
      return (
        event.creator_id === staff_id ||
        (event.participants &&
          event.participants.some(
            (p: any) => p.person_id === staff_id || p.team_id === staff_id
          ))
      );
    }

    if (event.type === "followup") {
      return event.related_staff === staff_id;
    }

    if (
      ["overdue_project", "overdue_milestone", "overdue_task"].includes(
        event.type
      )
    ) {
      return event.handler_by === staff_id;
    }

    return false;
  });
}

        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token, role, staff_id]);

  return (
    <div style={{ height: "100vh", padding: "20px", backgroundColor: "#f5f5f5" }}>
      <div
        style={{
          background: "white",
          height: "calc(100% - 40px)",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          padding: "20px",
        }}
      >
        {loading ? (
          <p>Loading calendar...</p>
        ) : (
          <>
            <Calendar
              localizer={localizer}
              events={events}
              date={currentDate}
              onNavigate={setCurrentDate}
              view={view}
              onView={setView}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={["month", "week", "day", "agenda"]}
              popup
              style={{ height: "100%" }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor:
                    event.type.includes("overdue")
                      ? "#e03131"
                      : event.type === "meeting"
                      ? "#1971c2"
                      : "#ff922b",
                  borderRadius: "4px",
                  color: "white",
                  border: "none",
                },
              })}
              onSelectEvent={(event) => setSelectedEvent(event)}
            />

            {/* -------- Popup Modal -------- */}
            {selectedEvent && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[200]">
                <div className="bg-white p-6 rounded-xl shadow-lg w-[520px] max-w-full">
                  <h2 className="text-xl font-semibold mb-3">
                    {selectedEvent.title}
                  </h2>

                  {/* Event Specific Details */}
                  {selectedEvent.type === "meeting" && (
                    <>
                      <p>
                        🗓 {moment(selectedEvent.start).format("DD MMM YYYY, HH:mm")} –{" "}
                        {moment(selectedEvent.end).format("HH:mm")}
                      </p>
                      <p>🔗 {selectedEvent.link || "No link"}</p>
                      <p>📝 {selectedEvent.notes || "No notes"}</p>
                    </>
                  )}

                  {selectedEvent.type === "video_meeting" && (
                    <>
                      <p>
                        🗓 {moment(selectedEvent.start).format("DD MMM YYYY, HH:mm")} –{" "}
                        {moment(selectedEvent.end).format("HH:mm")}
                      </p>
                      <p>📝 {selectedEvent.notes || "No description"}</p>
                    </>
                  )}

                  {selectedEvent.type === "followup" && (
                    <>
                      <p>📌 Campaign: {selectedEvent.campaign}</p>
                      <p>📝 {selectedEvent.notes}</p>
                    </>
                  )}

                  {selectedEvent.type === "overdue_project" && (
                    <>
                      <p>📌 Project Code: {selectedEvent.project_code}</p>
                      <p>👤 Handler: {selectedEvent.handler_by}</p>
                      <p>📊 Status: {selectedEvent.status}</p>
                      <p>📝 Notes: {selectedEvent.notes}</p>
                      <p>⚠️ Reason: {selectedEvent.reason}</p>
                    </>
                  )}

                  {selectedEvent.type === "overdue_milestone" && (
                    <>
                      <p>📌 Milestone Code: {selectedEvent.milestone_code}</p>
                      <p>📂 Project: {selectedEvent.project_code}</p>
                      <p>👤 Handler: {selectedEvent.handler_by}</p>
                      <p>📊 Status: {selectedEvent.status}</p>
                      <p>📝 Overdue Reason: {selectedEvent.reason}</p>
                      <p>✅ Tasks: {selectedEvent.task_count}</p>
                    </>
                  )}

                  {selectedEvent.type === "overdue_task" && (
                    <>
                      <p>📌 Task: {selectedEvent.task_id}</p>
                      <p>📂 Project: {selectedEvent.project_code}</p>
                      <p>🧩 Milestone: {selectedEvent.milestone_code}</p>
                      <p>👤 Handler: {selectedEvent.handlername}</p>
                      <p>⚡ Priority: {selectedEvent.priority}</p>
                      <p>📝 {selectedEvent.notes || "No notes"}</p>
                      <p>
                        👥 Participants:{" "}
                        {selectedEvent.participants
                          .map((p: any) => `${p.name} (${p.staff_id})`)
                          .join(", ") || "None"}
                      </p>
                    </>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Close
                    </button>
                    {selectedEvent.type === "meeting" && (
                      <>
                        <button
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                          onClick={() => navigate(`/meetings/${selectedEvent.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg bg-green-600 text-white"
                          onClick={() => navigate(`/meeting_view/${selectedEvent.id}`)}
                        >
                          View
                        </button>
                      </>
                    )}
                    {selectedEvent.type === "video_meeting" && (
                      <button
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-750"
                        onClick={() => {
                          setSelectedEvent(null);
                          navigate(selectedEvent.link);
                        }}
                      >
                        Join Room
                      </button>
                    )}
                    {selectedEvent.type === "overdue_project" && (
                      <>

                                          <button
                        className="hidden px-4 py-2 rounded-lg bg-red-600 text-white"
                         onClick={() => setShowReasonForm(true)}
                      >
                        Reason
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={() =>
                          // navigate(`/project/${selectedEvent.project_code}`)
navigate(`/project/${encodeURIComponent(selectedEvent.project_code)}`)

                        }
                      >
                        View Project
                      </button>

{showReasonForm && selectedEvent && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[500px]">
      <EditProjectReasonForm
        project_code={
          selectedEvent.milestone_code ||
          selectedEvent.project_code ||
          selectedEvent.task_id
        }
        onSuccess={() => setShowReasonForm(false)}
        onCancel={() => setShowReasonForm(false)}
      />
    </div>
  </div>
)}



</>

                    )}



                    {selectedEvent.type === "overdue_milestone" && (
                      <>

                                          <button
                        className="hidden px-4 py-2 rounded-lg bg-red-600 text-white"
                               onClick={() => setShowmReasonForm(true)}
                      >
                        Reason
                      </button>
                      {/*<button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={() =>
                          navigate(`/project/${selectedEvent.milestone_code}`)
                        }
                      >
                        View Project
                      </button>*/}


{showmReasonForm && selectedEvent && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[500px]">
      <EditMilestoneReasonForm
        milestone_code={
          selectedEvent.milestone_code ||
          selectedEvent.project_code ||
          selectedEvent.task_id
        }
        onSuccess={() => setShowmReasonForm(false)}
        onCancel={() => setShowmReasonForm(false)}
      />
    </div>
  </div>
)}


</>

                    )}

                                        {selectedEvent.type === "overdue_task" && (
                      <>

                                          <button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={() =>
                          navigate(`/task_view/${selectedEvent.task_id}`)
                        }
                      >
                        View Task
                      </button>
                      {/*<button
                        className="px-4 py-2 rounded-lg bg-red-600 text-white"
                        onClick={() =>
                          navigate(`/project/${selectedEvent.milestone_code}`)
                        }
                      >
                        View Project
                      </button>*/}
</>

                    )}




                  </div>
                </div>
             

              </div>
            

            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCalendar;
