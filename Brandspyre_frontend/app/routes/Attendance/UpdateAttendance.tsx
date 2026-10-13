import React, { useState } from "react";

function UpdateAttendanceForm() {
    const [loading,setLoading]=useState(false)
  return (
    <div className="text-medium dark:bg-gray-800 dark:text-gray-200">
      <div className="text-medium sm:flex gap-5">
        <div className="flex flex-col py-2 text-left mt-1">
          <label htmlFor="" className="text-sm text-gray-700 dark:text-gray-300 mb-3">
           Reviewed By
          </label>
          <input
            className="max-w-[400px] w-[300px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
            type="text"
          />
        </div>
        <div className="flex flex-col py-2 text-left mt-1">
          <label htmlFor="" className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          status
          </label>
          <input
            className="max-w-[400px] w-[300px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
            type="text"
          />
        </div>
      </div>
 
     
      <div className="text-medium sm:flex gap-5">
        <div className="flex flex-col py-2 text-left mt-1">
          <label htmlFor="" className="text-sm text-gray-700 dark:text-gray-300 mb-3">
             Notes/Remarks
          </label>
          <textarea
            className=" w-[625px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
          />
        </div>
      </div>
        <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  
                  className="px-4 py-2 bg-[var(--color-secondary)] hover:[var(--color-hover-secondary)] hover-effect text-gray-800 dark:text-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)]  text-white rounded hover:bg-gradient-to-b hover-effect transition"
                  disabled={loading}
                >
                  {loading ? <ButtonLoader/> : "Create Branch"}
                </button>
              </div>
    </div>
  );
}

export default UpdateAttendanceForm;