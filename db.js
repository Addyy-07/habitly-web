// ============================================================
//  db.js — Firestore helpers (habits, completions, reminders)
//
//  Data model:
//    users/{uid}/habits/{habitId}
//    users/{uid}/completions/{YYYY-MM-DD}/{habitId: true}
//    users/{uid}/reminders/{reminderId}
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc,
  query, orderBy, onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── helpers ──────────────────────────────────────────────────
const habitsRef  = (uid) => collection(db, "users", uid, "habits");
const habitDoc   = (uid, id) => doc(db, "users", uid, "habits", id);
const completionDoc = (uid, date) => doc(db, "users", uid, "completions", date);
const remindersRef  = (uid) => collection(db, "users", uid, "reminders");
const reminderDoc   = (uid, id) => doc(db, "users", uid, "reminders", id);

// ── TODAY KEY ────────────────────────────────────────────────
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── HABITS ───────────────────────────────────────────────────

// Listen to habits in real-time
export function listenHabits(uid, callback) {
  const q = query(habitsRef(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const habits = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(habits);
  });
}

// Add a new habit
export async function addHabit(uid, habit) {
  return addDoc(habitsRef(uid), {
    ...habit,
    streak: 0,
    createdAt: serverTimestamp()
  });
}

// Update an existing habit
export async function updateHabit(uid, habitId, updates) {
  return updateDoc(habitDoc(uid, habitId), updates);
}

// Delete a habit
export async function deleteHabit(uid, habitId) {
  return deleteDoc(habitDoc(uid, habitId));
}

// ── COMPLETIONS ──────────────────────────────────────────────

// Get completions for a specific date
export async function getCompletions(uid, date) {
  const snap = await getDoc(completionDoc(uid, date));
  return snap.exists() ? snap.data() : {};
}

// Listen to today's completions in real-time
export function listenCompletions(uid, date, callback) {
  return onSnapshot(completionDoc(uid, date), (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
}

// Toggle a habit completion for today
export async function toggleCompletion(uid, date, habitId, done) {
  const ref = completionDoc(uid, date);
  await setDoc(ref, { [habitId]: done }, { merge: true });
}

// Get completions for a range of dates (for heatmap/stats)
export async function getCompletionsRange(uid, dates) {
  const results = {};
  await Promise.all(
    dates.map(async (date) => {
      const snap = await getDoc(completionDoc(uid, date));
      results[date] = snap.exists() ? snap.data() : {};
    })
  );
  return results;
}

// ── REMINDERS ────────────────────────────────────────────────

// Listen to reminders in real-time
export function listenReminders(uid, callback) {
  const q = query(remindersRef(uid), orderBy("time", "asc"));
  return onSnapshot(q, (snap) => {
    const reminders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(reminders);
  });
}

// Add reminder
export async function addReminder(uid, reminder) {
  return addDoc(remindersRef(uid), reminder);
}

// Update reminder (e.g. toggle enabled)
export async function updateReminder(uid, reminderId, updates) {
  return updateDoc(reminderDoc(uid, reminderId), updates);
}

// Delete reminder
export async function deleteReminder(uid, reminderId) {
  return deleteDoc(reminderDoc(uid, reminderId));
}

// ── USER PROFILE ──────────────────────────────────────────────

// Save/update user profile doc
export async function saveUserProfile(uid, profile) {
  return setDoc(doc(db, "users", uid), profile, { merge: true });
}

// Get user profile
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}