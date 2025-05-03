import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PrimeReactProvider } from "primereact/api";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner"
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Cấu hình thêm cho PrimeReact
const primeReactConfig = {
  ripple: true,
  unstyled: false,
  pt: {},
  cssTransition: true,
};

// Sử dụng React.StrictMode để phát hiện các vấn đề tiềm ẩn trong ứng dụng
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <HelmetProvider>
        <PrimeReactProvider value={primeReactConfig}>
          <AuthProvider>
            <CartProvider>
              <Theme accentColor="green">
                <App />
                <Toaster richColors position="bottom-right" />
              </Theme>
            </CartProvider>
          </AuthProvider>
        </PrimeReactProvider>
      </HelmetProvider>
    </Router>
  </React.StrictMode>
);
