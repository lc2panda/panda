// Input:  DOM root element (#root)
// Output: mounted React application
// Pos:    application entry point — bootstraps React tree
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { setupBridgeListeners } from "./stores";
import "./styles/global.css";

// Wire IPC bridge events → Zustand stores (dev mock or Electron preload)
setupBridgeListeners();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
