// ============================================================
//  auth.js — Google Sign-In / Sign-Out / Auth State
// ============================================================

import { auth, provider } from "./firebase-config.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Sign in with Google popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error("Google sign-in error:", err);
    throw err;
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Sign-out error:", err);
    throw err;
  }
}

// Subscribe to auth state changes
// callback(user) — user is null when signed out
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Get current user synchronously (may be null before auth initialises)
export function getCurrentUser() {
  return auth.currentUser;
}