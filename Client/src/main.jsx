import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { PrimeReactProvider } from "primereact/api";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrimeReactProvider>
      <Theme>
        <App />
      </Theme>
    </PrimeReactProvider>
  </StrictMode>
);
