import React, { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { useParams } from "react-router-dom";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import {
  Eye,
  Edit2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Award,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
} from "lucide-react";
import { notify } from "~/services/notificationService";
import Modal from "src/component/Modal";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";

const LeedFeedbackManagement = ({leed}) => {
  console.log("leedddddddd",leed)
  const { id } = useParams();
  const team_id = decodeURIComponent(id);
  const token = useAuthStore((state) => state.accessToken);
 
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [editFormData, setEditFormData] = useState({
    lead_tasks_completed: "",
    lead_tasks_rating: "",
    lead_errors_count: "",
    lead_errors_rating: "",
    lead_timeliness_percent: "",
    lead_timeliness_rating: "",
    lead_communication_rating: "",
    lead_client_feedback_rating: "",
    lead_attendance_rating: "",
    development_initiative: false,
    development_initiative_remarks: "",
    lead_technical_rating: "",
    lead_technical_remarks: "",
    lead_attitude_rating: "",
    lead_attitude_remarks: "",
    lead_learning_rating: "",
    lead_learning_remarks: "",
    lead_team_rating: "",
    lead_team_remarks: "",
    training_required: false,
    training_details: "",
    lead_comments: "",
  });
  const [expandedSections, setExpandedSections] = useState({
    performance: false,
    skills: false,
    behavior: false,
    development: false,
  });

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/users/self_rating/read?team_id=${team_id}&page=${currentPage}&limit=${pageSize}`
        );
        setFeedbacks(response.data.data);
        setTotalItems(response.data.totalDocuments);
      } catch (err) {
        setError(err.message);
        notify.error("Failed to fetch feedback data");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [team_id, token, currentPage, pageSize]);

  // Handle view feedback
  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowViewModal(true);
  };

  // Handle edit feedback
  const handleEditFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setEditFormData({
      lead_tasks_completed: feedback.lead_tasks_completed || "",
      lead_tasks_rating: feedback.lead_tasks_rating || "",
      lead_errors_count: feedback.lead_errors_count || "",
      lead_errors_rating: feedback.lead_errors_rating || "",
      lead_timeliness_percent: feedback.lead_timeliness_percent || "",
      lead_timeliness_rating: feedback.lead_timeliness_rating || "",
      lead_communication_rating: feedback.lead_communication_rating || "",
      lead_client_feedback_rating: feedback.lead_client_feedback_rating || "",
      lead_attendance_rating: feedback.lead_attendance_rating || "",
      development_initiative: feedback.development_initiative || false,
      development_initiative_remarks:
        feedback.development_initiative_remarks || "",
      lead_technical_rating: feedback.lead_technical_rating || "",
      lead_technical_remarks: feedback.lead_technical_remarks || "",
      lead_attitude_rating: feedback.lead_attitude_rating || "",
      lead_attitude_remarks: feedback.lead_attitude_remarks || "",
      lead_learning_rating: feedback.lead_learning_rating || "",
      lead_learning_remarks: feedback.lead_learning_remarks || "",
      lead_team_rating: feedback.lead_team_rating || "",
      lead_team_remarks: feedback.lead_team_remarks || "",
      training_required: feedback.training_required || false,
      training_details: feedback.training_details || "",
      lead_comments: feedback.lead_comments || "",
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmitFeedback = async () => {
    try {
      setLoading(true);
      const payload = {
        reviewData: {
          ...editFormData,
          lead_id: leed.team_lead,
          performance_id: selectedFeedback.performance_id,
          status: "teamlead_reviewed",
        },
      };

      const response = await apiClient.put(
        `/users/lead_rating/edit`,
        payload
      );

      if (response.status === 200) {
        notify.success("Feedback updated successfully!");
        setShowEditModal(false);
        // Refresh the feedback list
        const updatedResponse = await apiClient.get(
          `/users/self_rating/read?team_id=${team_id}&page=${currentPage}&limit=${pageSize}`
        );
        setFeedbacks(updatedResponse.data.data);
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      notify.error("Failed to update feedback");
    } finally {
      setLoading(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={18}
          className={
            i <= rating
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300 dark:text-gray-500"
          }
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Table configuration
  const thead = () => [
    { data: "ID" },
    { data: "Employee" },
    { data: "Designation" },
    { data: "Review Period" },
    { data: "Self Rating" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return feedbacks.map((feedback, index) => ({
      id: index + 1,
      data: [
        { data: feedback.performance_id },
        {
          data: (
            <div className="flex items-center">
              <User className="mr-2" size={16} />
              {feedback.name}
            </div>
          ),
        },
        { data: feedback.designation },
        { data: feedback.review_year },
        { data: renderStars(feedback.self_rating_overall) },
        {
          data: (
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                feedback.status === "submitted"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : feedback.status === "teamlead_reviewed"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {feedback.status.replace("_", " ")}
            </span>
          ),
        },
        {
          data: (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleViewFeedback(feedback)}
                className="p-1 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                title="View"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={() => handleEditFeedback(feedback)}
                className="p-1 text-green-600 hover:text-green-800 dark:hover:text-green-400"
                title="Edit"
                disabled={feedback.status === "teamlead_reviewed"}
              >
                <Edit2 size={18} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  return (
    <div className="container mx-auto px-4 py-8">
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Employee Feedback Management
        </h1>

        {loading && !feedbacks.length ? (
          <div className="text-center py-8">
            <ButtonLoader />
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading feedback data...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <DataTable
                thead={thead}
                tbody={tbody}
                responsive={true}
                className="min-w-full"
              />
            </div>

            <div className="mt-4">
              <CustomPagination
                total={totalItems}
                currentPage={currentPage}
                defaultPageSize={pageSize}
                onChange={handlePageChange}
                paginationLabel="feedbacks"
              />
            </div>
          </>
        )}
      </div>

      {/* View Feedback Modal */}
    <Modal
  isVisible={showViewModal}
  className="w-full max-w-6xl mx-auto"
  onClose={() => setShowViewModal(false)}
  title="Employee Feedback Details"
>
  {selectedFeedback && (
    <div className="space-y-6 px-4">
      {/* Employee Info */}
      <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-4">
              <User className="mr-2 text-red-700 dark:text-red-500" size={18} />
              Employee Information
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Name:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Designation:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.designation}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-4">
              <Award className="mr-2 text-red-700 dark:text-red-500" size={18} />
              Performance Summary
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Review Period:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.review_year}
                </span>
              </p>
              <p className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Self Rating:</span>
                <span className="font-medium">
                  {renderStars(selectedFeedback.self_rating_overall)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-4">
              <CheckCircle className="mr-2 text-red-700 dark:text-red-500" size={18} />
              Attendance
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Present Days:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.total_dayspresent}/{selectedFeedback.total_workingdays}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Attendance %:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.overall_attendance_percentage}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800">
        <button
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection("performance")}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <TrendingUp className="mr-2 text-red-700 dark:text-red-500" size={18} />
            Performance Metrics
          </h3>
          {expandedSections.performance ? (
            <ChevronUp className="text-red-700 dark:text-red-500" size={20} />
          ) : (
            <ChevronDown className="text-red-700 dark:text-red-500" size={20} />
          )}
        </button>
        {expandedSections.performance && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 dark:border-gray-700">
            {[
              {
                icon: <Clock className="text-red-700 dark:text-red-500" size={16} />,
                title: "Timeliness",
                comment: selectedFeedback.self_timeliness_comments,
                rating: selectedFeedback.self_timeliness_rating
              },
              {
                icon: <CheckCircle className="text-red-700 dark:text-red-500" size={16} />,
                title: "Quality of Work",
                comment: selectedFeedback.self_quality_comments,
                rating: selectedFeedback.self_quality_rating
              },
              {
                icon: <MessageSquare className="text-red-700 dark:text-red-500" size={16} />,
                title: "Communication",
                comment: selectedFeedback.self_communication_comments,
                rating: selectedFeedback.self_communication_rating
              },
              {
                icon: <BookOpen className="text-red-700 dark:text-red-500" size={16} />,
                title: "Initiative",
                comment: selectedFeedback.self_initiative_comments,
                rating: selectedFeedback.self_initiative_rating
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
              >
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {item.comment}
                </p>
                <div className="mt-2">
                  {renderStars(item.rating)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Self Feedback Section */}
      <div className="rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800">
        <button
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection("skills")}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <Smile className="mr-2 text-red-700 dark:text-red-500" size={18} />
            Self Assessment
          </h3>
          {expandedSections.skills ? (
            <ChevronUp className="text-red-700 dark:text-red-500" size={20} />
          ) : (
            <ChevronDown className="text-red-700 dark:text-red-500" size={20} />
          )}
        </button>
        {expandedSections.skills && (
          <div className="p-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "What Went Well",
                  content: selectedFeedback.what_went_well
                },
                {
                  title: "Challenges Faced",
                  content: selectedFeedback.challenges_faced
                },
                {
                  title: "New Skills Learned",
                  content: selectedFeedback.new_skills_learned
                },
                {
                  title: "Areas to Improve",
                  content: selectedFeedback.areas_to_improve
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                Overall Feedback
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFeedback.self_overall_feedback}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lead Feedback (if available) */}
      {selectedFeedback.status === "teamlead_reviewed" && (
        <div className="rounded-xl overflow-hidden shadow-lg bg-purple-50 dark:bg-purple-900/30">
          <button
            className="w-full flex justify-between items-center p-6 hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors"
            onClick={() => toggleSection("behavior")}
          >
            <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 flex items-center">
              <User className="mr-2 text-purple-700 dark:text-purple-400" size={18} />
              Team Lead Feedback
            </h3>
            {expandedSections.behavior ? (
              <ChevronUp className="text-purple-700 dark:text-purple-400" size={20} />
            ) : (
              <ChevronDown className="text-purple-700 dark:text-purple-400" size={20} />
            )}
          </button>
          {expandedSections.behavior && (
            <div className="p-6 space-y-6 border-t border-purple-200 dark:border-purple-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-100 dark:bg-purple-800/50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    Tasks Completed
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {selectedFeedback.lead_tasks_completed} tasks with rating:{" "}
                    {renderStars(selectedFeedback.lead_tasks_rating)}
                  </p>
                </div>
                
                <div className="bg-purple-100 dark:bg-purple-800/50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    Errors Count
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {selectedFeedback.lead_errors_count} errors with rating:{" "}
                    {renderStars(selectedFeedback.lead_errors_rating)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-100 dark:bg-purple-800/50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    Technical Skills
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                    {selectedFeedback.lead_technical_remarks}
                  </p>
                  <div className="mt-2">
                    {renderStars(selectedFeedback.lead_technical_rating)}
                  </div>
                </div>
                
                <div className="bg-purple-100 dark:bg-purple-800/50 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    Team Collaboration
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                    {selectedFeedback.lead_team_remarks}
                  </p>
                  <div className="mt-2">
                    {renderStars(selectedFeedback.lead_team_rating)}
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-100 dark:bg-purple-800/50 p-4 rounded-lg">
                <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                  Lead Comments
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {selectedFeedback.lead_comments}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</Modal>

      {/* Edit Feedback Modal */}

      
{/* Edit Feedback Modal */}
<Modal
  isVisible={showEditModal}
  className="w-full md:w-3/4 lg:w-2/3"
  onClose={() => setShowEditModal(false)}
  title="Update Employee Feedback"
>
  {selectedFeedback && (
    <div className="space-y-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {/* Employee Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <User className="inline mr-2" /> Employee Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Employee Name
            </p>
            <input
              value={selectedFeedback.name}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Award className="inline mr-1" size={14} /> Designation
            </p>
            <input
              value={selectedFeedback.designation}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Review Period
            </p>
            <input
              value={selectedFeedback.review_year}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Star className="inline mr-1" size={14} /> Self Rating
            </p>
            <div className="mt-1">
              {renderStars(selectedFeedback.self_rating_overall)}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <TrendingUp className="inline mr-2" /> Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks Completed */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CheckCircle className="inline mr-1" size={14} /> Tasks Completed
            </p>
            <input
              type="number"
              name="lead_tasks_completed"
              value={editFormData.lead_tasks_completed}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              min="0"
              placeholder="Enter number of tasks completed"
            />
          </div>
          
          {/* Tasks Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Star className="inline mr-1" size={14} /> Tasks Rating
            </p>
            <select
              name="lead_tasks_rating"
              value={editFormData.lead_tasks_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Poor' : num === 5 ? 'Excellent' : 'Average'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Errors Count */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlertCircle className="inline mr-1" size={14} /> Errors Count
            </p>
            <input
              type="number"
              name="lead_errors_count"
              value={editFormData.lead_errors_count}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              min="0"
              placeholder="Enter number of errors"
            />
          </div>
          
          {/* Errors Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Star className="inline mr-1" size={14} /> Errors Rating
            </p>
            <select
              name="lead_errors_rating"
              value={editFormData.lead_errors_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Many Errors' : num === 5 ? 'No Errors' : 'Some Errors'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Timeliness Percentage */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Clock className="inline mr-1" size={14} /> Timeliness %
            </p>
            <input
              type="number"
              name="lead_timeliness_percent"
              value={editFormData.lead_timeliness_percent}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              min="0"
              max="100"
              placeholder="Enter timeliness percentage"
            />
          </div>
          
          {/* Timeliness Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Star className="inline mr-1" size={14} /> Timeliness Rating
            </p>
            <select
              name="lead_timeliness_rating"
              value={editFormData.lead_timeliness_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Often Late' : num === 5 ? 'Always On Time' : 'Sometimes Late'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Communication & Client Feedback Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <MessageSquare className="inline mr-2" /> Communication & Client Feedback
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Communication Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <MessageSquare className="inline mr-1" size={14} /> Communication Rating
            </p>
            <select
              name="lead_communication_rating"
              value={editFormData.lead_communication_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Poor' : num === 5 ? 'Excellent' : 'Average'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Client Feedback Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Client Feedback Rating
            </p>
            <select
              name="lead_client_feedback_rating"
              value={editFormData.lead_client_feedback_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Negative' : num === 5 ? 'Very Positive' : 'Neutral'}
                </option>
              ))}
            </select>
          </div>
          
          {/* Attendance Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Attendance Rating
            </p>
            <select
              name="lead_attendance_rating"
              value={editFormData.lead_attendance_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Poor' : num === 5 ? 'Excellent' : 'Average'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Skills & Development Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Award className="inline mr-2" /> Skills & Development
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Technical Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <TrendingUp className="inline mr-1" size={14} /> Technical Rating
            </p>
            <select
              name="lead_technical_rating"
              value={editFormData.lead_technical_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Basic' : num === 5 ? 'Expert' : 'Intermediate'}
                </option>
              ))}
            </select>
            <textarea
              name="lead_technical_remarks"
              value={editFormData.lead_technical_remarks}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Technical remarks"
              rows={2}
            />
          </div>
          
          {/* Learning Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <BookOpen className="inline mr-1" size={14} /> Learning Rating
            </p>
            <select
              name="lead_learning_rating"
              value={editFormData.lead_learning_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Resistant' : num === 5 ? 'Eager' : 'Willing'}
                </option>
              ))}
            </select>
            <textarea
              name="lead_learning_remarks"
              value={editFormData.lead_learning_remarks}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Learning remarks"
              rows={2}
            />
          </div>
          
          {/* Team Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Team Rating
            </p>
            <select
              name="lead_team_rating"
              value={editFormData.lead_team_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Poor' : num === 5 ? 'Excellent' : 'Average'}
                </option>
              ))}
            </select>
            <textarea
              name="lead_team_remarks"
              value={editFormData.lead_team_remarks}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Team collaboration remarks"
              rows={2}
            />
          </div>
          
          {/* Attitude Rating */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Smile className="inline mr-1" size={14} /> Attitude Rating
            </p>
            <select
              name="lead_attitude_rating"
              value={editFormData.lead_attitude_rating}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="">Select Rating (1-5)</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} - {num === 1 ? 'Negative' : num === 5 ? 'Very Positive' : 'Neutral'}
                </option>
              ))}
            </select>
            <textarea
              name="lead_attitude_remarks"
              value={editFormData.lead_attitude_remarks}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Attitude remarks"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Development Initiative Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <TrendingUp className="inline mr-2" /> Development Initiative
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="development_initiative"
                checked={editFormData.development_initiative}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Development Initiative Shown
              </span>
            </label>
            <textarea
              name="development_initiative_remarks"
              value={editFormData.development_initiative_remarks}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Describe development initiatives taken"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Training Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookOpen className="inline mr-2" /> Training Requirements
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="training_required"
                checked={editFormData.training_required}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Training Required
              </span>
            </label>
            <textarea
              name="training_details"
              value={editFormData.training_details}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 focus:outline-none border-t border-gray-200 dark:border-gray-600 pt-2"
              placeholder="Describe training requirements"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Overall Comments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <MessageSquare className="inline mr-2" /> Overall Comments
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <textarea
              name="lead_comments"
              value={editFormData.lead_comments}
              onChange={handleInputChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Provide your overall feedback"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={() => setShowEditModal(false)}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmitFeedback}
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Submit Feedback"}
        </button>
      </div>
    </div>
  )}
</Modal>

              </div>)
}

export default LeedFeedbackManagement;
