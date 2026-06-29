import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2w3Vds-YZ2miChbRTcfOoizoDs0cHt6g",
  authDomain: "bg-connect-ba650.firebaseapp.com",
  projectId: "bg-connect-ba650",
  storageBucket: "bg-connect-ba650.firebasestorage.app",
  messagingSenderId: "454995749393",
  appId: "1:454995749393:web:23f1f21b4719c38ce8dfb0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
