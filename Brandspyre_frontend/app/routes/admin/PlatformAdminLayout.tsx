import React from 'react';
import { Outlet } from 'react-router';

/**
 * PlatformAdminLayout (Platform Admin Guard)
 * Performs authorization checks for Platform Admin routes and renders child pages
 * directly inside the single unified application shell (Layout.tsx).
 * 
 * No nested sidebars, headers, or secondary dark wrappers are rendered here.
 */
export default function PlatformAdminLayout() {
  return <Outlet />;
}
