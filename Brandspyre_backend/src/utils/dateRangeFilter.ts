export interface GenericDeadlineFilter {
  fields: string[]; // e.g. ['start_date', 'end_date']
  filter_type: 'last' | 'upcoming' | 'custom' | 'deadline';
  startdate?: string;
  enddate?: string;
  n_days?: number;
}

/**
 * Builds a dynamic SQL WHERE clause and parameter array based on deadline filters.
 */
export const buildDeadlineQuery = ({
  fields,
  filter_type,
  startdate,
  enddate,
  n_days
}: GenericDeadlineFilter): { whereClause: string; values: any[] } => {
  const whereClauses: string[] = [];
  const values: any[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let start: string | null = null;
  let end: string | null = null;

  const defaultStartTime = "00:00:00Z";
  const defaultEndTime = "23:59:59.999Z";

  if (startdate && enddate) {
    start = `${startdate}T${defaultStartTime}`;
    end = `${enddate}T${defaultEndTime}`;
  } else if (filter_type === 'last' && n_days) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - n_days);
    const endDate = new Date(today);
    start = startDate.toISOString().split("T")[0] + "T" + defaultStartTime;
    end = endDate.toISOString().split("T")[0] + "T" + defaultEndTime;
  } else if (filter_type === 'upcoming' && n_days) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + n_days - 1);
    start = startDate.toISOString().split("T")[0] + "T" + defaultStartTime;
    end = endDate.toISOString().split("T")[0] + "T" + defaultEndTime;
  }

  if (start && end && fields.length > 0) {
    const dateFilters = fields.map((field) => {
      const startPos = values.length + 1;
      const endPos = values.length + 2;
      values.push(start);
      values.push(end);
      return `${field} BETWEEN $${startPos}::timestamptz AND $${endPos}::timestamptz`;
    });
    whereClauses.push(`(${dateFilters.join(' OR ')})`);
  }

  const whereClause = whereClauses.length > 0 ? whereClauses.join(' AND ') : "";

  return { whereClause, values };
};