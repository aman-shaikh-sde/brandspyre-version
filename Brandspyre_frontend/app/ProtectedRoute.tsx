// import React, { useEffect, useState } from "react";
// import { Navigate } from "react-router-dom";
// import { useAuthStore } from "src/stores/authStore";

// interface Props {
//   children: React.ReactNode;
// }

// const ProtectedRoute: React.FC<Props> = ({ children }) => {
//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
//   const [hydrated, setHydrated] = useState(false);

//   // Wait for Zustand persist to load from localStorage
//   useEffect(() => {
//     setHydrated(true);
//   }, []);

//   if (!hydrated) {
//     // Or show a loader while checking auth
//     return <div>Loading...</div>;
//   }

//   if (!isLoggedIn) {
//     return <Navigate to="/login" replace />;
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;


// src/component/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "src/stores/authStore"; // adjust path

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: string; // optional role-based protection
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isLoggedIn, role } = useAuthStore();
  const hydrated = useAuthStore.persist.hasHydrated();

  // wait for store to rehydrate from localStorage
  if (!hydrated) {
    return <div>Loading...</div>;
  }

  // redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // redirect if role is required and user doesn't have it
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />; // optional 403 page
  }

  return children;
};

export default ProtectedRoute;
