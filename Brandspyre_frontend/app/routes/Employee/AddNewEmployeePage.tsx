import { Navigate } from "react-router";

/**
 * @deprecated This standalone page is obsolete and superseded by the canonical
 * AddEmployeeForm modal flow located at /employee?create=true.
 * Redirects automatically to prevent broken employee creation experiences.
 */
const AddNewEmployeePage = () => {
  return <Navigate to="/employee?create=true" replace />;
};

export default AddNewEmployeePage;