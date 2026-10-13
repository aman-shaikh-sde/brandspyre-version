// // components/AuthProvider.tsx
// import { useEffect } from 'react';
// import { useNavigate, Outlet } from 'react-router-dom';
// import { useAuthStore } from '../stores/authStore';

// export default function AuthProvider() {
//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!isLoggedIn) {
//       navigate('/login', { replace: true });
//     }
//   }, [isLoggedIn, navigate]);

//   return isLoggedIn ? <Outlet /> : null;
// }


// components/AuthProvider.tsx
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function AuthProvider() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasHydrated = useAuthStore.persist.hasHydrated();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasHydrated) return; // wait until store is ready

    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [hasHydrated, isLoggedIn, navigate]);

  // While hydrating, render nothing (prevents wrong redirect)
  if (!hasHydrated) {
    return <div>Loading...</div>;
  }

  return isLoggedIn ? <Outlet /> : null;
}
