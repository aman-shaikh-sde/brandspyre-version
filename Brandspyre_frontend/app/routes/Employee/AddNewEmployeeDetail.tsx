import { apiClient } from "src/services/apiClient";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "~/services/notificationService";
import { useNavigate, useParams, Navigate } from "react-router";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";

const AddNewEmployeeDetail = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const token = useAuthStore((state) => state.accessToken);
  const { id } = useParams();
  const staff_id = id ? decodeURIComponent(id) : "";
  const [isLoading, setIsLoading] = useState(false);
  const [personalData,setPersonalData]=useState([]);
    const [masterLanguages, setMasterLanguages] = useState([]);
  const [masterSoftware, setMasterSoftware] = useState([]);
  const branchcode=useAuthStore((state)=>state.branchcode)
 
  const [existingData, setExistingData] = useState({
    education: [],
    employment: [],
    references: [],
    emergencyContacts: [],
    software: [],
    languages: [],
  });

  const [formData, setFormData] = useState({
    education: [
      {
        sno: 1,
        degree: "",
        institute: "",
        yearOfPassing: "",
        percentage: "",
        start_year: "",
        end_year: "",
      },
    ],
    employment: [
      {
        sno: 1,
        companyName: "",
        designation: "",
        salary: "",
        periodFrom: "",
        periodTo: "",
        reasonForResign: "",
      },
    ],
    references: [
      {
        sno: 1,
        
        name: "",
        relation: "",
        contactNo: "",
        address: "",
        referstaff_id: "",
      },
    ],
    emergencyContacts: [
      { sno: 1, name: "", relation: "", mobileNo: "", landlineNo: "" },
    ],
     software: [],
    languages: [],
  });

  const navigate = useNavigate();

  // Guard: redirect if accessed with a fake/invalid id (e.g. /employee/addpage/new) -> redirect to canonical create flow
  if (!id || id === "new") {
    return <Navigate to="/employee?create=true" replace />;
  }

const getPersonalData=async()=>{
const response=await apiClient.get(`/users/read?staff_id=${staff_id}`)

console.log("userpersonalresponsee",response)
setPersonalData(response?.data?.data[0] || [])
}
 const fetchMasterData = async () => {
    try {
      // Fetch master languages
      const langRes = await apiClient.get(`/master/language/read?branchcode=${branchcode}`);
      setMasterLanguages(langRes.data.data || []);
console.log("response eof languagess>>>>>>>>>>>>>>>",langRes)
      // Fetch master software
      const softRes = await apiClient.get(`/master/software/read?branchcode=${branchcode}`);
console.log("responseesoftwareeee",softRes)

      setMasterSoftware(softRes.data.data || []);
    } catch (error) {
      // console.error("Error fetching master data:", error);
      // notify.error("Failed to fetch master data");
    }
  };

  useEffect(() => {
    getPersonalData();
    fetchMasterData();
  }, []);


  // Fetch existing data for each section
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch education
        const eduRes = await apiClient.get(
          `/users/education/read?staff_id=${staff_id}`
        );
        console.log("response for education", eduRes);
        if (eduRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            education: eduRes.data.data.map((item, index) => ({
              sno: index + 1,
              degree: item.degree,
              institute: item.institute,
              yearOfPassing: item.passing,
              percentage: item.percentage,
              start_year: item.start_year,
              end_year: item.end_year,
            })),
          }));
        }

        // Fetch employment
        const empRes = await apiClient.get(
          `/users/experience/read?usersId=${staff_id}`
        );
        if (empRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            employment: empRes.data.data.map((item, index) => ({
              sno: index + 1,
              companyName: item.companyname,
              designation: item.designation,
              salary: item.lastsalary,
              periodFrom: item.start_year,
              periodTo: item.end_year,
              reasonForResign: item.reason,
            })),
          }));
        }
        const emgRes = await apiClient.get(
          `/users/emergency/read?branchcode=${staff_id}`
        );

        console.log("responsefor emergencycontact", emgRes);
        if (emgRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            emergencyContacts: emgRes.data.data.map((item, index) => ({
              sno: index + 1,
              name: item.name,
              relation: item.relation,
              mobileNo: item.contactno,
              landlineNo: item.landline,
            })),
          }));
        }
        // Fetch references
        const refRes = await apiClient.get(
          `/users/reference/read?staff_id=${staff_id}`
        );
        if (refRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            references: refRes.data.data.map((item, index) => ({
              sno: index + 1,
              name: item.name,
              relation: item.relation,
              contactNo: item.contactno,
              address: item.address,
              referstaff_id: item.referstaff_id,
            })),
          }));
        }

      const langRes = await apiClient.get(
          `/users/language/read?staff_id=${staff_id}`
        );
        console.log("laanguage previous datas",langRes)
        if (langRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            languages: langRes.data.data.map((item, index) => ({
              sno: index + 1,
              language_id: item.language_id,
              language: item.name, // Assuming API returns language_name
              read: item.can_read,
              speak: item.can_speak,
              write: item.can_write,
              fluency: item.proficiency
            })),
          }));
        }

        // Fetch employee software
        const softRes = await apiClient.get(
          `/users/software/read?staff_id=${staff_id}`
        );

        console.log("software previous response",softRes)
        if (softRes.data.data?.length > 0) {
          setExistingData((prev) => ({
            ...prev,
            software: softRes.data.data.map((item, index) => ({
              sno: index + 1,
              software_id: item.software_id,
              softwareName: item.software_name, // Assuming API returns software_name
              proficiency: item.proficiency,
              remark: item.remark,
            })),
          }));
        }

      } catch (error) {
        // console.error("Error fetching data:", error);
        // notify.error("Failed to fetch existing data");
      } finally {
        setIsLoading(false);
      }
    };

    if (staff_id) {
      fetchData();
    }
  }, [staff_id, token]);
useEffect(() => {
    if (masterLanguages.length > 0) {
      setFormData(prev => ({
        ...prev,
        languages: masterLanguages.map((lang, index) => ({
          sno: index + 1,
          language_id: lang.id,
          language: lang.name,
          read: false,
          speak: false,
          write: false,
          fluency: "",
        }))
      }));
    }
  }, [masterLanguages]);

  useEffect(() => {
    if (masterSoftware.length > 0) {
      setFormData(prev => ({
        ...prev,
        software: masterSoftware.map((soft, index) => ({
          sno: index + 1,
          software_id: soft.id,
          softwareName: soft.name,
          proficiency: "",
          remark: "",
        }))
      }));
    }
  }, [masterSoftware]);

  const handleGoBack = () => {
    navigate("/employee");
  };
const handleLanguagesSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const languagesToSubmit = formData.languages.filter(
        (item) => item.fluency || item.read || item.speak || item.write || item.remark
      );

      const payload = {
        userDatas: languagesToSubmit.map((item) => ({
          staff_id,
          language_id: item.language_id,
          can_read: item.read,
          can_speak: item.speak,
          can_write: item.write,
          proficiency: item.fluency,
          remark:item.remark || ""
        })),
      };
console.log("create languageemployee",payload);

      await apiClient.post(`/users/language/create`, payload);

      notify.success("Language details saved successfully");
    } catch (error) {
      // console.error("Error saving language details:", error);
      // notify.error("Failed to save language details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoftwareSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const softwareToSubmit = formData.software.filter(
        (item) => item.proficiency
      );

      const payload = {
        userDatas: softwareToSubmit.map((item) => ({
          staff_id,
          software_id: item.software_id,
          proficiency: item.proficiency,
          remark: item.remark || "",
        })),
      };

      await apiClient.post(`/users/software/create`, payload);

      notify.success("Software proficiency saved successfully");
    } catch (error) {
      // console.error("Error saving software proficiency:", error);
      // notify.error("Failed to save software proficiency");
    } finally {
      setIsLoading(false);
    }
  };

  // Tab change functions
  const nextTab = () => {
    const tabs = ["personal", "education", "other"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = ["personal", "education", "other"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const addNewEntry = (arrayName, template) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [
        ...prev[arrayName],
        {
          ...template,
          sno: prev[arrayName].length + 1,
        },
      ],
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const updatedArray = [...formData[arrayName]];
    updatedArray[index][field] = value;
    setFormData({ ...formData, [arrayName]: updatedArray });
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Filter out empty education entries
      const educationToSubmit = formData.education.filter(
        (item) => item.degree && item.institute && item.yearOfPassing
      );

      // if (educationToSubmit.length === 0) {
      //   notify.error("Please add at least one education entry");
      //   return;
      // }

      const payload = {
        userDatas: educationToSubmit.map((item) => ({
          staff_id,
          degree: item.degree,
          institute: item.institute,
          passing: item.yearOfPassing,
          percentage: item.percentage,
          start_year: item.start_year,
          end_year: item.end_year,
        })),
      };

      await apiClient.post(`/users/education/create`, payload);

      notify.success("Education details saved successfully");
      
      nextTab();
    } catch (error) {
      // console.error("Error saving education:", error);
      // notify.error("Failed to save education details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmploymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const employmentToSubmit = formData.employment.filter(
        (item) => item.companyName && item.designation
      );

      // if (employmentToSubmit.length === 0) {
      //   notify.error("Please add at least one employment entry");
      //   return;
      // }

      const payload = {
        userDatas: employmentToSubmit.map((item) => ({
          staff_id,
          companyname: item.companyName,
          designation: item.designation,
          lastsalary: item.salary,
          start_year: item.periodFrom,
          end_year: item.periodTo,
          reason: item.reasonForResign,
        })),
      };

      await apiClient.post(`/users/experience/create`, payload);

      notify.success("Employment details saved successfully");
      nextTab();
    } catch (error) {
      // console.error("Error saving employment:", error);
      // notify.error("Failed to save employment details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const referencesToSubmit = formData.references.filter(
        (item) => item.name && item.relation
      );

      // if (referencesToSubmit.length === 0) {
      //   notify.error("Please add at least one reference");
      //   return;
      // }

      const payload = {
        userDatas: referencesToSubmit.map((item) => ({
          staff_id,
          referstaff_id: item.referstaff_id || staff_id, // fallback to staff_id if not provided
          name: item.name,
          relation: item.relation,
          contactno: item.contactNo,
          address: item.address,
        })),
      };

      await apiClient.post(`/users/reference/create`, payload);

      notify.success("References saved successfully");
    } catch (error) {
      // console.error("Error saving references:", error);
      // notify.error("Failed to save references");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const emergencyToSubmit = formData.emergencyContacts.filter(
        (item) => item.name && item.relation
      );

      // if (emergencyToSubmit.length === 0) {
      //   notify.error("Please add at least one emergency contact");
      //   return;
      // }

      const payload = {
        userDatas: emergencyToSubmit.map((item) => ({
          staff_id,
          name: item.name,
          relation: item.relation,
          contactno: item.mobileNo,
          landline: item.landlineNo,
        })),
      };

      await apiClient.post(`/users/emergency/create`, payload);

      notify.success("Emergency contacts saved successfully");
    } catch (error) {
      // console.error("Error saving emergency contacts:", error);
      // notify.error("Failed to save emergency contacts");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSoftwareSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     setIsLoading(true);

  //     const softwareToSubmit = formData.software.filter(
  //       (item) => item.proficiency
  //     );

  //     // if (softwareToSubmit.length === 0) {
  //     //   notify.error("Please select proficiency for at least one software");
  //     //   return;
  //     // }

  //     // Assuming you have an API endpoint for software
  //     const payload = {
  //       userDatas: softwareToSubmit.map((item) => ({
  //         staff_id,
  //         software_name: item.softwareName,
  //         proficiency: item.proficiency,
  //       })),
  //     };

  //     await apiClient.post(`/users/software/create`, payload, {
  //
  //     });

  //     notify.success("Software proficiency saved successfully");
  //   } catch (error) {
  //     console.error("Error saving software proficiency:", error);
  //     notify.error("Failed to save software proficiency");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleLanguagesSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     setIsLoading(true);

  //     const languagesToSubmit = formData.languages.filter(
  //       (item) => item.fluency || item.read || item.speak || item.write
  //     );

  //     // if (languagesToSubmit.length === 0) {
  //     //   notify.error("Please provide details for at least one language");
  //     //   return;
  //     // }

  //     const payload = {
  //       userDatas: languagesToSubmit.map((item) => ({
  //         staff_id,
  //         language: item.language,
  //         read: item.read,
  //         speak: item.speak,
  //         write: item.write,
  //         fluency: item.fluency,
  //       })),
  //     };

  //     await apiClient.post(`/users/languages/create`, payload, {
  //
  //     });

  //     notify.success("Language details saved successfully");
  //   } catch (error) {
  //     console.error("Error saving language details:", error);
  //     notify.error("Failed to save language details");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Submit all "other" section data
      await Promise.all([
        handleReferencesSubmit(e),
        handleEmergencySubmit(e),
        handleSoftwareSubmit(e),
        handleLanguagesSubmit(e),
      ]);

      notify.success("All details saved successfully");
      navigate("/employee"); // Go back to employee roster after successful submission
    } catch (error) {
      console.error("Error in final submission:", error);
      notify.error("Failed to save some details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto bg-transparent dark:bg-gray-800 overflow-hidden">
        <div className="flex justify-between">
          <div className="p-4 text-red-700 mb-10">
            <h1 className="text-2xl font-bold">Employee Information Form</h1>
          </div>
<div>
            <button
              className="text-gray-500 bg-gray-200 px-3 py-1 rounded-lg mt-6"
              onClick={handleGoBack}
            >
              <LogOut className="inline rotate-180 text-gray-500 mr-3" />
              Go Back
            </button>
          </div>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-10">
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === "personal" ? " dark:bg-gray-800 text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            onClick={() => setActiveTab("personal")}
          >
          Personal Information
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === "education" ? " dark:bg-gray-800 text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            onClick={() => setActiveTab("education")}
          >
            Education & Experience
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === "other" ? " dark:bg-gray-800 text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            onClick={() => setActiveTab("other")}
          >
            Other Details
          </button>
        </div>
        {activeTab === "personal" && (
          <div className="space-y-8 bg-white rounded-2xl h-[750px] overflow-y-auto">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-white">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {" "}
                    First Name{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={personalData.firstname || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={personalData.lastname || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={
                      personalData.dob
                        ? new Date(personalData.dob).toISOString().split("T")[0]
                        : ""
                    }
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={personalData.gender || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marital Status
                  </label>
                  <input
                    type="text"
                    value={personalData.marital || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={personalData.bloodgroup || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile No
                  </label>
                  <input
                    type="text"
                    value={personalData.phonenumber || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Residence Contact no
                  </label>
                  <input
                    type="text"
                    value={personalData.alternumber || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email ID (Personal)
                  </label>
                  <input
                    type="text"
                    value={personalData.email || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={personalData.branchcode || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={personalData.role || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PSN CODE
                  </label>
                  <input
                    type="text"
                    value={personalData.psn || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pan Card Number
                  </label>
                  <input
                    type="text"
                    value={personalData.pannumber || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adhar Card Number
                  </label>
                  <input
                    type="text"
                    value={personalData.aadharnumber || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={personalData.department || ""}
                    disabled
                    className="max-w-[400px] w-[300px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Present Address
                  </label>
                  <textarea
                    value={personalData.presentaddress || ""}
                    disabled
                    rows={3}
                    className="w-[1020px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permanent Address
                  </label>
                  <textarea
                    value={personalData.permanentaddress || ""}
                    disabled
                    rows={3}
                    className="w-[1020px] bg-gray-100 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 rounded cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex m-10 justify-between">
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextTab}
                className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {activeTab === "education" && (
          <div className="space-y-8">
            {/* Existing Education Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  Educational Qualification
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("education", {
                      sno: formData.education.length + 1,
                      degree: "",
                      institute: "",
                      yearOfPassing: "",
                      percentage: "",
                      start_year: "",
                      end_year: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2  text-sm"
                >
                  + Add Education
                </button>
              </div>

              {/* Show existing education data (read-only) */}
              {existingData.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing Education
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Degree
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Institute
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Year of Passing
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.education.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.degree}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.institute}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.yearOfPassing}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.percentage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Form for new education entries */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Degree/Diploma/Certificate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Institute/University
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Year of Passing
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.education.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.degree}
                            onChange={(e) =>
                              handleArrayChange(
                                "education",
                                index,
                                "degree",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[200px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.institute}
                            onChange={(e) =>
                              handleArrayChange(
                                "education",
                                index,
                                "institute",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[200px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.yearOfPassing}
                            onChange={(e) =>
                              handleArrayChange(
                                "education",
                                index,
                                "yearOfPassing",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[200px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.percentage}
                            onChange={(e) =>
                              handleArrayChange(
                                "education",
                                index,
                                "percentage",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[200px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedEducation =
                                formData.education.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdatedSno = updatedEducation.map(
                                (ref, idx) => ({
                                  ...ref,
                                  sno: idx + 1,
                                })
                              );
                              setFormData({
                                ...formData,
                                education: withUpdatedSno,
                              });
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end p-6">
                <button             
                  className="px-3 py-2 bg-red-600 text-white rounded-sm  hover:bg-red-700 focus:outline-none focus:ring-2  text-sm"
          onClick={handleEducationSubmit}>Submit Education</button>
          </div>
              </div>
            </div>

            {/* Employment Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  Previous Employment Details
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("employment", {
                      sno: formData.employment.length + 1,
                      companyName: "",
                      designation: "",
                      salary: "",
                      periodFrom: "",
                      periodTo: "",
                      reasonForResign: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2  text-sm"
                >
                  + Add Employment
                </button>
              </div>

              {/* Show existing employment data (read-only) */}
              {existingData.employment.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing Employment
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Designation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Salary
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Period
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.employment.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.companyName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.designation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.salary}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.periodFrom} to {item.periodTo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Form for new employment entries */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Salary Last Drawn
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Period From
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Period To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reason for Resign
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.employment.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.companyName}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "companyName",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.designation}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "designation",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.salary}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "salary",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={item.periodFrom}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "periodFrom",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={item.periodTo}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "periodTo",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.reasonForResign}
                            onChange={(e) =>
                              handleArrayChange(
                                "employment",
                                index,
                                "reasonForResign",
                                e.target.value
                              )
                            }
                            className="max-w-[400px] w-[150px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-1 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedEmployment =
                                formData.employment.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdatedSno = updatedEmployment.map(
                                (ref, idx) => ({
                                  ...ref,
                                  sno: idx + 1,
                                })
                              );
                              setFormData({
                                ...formData,
                                employment: withUpdatedSno,
                              });
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevTab}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleEmploymentSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save & Next"}
              </button>
            </div>
          </div>
        )}
        {/* {activeTab === "other" && (
          <div className="space-y-8">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-white">
                Software Proficiency
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Software
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proficiency Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.software.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.softwareName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <select
                            value={item.proficiency}
                            onChange={(e) =>
                              handleArrayChange(
                                "software",
                                index,
                                "proficiency",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          >
                            <option value="">Select</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-white">
                Languages Known
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Language
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Read
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Speak
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Write
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fluency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.languages.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.language}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={item.read}
                            onChange={(e) =>
                              handleArrayChange(
                                "languages",
                                index,
                                "read",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={item.speak}
                            onChange={(e) =>
                              handleArrayChange(
                                "languages",
                                index,
                                "speak",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={item.write}
                            onChange={(e) =>
                              handleArrayChange(
                                "languages",
                                index,
                                "write",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <select
                            value={item.fluency}
                            onChange={(e) =>
                              handleArrayChange(
                                "languages",
                                index,
                                "fluency",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          >
                            <option value="">Select</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Basic">Basic</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  References
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("references", {
                      sno: formData.references.length + 1,
                      name: "",
                      relation: "",
                      contactNo: "",
                      address: "",
                      referstaff_id: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none f text-sm"
                >
                  + Add Reference
                </button>
              </div>

              {existingData.references.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing References
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Relation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact No
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.references.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.relation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.contactNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Referrence_Id
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Relation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.references.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>  
                         <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.referstaff_id}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "referstaff_id",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.relation}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "relation",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.contactNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "contactNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.address}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "address",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              const updatedReferences =
                                formData.references.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdateSno = updatedReferences.map(
                                (ref, idx) => ({
                                  ...ref,
                                  sno: idx + 1,
                                })
                              );
                              setFormData({
                                ...formData,
                                references: withUpdateSno,
                              });
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  Emergency Contact Details
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("emergencyContacts", {
                      sno: formData.emergencyContacts.length + 1,
                      name: "",
                      relation: "",
                      mobileNo: "",
                      landlineNo: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2  text-sm"
                >
                  + Add Emergency
                </button>
              </div>

              {existingData.emergencyContacts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing Emergency Contacts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Relation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Mobile No
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.emergencyContacts.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.relation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.mobileNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact Person Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Relation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mobile No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Landline No
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.emergencyContacts.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.relation}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "relation",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.mobileNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "mobileNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.landlineNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "landlineNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedEmergerncyContact =
                                formData.emergencyContacts.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdatedSno =
                                updatedEmergerncyContact.map(
                                  (emergency, idx) => ({
                                    ...emergency,
                                    sno: idx + 1,
                                  })
                                );
                              setFormData({
                                ...formData,
                                emergencyContacts: withUpdatedSno,
                              });
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevTab}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )} */}
     {activeTab === "other" && (
        <div className="space-y-8">
          {/* Software Proficiency Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white" hidden>
            <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-white">
              Software Proficiency
            </h2>


<button
  type="button"
  onClick={() =>
    addNewEntry("software", {
      softwareName: "",
      proficiency: "",
    })
  }
  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 text-sm"
>
  + Add Software Proficiency
</button>


            {/* Show existing software data */}
            {existingData.software.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Existing Software Proficiency
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          S.No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Software
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Proficiency Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {existingData.software.map((item) => (
                        <tr key={item.sno}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.sno}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.softwareName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.proficiency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Form for new software entries */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Software
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Proficiency Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {formData.software.map((item, index) => (
                    <tr key={item.sno}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.sno}
                      </td>
{/*                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.softwareName}
                      </td>*/}

                      <td className="px-4 py-3 whitespace-nowrap">
  <input
    type="text"
    value={item.softwareName}
    onChange={(e) =>
      handleArrayChange(
        "software",
        index,
        "softwareName",
        e.target.value
      )
    }
    placeholder="Enter software name"
    className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2
               border border-gray-400 dark:border-gray-600 rounded
               focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
  />
</td>


                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <select
                          value={item.proficiency}
                          onChange={(e) =>
                            handleArrayChange(
                              "software",
                              index,
                              "proficiency",
                              e.target.value
                            )
                          }
                          className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                        >
                          <option value="">Select</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Languages Known Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white" hidden>
            <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-white">
              Languages Known
            </h2>
<button
  type="button"
  onClick={() =>
    addNewEntry("languages", {
      language: "",
      read: false,
      speak: false,
      write: false,
      fluency: "",
      remark: "",
    })
  }
  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 text-sm"
>
  + Add Language
</button>


            {/* Show existing languages data */}
            {existingData.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Existing Languages
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          S.No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Language
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Read
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Speak
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Write
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fluency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {existingData.languages.map((item) => (
                        <tr key={item.sno}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.sno}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.language}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.read ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.speak ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.write ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {item.fluency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Form for new language entries */}
            <div className="overflow-x-auto">
              

              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Read
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Speak
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Write
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fluency
                    </th>
                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {formData.languages.map((item, index) => (
                    <tr key={item.sno}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.sno}
                      </td>
                      {/*<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.language}
                      </td>*/}
                      <td className="px-4 py-3 whitespace-nowrap">
  <input
    type="text"
    value={item.language}
    onChange={(e) =>
      handleArrayChange(
        "language",
        index,
        "language",
        e.target.value
      )
    }
    placeholder="Enter Language name"
    className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2
               border border-gray-400 dark:border-gray-600 rounded
               focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
  />
</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={item.read}
                          onChange={(e) =>
                            handleArrayChange(
                              "languages",
                              index,
                              "read",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={item.speak}
                          onChange={(e) =>
                            handleArrayChange(
                              "languages",
                              index,
                              "speak",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={item.write}
                          onChange={(e) =>
                            handleArrayChange(
                              "languages",
                              index,
                              "write",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <select
                          value={item.fluency}
                          onChange={(e) =>
                            handleArrayChange(
                              "languages",
                              index,
                              "fluency",
                              e.target.value
                            )
                          }
                          className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                        >
                          <option value="">Select</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Basic">Basic</option>
                        </select>
                      </td>
                             <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.remark}
                            onChange={(e) =>
                              handleArrayChange(
                                "languages",
                                index,
                                "remark",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
   <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  References
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("references", {
                      sno: formData.references.length + 1,
                      name: "",
                      relation: "",
                      contactNo: "",
                      address: "",
                      referstaff_id: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none f text-sm"
                >
                  + Add Reference
                </button>
              </div>

              {existingData.references.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing References
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Relation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact No
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.references.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.relation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.contactNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Referrence_Id
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Relation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.references.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>  
                         <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.referstaff_id}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "referstaff_id",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.relation}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "relation",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.contactNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "contactNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.address}
                            onChange={(e) =>
                              handleArrayChange(
                                "references",
                                index,
                                "address",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              const updatedReferences =
                                formData.references.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdateSno = updatedReferences.map(
                                (ref, idx) => ({
                                  ...ref,
                                  sno: idx + 1,
                                })
                              );
                              setFormData({
                                ...formData,
                                references: withUpdateSno,
                              });
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-500 dark:text-white">
                  Emergency Contact Details
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addNewEntry("emergencyContacts", {
                      sno: formData.emergencyContacts.length + 1,
                      name: "",
                      relation: "",
                      mobileNo: "",
                      landlineNo: "",
                    })
                  }
                  className="px-3 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 focus:outline-none focus:ring-2  text-sm"
                >
                  + Add Emergency
                </button>
              </div>

              {existingData.emergencyContacts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Existing Emergency Contacts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Relation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Mobile No
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {existingData.emergencyContacts.map((item) => (
                          <tr key={item.sno}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.relation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.mobileNo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact Person Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Relation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mobile No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Landline No
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.emergencyContacts.map((item, index) => (
                      <tr key={item.sno}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {item.sno}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.relation}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "relation",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.mobileNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "mobileNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.landlineNo}
                            onChange={(e) =>
                              handleArrayChange(
                                "emergencyContacts",
                                index,
                                "landlineNo",
                                e.target.value
                              )
                            }
                            className="w-full bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedEmergerncyContact =
                                formData.emergencyContacts.filter(
                                  (_, i) => i !== index
                                );
                              const withUpdatedSno =
                                updatedEmergerncyContact.map(
                                  (emergency, idx) => ({
                                    ...emergency,
                                    sno: idx + 1,
                                  })
                                );
                              setFormData({
                                ...formData,
                                emergencyContacts: withUpdatedSno,
                              });
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          {/* ... (keep the references and emergency contacts sections as they are) */}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevTab}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AddNewEmployeeDetail;
