import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

/* `document.getElementById` returns `HTMLElement | null`, so TypeScript
   will not let you pass it to createRoot without dealing with the null.
   Throwing here is honest: if #root is missing, nothing can render. */
const container = document.getElementById("root");
if (!container) throw new Error("#root not found in index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
