import { CalendarDays, AlertTriangle, Clock } from "lucide-react";

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: "Holiday Break",
      date: "March 7, 2025",
      description:
        "We will be closed for the upcoming holidays. Please check the schedule.",
      type: "holiday",
      important: true,
    },
    {
      id: 2,
      title: "System Maintenance",
      date: "April 2, 2025",
      description: "Scheduled maintenance window from 2:00 AM to 5:00 AM.",
      type: "maintenance",
      important: false,
    },
    {
      id: 3,
      title: "Company Retreat",
      date: "June 15-17, 2025",
      description: "Annual company retreat at Mountain View Resort.",
      type: "event",
      important: true,
    },
  ];

  const getEventIcon = (type) => {
    switch (type) {
      case "holiday":
        return <CalendarDays className="text-yellow-500" size={20} />;
      case "maintenance":
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between mt-10 mb-10">
        <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] flex items-center gap-2">
          Upcoming Events
        </h2>
        <button className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5">
          New Announcement +
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`rounded-lg border p-4 transition-all hover:shadow-md dark:hover:shadow-gray-700 ${
              event.important
                ? "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getEventIcon(event.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {event.title}
                  </h3>
                  {event.important && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <CalendarDays size={14} /> {event.date}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <CalendarDays
            size={48}
            className="mx-auto text-gray-400 dark:text-gray-500"
          />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No upcoming events scheduled
          </p>
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
