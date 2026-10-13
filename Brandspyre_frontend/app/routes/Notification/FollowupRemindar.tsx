import {
  Dot,
  Eye,
  User2,
  Calendar,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { Link } from "react-router-dom";

interface Followup {
  id: number;
  branchcode: string;
  campaign_code: string;
  lead_id: number;
  next_date: string;
  status: string;
  notes: string | null;
  created_on: string;
  updated_on: string;
}

function FollowupRemindar() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchFollowups();
  }, [selectedDate]);

  const fetchFollowups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/campaign/followup/read?status=active`);

      if (response.data.message === "View Leads Follow-up Info Success") {
        setFollowups(response.data.data);
      } else {
        setError("Failed to fetch followups");
      }
    } catch (err) {
      setError("Error fetching followups");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter followups by the selectedDate
  const filteredFollowups = followups.filter((item) => {
    if (!item.next_date) return false;
    
    // next_date is stored as "YYYY-MM-DD"
    const itemDateStr = item.next_date.split("T")[0];
    
    // selectedDate to "YYYY-MM-DD" in local time
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${day}`;
    
    return itemDateStr === targetDateStr;
  });

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <div className="text-gray-500 text-xl font-bold">Follow-up Reminder</div>
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" size={20} />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date!)}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
          />
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading followups...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      <div className="w-full flex flex-col justify-evenly gap-8">
        {filteredFollowups.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            No followups found for {selectedDate.toDateString()}
          </div>
        )}

        {filteredFollowups.map((item) => (
          <div
            key={item.id}
            className="bg-white w-full flex rounded-sm shadow-lg"
          >
            <div>
              <div className="bg-blue-700 rounded-r-lg w-4 h-[200px]"></div>
            </div>
            <div className="ms-4 w-full p-4">
              <div className="flex gap-3 items-center">
                <User2 className="text-gray-600" size={22} />
                <h1 className="text-lg font-semibold text-gray-700">
                  Follow-up ID: {item.id}
                </h1>
              </div>

              <div className="mt-3 space-y-1 text-gray-600">
                <p>Branch: {item.branchcode}</p>
                <p>Campaign: {item.campaign_code}</p>
                <p>Lead ID: {item.lead_id}</p>
                <p>Next Date: {formatDate(item.next_date)}</p>
                <p>Status: {item.status}</p>
                {item.notes && <p>Notes: {item.notes}</p>}
              </div>

              <div className="mt-4 flex justify-between">
                <p className="text-sm flex items-center gap-1 text-blue-700">
                  <Dot /> Created: {formatDate(item.created_on)}
                </p>
                <Link to={`/leadsview/${encodeURIComponent(item.lead_id)}`}>
                  <button className="bg-blue-100 px-3 py-2 rounded-sm text-blue-700 hover:bg-blue-200 flex gap-1">
                    <Eye size={15} className="mt-1" />
                    View Detail
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FollowupRemindar;
