import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  User,
  BookUser,
  Tag,
  BookOpenText,
  Hash,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  BarChart2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import useBranchStore from "src/stores/useBranchStore";

const FeedbackForm = ({ employee, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const [staffOptions, setStaffOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const [isFetchingTeams, setIsFetchingTeams] = useState(false);

  const [formData, setFormData] = useState({
    branchcode: employee.basic.branchcode,
    staff_id: employee.basic.staff_id,
    reporting_to: "",
    team_id: "",
    year_of_experience: "",
    review_year: "",
    total_workingdays: "",
    total_dayspresent: "",
    total_daysabsent: "",
    total_daysleave: "",
    overall_attendance_percentage: "",
    total_project_worked: "",
    overallprojectrating: "",
    overall_milestone_rating: "",
    total_task: "",
    total_task_participantavgrating: "",
    total_duration_minutes: "",
    total_tasks_handled: "",
    tasks_completed_ontime: "",
    reworks_revisions: "",
    major_projects: "",
    self_timeliness_rating: "",
    self_timeliness_comments: "",
    self_quality_rating: "",
    self_quality_comments: "",
    self_communication_rating: "",
    self_communication_comments: "",
    self_initiative_rating: "",
    self_initiative_comments: "",
    self_interaction_rating: "",
    self_interaction_comments: "",
    self_attendance_rating: "",
    self_attendance_comments: "",
    what_went_well: "",
    challenges_faced: "",
    support_needed: "",
    improvement_suggestions: "",
    new_skills_learned: "",
    areas_to_improve: "",
    self_training_required: "",
    self_rating_overall: "",
    self_overall_feedback: "",
    self_trainings_attended: "",
    status: "draft",
  });

  // Fetch staff and team options when branchcode changes
  useEffect(() => {
    if (formData.branchcode) {
      fetchStaffOptions(formData.branchcode);
      fetchTeamOptions(formData.branchcode);
    } else {
      setStaffOptions([]);
      setTeamOptions([]);
    }
  }, [formData.branchcode]);

  const fetchStaffOptions = async (branchcode) => {
    setIsFetchingStaff(true);
    try {
      const response = await apiClient.get(
        `/users/dropdown?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((staff) => ({
          value: staff.staff_id,
          label: `${staff.firstname} ${staff.lastname} (${staff.designation})`,
        }));
        setStaffOptions(options);
      } else {
        setStaffOptions([]);
      }
    } catch (err) {
      notify.error("Failed to fetch staff options");
      setStaffOptions([]);
    } finally {
      setIsFetchingStaff(false);
    }
  };

  const fetchTeamOptions = async (branchcode) => {
    setIsFetchingTeams(true);
    try {
      const response = await apiClient.get(
        `/teams/read?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((team) => ({
          value: team.team_id,
          label: team.team_name,
        }));
        setTeamOptions(options);
      } else {
        setTeamOptions([]);
      }
    } catch (err) {
      notify.error("Failed to fetch team options");
      setTeamOptions([]);
    } finally {
      setIsFetchingTeams(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   const feedbackData = {
  //     reviewData: {
  //       ...formData,
  //       review_year: formData.review_year
  //         ? `${formData.review_year}-01-01|${formData.review_year}-12-31`
  //         : "",
  //     },
  //   };

  //   try {
  //     const response = await apiClient.post(
  //       `/users/self_rating/create`,
  //       feedbackData,
  //       {
  //
  //       }
  //     );

  //     if (response.status === 201) {
  //       notify.success("Feedback submitted successfully!");
  //       onSuccess();
  //     } else {
  //       setError(response.data.message || "Failed to submit feedback");
  //     }
  //   } catch (err) {
  //     setError(err.response?.data?.message || "An error occurred");
  //     notify.error(error || "Error submitting feedback");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // const payload = {
    //   reviewData: {
    //     ...formData,
    //     review_year: formData.review_year
    //       ? `${formData.review_year}-01-01|${formData.review_year}-12-31`
    //       : "",
    //   },
    // };


    const payload = {
      ...formData,
      review_year: formData.review_year
        ? `${formData.review_year}-01-01|${formData.review_year}-12-31`
        : "",
    };


    const response = await apiClient.post(
      `/addfeedbackemp`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data?.success) {
      notify.success("Review submitted successfully!");
      onSuccess?.(); // optional callback if parent needs refresh
    } else {
      notify.error(response.data?.message || "Something went wrong!");
    }
  } catch (error: any) {
    console.error("Submit Error:", error);
    notify.error(error.response?.data?.message || "Server error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // Rating scale component
  const RatingScale = ({ name, value, label }) => (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleRatingChange(name, rating)}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs 
            ${value >= rating ? "bg-red-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
        >
          {rating}
        </button>
      ))}
      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
        {value ? (
          value <= 2 ? (
            <span className="text-red-500 flex items-center">
              <ChevronsDown size={14} className="mr-1" /> Needs Improvement
            </span>
          ) : value <= 4 ? (
            <span className="text-yellow-500 flex items-center">
              <TrendingUp size={14} className="mr-1" /> Good
            </span>
          ) : (
            <span className="text-green-500 flex items-center">
              <Award size={14} className="mr-1" /> Excellent
            </span>
          )
        ) : null}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <User className="inline mr-2" /> Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Code */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code
            </p>
            <input
              name="branchcode"
              value={formData.branchcode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />
          </div>

          {/* Staff ID */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Staff ID
            </p>
            <input
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />
          </div>
          {/* Reporting To */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Reporting To
            </p>
            {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
            ) : (
              <select
                name="reporting_to"
                value={formData.reporting_to}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.branchcode || staffOptions.length === 0}
              >
                <option value="">Select Reporting Manager</option>
                {staffOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {formData.branchcode &&
              staffOptions.length === 0 &&
              !isFetchingStaff && (
                <div className="text-xs text-gray-500 mt-1">
                  No staff found for this branch
                </div>
              )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Team ID
            </p>
            {isFetchingTeams ? (
              <div className="text-sm text-gray-500 mt-1">Loading teams...</div>
            ) : (
              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.branchcode || teamOptions.length === 0}
              >
                <option value="">Select Team</option>
                {teamOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {formData.branchcode &&
              teamOptions.length === 0 &&
              !isFetchingTeams && (
                <div className="text-xs text-gray-500 mt-1">
                  No teams found for this branch
                </div>
              )}
          </div>

          {/* Years of Experience */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <TrendingUp className="inline mr-1" size={14} /> Years of
              Experience
            </p>
            <input
              name="year_of_experience"
              value={formData.year_of_experience}
              onChange={handleChange}
              type="number"
              step="0.1"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter years of experience"
              required
            />
          </div>
          {/* Years of Experience */}
   

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Review Year
            </p>
            <input
              name="review_year"
              value={formData.review_year}
              onChange={handleChange}
              type="number"
              min="2000"
              max="2099"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter review year (e.g., 2023)"
              required
            />
          </div>
        </div>
      </div>

      {/* Attendance Metrics Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Clock className="inline mr-2" /> Attendance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Working Days */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Total Working
              Days
            </p>
            <input
              name="total_workingdays"
              value={formData.total_workingdays}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter total working days"
            />
          </div>

          {/* Days Present */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CheckCircle className="inline mr-1" size={14} /> Days Present
            </p>
            <input
              name="total_dayspresent"
              value={formData.total_dayspresent}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter days present"
            />
          </div>

          {/* Days Absent */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlertCircle className="inline mr-1" size={14} /> Days Absent
            </p>
            <input
              name="total_daysabsent"
              value={formData.total_daysabsent}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter days absent"
            />
          </div>

          {/* Days Leave */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Days Leave
            </p>
            <input
              name="total_daysleave"
              value={formData.total_daysleave}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter days leave"
            />
          </div>

          {/* Attendance Percentage */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BarChart2 className="inline mr-1" size={14} /> Attendance
              Percentage
            </p>
            <input
              name="overall_attendance_percentage"
              value={formData.overall_attendance_percentage}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter attendance percentage"
            />
          </div>
        </div>
      </div>

      {/* Project Metrics Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookUser className="inline mr-2" /> Project Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Projects Worked */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BookUser className="inline mr-1" size={14} /> Total Projects
              Worked
            </p>
            <input
              name="total_project_worked"
              value={formData.total_project_worked}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter total projects worked"
            />
          </div>

          {/* Overall Project Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Award className="inline mr-1" size={14} /> Overall Project Rating
            </p>
            <RatingScale
              name="overallprojectrating"
              value={formData.overallprojectrating}
              label="Rate your project performance (1-5)"
            />
          </div>

          {/* Milestone Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BarChart2 className="inline mr-1" size={14} /> Milestone Rating
            </p>
            <RatingScale
              name="overall_milestone_rating"
              value={formData.overall_milestone_rating}
              label="Rate your milestone achievement (1-5)"
            />
          </div>

          {/* Total Tasks */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CheckCircle className="inline mr-1" size={14} /> Total Tasks
            </p>
            <input
              name="total_task"
              value={formData.total_task}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter total tasks"
            />
          </div>

          {/* Task Participant Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Task Participant Rating
            </p>
            <RatingScale
              name="total_task_participantavgrating"
              value={formData.total_task_participantavgrating}
              label="Average participant rating (1-5)"
            />
          </div>

          {/* Total Duration (minutes) */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Clock className="inline mr-1" size={14} /> Total Duration
              (minutes)
            </p>
            <input
              name="total_duration_minutes"
              value={formData.total_duration_minutes}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter total duration in minutes"
            />
          </div>

          {/* Major Projects */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700 col-span-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BookUser className="inline mr-1" size={14} /> Major Projects
            </p>
            <input
              name="major_projects"
              value={formData.major_projects}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="List major projects worked on"
            />
          </div>
        </div>
      </div>

      {/* Task Metrics Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <CheckCircle className="inline mr-2" /> Task Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Tasks Handled */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CheckCircle className="inline mr-1" size={14} /> Total Tasks
              Handled
            </p>
            <input
              name="total_tasks_handled"
              value={formData.total_tasks_handled}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter total tasks handled"
            />
          </div>

          {/* Tasks Completed On Time */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Clock className="inline mr-1" size={14} /> Tasks Completed On
              Time
            </p>
            <input
              name="tasks_completed_ontime"
              value={formData.tasks_completed_ontime}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter tasks completed on time"
            />
          </div>

          {/* Reworks/Revisions */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlertCircle className="inline mr-1" size={14} />{" "}
              Reworks/Revisions
            </p>
            <input
              name="reworks_revisions"
              value={formData.reworks_revisions}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter number of reworks/revisions"
            />
          </div>
        </div>
      </div>

      {/* Self-Ratings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BarChart2 className="inline mr-2" /> Self-Ratings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timeliness Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Clock className="inline mr-1" size={14} /> Timeliness
            </p>
            <RatingScale
              name="self_timeliness_rating"
              value={formData.self_timeliness_rating}
              label="Rate your timeliness (1-5)"
            />
            <textarea
              name="self_timeliness_comments"
              value={formData.self_timeliness_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on timeliness"
              rows={2}
            />
          </div>

          {/* Quality Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Award className="inline mr-1" size={14} /> Quality
            </p>
            <RatingScale
              name="self_quality_rating"
              value={formData.self_quality_rating}
              label="Rate your work quality (1-5)"
            />
            <textarea
              name="self_quality_comments"
              value={formData.self_quality_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on quality"
              rows={2}
            />
          </div>

          {/* Communication Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <MessageSquare className="inline mr-1" size={14} /> Communication
            </p>
            <RatingScale
              name="self_communication_rating"
              value={formData.self_communication_rating}
              label="Rate your communication (1-5)"
            />
            <textarea
              name="self_communication_comments"
              value={formData.self_communication_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on communication"
              rows={2}
            />
          </div>

          {/* Initiative Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <TrendingUp className="inline mr-1" size={14} /> Initiative
            </p>
            <RatingScale
              name="self_initiative_rating"
              value={formData.self_initiative_rating}
              label="Rate your initiative (1-5)"
            />
            <textarea
              name="self_initiative_comments"
              value={formData.self_initiative_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on initiative"
              rows={2}
            />
          </div>

          {/* Interaction Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Team Interaction
            </p>
            <RatingScale
              name="self_interaction_rating"
              value={formData.self_interaction_rating}
              label="Rate your team interaction (1-5)"
            />
            <textarea
              name="self_interaction_comments"
              value={formData.self_interaction_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on team interaction"
              rows={2}
            />
          </div>

          {/* Attendance Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Attendance
            </p>
            <RatingScale
              name="self_attendance_rating"
              value={formData.self_attendance_rating}
              label="Rate your attendance (1-5)"
            />
            <textarea
              name="self_attendance_comments"
              value={formData.self_attendance_comments}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Comments on attendance"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <MessageSquare className="inline mr-2" /> Feedback
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {/* What Went Well */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <ThumbsUp className="inline mr-1" size={14} /> What Went Well
            </p>
            <textarea
              name="what_went_well"
              value={formData.what_went_well}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Describe what went well this year"
              rows={3}
            />
          </div>

          {/* Challenges Faced */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <AlertCircle className="inline mr-1" size={14} /> Challenges Faced
            </p>
            <textarea
              name="challenges_faced"
              value={formData.challenges_faced}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Describe challenges you faced this year"
              rows={3}
            />
          </div>

          {/* Support Needed */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <HelpCircle className="inline mr-1" size={14} /> Support Needed
            </p>
            <textarea
              name="support_needed"
              value={formData.support_needed}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Describe what support you need"
              rows={3}
            />
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              <TrendingUp className="inline mr-1" size={14} /> Improvement
              Suggestions
            </p>
            <textarea
              name="improvement_suggestions"
              value={formData.improvement_suggestions}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Suggest improvements for next year"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Development Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <TrendingUp className="inline mr-2" /> Development
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {/* New Skills Learned */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Award className="inline mr-1" size={14} /> New Skills Learned
            </p>
            <textarea
              name="new_skills_learned"
              value={formData.new_skills_learned}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="List new skills you've learned this year"
              rows={3}
            />
          </div>

          {/* Areas to Improve */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ThumbsDown className="inline mr-1" size={14} /> Areas to Improve
            </p>
            <textarea
              name="areas_to_improve"
              value={formData.areas_to_improve}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Identify areas you want to improve"
              rows={3}
            />
          </div>

          {/* Self-Training Required */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BookOpenText className="inline mr-1" size={14} /> Self-Training
              Required
            </p>
            <textarea
              name="self_training_required"
              value={formData.self_training_required}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="List training you think would help you improve"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Self-Evaluation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BarChart2 className="inline mr-2" /> Self-Evaluation
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {/* Overall Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Award className="inline mr-1" size={14} /> Overall Rating
            </p>
            <RatingScale
              name="self_rating_overall"
              value={formData.self_rating_overall}
              label="Rate your overall performance (1-5)"
            />
          </div>

          {/* Overall Feedback */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <MessageSquare className="inline mr-1" size={14} /> Overall
              Feedback
            </p>
            <textarea
              name="self_overall_feedback"
              value={formData.self_overall_feedback}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Provide your overall feedback for the year"
              rows={4}
            />
          </div>

          {/* Trainings Attended */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BookOpenText className="inline mr-1" size={14} /> Trainings
              Attended
            </p>
            <textarea
              name="self_trainings_attended"
              value={formData.self_trainings_attended}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="List trainings you attended this year"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Tag className="inline mr-2" /> Status
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submit for Review</option>
          </select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
  {/* Cancel Button */}
  <button
    type="button"
    onClick={onCancel}
    disabled={loading}
    className="px-5 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 
               text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 
               font-medium text-sm"
  >
    Cancel
  </button>

  {/* Submit Button */}
  <button
    type="submit"

    onClick={handleSubmit}
    
    className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700 
               text-white rounded-md transition-colors duration-200 font-medium text-sm 
               flex items-center justify-center"
  >
    
      Submit
  </button>
</div>
    </div>
  );
};

export default FeedbackForm;
