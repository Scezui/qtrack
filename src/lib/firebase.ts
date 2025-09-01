// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "qtrack-2qwb1",
  appId: "1:716182257915:web:3bc1e8af4e5b300f49305e",
  storageBucket: "qtrack-2qwb1.firebasestorage.app",
  apiKey: "AIzaSyC5xIAE0VMpjX1uqbPyuMpMdy2K35vDwwM",
  authDomain: "qtrack-2qwb1.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "716182257915",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
