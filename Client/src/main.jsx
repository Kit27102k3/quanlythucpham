import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "react-facebook-login-lite/dist/public/styles.css";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PrimeReactProvider } from "primereact/api";
import { Theme } from "@radix-ui/themes";
import { Toaster, toast } from "sonner"
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Cấu hình thêm cho PrimeReact
const primeReactConfig = {
  ripple: true,
  unstyled: false,
  pt: {},
  cssTransition: true,
};

// Helper function to convert URL-safe base64 string to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Function to send push subscription to backend
const sendSubscriptionToBackend = async (subscription) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.warn("No access token found. Cannot send subscription to backend.");
    // Optionally, handle this case - maybe ask user to log in
    return;
  }

  try {
    const response = await fetch("/auth/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (response.ok) {
      console.log("Push subscription sent to backend successfully.");
      // Optionally show a success message to the user
      // toast.success("Đăng ký nhận thông báo thành công!");
    } else {
      console.error("Failed to send push subscription to backend:", response.statusText);
      // Optionally show an error message to the user
      // toast.error("Đăng ký nhận thông báo thất bại.");
    }
  } catch (error) {
    console.error("Error sending push subscription to backend:", error);
    // Optionally show an error message
    // toast.error("Đã xảy ra lỗi khi đăng ký nhận thông báo.");
  }
};

// Function to register Service Worker and request notification permission
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    console.log("Service Worker and Push API supported");

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      const permission = await Notification.requestPermission();
      console.log("Notification permission result:", permission);
      
      if (permission === "granted") {
        console.log("Notification permission granted.");

        try {
          // Fetch VAPID public key from backend
          console.log("Fetching VAPID public key from server...");
          const response = await fetch("/auth/vapid-public-key");
          console.log("VAPID key response status:", response.status);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch VAPID public key: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Received VAPID public key:", data.vapidPublicKey ? "Valid key received" : "No valid key");
          
          if (!data.vapidPublicKey) {
            throw new Error("No valid VAPID public key received from server");
          }
          
          const applicationServerKey = data.vapidPublicKey;

          // Check if a subscription already exists
          console.log("Checking for existing push subscription...");
          const existingSubscription = await registration.pushManager.getSubscription();

          if (existingSubscription) {
            console.log("Existing push subscription found:", existingSubscription);
            console.log("Subscription details:", {
              endpoint: existingSubscription.endpoint,
              expirationTime: existingSubscription.expirationTime,
              hasKeys: !!existingSubscription.options?.applicationServerKey
            });
            
            // Send existing subscription to backend again in case it wasn't saved before
            sendSubscriptionToBackend(existingSubscription);
          } else {
            console.log("No existing push subscription found. Subscribing user...");
            
            // If no existing subscription, subscribe the user
            try {
              const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
              };

              console.log("Subscribing with options:", {
                userVisibleOnly: subscribeOptions.userVisibleOnly,
                hasApplicationServerKey: !!subscribeOptions.applicationServerKey
              });
              
              const subscription = await registration.pushManager.subscribe(subscribeOptions);

              console.log("New Push Subscription created:", subscription);
              console.log("Subscription JSON:", JSON.stringify(subscription));

              // Send the new subscription object to your backend
              sendSubscriptionToBackend(subscription);
            } catch (subscribeError) {
              console.error("Failed to subscribe the user:", subscribeError);
              console.error("Error details:", subscribeError.message);
            }
          }
        } catch (vapidError) {
          console.error("Error fetching VAPID key:", vapidError);
          console.error("Error details:", vapidError.message);
        }
      } else {
        console.warn("Notification permission denied by user:", permission);
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      console.error("Error details:", error.message);
    }
  } else {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker API not supported in this browser.");
    }
    if (!("PushManager" in window)) {
      console.warn("Push API not supported in this browser.");
    }
  }
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

// Register Service Worker after initial render
registerServiceWorker();
