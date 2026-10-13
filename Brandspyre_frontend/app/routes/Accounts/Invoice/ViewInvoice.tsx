
import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LogOut } from "lucide-react";
import { apiClient } from "src/services/apiClient";
import almino from "../../../assets/Almino structural consultancy_Final.png";
import alminocompanyseal from "../../../assets/almino seal.png";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

const ViewInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();
  const idParam = params.id || params.invoice_id;
  const inv_id = idParam ? decodeURIComponent(idParam) : "";
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const accesstoken = useAuthStore((state) => state.accessToken);
  const [hydrated, setHydrated] = useState(false);

  // wait for Zustand persist to hydrate
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
      } else {
        const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
        return () => unsub();
      }
    }
  }, []);

  const token = accesstoken;

  useEffect(() => {
    if (hydrated && token) {
      if (!inv_id) {
        setLoading(false);
        return;
      }

      const fetchInvoiceData = async () => {
        try {
          const response = await apiClient.get(
            `/project/invoice/read?invoice_id=${encodeURIComponent(inv_id)}`
          );

          if (response.data?.data && response.data.data.length > 0) {
            setInvoiceData(response.data.data[0]);
          }
          setLoading(false);
        } catch (error) {
          console.error("Error fetching invoice data:", error);
          setLoading(false);
        }
      };

      fetchInvoiceData();
    }
  }, [hydrated, token, inv_id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="p-4">Loading invoice data...</div>;
  }

  if (!invoiceData) {
    return <div className="p-4">Invoice not found</div>;
  }

  // Helper function to convert number to words
  // const numberToWords = (num) => {
  //   // Implement your number to words conversion logic here
  //   // This is a simplified version
  //   const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  //   const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  //   if (num === 0) return 'Zero';

  //   let words = '';
  //   if (num >= 1000) {
  //     words += ones[Math.floor(num / 1000)] + ' Thousand ';
  //     num %= 1000;
  //   }
  //   if (num >= 100) {
  //     words += ones[Math.floor(num / 100)] + ' Hundred ';
  //     num %= 100;
  //   }
  //   if (num >= 20) {
  //     words += tens[Math.floor(num / 10)] + ' ';
  //     num %= 10;
  //   }
  //   if (num > 0) {
  //     words += ones[num] + ' ';
  //   }

  //   return words.trim() + ' Only';
  // };

  // Convert numbers to words
  const numberToWords = (num: number): string => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
      if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
      return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    };

    return inWords(num) + " Only";
  };



  // Format date from "2025-07-07T18:30:00.000Z" to "07/07/2025"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div>
      <div className="flex justify-between">
        <div className="p-4 text-red-700 mb-10">
          <h1 className="text-2xl font-bold">View Invoice Page</h1>
        </div>
        <div>



          <button className="text-gray-500 bg-gray-200 px-3 py-1 rounded-lg mt-6" onClick={handleGoBack}>
            <LogOut className="inline rotate-180 text-gray-500 mr-3" />Go Back
          </button>
        </div>
      </div>

      <div className="p-8 w-[794px] mx-auto border border-gray-400 text-[12px] font-sans bg-white ">
        <div className="border border-gray-600 m-5 p-1">
          <div className="flex justify-between items-center mb-4 border-b-2 border-gray-400">
            <div className="flex mt-[3px] h-[60%] ">
              <div className="flex items-center mr-15 w-[30%]">
                <img src={almino} alt="Company Logo" className="h-30 mb-2" />
              </div>
              <div className="flex flex-col w-[50%]">
                <div className="font-bold uppercase">
                  Brandsypre Groups Pvt Ltd
                </div>
                <div className="text-xs">
                  No: 10/387-d6 Meenakshi Nagar 1st Street, Near King's Palace
                  Old Check Post,
                  <br />
                  Pannaiyarkulam, Ramanathapuram
                  <br />
                  Mobile: 9786815307, Tamil Nadu - 623503
                  <br />
                  GSTIN: 33AADCA5362R1Z2
                </div>
              </div>
              <div className="flex items-end justify-end w-[40%]">
                <h1 className="text-xl font-medium uppercase text-gray-800 items-end">
                  TAX INVOICE
                </h1>
              </div>
            </div>
          </div>
          <div className="flex mt-[-18px]">
            <div className="text-right w-[50%] border-r border-gray-600">
              <table className="text-xs mt-2">
                <tbody>
                  <tr>
                    <td className="text-left">Invoice</td>
                    <td className="text-left font-bold">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      {invoiceData.invoice.invoice_no}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Invoice Date</td>
                    <td className="text-left font-bold">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      {formatDate(invoiceData.invoice.invoice_date)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Terms</td>
                    <td className="text-left font-bold">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      Due on Receipt
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left">Due Date</td>
                    <td className="text-left font-bold">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      {formatDate(invoiceData.invoice.due_date)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-right w-[50%]">
              <table className="text-xs mt-2 ml-1">
                <tbody>
                  <tr>
                    <td className="text-left">Place of Supply</td>
                    <td className="font-bold">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      Tamil Nadu (33)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-1 pt-2">
            <div className="bg-gray-200 border-b border-gray-400 border-t -m-1 -mt-2">
              <p className="ml-1 font-bold text-gray-800">Bill To:</p>
            </div>
            <div className="pt-3 pb-2">
              <p className="font-extrabold">{invoiceData.invoice.client_name}</p>
              <p>{invoiceData.invoice.company_name}</p>
              <p>{invoiceData.invoice.office_address}</p>
            </div>
          </div>

          <table className="w-[100%] border-2 border-collapse  border-gray-400  text-end text-sm ">
            <thead className="bg-gray-200 text-gray-900 ">
              <tr>
                <th rowSpan={2} className="px-2 py-1 ">
                  #
                </th>
                <th
                  rowSpan={2}
                  className="border-2 border-gray-400 px-2 py-1 text-left"
                >
                  Item & Description
                </th>
                <th rowSpan={2} className="border-2 border-gray-400 px-2 py-1">
                  HSN/SAC
                </th>
                <th rowSpan={2} className="border-2 border-gray-400 px-2 py-1">
                  Qty
                </th>
                <th rowSpan={2} className="border-2 border-gray-400 px-2 py-1">
                  Rate
                </th>
                <th colSpan={2} className="border-2 border-gray-400 px-2 py-1">
                  CGST
                </th>
                <th colSpan={2} className="border-2 border-gray-400 px-2 py-1">
                  SGST{" "}
                </th>
                <th
                  rowSpan={2}
                  className="border-2 border-gray-400 px-2 py-1 border-r-0"
                >
                  Total
                </th>
              </tr>
              <tr>
                <th className=" px-2 py-1 border border-gray-400 ">%</th>
                <th className="border-2 border-gray-400  px-2 py-1">Amt</th>
                <th className="border-2 border-gray-400  px-2 py-1">%</th>
                <th className="border-2 border-gray-400 px-2 py-1">Amt</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.milestone_requests.map((milestone, index) => (
                <tr key={index}>
                  <td className="border px-2">{index + 1}</td>
                  <td className="border px-2 text-left">
                    {milestone.miles_title}
                    <br />
                    {invoiceData.invoice.project_title}
                  </td>
                  <td className="border-2 border-gray-400 px-2">{invoiceData.invoice.hsn_sac || '998332'}</td>
                  <td className="border-2 border-gray-400 px-2">1.00 set</td>
                  <td className="border-2 border-gray-400 px-2">{milestone.milestone_amount}</td>
                  <td className="border-2 border-gray-400 px-2">{invoiceData.invoice.cgst_percentage}%</td>
                  <td className="border-2 border-gray-400 px-2">{invoiceData.invoice.cgst_amount}</td>
                  <td className="border-2 border-gray-400 px-2">{invoiceData.invoice.sgst_percentage}%</td>
                  <td className="border-2 border-gray-400 px-2">{invoiceData.invoice.sgst_amount}</td>
                  <td className="border-2 border-gray-400 px-2">{milestone.milestone_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between">
            <div className="text-sm w-[50%] ">
              <p>Total in Words</p>
              <p className="font-bold italic">
                {numberToWords(Number(invoiceData.invoice.final_amount))}
              </p>
              <p className="mt-5">
                Notes:
                <br />
                {invoiceData.invoice.notes || "Thanks for your business."}
              </p>
            </div>
            <div className="text-sm border-l-2 border-b-2 border-gray-400 w-[50%] ">
              <table className="ml-15">
                <tbody>
                  <tr>
                    <td className="pr-4 text-right">Sub Total:</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.total_amount}
                    </td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-right">CGST ({invoiceData.invoice.cgst_percentage}%):</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.cgst_amount}
                    </td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-right">SGST ({invoiceData.invoice.sgst_percentage}%):</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.sgst_amount}
                    </td>
                  </tr>

                  <tr>
                    <td className="pr-4 text-right">Discount:</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.discount}
                    </td>
                  </tr>


                  <tr>
                    <td className="pr-4 text-right">Rounding:</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.roundoff}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td className="pr-4 text-right">Total:</td>
                    <td className="text-left text-red-700">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.final_amount}
                    </td>
                  </tr>
                  {/*<tr>
                    <td className="pr-4 text-right">Payment Mode:</td>
                    <td className="text-left">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹
                      {invoiceData.invoice.paid_amount}
                    </td>
                  </tr>*/}
                  <tr className="">
                    <td className="pr-4 text-right">
                      <strong>Balance:</strong>
                    </td>
                    <td className="text-left">
                      <strong>
                        {" "}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        ₹ {invoiceData.invoice.balance_amount}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex ">
            <div className="w-[50%]"></div>
            <div className="text-center w-[50%] border-l-2 border-gray-400">
              <p>BRANDSPYRE Technologies Pvt Ltd</p>
              <img
                src={alminocompanyseal}
                alt="Signature"
                className="h-30 mx-auto mb-2"
              />
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoice;