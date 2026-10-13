import React from "react";
import { Navigate } from "react-router";

/**
 * Legacy /home redirect
 * Redirects to canonical /dashboard.
 */
export default function HomeRedirect() {
  return <Navigate to="/dashboard" replace />;
}
