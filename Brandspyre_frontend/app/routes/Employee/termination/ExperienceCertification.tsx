import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import alminoLogo from "../../../assets/Almino structural consultancy_Final.png";
import alminoSeal from "../../../assets/almino seal.png";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";

const ExperienceCertificate = () => {
  const navigate = useNavigate();
  const componentRef = useRef();
  const { id, resign_id } = useParams();
  const accesstoken = useAuthStore((state) => state.accessToken);

  const req_id = decodeURIComponent(resign_id);
  // Get both staff_id and resign_id from params
  const [employee, setEmployee] = useState(null);
  const [terminationData, setTerminationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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



  const fetchEmployeeData = async () => {
    try {
      const response = await apiClient.post(
        `/users/profile`,
        {
          staff_id: decodeURIComponent(id),
        }
      );

      if (response.data && response.data.data) {
        setEmployee(response.data.data);
      } else {
        throw new Error("No employee data found");
      }
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError(err.message);
    }
  };

  const fetchTerminationData = async () => {
    try {
      const response = await apiClient.get(
        `/user_resign_form/read?resign_id=${req_id}`
      );

      if (response.data && response.data.data) {
        setTerminationData(response.data.data);
      } else {
        throw new Error("No termination data found");
      }
    } catch (err) {
      console.error("Error fetching termination data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      fetchEmployeeData();
      fetchTerminationData();
    }
  }, [hydrated, token, id, resign_id]);

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

  // Calculate years of experience using termination data if available
  const calculateExperience = () => {
    if (!employee && !terminationData) return "3 years";

    // Prefer termination data if available
    const joiningDate = terminationData?.dateofjoining
      ? new Date(terminationData.dateofjoining)
      : employee?.basic?.dateofjoining
        ? new Date(employee.basic.dateofjoining)
        : new Date("2022-01-01"); // Default if null

    const leavingDate = terminationData?.reliving_date
      ? new Date(terminationData.reliving_date)
      : employee?.basic?.relivingdate
        ? new Date(employee.basic.relivingdate)
        : new Date(); // Current date if null

    const diffTime = Math.abs(leavingDate - joiningDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));

    return `${diffYears} year${diffYears !== 1 ? "s" : ""}`;
  };

  // Format dates - prefer termination data if available
  const formatDate = (dateString) => {
    if (!dateString) return "01-01-2022"; // Default if null

    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  // Get the most relevant data (prefer termination data if available)
  const getEmployeeName = () => {
    if (terminationData?.staff_name) return terminationData.staff_name;
    if (employee?.basic?.firstname && employee?.basic?.lastname)
      return `${employee.basic.firstname} ${employee.basic.lastname}`;
    return "Employee";
  };

  const getDesignation = () => {
    if (terminationData?.designation) return terminationData.designation;
    if (employee?.basic?.designation) return employee.basic.designation;
    return "Employee";
  };

  const getGender = () => {
    if (employee?.basic?.gender) return employee.basic.gender;
    return "Female"; // Default if not available
  };

  const getJoiningDate = () => {
    if (terminationData?.dateofjoining) return terminationData.dateofjoining;
    if (employee?.basic?.dateofjoining) return employee.basic.dateofjoining;
    return "2022-01-01"; // Default
  };

  const getLeavingDate = () => {
    if (terminationData?.reliving_date) return terminationData.reliving_date;
    if (employee?.basic?.relivingdate) return employee.basic.relivingdate;
    return new Date().toISOString(); // Current date
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!employee && !terminationData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-800 text-lg">No employee data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 print:p-0">
      <div className="flex justify-between">
        <button
          onClick={handlePrint}
          className="mb-4 px-4 py-2 bg-red-700 text-white rounded shadow print:hidden"
        >
          Print Experience Certificate
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

          <div className="text-right mb-4">
            <p>Ref. No: {resign_id || "25/E26"}</p>
            <p>
              Date:{" "}
              {new Date()
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .replace(/\//g, "-")}
            </p>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold underline">
              EXPERIENCE CERTIFICATE
            </h2>
          </div>

          <p className="text-center font-semibold mb-6">
            To Whom It May Concern,
          </p>

          <p className="mt-2 text-justify">
            This is to certify that <strong>Ms. {getEmployeeName()}</strong> has
            been employed withBrandsypre Groups Pvt Ltd from{" "}
            <strong>{formatDate(getJoiningDate())}</strong> to{" "}
            <strong>{formatDate(getLeavingDate())}</strong> as a{" "}
            <strong>{getDesignation()}</strong>. During their tenure with the
            company, {getGender() === "Male" ? "he" : "she"} has demonstrated
            excellent skills in their role.
          </p>

          <p className="mt-4 text-justify">
            As a {getDesignation()}, {getGender() === "Male" ? "he" : "she"} was
            responsible for the following key duties:
          </p>

          <ul className="list-disc list-inside ml-4 mt-2">
            <li>Performing duties as assigned by the management</li>
            <li>
              Collaborating with team members to achieve company objectives
            </li>
            <li>
              Maintaining high standards of professionalism and work ethics
            </li>
            <li>Ensuring quality in all assigned tasks</li>
            <li>Adhering to company policies and procedures</li>
          </ul>

          <p className="mt-4 text-justify">
            {getGender() === "Male" ? "He" : "She"} has exhibited
            professionalism, dedication, and strong problem-solving abilities in
            fulfilling their responsibilities.{" "}
            {getGender() === "Male" ? "He" : "She"} has contributed
            significantly to the company's success during{" "}
            {calculateExperience()} of service with us.
          </p>

          <p className="mt-4 text-justify">
            We wish {getGender() === "Male" ? "him" : "her"} all the best in{" "}
            {getGender() === "Male" ? "his" : "her"} future endeavors.
          </p>

          <div className="mt-12">
            <p className="font-semibold">Managing Director</p>
            <p>BRANDSPYRE Technologies Pvt Ltd</p>
          </div>

          <div className="mt-10 text-right">
            <img src={alminoSeal} alt="Company Seal" className="h-20 inline" />
          </div>

          <footer className="text-sm mt-10 border-t border-gray-300 pt-3">
            <div className="flex justify-between">
              <div>
                <p className="text-red-600">
                  📞 +91 95977 46657
                  <br />
                  📞 +91 97865 81307
                </p>
              </div>
              <div className="text-right">
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

export default ExperienceCertificate;
