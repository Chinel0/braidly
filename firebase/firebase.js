import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC1GgBEf61aBvVGZZxpRwlt1lEIn-5wQ4w",
  authDomain: "braidely.firebaseapp.com",
  projectId: "braidely",
  storageBucket: "braidely.firebasestorage.app",
  messagingSenderId: "326745046861",
  appId: "1:326745046861:web:026be689be388ac9b5c104",
  measurementId: "G-VNCL7BDR5J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
