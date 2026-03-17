// ============================================================
//  HABITLY — Firebase Configuration
//  Replace the values below with your own Firebase project.
//
//  HOW TO GET THESE VALUES:
//  1. Go to https://console.firebase.google.com
//  2. Create a new project (e.g. "habitly")
//  3. Click the </> (Web) icon to add a web app
//  4. Copy the firebaseConfig object shown and paste here
//  5. In Firebase Console → Authentication → Sign-in method
//     → Enable "Google"
//  6. In Firebase Console → Firestore Database
//     → Create database → Start in production mode
//     → Choose a region → Done
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDAyq9Ef5q30vFTJ87dxjZ-XLr6Im3toZk",
  authDomain:        "habitly-afa82.firebaseapp.com",
  projectId:         "habitly-afa82",
  storageBucket:     "habitly-afa82.firebasestorage.app",
  messagingSenderId: "604112573915",
  appId:             "1:604112573915:web:d6de837298fa24279043fe"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();