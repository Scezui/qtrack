// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "qtrack-2qwb1",
  appId: "1:716182257915:web:3bc1e8af4e5b300f49305e",
  storageBucket: "qtrack-2qwb1.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "qtrack-2qwb1.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "716182257915",
};

// Initialize Firebase for client-side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
