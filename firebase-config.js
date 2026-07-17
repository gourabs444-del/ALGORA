// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZPGt_a9qDr36MtZl10l8t2cJ1pXngyyM",
  authDomain: "portfolio-5141f.firebaseapp.com",
  projectId: "portfolio-5141f",
  storageBucket: "portfolio-5141f.firebasestorage.app",
  messagingSenderId: "726171689300",
  appId: "1:726171689300:web:70a4f6eed905e2899e28c1",
  measurementId: "G-NX74FS2FBG"
};

// Expose this public web configuration to classic Firebase pages in this site.
// The page that consumes it initializes Firebase Auth exactly once.
window.firebaseConfig = firebaseConfig;
window.dispatchEvent(new Event('firebase-config-ready'));
