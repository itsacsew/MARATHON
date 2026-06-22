// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWXiw1X_aDj9JAIPIbduzpEAT43sDep5A",
  authDomain: "payroll-1fcab.firebaseapp.com",
  projectId: "payroll-1fcab",
  storageBucket: "payroll-1fcab.firebasestorage.app",
  messagingSenderId: "456428073034",
  appId: "1:456428073034:web:50945d1f9ebb55998736b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;