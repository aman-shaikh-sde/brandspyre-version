import React from "react";
import { Navigate } from "react-router";

/**
 * Task View Redirect
 * Redirects legacy /task_view (list navigation without task ID) to canonical /project_tasklist.
 * Individual tasks remain at /task_view/:id.
 */
export default function TaskViewRedirect() {
  return <Navigate to="/project_tasklist" replace />;
}
