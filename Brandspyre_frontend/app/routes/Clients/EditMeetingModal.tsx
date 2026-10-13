import React, { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { Video, Users, ChevronUp, ChevronDown, X ,  ClipboardList,} from "lucide-react";
import ButtonLoader from "./ButtonLoader";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "src/stores/authStore";
// import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const EditMeetingModal = ({ onUpdated, onCancel }: { onUpdated?: () => void; onCancel?: () => void }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);

  const staff_ids = useAuthStore((state) => state.staff_id);

  // Core meeting fields
  const [formData, setFormData] = useState({
    meet_id: "",
    branchcode: "",
    title: "",
    notes: "",
    comm_type: "meeting",
    status: "",
    doc_status: "none",
    meet_link: "",
    start_date_time: "",
    end_date_time: "",
    category: "branch",
    field: "project",
    participants: [],
    custom_targets: [],
  });

  // --- Documents state (kept separate) ---
  // Existing docs as they come from DB (do not mutate ordering)
  const [existingDocs, setExistingDocs] = useState([]); // [{url,type}, ...]
  // Newly added docs in this UI session only
  const [newDocs, setNewDocs] = useState([]); // [{url,type}, ...]
  // Which *original indexes* (in existingDocs) to remove
  const [removedExistingIndexes, setRemovedExistingIndexes] = useState([]); // [0,2,...]
  // Optional: if you add a "replace" flow, push { index, url, type } here
  const [editDocs, setEditDocs] = useState([]); // not used unless you implement replace

  const [loading, setLoading] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);

    const userRole = useAuthStore((state) => state.role);
    const isOrganizer = formData.createdby === staff_ids || userRole === "superadmin";

  // new participant state
  const [newParticipant, setNewParticipant] = useState({
    person_id: "",
    role: "staff",
    isdocvisible: false,
  });

  // fetch meeting details
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiClient.get(`/getmeetingbyid?id=${id}`);
        if (res.data?.success) {
          const data = res.data.data;

          setFormData((prev) => ({
            ...prev,
            meet_id: data.meet_id,
            branchcode: data.branchcode || "",
            title: data.title || "",
            notes: data.notes || "",
            comm_type: data.comm_type,
            status: data.status,
            doc_status: data.doc_status || "none",
            meet_link: data.meet_link || "",
            start_date_time: data.start_date_time || "",
            end_date_time: data.end_date_time || "",
            category: data.category,
            field: data.field,
            createdby  : data.createdby,
            participants:
              data.participants?.map((p) => ({
                id: p.id,
                person_id: p.staff_id || p.client_code || p.id,
                role: p.role,
                isdocvisible: p.isdocvisible,
                status: p.status,
                name:
                  p.client_name || `${p.firstname || ""} ${p.lastname || ""}`,
                email: p.client_email || p.email,
                phone: p.primary_phone || p.phonenumber,
              })) || [],
            custom_targets: data.custom_targets || [],
          }));

          // Reset docs state based on DB
          setExistingDocs(Array.isArray(data.doc) ? data.doc : []);
          setNewDocs([]);
          setRemovedExistingIndexes([]);
          setEditDocs([]);
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
      }
    })();
  }, [id, token]);

  // ------------------
  // helpers
  // ------------------
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Add NEW docs only (don't touch existingDocs)
  // const handleNewFileUpload = (e) => {
  //   const files = Array.from(e.target.files || []);
  //   if (!files.length) return;
  //   setNewDocs((prev) => [
  //     ...prev,
  //     ...files.map((f) => ({ url: f.name, type: f.type || "file" })),
  //   ]);
  // };



  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      // Call backend upload API
      const res = await apiClient.post(`/uploadedit/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add uploaded doc info (url, type) to newDocs state
      setNewDocs((prev) => [...prev, res.data]);
    }
  } catch (error) {
    console.error("File upload failed:", error);
    alert("File upload failed, please try again.");
  }
};



  const generatePDF = () => {
    const doc = new jsPDF();

    // Title / Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(180, 0, 0); // Red color matching theme
    doc.text("MINUTES OF MEETING (MOM)", 14, 20);

    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, 196, 25);

    // Meeting Details (Key-Value style)
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    // Left Column
    doc.setFont("helvetica", "bold");
    doc.text("Meeting Title:", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(formData.title || "N/A", 45, 35);

    doc.setFont("helvetica", "bold");
    doc.text("Meeting ID:", 14, 43);
    doc.setFont("helvetica", "normal");
    doc.text(String(formData.meet_id || "N/A"), 45, 43);

    doc.setFont("helvetica", "bold");
    doc.text("Link:", 14, 51);
    doc.setFont("helvetica", "normal");
    const linkText = formData.meet_link || "N/A";
    const splitLink = doc.splitTextToSize(linkText, 140);
    doc.text(splitLink, 45, 51);

    // Right Column
    doc.setFont("helvetica", "bold");
    doc.text("Start Time:", 110, 35);
    doc.setFont("helvetica", "normal");
    doc.text(formData.start_date_time ? new Date(formData.start_date_time).toLocaleString() : "N/A", 135, 35);

    doc.setFont("helvetica", "bold");
    doc.text("End Time:", 110, 43);
    doc.setFont("helvetica", "normal");
    doc.text(formData.end_date_time ? new Date(formData.end_date_time).toLocaleString() : "N/A", 135, 43);

    doc.setFont("helvetica", "bold");
    doc.text("Status:", 110, 51);
    doc.setFont("helvetica", "normal");
    doc.text(formData.status || "N/A", 135, 51);

    // Divider
    doc.line(14, 60, 196, 60);

    // Participants Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(180, 0, 0);
    doc.text("Attendees / Participants", 14, 68);

    const participantCols = ["Name/ID", "Role", "Status"];
    const participantRows = formData.participants.map((p: any) => [
      p.name || p.person_id || "N/A",
      p.role || "N/A",
      p.status || "N/A"
    ]);

    autoTable(doc, {
      head: [participantCols],
      body: participantRows,
      startY: 73,
      theme: "striped",
      headStyles: { fillColor: [180, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Meeting Notes Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(180, 0, 0);
    doc.text("Meeting Notes / Discussion Points", 14, currentY);
    currentY += 6;

    const notesText = formData.notes || "No notes recorded for this meeting.";
    
    // AutoTable handles multiline wrapping and automatic page breaking beautifully
    autoTable(doc, {
      body: [[notesText]],
      startY: currentY,
      theme: "plain",
      styles: { 
        fontSize: 11, 
        cellPadding: 2, 
        textColor: [50, 50, 50],
        font: "helvetica"
      },
    });

    // Save PDF
    doc.save(`MOM-${formData.meet_id || "Report"}.pdf`);
  };

  // Remove a NEW doc (no need to tell backend—it's not saved yet)
  const removeNewDoc = (idx) => {
    setNewDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Mark an EXISTING doc for removal by its ORIGINAL index
  const removeExistingDoc = (origIndex) => {
    setRemovedExistingIndexes((prev) => {
      if (prev.includes(origIndex)) return prev; // avoid duplicates
      return [...prev, origIndex];
    });
  };

  const toggleDocVisibility = async (participant) => {
    try {
      await apiClient.put(
        `/doc_meet/participant/edit`,
        {
          id: participant.id,
          role: participant.role,
          isdocvisible: !participant.isdocvisible,
          status: participant.status || "accepted",
        }
      );
      // Update local state
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participant.id
            ? { ...p, isdocvisible: !p.isdocvisible }
            : p
        ),
      }));
    } catch (err) {
      console.error("Error toggling doc visibility:", err);
    }
  };

  const removeParticipant = async (idToRemove) => {
    try {
      await apiClient.delete(`/doc_meet/participant/delete`, {
        data: { id: idToRemove },
      });
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== idToRemove),
      }));
    } catch (err) {
      console.error("Error removing participant:", err);
    }
  };

  // add participant
  const addParticipant = async () => {
    if (!newParticipant.person_id) return;
    try {
      const res = await apiClient.post(
        `/doc_meet/participant/create`,
        {
          meet_id: formData.meet_id,
          participants: [newParticipant],
        }
      );

      if (res.data?.success) {
        // If API returns the created row with id, prefer that.
        const created =
          res.data.data?.[0] ||
          { ...newParticipant, id: Math.random().toString(36).slice(2) };

        setFormData((prev) => ({
          ...prev,
          participants: [...prev.participants, created],
        }));
        setNewParticipant({ person_id: "", role: "staff", isdocvisible: false });
      }
    } catch (err) {
      console.error("Error adding participant:", err);
    }
  };

  // keep DB "YYYY-MM-DD HH:mm:ss" exact, but show as input-friendly
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // If already T-separated, keep it; else convert single space to T
    const safe = dateString.includes("T")
      ? dateString
      : dateString.replace(" ", "T");
    return safe.slice(0, 16);
  };

  // submit meeting update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // IMPORTANT:
    // - add_docs: ONLY the newDocs
    // - remove_indexes: ORIGINAL indexes from existingDocs that you marked to remove
    // - edit_docs: if you implement replace, push { index, url, type } here
    const payload = {
      meet_id: formData.meet_id,
      title: formData.title,
      notes: formData.notes,
      meet_link: formData.meet_link,
      start_date_time: formData.start_date_time,
      end_date_time: formData.end_date_time,
      status: formData.status,
      doc_status: formData.doc_status,
      add_docs: newDocs.map((d) => ({ url: d.url, type: d.type })),
      remove_indexes: removedExistingIndexes, // <-- backend will remove by these original positions
      edit_docs: editDocs, // optional; keep [] if not used
    };

    // If your backend expects "remove_index" (singular), rename the key above.

const fd = new FormData();
fd.append("data", JSON.stringify(payload));

newDocs.forEach((fileObj) => {
  fd.append("URL", fileObj.file); // assuming fileObj.file is the actual File object
});



    try {
      const res = await apiClient.put(
        `/doc_meet/edit/${formData.meet_id}`,
        payload
      );

      if (res.data?.message?.includes("Success")) {
        alert("Meeting updated successfully ?");
        if (onUpdated) {
          onUpdated();
        } else {
          navigate("/meetings");
        }
      }
    } catch (error) {
      console.error("Error updating meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to know if an existing doc is marked as removed
  const isRemoved = (idx) => removedExistingIndexes.includes(idx);

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<h3 className="text-lg font-semibold border-b pb-2">
        <Video className="inline mr-2" /> Edit Meeting
      </h3>

      {/* Title */}
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
        placeholder="Title"
          disabled={!isOrganizer}
      />

      {/* Meeting Link */}
      <input
        type="url"
        name="meet_link"
        value={formData.meet_link}
        onChange={handleChange}
        className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
        placeholder="Meeting Link"
        disabled={!isOrganizer}
      />

      {/* Dates */}
      <input
        type="datetime-local"
        name="start_date_time"
        value={formatDateForInput(formData.start_date_time)}
        onChange={handleChange}
        disabled={!isOrganizer}
        className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
      />
      <input
        type="datetime-local"
        name="end_date_time"
        value={formatDateForInput(formData.end_date_time)}
        onChange={handleChange}
        disabled={!isOrganizer}
        className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
      />

<label className="block text-sm font-medium mb-1">Meeting Notes / MOM</label>
<textarea
  name="notes"
  value={formData.notes}
  onChange={handleChange}
  rows={20}   // ?? bigger size
  className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded resize-y"
/>
<button
        type="button"
        onClick={generatePDF}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate Notes to PDF
      </button>
      {/* Existing Documents */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Existing Documents</p>
        {existingDocs.length === 0 && (
          <p className="text-xs text-gray-500">No existing documents.</p>
        )}

        {existingDocs.map((doc, idx) =>
          isRemoved(idx) ? null : (
            <div
              key={`exist-${idx}-${doc.url}`}
              className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded"
            >
              <span className="text-sm truncate">{doc.url}</span>
              <button
                type="button"
                onClick={() => removeExistingDoc(idx)}
                className="text-red-500 hover:text-red-700"
                title="Remove existing document"
              >
                <X size={16} />
              </button>
            </div>
          )
        )}
      </div>


      {/* Add New Documents */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Add Documents</p>
        <input type="file" multiple onChange={handleNewFileUpload} />
        {newDocs.map((doc, idx) => (
          <div
            key={`new-${idx}-${doc.url}`}
            className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded"
          >
            <span className="text-sm truncate">{doc.url}</span>
            <button
              type="button"
              onClick={() => removeNewDoc(idx)}
              className="text-red-500 hover:text-red-700"
              title="Remove new document"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>




<div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Status
            </p>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>

      {/* Participants */}
      <div>
        <h4
          className="flex justify-between cursor-pointer"
          onClick={() => setShowParticipants(!showParticipants)}
        >
          <span>
            <Users className="inline mr-2" /> Participants (
            {formData.participants.length})
          </span>
          {showParticipants ? <ChevronUp /> : <ChevronDown />}
        </h4>

        {showParticipants && (
          <>
            <div className="mt-2 space-y-2">
              {formData.participants.map((p) => (
                <div
                  key={p.id || p.person_id}
                  className="flex justify-between bg-gray-100 dark:bg-gray-600 p-2 rounded"
                >
                  <span>
                    {p.name || p.person_id} ({p.role})
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={!!p.isdocvisible}
                      onChange={() => toggleDocVisibility(p)}
                    />
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      className="text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add participant form */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mt-4">
              <h5 className="text-sm font-semibold mb-2">Add Participant</h5>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Person ID"
                  value={newParticipant.person_id}
                  onChange={(e) =>
                    setNewParticipant((prev) => ({
                      ...prev,
                      person_id: e.target.value,
                    }))
                  }
                  className="flex-1 bg-gray-50 dark:bg-gray-600 p-2 rounded"
                />

                <select
                  value={newParticipant.role}
                  onChange={(e) =>
                    setNewParticipant((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className="bg-gray-50 dark:bg-gray-600 p-2 rounded"
                >
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>

                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newParticipant.isdocvisible}
                    onChange={(e) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        isdocvisible: e.target.checked,
                      }))
                    }
                  />
                  Doc Visible
                </label>

                <button
                  type="button"
                  onClick={addParticipant}
                  className="px-3 py-2 bg-green-600 text-white rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t pt-4">
        <button
          type="button"
          onClick={onCancel || (() => navigate("/meetings"))}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-red-700 text-white rounded"
        >
          {loading ? <ButtonLoader /> : "Update Meeting"}
        </button>
      </div>
    </div>
  );
};

export default EditMeetingModal;


// import React, { useEffect, useState } from "react";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import { Toaster } from "react-hot-toast";
// import {
//   Video,
//   Users,
//   ChevronUp,
//   ChevronDown,
//   X,
// } from "lucide-react";
// import ButtonLoader from "./ButtonLoader";
// import { useParams } from "react-router-dom";
// import { useAuthStore } from "src/stores/authStore";

// const EditMeetingModal = ({ onUpdated, onCancel }) => {
//   const { id } = useParams();
//   const token = useAuthStore((state) => state.accessToken);

//   const [formData, setFormData] = useState({
//     meet_id: "",
//     branchcode: "",
//     title: "",
//     notes: "",
//     comm_type: "meeting",
//     status: "active",
//     doc_status: "none",
//     meet_link: "",
//     start_date_time: "",
//     end_date_time: "",
//     category: "branch",
//     field: "project",
//     doc: [], // existing docs + newly added
//     participants: [],
//     custom_targets: [],
//   });

//   const [loading, setLoading] = useState(false);
//   const [showParticipants, setShowParticipants] = useState(true);

//   // Fetch meeting details
//   useEffect(() => {
//     if (id) {
//       axios
//         .get(`/getmeetingbyid?id=${id}`, {
//
//         })
//         .then((res) => {
//           if (res.data.success) {
//             const data = res.data.data;
//             setFormData({
//               meet_id: data.meet_id,
//               branchcode: data.branchcode || "",
//               title: data.title || "",
//               notes: data.notes || "",
//               comm_type: data.comm_type,
//               status: data.status,
//               doc_status: data.doc_status || "none",
//               meet_link: data.meet_link || "",
//               start_date_time: data.start_date_time
//                 ? new Date(data.start_date_time).toISOString().slice(0, 16)
//                 : "",
//               end_date_time: data.end_date_time
//                 ? new Date(data.end_date_time).toISOString().slice(0, 16)
//                 : "",
//               category: data.category,
//               field: data.field,
//               doc: data.doc || [],
//               participants:
//                 data.participants?.map((p) => ({
//                   id: p.id, // needed for edit/remove API
//                   person_id: p.staff_id || p.client_code || p.id,
//                   role: p.role,
//                   isdocvisible: p.isdocvisible,
//                   status: p.status,
//                   name: p.client_name || `${p.firstname || ""} ${p.lastname || ""}`,
//                   email: p.client_email || p.email,
//                   phone: p.primary_phone || p.phonenumber,
//                 })) || [],
//               custom_targets: data.custom_targets || [],
//             });
//           }
//         })
//         .catch((err) => console.error("Error fetching meeting:", err));
//     }
//   }, [id, token]);

//   // --------------------------
//   // Handlers
//   // --------------------------
//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   // Add new docs
//   const handleFileUpload = (e) => {
//     const files = Array.from(e.target.files);
//     setFormData((prev) => ({
//       ...prev,
//       doc: [...prev.doc, ...files.map((f) => ({ url: f.name, type: f.type }))],
//     }));
//   };

//   // Remove doc by index
//   const removeFile = (index) => {
//     setFormData((prev) => {
//       const updatedDocs = [...prev.doc];
//       updatedDocs.splice(index, 1);
//       return { ...prev, doc: updatedDocs };
//     });
//   };

//   // Toggle doc visibility for participant
//   const toggleDocVisibility = async (participant) => {
//     try {
//       await apiClient.put(
//         `/doc_meet/participant/edit`,
//         {
//           id: participant.id,
//           role: participant.role,
//           isdocvisible: !participant.isdocvisible,
//           status: participant.status || "accepted",
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setFormData((prev) => ({
//         ...prev,
//         participants: prev.participants.map((p) =>
//           p.id === participant.id ? { ...p, isdocvisible: !p.isdocvisible } : p
//         ),
//       }));
//     } catch (err) {
//       console.error("Error toggling doc visibility:", err);
//     }
//   };

//   // Remove participant
//   const removeParticipant = async (id) => {
//     try {
//       await apiClient.delete(`/doc_meet/participant/delete`, {
//
//         data: { id },
//       });
//       setFormData((prev) => ({
//         ...prev,
//         participants: prev.participants.filter((p) => p.id !== id),
//       }));
//     } catch (err) {
//       console.error("Error removing participant:", err);
//     }
//   };

// // Convert DB "YYYY-MM-DD HH:mm:ss" ? "YYYY-MM-DDTHH:mm"
// const formatDateForInput = (dateString: string) => {
//   if (!dateString) return "";
//   return dateString.replace(" ", "T").slice(0, 16);
// };




//   // Submit Meeting Update
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const payload = {
//       meet_id: formData.meet_id,
//       title: formData.title,
//       notes: formData.notes,
//       meet_link: formData.meet_link,
//       start_date_time: formData.start_date_time,
//       end_date_time: formData.end_date_time,
//       status: formData.status,
//       doc_status: formData.doc_status,
//       add_docs: formData.doc.map((d) => ({ url: d.url, type: d.type })), // new docs
//       remove_indexes: [], // you can manage removed docs here
//       edit_docs: [], // handle doc updates if needed
//     };

//     try {
//       const res = await apiClient.put(
//         `/doc_meet/edit/${formData.meet_id}`,
//         payload,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data.success) {
//         onUpdated?.();
//       }
//     } catch (error) {
//       console.error("Error updating meeting:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
//       <Toaster position="top-right" />

//       <h3 className="text-lg font-semibold border-b pb-2">
//         <Video className="inline mr-2" /> Edit Meeting
//       </h3>

//       {/* Title */}
//       <input
//         type="text"
//         name="title"
//         value={formData.title}
//         onChange={handleChange}
//         className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
//         placeholder="Title"
//       />

//       {/* Meeting Link */}
//       <input
//         type="url"
//         name="meet_link"
//         value={formData.meet_link}
//         onChange={handleChange}
//         className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
//         placeholder="Meeting Link"
//       />

//       {/* Dates */}
//       <input
//         type="datetime-local"
//         name="start_date_time"
//         value={formatDateForInput(formData.start_date_time)}
//         onChange={handleChange}
//         className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
//       />
//       <input
//         type="datetime-local"
//         name="end_date_time"
//         value={formatDateForInput(formData.end_date_time)}
//         onChange={handleChange}
//         className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded"
//       />

//       {/* Notes */}
//       <textarea
//         name="notes"
//         value={formData.notes}
//         onChange={handleChange}
//         className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded min-h-[100px]"
//         placeholder="Notes"
//       />

//       {/* Docs */}
//       <div>
//         <input type="file" multiple onChange={handleFileUpload} />
//         {formData.doc.map((file, idx) => (
//           <div key={idx} className="flex justify-between items-center">
//             <span>{file.url}</span>
//             <button type="button" onClick={() => removeFile(idx)}>
//               <X size={16} />
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Participants */}
//       <div>
//         <h4
//           className="flex justify-between cursor-pointer"
//           onClick={() => setShowParticipants(!showParticipants)}
//         >
//           <span>
//             <Users className="inline mr-2" /> Participants (
//             {formData.participants.length})
//           </span>
//           {showParticipants ? <ChevronUp /> : <ChevronDown />}
//         </h4>

//         {showParticipants &&
//           formData.participants.map((p) => (
//             <div
//               key={p.id}
//               className="flex justify-between bg-gray-100 dark:bg-gray-600 p-2 rounded"
//             >
//               <span>{p.name}</span>
//               <div className="flex gap-2">
//                 <input
//                   type="checkbox"
//                   checked={p.isdocvisible}
//                   onChange={() => toggleDocVisibility(p)}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => removeParticipant(p.id)}
//                   className="text-red-500"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>
//           ))}
//       </div>

//       {/* Actions */}
//       <div className="flex justify-end gap-4 border-t pt-4">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 bg-gray-200 rounded"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           onClick={handleSubmit}
//           disabled={loading}
//           className="px-4 py-2 bg-red-700 text-white rounded"
//         >
//           {loading ? <ButtonLoader /> : "Update Meeting"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default EditMeetingModal;
