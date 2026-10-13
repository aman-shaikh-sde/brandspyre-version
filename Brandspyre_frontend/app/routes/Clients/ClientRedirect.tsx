import React from "react";
import { Navigate } from "react-router";

/**
 * Legacy Client Redirect
 * Automatically redirects legacy /client and /customers paths to the canonical /clients route.
 */
export default function ClientRedirect() {
  return <Navigate to="/clients" replace />;
}
