
// import { useRef } from "react";
// import alminoLogo from "../../../assets/Almino structural consultancy_Final.png";
// import alminoSeal from "../../../assets/almino seal.png";
// import { LogOut } from "lucide-react";
// import { useNavigate } from "react-router";

// const OfferLetter = () => {
//   const componentRef = useRef();
//   const navigate = useNavigate();

//   //   const handlePrint = () => {
//   //     window.print();
//   //   };
//   const handlePrint = () => {
//     const printContent = document.getElementById("print").innerHTML;
//     const originalContent = document.body.innerHTML;

//     const style = `
//       <style>
//         @media print {
//           @page {
//             margin-bottom: 0; /* Only remove footer margin */
//           }
//           body { 
//             margin: 1cm; /* Keep normal margins on all sides */
//           }
//           header, footer, .no-print { 
//             display: none !important; 
//           }
//           a[href]:after {
//             content: none !important;
//           }
//           #print {
//             position: relative;
//             width: 100%;
//             height: 100%;
//           }
//         }
//       </style>
//     `;

//     document.body.innerHTML = style + printContent;
//     window.print();
//     window.onafterprint = () => {
//       document.body.innerHTML = originalContent;
//       window.location.reload();
//     };
//   };
//   const handleGoBack = () => {
//     navigate(-1);
//   };
//   return (
//     <div className="p-6 print:p-0">
//       <div className="flex justify-between">
//         <button
//           onClick={handlePrint}
//           className="mb-4 px-4 py-2 bg-red-700 text-white rounded shadow print:hidden"
//         >
//           Print Offer Letter
//         </button>
//         <button
//           className="text-gray-500 bg-gray-200 px-4 py-2 rounded-lg mt-3"
//           onClick={handleGoBack}
//         >
//           <LogOut className="inline rotate-180 text-gray-500 mr-3" />
//           Go Back
//         </button>
//       </div>
//       <div
//         ref={componentRef}
//         className="relative bg-white text-black p-10 w-[794px] mx-auto border border-red-500 text-[14px] font-serif"
//         id="print"
//       >
//         {/* Background watermark */}
//         <img
//           src={alminoLogo}
//           alt="Watermark"
//           className="absolute opacity-10 z-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] pointer-events-none"
//         />

//         <div className="relative z-10">
//           <div className="flex justify-between items-center mb-4 border-b border-gray-400 pb-4">
//             <img src={alminoLogo} alt="Almino Logo" className="h-20" />
//             <div className="text-right text-sm">
//               <p className="font-bold text-lg">
//                 ALMINO STRUCTURAL CONSULTANCY PVT LTD
//               </p>
//               <p className="text-red-500 font-semibold">
//                 GST NO : 33AASCA3262R1Z2
//               </p>
//             </div>
//           </div>

//           <div className="text-center mb-4">
//             <h2 className="text-xl font-bold underline">JOB OFFER LETTER</h2>
//           </div>

//           <p>To,</p>
//           <p className="font-semibold">Er. Shaik Anas S</p>
//           <p>Ramanathapuram</p>

//           <p className="mt-6 font-semibold">
//             Subject: Job Offer for the Position of Site Engineer
//           </p>

//           <p className="mt-4">Dear Er. Shaik Anas S,</p>
//           <p className="mt-2 text-justify">
//             We are pleased to offer you the position of{" "}
//             <strong>Site Engineer</strong> at Almino Structural Consultancy Pvt
//             Ltd, based on your qualifications and the interview process. We
//             believe your skills and experience will be a valuable asset to our
//             team.
//           </p>

//           <div className="mt-4">
//             <p>
//               <strong>Position:</strong> Site Engineer
//             </p>
//             <p>
//               <strong>Reporting To:</strong> Er. Vignesh
//             </p>
//             <p>
//               <strong>Location:</strong> Pattinamkathan, Ramanathapuram
//             </p>
//             <p>
//               <strong>Start Date:</strong> 26-05-25
//             </p>
//           </div>

//           <div className="mt-4">
//             <p className="underline font-semibold">Salary Details:</p>
//             <ul className="list-disc list-inside ml-4">
//               <li>
//                 <strong>Monthly Gross Salary:</strong> ₹10,000
//               </li>
//               <li>
//                 <strong>Accommodation:</strong> Provided by the company
//               </li>
//               <li>
//                 <strong>Other Allowances (Food):</strong> ₹5,000
//               </li>
//             </ul>
//           </div>

//           <p className="mt-4 text-justify">
//             In addition to the salary, you will be entitled to benefits as per
//             the company’s HR policies, which will be detailed in your
//             appointment letter upon joining.
//           </p>

//           <p className="mt-4 text-justify">
//             Please confirm your acceptance of this offer by signing and
//             returning a copy of this letter on or before{" "}
//             <strong>15-04-25</strong>. We are excited to welcome you to our team
//             and look forward to a mutually beneficial relationship. If you have
//             any questions or require further clarification, feel free to contact
//             us at <strong>97865 81307</strong> or{" "}
//             <strong>admin@almino.in</strong>
//           </p>

//           <p className="mt-6">Sincerely,</p>
//           <p className="mt-2 font-semibold">Shaik Anas S</p>
//           <p>Site Engineer</p>
//           <p>Almino Structural Consultancy Pvt Ltd</p>

//           <div className="mt-10 text-right">
//             <img src={alminoSeal} alt="Company Seal" className="h-20 inline" />
//           </div>

//           <footer className="text-sm mt-10 border-t border-gray-300 pt-3">
//             <div className="flex justify-between">
//               <div>
//                 <p className="text-red-600">
//                   📞 +91 95977 46657
//                   <br />
//                   📞 +91 97865 81307
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p>📍 Near King's Palace, Old Check Post,</p>
//                 <p>Pattinamkathan, Ramanathapuram - 623503</p>
//                 <p>📧 alminostructure@gmail.com</p>
//               </div>
//             </div>
//           </footer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OfferLetter;
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import alminoLogo from "../../../assets/Almino structural consultancy_Final.png";
import alminoSeal from "../../../assets/almino seal.png";
import { useAuthStore } from "src/stores/authStore";

const OfferLetterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();
  const [offerLetter, setOfferLetter] = useState(null);

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
      const savedLetters = localStorage.getItem("offerLetters");
      if (savedLetters) {
        const letters = JSON.parse(savedLetters);
        const foundLetter = letters.find(letter => letter.id === id);
        if (foundLetter) {
          setOfferLetter(foundLetter);
        }
      }
    }
  }, [hydrated, token, id]);

  const handlePrint = () => {
    const printContent = document.getElementById("print").innerHTML;
    const originalContent = document.body.innerHTML;

    const style = `
      <style>
        @media print {
          @page {
            margin-bottom: 0;
          }
          body { 
            margin: 1cm;
          }
          header, footer, .no-print { 
            display: none !important; 
          }
          a[href]:after {
            content: none !important;
          }
          #print {
            position: relative;
            width: 100%;
            height: 100%;
          }
        }
      </style>
    `;

    document.body.innerHTML = style + printContent;
    window.print();
    window.onafterprint = () => {
      document.body.innerHTML = originalContent;
      window.location.reload();
    };
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!offerLetter) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 print:p-0">
      <div className="flex justify-between">
        <button
          onClick={handlePrint}
          className="mb-4 px-4 py-2 bg-red-700 text-white rounded shadow print:hidden"
        >
          Print Offer Letter
        </button>
        <button
          className="text-gray-500 bg-gray-200 px-4 py-2 rounded-lg mt-3"
          onClick={handleGoBack}
        >
          <LogOut className="inline rotate-180 text-gray-500 mr-3" />
          Go Back
        </button>
      </div>

      <div
        ref={componentRef}
        className="relative bg-white text-black p-10 w-[794px] mx-auto text-[14px] font-serif"
        id="print"
      >
        {/* Background watermark */}
        <img
          src={alminoLogo}
          alt="Watermark"
          className="absolute opacity-10 z-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] pointer-events-none"
        />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4 border-b border-gray-400 pb-4">
            <img src={alminoLogo} alt="Almino Logo" className="h-20" />
            <div className="text-right text-sm">
              <p className="font-bold text-lg">
                ALMINO STRUCTURAL CONSULTANCY PVT LTD
              </p>
              <p className="text-red-500 font-semibold">
                GST NO : 33AASCA3262R1Z2
              </p>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold underline">JOB OFFER LETTER</h2>
            <p className="text-sm mt-1">GET NO: 330A562A0508172</p>
          </div>

          <p>To,</p>
          <p className="font-semibold">{offerLetter.name}</p>
          <p>{offerLetter.location}</p>

          <p className="mt-6 font-semibold">
            Subject: Job Offer for the Position of {offerLetter.position}
          </p>

          <p className="mt-4">Dear {offerLetter.name},</p>
          <p className="mt-2 text-justify">
            We are pleased to offer you the position of{" "}
            <strong>{offerLetter.position}</strong> atBrandsypre Groups Pvt
            Ltd, based on your qualifications and the interview process. We
            believe your skills and experience will be a valuable asset to our
            team.
          </p>

          <div className="mt-4">
            <p>
              <strong>Position:</strong> {offerLetter.position}
            </p>
            <p>
              <strong>Department:</strong> {offerLetter.department}
            </p>
            <p>
              <strong>Location:</strong> {offerLetter.location}
            </p>
            <p>
              <strong>Start Date:</strong> {offerLetter.startDate}
            </p>
          </div>

          <div className="mt-4">
            <p className="underline font-semibold">Salary Details:</p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Monthly Gross Salary:</strong> {offerLetter.monthlySalary}
              </li>
              <li>
                <strong>Other Allowances:</strong> {offerLetter.otherAllowances}
              </li>
            </ul>
          </div>

          <p className="mt-4 text-justify">
            In addition to the salary, you will be entitled to benefits as per
            the company's HR policies, which will be detailed in your
            appointment letter upon joining.
          </p>

          <p className="mt-4 text-justify">
            Please confirm your acceptance of this offer by signing and
            returning a copy of this letter on or before{" "}
            <strong>15-04-25</strong>. We are excited to welcome you to our team
            and look forward to a mutually beneficial relationship. If you have
            any questions or require further clarification, feel free to contact
            us at <strong>{offerLetter.contactPhone}</strong> or{" "}
            <strong>{offerLetter.contactEmail}</strong>
          </p>

          <p className="mt-6">Sincerely,</p>
          <p className="mt-2 font-semibold">Shaik Anas S</p>
          <p>Operations Lead</p>
          <p>BRANDSPYRE Technologies Pvt Ltd</p>

          <div className="mt-10 text-right">
            <img src={alminoSeal} alt="Company Seal" className="h-20 inline" />
          </div>

          <footer className="text-sm mt-10 border-t-5 border-red-500 pt-3">
            <div className="flex justify-between">
              <div>
                <div className="text-red-600 flex flex-col ">
                  <div>
                    <span className="p-1 bg-gray-300 rounded-full mr-2 ">📞</span> +91 95977 46657
                  </div>
                  <br />
                  <div>
                    <span className="p-1 bg-gray-300 rounded-full mr-2">  📞</span> +91 97865 81307
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col gap-2">
                <p>📍 Near King's Palace, Old Check Post,</p>
                <p>Pattinamkathan, Ramanathapuram - 623503</p>
                <p>📧 alminostructure@gmail.com</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterView;