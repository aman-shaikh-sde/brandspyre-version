import {
  Bell,
  Dot,
  Eye,
  User2,
  Calendar,
  CreditCard,
  DollarSign,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { Link } from "react-router-dom";

interface Payment {
  invoice: {
    invoice_id: string;
    invoice_no: string;
    invoice_date: string;
    due_date: string;
    total_amount: string;
    paid_amount: string;
    balance_amount: string;
    status: string;
    client_name: string;
    company_name: string;
    project_title: string;
  };
  milestone_requests: {
    miles_title: string;
    milestone_amount: string;
    status: string;
  }[];
}

function PaymentRemaindar() {
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchOverduePayments();
  }, [selectedDate]);

  const fetchOverduePayments = async () => {
    setLoading(true);
    setError("");
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await apiClient.get(
        `/project/invoice/read?overdue=${formattedDate}`
      );
      
      if (response.data.message === "Get Invoices with Milestones Success") {
        setOverduePayments(response.data.data);
      } else {
        setError("Failed to fetch overdue payments");
      }
    } catch (err) {
      setError("Error fetching overdue payments");
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount));
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <div className="text-gray-500 text-xl font-bold">Payment Reminder</div>
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" size={20} />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
          />
        </div>
      </div>
      
      {loading && <div className="text-center py-4">Loading overdue payments...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      
      <div className="w-full flex flex-col justify-evenly gap-8">
        {overduePayments.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            No overdue payments found for {selectedDate.toDateString()}
          </div>
        )}

        {overduePayments.map((payment, index) => (
          <div key={`${payment.invoice.invoice_id}-${index}`} className="bg-white w-full h-[100%] flex rounded-sm shadow-lg">
            <div>
              <div className="bg-red-700 rounded-r-lg w-4 h-[240px]"></div>
            </div>
            <div className="ms-4 w-full p-4">
              <div className="md:flex gap-5">
                <CreditCard className="font-light text-gray-600" size={25} />
                <h1 className="text-xl font-medium text-gray-600">
                  Invoice: {payment.invoice.invoice_no} - {payment.invoice.client_name}
                </h1>
              </div>
              <div className="md:flex md:w-full justify-between mt-2">
                <div>
                  <p className="text-gray-600">
                    Project: {payment.invoice.project_title} | 
                    Status: {payment.invoice.status}
                  </p>
                  <p className="text-gray-600">
                    Issued: {formatDate(payment.invoice.invoice_date)} | 
                    Due: {formatDate(payment.invoice.due_date)}
                  </p>
                  <p className="text-gray-600">
                    Total: {formatCurrency(payment.invoice.total_amount)} | 
                    Paid: {formatCurrency(payment.invoice.paid_amount)} | 
                    Balance: {formatCurrency(payment.invoice.balance_amount)}
                  </p>
                  <p className="text-gray-600">
                    Company: {payment.invoice.company_name}
                  </p>
                  {payment.milestone_requests.map((milestone, mIndex) => (
                    <p key={mIndex} className="text-gray-600">
                      Milestone: {milestone.miles_title} - {formatCurrency(milestone.milestone_amount)}
                    </p>
                  ))}
                </div>
                <div className="md:flex flex-col">
                  <div>
                    <p className="w-[120px] h-[30px] bg-red-700/25 text-red-700 rounded-3xl">
                      <Dot className="inline" /> Overdue
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:flex justify-between mt-4">
                <div className="flex gap-8">
                  <Link to={`/payreq_view/${encodeURIComponent(payment.invoice.invoice_id) }`}>
                    <button className="bg-red-700/25 px-3 py-2 rounded-sm text-red-700 hover:bg-red-700/50 hover:text-red-800 flex gap-1">
                      <Eye size={15} className="mt-1" />
                      View Detail
                    </button>
                  </Link>
                  {/*<button className="bg-red-700 px-3 py-2 text-gray-100 hover:bg-red-800 flex gap-1 rounded-sm">
                    <DollarSign size={15} className="mt-1" />
                    Record Payment
                  </button>*/}
                </div>
                <div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentRemaindar;