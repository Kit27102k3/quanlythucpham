import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import "./index.css";
import App from "./App.jsx";
import { PrimeReactProvider } from "primereact/api";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <PrimeReactProvider>
        <Theme>
          <App />
        </Theme>
      </PrimeReactProvider>
    </HelmetProvider>
  </StrictMode>
);
