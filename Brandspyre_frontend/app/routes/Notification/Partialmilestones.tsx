import {
  Bell,
  Dot,
  Eye,
  KeyRound,
  Trash2,
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

interface Milestone {
  milestone_code: string;
  miles_title: string;
  milestone_type: string;
  start_date: string;
  end_date: string;
  status: string;
  handler_by: string;
  project_code: string;
  paystatus: string;
}

function PartialMilestoneRemindar() {
  const [overdueMilestones, setOverdueMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchOverdueMilestones();
  }, [selectedDate]);

  const fetchOverdueMilestones = async () => {
    setLoading(true);
    setError("");
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await apiClient.get(
        `/project/milestone/read?partial=${formattedDate}`
      );
      
      if (response.data.message === "View Project Milestone Info Success") {
        setOverdueMilestones(response.data.data);
      } else {
        setError("Failed to fetch overdue milestones");
      }
    } catch (err) {
      setError("Error fetching overdue milestones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string, milestoneType: string) => {
    if (status === 'verified') {
      return 'amber';
    } else if (milestoneType === 'initial') {
      return 'blue';
    } else {
      return 'red';
    }
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <div className="text-gray-500 text-xl font-bold">Milestone Reminder</div>
        {/*<div className="flex items-center gap-2">
          <Calendar className="text-gray-500" size={20} />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
          />
        </div>*/}
      </div>
      
      {loading && <div className="text-center py-4">Loading overdue milestones...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      
      <div className="w-full flex flex-col justify-evenly gap-8">
        {overdueMilestones.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            No overdue milestones found for {selectedDate.toDateString()}
          </div>
        )}

        {overdueMilestones.map((milestone) => {
          const statusColor = getStatusColor(milestone.status, milestone.milestone_type);
          const bgColor = statusColor === 'amber' ? 'bg-amber-500' : 
                         statusColor === 'blue' ? 'bg-blue-700' : 'bg-red-700';
          const textColor = statusColor === 'amber' ? 'text-amber-500' : 
                          statusColor === 'blue' ? 'text-blue-700' : 'text-red-700';
          const hoverBgColor = statusColor === 'amber' ? 'hover:bg-amber-500/50' : 
                              statusColor === 'blue' ? 'hover:bg-blue-700/50' : 'hover:bg-red-700/50';
          const hoverTextColor = statusColor === 'amber' ? 'hover:text-amber-800' : 
                               statusColor === 'blue' ? 'hover:text-blue-800' : 'hover:text-red-800';

          return (
            <div key={milestone.milestone_code} className="bg-white w-full h-[100%] flex rounded-sm shadow-lg">
              <div>
                <div className={`${bgColor} rounded-r-lg w-4 h-[195px]`}></div>
              </div>
              <div className="ms-4 w-full p-4">
                <div className="md:flex gap-5">
                  <User2 className="font-light text-gray-600" size={25} />
                  <h1 className="text-xl font-medium text-gray-600">
                    {milestone.milestone_code} - {milestone.miles_title}
                  </h1>
                </div>
                <div className="md:flex md:w-full justify-between mt-2">
                  <div>
                    <p className="text-gray-600">
                      Type: {milestone.milestone_type} | Status: {milestone.status}
                    </p>
                    <p className="text-gray-600">
                      Start: {formatDate(milestone.start_date)} | 
                      Due: {formatDate(milestone.end_date)} | 
                      Payment: {milestone.paystatus}
                    </p>
                    <p className="text-gray-600">
                      Handler: {milestone.handler_by}
                    </p>
                  </div>
                  <div className="md:flex flex-col">
                    <div>
                      <p className={`w-[120px] h-[30px] ${bgColor}/25 ${textColor} rounded-3xl`}>
                        <Dot className="inline" /> Overdue
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:flex justify-between mt-4">
                  <div className="flex gap-8">
                    <Link to={`/milestone/${encodeURIComponent(milestone.milestone_code)}`}>
                      <button className={`${bgColor}/25 px-3 py-2 rounded-sm ${textColor} ${hoverBgColor} ${hoverTextColor} flex gap-1`}>
                        <Eye size={15} className="mt-1" />
                        View Detail
                      </button>
                    </Link>
                  </div>
                  <div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PartialMilestoneRemindar;