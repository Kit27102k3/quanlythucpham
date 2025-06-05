import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-facebook-login-lite/dist/public/styles.css";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PrimeReactProvider } from "primereact/api";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { API_BASE_URL } from "./config/apiConfig";

// Cấu hình thêm cho PrimeReact
const primeReactConfig = {
  ripple: true,
  unstyled: false,
  pt: {},
  cssTransition: true,
};

// Helper function to convert URL-safe base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to test VAPID key
const testVapidKey = (key) => {
  try {
    if (!key) {
      return false;
    }

    const isValidBase64 = /^[A-Za-z0-9\-_]+=*$/.test(key);

    if (!isValidBase64) {
      console.error("VAPID key is not valid base64");
      return false;
    }

    // Test conversion to Uint8Array
    const array = urlBase64ToUint8Array(key);
    if (!array) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error testing VAPID key:", error);
    return false;
  }
};

// Function to send push subscription to backend
const sendSubscriptionToBackend = async (subscription) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/subscribe`, {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(
        "Push subscription sent to backend successfully:",
        responseData
      );
      return true;
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      console.error("Failed to send push subscription to backend:", errorData);
      return false;
    }
  } catch (error) {
    console.error("Error sending push subscription to backend:", error);
    return false;
  }
};

// Function to register Service Worker and request notification permission
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
      // Đầu tiên đăng ký Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      if (localStorage.getItem("accessToken")) {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          try {
            const response = await fetch(
              `${API_BASE_URL}/auth/vapid-public-key`
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch VAPID public key: ${response.statusText}`
              );
            }
            const data = await response.json();
            if (!data.vapidPublicKey) {
              throw new Error("No valid VAPID public key received from server");
            }
            const vapidPublicKey = data.vapidPublicKey;
            const isKeyValid = testVapidKey(vapidPublicKey);
            if (!isKeyValid) {
              throw new Error("VAPID key validation failed");
            }
            const existingSubscription =
              await registration.pushManager.getSubscription();
            if (existingSubscription) {
              await sendSubscriptionToBackend(existingSubscription);
            } else {
              try {
                const subscribeOptions = {
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                };

                const subscription = await registration.pushManager.subscribe(
                  subscribeOptions
                );

                await sendSubscriptionToBackend(subscription);
              } catch (subscribeError) {
                console.error(
                  "Failed to subscribe the user:",
                  subscribeError.message
                );
              }
            }
          } catch (vapidError) {
            console.error("Error fetching VAPID key:", vapidError.message);
          }
        }
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error.message);
    }
  }
};

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

if (localStorage.getItem("accessToken")) {
  registerServiceWorker();
}
