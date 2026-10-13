import React from "react";
import MarketingHome from "./marketing/MarketingHome";

/**
 * RootDispatcher renders the Brandspyre Marketing Homepage.
 * Both anonymous and authenticated users can browse the marketing site.
 * Authenticated users see the 'Dashboard' action in the PublicNavbar.
 */
export default function RootDispatcher() {
  return <MarketingHome />;
}
