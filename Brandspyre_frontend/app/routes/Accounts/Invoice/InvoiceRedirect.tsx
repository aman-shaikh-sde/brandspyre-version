import React from "react";
import { Navigate, useParams } from "react-router";

/**
 * Invoice Redirect
 * Redirects legacy /view_invoice/:id to canonical /invoice_view/:id.
 * Redirects legacy /view_invoice and /invoice_view without ID to canonical /account.
 */
export default function InvoiceRedirect() {
  const { id } = useParams<{ id?: string }>();
  if (id) {
    return <Navigate to={`/invoice_view/${encodeURIComponent(id)}`} replace />;
  }
  return <Navigate to="/account" replace />;
}
