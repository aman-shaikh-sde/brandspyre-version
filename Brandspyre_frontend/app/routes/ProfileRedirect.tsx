import React from "react";
import { Navigate } from "react-router";

/**
 * Legacy /profile redirect
 * Redirects to canonical /account_profile.
 */
export default function ProfileRedirect() {
  return <Navigate to="/account_profile" replace />;
}
