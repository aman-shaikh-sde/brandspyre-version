import { useState, useEffect } from "react";
import Modal from "src/component/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { notify } from "~/services/notificationService";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";

const EditAttendanceModal = ({ isVisible, onClose, log, token, onSuccess }) => {
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (log) {
      setCheckIn(log.check_in ? new Date(log.check_in) : null);
      setCheckOut(log.check_out ? new Date(log.check_out) : null);
      setRemarks(log.remarks || "");
    }
  }, [log]);


const formatLocalDateTime = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};



  const handleSubmit = async () => {
    if (!checkIn) {
      notify.error("Check-in time is required");
      return;
    }

    try {
      const payload = {
       id: log.id,
  check_in: checkIn ? formatLocalDateTime(checkIn) : null,
  check_out: checkOut ? formatLocalDateTime(checkOut) : null,
  remarks,
      };

      const response = await apiClient.put(
        `/editattendace/${log.id}`,
        payload
      );

      notify.success("Attendance updated successfully");
      onSuccess();
    } catch (error) {
      console.error(error);
      notify.error(error.response?.data?.message || "Failed to update attendance");
    }
  };

  if (!log) return null;

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="Edit Attendance"
      className="w-full md:w-[400px]"
    >
      <div className="flex flex-col gap-3 p-4">
        <label className="text-sm font-medium">Check In</label>
        <DatePicker
          selected={checkIn}
          onChange={(date) => setCheckIn(date)}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm:ss"
          className="w-full border border-gray-300 rounded px-2 py-1"
        />

        <label className="text-sm font-medium">Check Out</label>
        <DatePicker
          selected={checkOut}
          onChange={(date) => setCheckOut(date)}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm:ss"
          className="w-full border border-gray-300 rounded px-2 py-1"
        />

        <label className="text-sm font-medium">Remarks</label>
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter remarks"
          className="w-full border border-gray-300 rounded px-2 py-1"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-red-800"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditAttendanceModal;
