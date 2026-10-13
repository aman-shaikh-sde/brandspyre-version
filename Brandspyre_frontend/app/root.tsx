import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "../src/services/apiClient";
import { Toaster } from "react-hot-toast";
import AppErrorBoundary from "./components/ErrorBoundary";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/brandspyre_icon.png", type: "image/png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              maxWidth: '420px',
              padding: '14px 18px',
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
            success: { duration: 3000 },
            error: { duration: 7000 },
          }}
          containerStyle={{ top: 20, right: 20, zIndex: 999999 }}
        />
        <AppErrorBoundary>
          {children}
        </AppErrorBoundary>
      
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { useEffect } from "react";
import { useAuthStore } from "src/stores/authStore";

export default function App() {
  useEffect(() => {
    useAuthStore.getState().bootstrapAuth();
  }, []);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

