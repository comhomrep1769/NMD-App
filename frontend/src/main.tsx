import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./nmd-blue-theme.css";
import "./components/treatments/treatment-workspace.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
