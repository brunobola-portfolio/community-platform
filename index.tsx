
/**
 * Application Entry Point
 * 
 * This file serves as the root bootstrapper for the React application.
 * It handles the DOM mounting process and wraps the application in StrictMode
 * for development-time best practices and checks.
 */

import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

// Fail fast on missing backend URL instead of constructing a broken client
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL em falta. Define-a no .env.local (dev) ou no build de produção.");
}

const convex = new ConvexReactClient(convexUrl);

// Validate the existence of the root DOM element to prevent runtime crashes.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize the React Fiber reconciliation tree.
const root = ReactDOM.createRoot(rootElement);

// Render the application tree.
root.render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
);
