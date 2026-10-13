import { useEffect, useState } from "react";
import { useAuthStore } from "src/stores/authStore";
import MeetingDocumentViewer from "src/component/MeetinDocumentViewr";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";

interface MeetingDocument {
  meet_id: number;
  title: string;
  doc: Array<{
    url: string;
    type: string;
  }>;
  doc_status: string;
  created_on: string;
}

const MeetingDocuments = () => {
  const [meetings, setMeetings] = useState<MeetingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const staff_id = useAuthStore((state) => state.staff_id);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const fetchMeetingDocuments = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/doc_meet/read`, {
          params: {
            person_id: staff_id,
            role: 'staff',
            comm_type: 'doc'
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMeetings(response.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (staff_id) {
      fetchMeetingDocuments();
    }
  }, [staff_id, token]);

  if (loading) {
    return <div className="p-4">Loading meeting documents...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Flatten all documents from all meetings
  const allDocuments = meetings.flatMap(meeting => 
    meeting.doc.map(doc => ({
      ...doc,
      title: meeting.title,
      created_on: meeting.created_on,
      doc_status: meeting.doc_status
    }))
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Meeting Documents</h2>
      
      {allDocuments.length === 0 ? (
        <p>No meeting documents found.</p>
      ) : (
        <MeetingDocumentViewer documents={allDocuments} />
      )}
    </div>
  );
};

export default MeetingDocuments;