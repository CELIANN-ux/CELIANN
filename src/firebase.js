import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEKalWNyxHKcezr-WzdDhQ179co39RBcU",
  authDomain: "celiann.firebaseapp.com",
  projectId: "celiann",
  storageBucket: "celiann.firebasestorage.app",
  messagingSenderId: "887724082548",
  appId: "1:887724082548:web:ae5b02134d0f75494e1821",
  measurementId: "G-PFKR2RC9WM",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
