// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDj5GoYZgT2D4_KPRMrK3o6jrxfIGhDiOw",
  authDomain: "quanlythucpham.firebaseapp.com",
  projectId: "quanlythucpham",
  storageBucket: "quanlythucpham.appspot.com", // ✅ Sửa chỗ này!
  messagingSenderId: "376741082422",
  appId: "1:376741082422:web:ad47f12e27f95bccc0af97",
  measurementId: "G-T78FM5WNKF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
