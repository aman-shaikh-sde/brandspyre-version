import { Banknote, CalendarCheck, ClipboardList, FileText, Hash, Mail, MapPin, Phone, User } from "lucide-react"
import { AiFillFilePdf } from "react-icons/ai"

const UpdateInvoice = ({ onCancel }) => {
  return (
    <>
      <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
   
        <div className="space-y-4">

          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            <User className="inline mr-2" /> Update Invoice
          </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Mail className="inline mr-1" size={14} /> Balance Amount
              </p>
              <input
                type="email"
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="₹"
              />
            </div>
      
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <MapPin className="inline mr-1" size={14} />Date
              </p>
              <input
                type="date"
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="25-05-2025"
              />
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Payment Status
              </p>
              <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
                <option value="">Select Status</option>
                <option value="client1">Paid</option>
                <option value="client2">Partially Paid</option>
                    <option value="client2">Penidng</option>
              </select>
            </div>

          </div>
        </div>


        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </>
  )
}

export default UpdateInvoice;