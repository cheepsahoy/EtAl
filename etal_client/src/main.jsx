import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App";
import StyleControl from "./StyleControl";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StyleControl>
      <App />
    </StyleControl>
  </StrictMode>
);
