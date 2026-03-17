// ============================================================
//  app.js — Main application logic
// ============================================================

import { signInWithGoogle, signOutUser, onAuthChange } from "./Auth.js";
import {
  todayKey,
  listenHabits, addHabit, updateHabit, deleteHabit,
  listenCompletions, toggleCompletion, getCompletionsRange,
  listenReminders, addReminder, updateReminder, deleteReminder,
  saveUserProfile
} from "./db.js";

// ── STATE ────────────────────────────────────────────────────
let currentUser = null;
let habits = [];
let todayCompletions = {};
let reminders = [];
let editingHabitId = null;
let selectedEmoji = "🏃";
let selectedColor = "#2dd4bf";
let unsubHabits = null, unsubCompletions = null, unsubReminders = null;
let weeklyChartInst = null, monthlyChartInst = null, catChartInst = null;

// ── CONSTANTS ────────────────────────────────────────────────
const EMOJIS = ["🏃","💪","🧘","📚","💧","🥗","😴","🎯","✍️","🎸","🧹","💊","🌿","🚴","🏊","🧠","☕","🍎","📝","💻"];
const COLORS  = ["#2dd4bf","#a78bfa","#f87171","#fbbf24","#4ade80","#60a5fa","#f472b6","#fb923c","#34d399","#818cf8","#e879f9","#facc15"];
const CAT_COLORS = {
  Health:"#4ade80", Fitness:"#f87171", Learning:"#60a5fa",
  Mindfulness:"#a78bfa", Productivity:"#2dd4bf", Social:"#f472b6",
  Finance:"#fbbf24", Creativity:"#fb923c"
};

// ── AUTH STATE ────────────────────────────────────────────────
onAuthChange(async (user) => {
  if (user) {
    currentUser = user;
    await saveUserProfile(user.uid, {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
      lastSeen: new Date().toISOString()
    });
    showApp();
    setupRealtimeListeners();
  } else {
    currentUser = null;
    teardownListeners();
    showAuth();
  }
});

// ── SIGN IN / OUT ─────────────────────────────────────────────
window.handleGoogleSignIn = async () => {
  const btn = document.getElementById("google-btn");
  btn.textContent = "Signing in…";
  btn.disabled = true;
  try {
    await signInWithGoogle();
  } catch (e) {
    btn.textContent = "Continue with Google";
    btn.disabled = false;
    showToast("Sign-in failed. Please try again.", "error");
  }
};

window.handleSignOut = async () => {
  teardownListeners();
  await signOutUser();
  closeUserMenu();
};

// ── REALTIME LISTENERS ────────────────────────────────────────
function setupRealtimeListeners() {
  const uid = currentUser.uid;
  const today = todayKey();

  unsubHabits = listenHabits(uid, (h) => {
    habits = h;
    refreshCurrentPage();
    updateDashboardStats();
  });

  unsubCompletions = listenCompletions(uid, today, (c) => {
    todayCompletions = c;
    refreshCurrentPage();
    updateDashboardStats();
  });

  unsubReminders = listenReminders(uid, (r) => {
    reminders = r;
    if (activePage() === "reminders") renderReminders();
  });
}

function teardownListeners() {
  [unsubHabits, unsubCompletions, unsubReminders].forEach((u) => u && u());
}

// ── SCREEN SWITCHING ──────────────────────────────────────────
function showAuth() {
  document.getElementById("auth-screen").classList.add("active");
  document.getElementById("app-screen").classList.remove("active");
}

function showApp() {
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");

  const u = currentUser;
  const initials = (u.displayName || u.email || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("avatar-btn").textContent = initials;
  document.getElementById("user-display").textContent = (u.displayName || u.email).split(" ")[0];
  document.getElementById("menu-name").textContent = u.displayName || "User";
  document.getElementById("menu-email").textContent = u.email;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting-text").textContent = `${greet}, ${(u.displayName || "there").split(" ")[0]} ✦`;

  if (u.photoURL) {
    document.getElementById("avatar-btn").style.backgroundImage = `url(${u.photoURL})`;
    document.getElementById("avatar-btn").style.backgroundSize = "cover";
    document.getElementById("avatar-btn").textContent = "";
  }

  showPage("dashboard");
}

// ── PAGE ROUTING ──────────────────────────────────────────────
window.showPage = (name, btn) => {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  else {
    const b = document.querySelector(`.nav-btn[data-page="${name}"]`);
    if (b) b.classList.add("active");
  }

  closeUserMenu();
  closeNotifPanel();

  if (name === "dashboard") { renderDashboard(); renderWeeklyChart(); }
  if (name === "habits")    renderHabitsPage();
  if (name === "stats")     renderStatsPage();
  if (name === "reminders") renderReminders();
};

function activePage() {
  const p = document.querySelector(".page.active");
  return p ? p.id.replace("page-", "") : "dashboard";
}

function refreshCurrentPage() {
  const page = activePage();
  if (page === "dashboard") renderDashboard();
  if (page === "habits")    renderHabitsPage();
  if (page === "stats")     renderStatsPage();
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const done  = habits.filter((h) => todayCompletions[h.id]).length;
  const total = habits.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("s-today").textContent = `${done}/${total}`;
  document.getElementById("s-pct").textContent   = `${pct}%`;

  const bestStreak = habits.length ? Math.max(...habits.map((h) => h.streak || 0)) : 0;
  document.getElementById("s-streak").textContent = bestStreak;
  document.getElementById("s-total").textContent  = total;

  document.getElementById("greeting-sub").textContent =
    `You have ${total - done} habit${total - done !== 1 ? "s" : ""} left today.`;

  // Today habits list
  const list = document.getElementById("today-habits-list");
  list.innerHTML = "";
  if (!habits.length) {
    list.innerHTML = `<div class="empty-state">No habits yet — <span class="link" onclick="showPage('habits')">add your first one →</span></div>`;
    return;
  }
  habits.forEach((h) => {
    const isDone = !!todayCompletions[h.id];
    list.innerHTML += habitRowHTML(h, isDone);
  });

  // Category breakdown
  const cats = {};
  habits.forEach((h) => { cats[h.cat] = (cats[h.cat] || 0) + 1; });
  const cb = document.getElementById("cat-breakdown");
  cb.innerHTML = "";
  Object.entries(cats).forEach(([cat, count]) => {
    const p = total ? Math.round((count / total) * 100) : 0;
    cb.innerHTML += `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
          <span style="color:var(--text2)">${cat}</span>
          <span style="color:var(--text3)">${count} habit${count > 1 ? "s" : ""}</span>
        </div>
        <div class="prog-bar-bg">
          <div class="prog-bar-fill" style="width:${p}%;background:${CAT_COLORS[cat] || "#2dd4bf"}"></div>
        </div>
      </div>`;
  });
}

function updateDashboardStats() {
  if (activePage() === "dashboard") renderDashboard();
}

function habitRowHTML(h, isDone) {
  return `
    <div class="habit-row${isDone ? " done" : ""}" id="row-${h.id}">
      <div class="habit-check${isDone ? " checked" : ""}" onclick="handleToggle('${h.id}')">
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <polyline points="1,4.5 4.5,8 11,1" stroke="#0d1f1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="habit-icon" style="background:${h.color}22">${h.icon}</div>
      <div class="habit-info">
        <div class="habit-name" style="${isDone ? "text-decoration:line-through;color:var(--text2)" : ""}">${h.name}</div>
        <div class="habit-meta">
          <span class="streak-badge">🔥 ${h.streak || 0}d</span>
          <span>${h.cat}</span>
          ${h.goal ? `<span>· ${h.goal}</span>` : ""}
        </div>
      </div>
      <div class="habit-progress">
        <div style="font-size:10px;color:var(--text3);margin-bottom:4px;text-align:right">${isDone ? 100 : 0}%</div>
        <div class="prog-bar-bg">
          <div class="prog-bar-fill" style="width:${isDone ? 100 : 0}%;background:${h.color}"></div>
        </div>
      </div>
    </div>`;
}

// ── TOGGLE COMPLETION ──────────────────────────────────────────
window.handleToggle = async (habitId) => {
  if (!currentUser) return;
  const isDone = !!todayCompletions[habitId];
  const newDone = !isDone;

  // Optimistic UI
  todayCompletions[habitId] = newDone;
  renderDashboard();

  try {
    await toggleCompletion(currentUser.uid, todayKey(), habitId, newDone);
    // Update streak
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      const newStreak = newDone ? (habit.streak || 0) + 1 : Math.max(0, (habit.streak || 0) - 1);
      await updateHabit(currentUser.uid, habitId, { streak: newStreak });
    }
  } catch (e) {
    // Rollback
    todayCompletions[habitId] = isDone;
    renderDashboard();
    showToast("Failed to save. Please retry.", "error");
  }
};

// ── WEEKLY CHART ──────────────────────────────────────────────
function renderWeeklyChart() {
  const ctx = document.getElementById("weeklyChart");
  if (!ctx) return;
  if (weeklyChartInst) { weeklyChartInst.destroy(); weeklyChartInst = null; }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = [72, 85, 60, 91, 78, 45, 88]; // replace with real aggregation
  weeklyChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{
        data,
        backgroundColor: data.map((v) => v >= 80 ? "#2dd4bf" : "#1a3d3a"),
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#55556a", font: { size: 11 } } },
        y: { grid: { color: "#1c1c22" }, ticks: { color: "#55556a", font: { size: 11 }, callback: (v) => v + "%" }, min: 0, max: 100 }
      }
    }
  });
}

// ── HABITS PAGE ───────────────────────────────────────────────
function renderHabitsPage() {
  const cats = ["all", ...new Set(habits.map((h) => h.cat))];
  const fb = document.getElementById("filter-bar");
  const active = fb.querySelector(".filter-chip.active")?.dataset.cat || "all";
  fb.innerHTML = "";
  cats.forEach((c) => {
    fb.innerHTML += `<div class="filter-chip${c === active ? " active" : ""}" data-cat="${c}" onclick="filterHabits(this,'${c}')">${c === "all" ? "All" : c}</div>`;
  });
  renderHabitsGrid(active);
}

window.filterHabits = (el, cat) => {
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  renderHabitsGrid(cat);
};

function renderHabitsGrid(cat) {
  const grid = document.getElementById("habits-grid");
  grid.innerHTML = "";
  const filtered = cat === "all" ? habits : habits.filter((h) => h.cat === cat);
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No habits in this category yet.</div>`;
    return;
  }
  filtered.forEach((h) => {
    const isDone = !!todayCompletions[h.id];
    grid.innerHTML += habitCardHTML(h, isDone);
  });
}

function habitCardHTML(h, isDone) {
  const weekDays = ["M","T","W","T","F","S","S"];
  const dots = weekDays.map((d, i) => {
    const done = i === 6 ? isDone : Math.random() > 0.4; // real data in production
    return `<div class="week-dot${done ? " done" : ""}${i === 6 ? " today" : ""}">${d}</div>`;
  }).join("");
  return `
    <div class="habit-card">
      <div class="hc-top">
        <div class="hc-icon" style="background:${h.color}22">${h.icon}</div>
        <div class="hc-actions">
          <div class="icon-btn" onclick="openEditModal('${h.id}')" title="Edit">✏️</div>
          <div class="icon-btn" onclick="confirmDeleteHabit('${h.id}')" title="Delete">✕</div>
        </div>
      </div>
      <div class="hc-name">${h.name}</div>
      <div class="hc-category" style="background:${h.color}22;color:${h.color}">${h.cat}</div>
      <div class="hc-streak">🔥 Streak: <span>${h.streak || 0} days</span></div>
      <div class="hc-week">${dots}</div>
    </div>`;
}

// ── HABIT MODAL ───────────────────────────────────────────────
window.openAddModal = () => {
  editingHabitId = null;
  document.getElementById("modal-title").textContent = "Add New Habit";
  document.getElementById("habit-name-input").value = "";
  document.getElementById("habit-goal-input").value = "";
  document.getElementById("habit-cat-input").value  = "Health";
  selectedEmoji = "🏃";
  selectedColor = COLORS[0];
  buildEmojiGrid();
  buildColorGrid();
  document.getElementById("habit-modal").classList.add("open");
};

window.openEditModal = (id) => {
  const h = habits.find((x) => x.id === id);
  if (!h) return;
  editingHabitId = id;
  document.getElementById("modal-title").textContent = "Edit Habit";
  document.getElementById("habit-name-input").value = h.name;
  document.getElementById("habit-goal-input").value = h.goal || "";
  document.getElementById("habit-cat-input").value  = h.cat;
  selectedEmoji = h.icon;
  selectedColor = h.color;
  buildEmojiGrid();
  buildColorGrid();
  document.getElementById("habit-modal").classList.add("open");
};

window.closeModal = () => document.getElementById("habit-modal").classList.remove("open");

window.saveHabit = async () => {
  const name = document.getElementById("habit-name-input").value.trim();
  if (!name) { showToast("Please enter a habit name.", "error"); return; }
  const data = {
    name,
    cat:   document.getElementById("habit-cat-input").value,
    goal:  document.getElementById("habit-goal-input").value.trim(),
    icon:  selectedEmoji,
    color: selectedColor
  };
  try {
    if (editingHabitId) {
      await updateHabit(currentUser.uid, editingHabitId, data);
      showToast("Habit updated!");
    } else {
      await addHabit(currentUser.uid, data);
      showToast("Habit added!");
    }
    closeModal();
  } catch (e) {
    showToast("Failed to save habit.", "error");
  }
};

window.confirmDeleteHabit = async (id) => {
  if (!confirm("Delete this habit? This cannot be undone.")) return;
  try {
    await deleteHabit(currentUser.uid, id);
    showToast("Habit deleted.");
  } catch (e) {
    showToast("Failed to delete habit.", "error");
  }
};

function buildEmojiGrid() {
  const grid = document.getElementById("emoji-grid");
  grid.innerHTML = "";
  EMOJIS.forEach((e) => {
    grid.innerHTML += `<div class="emoji-opt${e === selectedEmoji ? " sel" : ""}" onclick="selectEmoji(this,'${e}')">${e}</div>`;
  });
}
function buildColorGrid() {
  const grid = document.getElementById("color-grid");
  grid.innerHTML = "";
  COLORS.forEach((c) => {
    grid.innerHTML += `<div class="color-opt${c === selectedColor ? " sel" : ""}" style="background:${c}" onclick="selectColor(this,'${c}')"></div>`;
  });
}
window.selectEmoji = (el, e) => {
  selectedEmoji = e;
  document.querySelectorAll(".emoji-opt").forEach((x) => x.classList.remove("sel"));
  el.classList.add("sel");
};
window.selectColor = (el, c) => {
  selectedColor = c;
  document.querySelectorAll(".color-opt").forEach((x) => x.classList.remove("sel"));
  el.classList.add("sel");
};

// ── STATS PAGE ────────────────────────────────────────────────
function renderStatsPage() {
  setTimeout(() => {
    const ctx1 = document.getElementById("monthlyChart");
    const ctx2 = document.getElementById("catChart");
    if (!ctx1 || !ctx2) return;

    if (monthlyChartInst) { monthlyChartInst.destroy(); monthlyChartInst = null; }
    if (catChartInst)     { catChartInst.destroy();     catChartInst = null; }

    monthlyChartInst = new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        datasets: [{
          data: [55, 60, 72, 65, 80, 88, 75, 82, 90, 78, 85, 92],
          borderColor: "#2dd4bf",
          backgroundColor: "rgba(45,212,191,.1)",
          tension: 0.4, fill: true,
          pointBackgroundColor: "#2dd4bf", pointRadius: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#55556a", font: { size: 10 } } },
          y: { grid: { color: "#1c1c22" }, ticks: { color: "#55556a", font: { size: 10 }, callback: (v) => v + "%" }, min: 0, max: 100 }
        }
      }
    });

    const cats   = Object.keys(CAT_COLORS).filter((c) => habits.some((h) => h.cat === c));
    const counts = cats.map((c) => habits.filter((h) => h.cat === c).length);
    catChartInst = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: cats,
        datasets: [{ data: counts, backgroundColor: cats.map((c) => CAT_COLORS[c]), borderWidth: 0, hoverOffset: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "65%",
        plugins: { legend: { display: false } }
      }
    });

    // Heatmap
    const hm = document.getElementById("heatmap");
    hm.innerHTML = "";
    const container = document.createElement("div");
    container.style.cssText = "display:flex;gap:3px;flex-wrap:wrap";
    for (let w = 0; w < 12; w++) {
      const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:3px";
      for (let d = 0; d < 7; d++) {
        const cell = document.createElement("div");
        const r = Math.random();
        const lvl = r < 0.3 ? "" : r < 0.5 ? "l1" : r < 0.7 ? "l2" : r < 0.85 ? "l3" : "l4";
        cell.className = "heatmap-cell" + (lvl ? " " + lvl : "");
        col.appendChild(cell);
      }
      container.appendChild(col);
    }
    hm.appendChild(container);

    // Top streaks
    const ts = document.getElementById("top-streaks");
    ts.innerHTML = "";
    const sorted = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0));
    const max = sorted[0]?.streak || 1;
    sorted.forEach((h, i) => {
      const pct = Math.min(100, Math.round(((h.streak || 0) / max) * 100));
      ts.innerHTML += `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <span style="font-size:13px;color:var(--text3);width:16px">${i + 1}</span>
          <div style="width:28px;height:28px;border-radius:7px;background:${h.color}22;display:flex;align-items:center;justify-content:center;font-size:14px">${h.icon}</div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
              <span style="font-weight:500">${h.name}</span>
              <span style="color:var(--amber);font-weight:600">🔥 ${h.streak || 0}d</span>
            </div>
            <div class="prog-bar-bg"><div class="prog-bar-fill" style="width:${pct}%;background:${h.color}"></div></div>
          </div>
        </div>`;
    });
  }, 50);
}

// ── REMINDERS ────────────────────────────────────────────────
function renderReminders() {
  const list = document.getElementById("reminders-list");
  list.innerHTML = "";
  if (!reminders.length) {
    list.innerHTML = `<div class="empty-state">No reminders yet. Add one above.</div>`;
    return;
  }
  reminders.forEach((r) => {
    const h = habits.find((x) => x.id === r.habitId) || { name: "—", icon: "🔔" };
    list.innerHTML += `
      <div class="reminder-row">
        <span style="font-size:18px">${h.icon}</span>
        <div class="reminder-time">${r.time}</div>
        <div class="reminder-info">
          <div class="reminder-name">${h.name}</div>
          <div class="reminder-days">${(r.days || "").split(",").join(" · ")}</div>
        </div>
        <div class="toggle${r.enabled !== false ? " on" : ""}" onclick="handleReminderToggle('${r.id}', ${r.enabled !== false})"></div>
        <div class="icon-btn" onclick="handleDeleteReminder('${r.id}')" style="margin-left:8px;font-size:12px;color:var(--text3)">✕</div>
      </div>`;
  });
}

window.handleReminderToggle = async (id, isOn) => {
  await updateReminder(currentUser.uid, id, { enabled: !isOn });
};
window.handleDeleteReminder = async (id) => {
  await deleteReminder(currentUser.uid, id);
  showToast("Reminder removed.");
};

window.openReminderModal = () => {
  const sel = document.getElementById("rem-habit-input");
  sel.innerHTML = "";
  habits.forEach((h) => { sel.innerHTML += `<option value="${h.id}">${h.icon} ${h.name}</option>`; });
  document.querySelectorAll("#days-picker .week-dot").forEach((d) => d.classList.add("done"));
  document.getElementById("reminder-modal").classList.add("open");
};
window.closeReminderModal = () => document.getElementById("reminder-modal").classList.remove("open");

window.saveReminder = async () => {
  const time = document.getElementById("rem-time-input").value;
  const habitId = document.getElementById("rem-habit-input").value;
  const days = Array.from(document.querySelectorAll("#days-picker .week-dot"))
    .filter((d) => d.classList.contains("done"))
    .map((d) => d.dataset.day)
    .join(",");
  try {
    await addReminder(currentUser.uid, { time, habitId, days: days || "M,T,W,T,F", enabled: true });
    closeReminderModal();
    showToast("Reminder saved!");
  } catch (e) {
    showToast("Failed to save reminder.", "error");
  }
};

// Day picker in reminder modal
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#days-picker .week-dot").forEach((d) => {
    d.addEventListener("click", () => d.classList.toggle("done"));
  });
});

// ── NOTIFICATION PANEL & USER MENU ────────────────────────────
window.toggleNotifPanel = () => {
  document.getElementById("notif-panel").classList.toggle("open");
  document.getElementById("user-menu").classList.remove("open");
  document.getElementById("notif-dot").style.display = "none";
};
window.toggleUserMenu = () => {
  document.getElementById("user-menu").classList.toggle("open");
  document.getElementById("notif-panel").classList.remove("open");
};
function closeUserMenu()  { document.getElementById("user-menu").classList.remove("open"); }
function closeNotifPanel(){ document.getElementById("notif-panel").classList.remove("open"); }
window.clearNotifs = () => {
  document.getElementById("notif-list").innerHTML = `<div style="padding:16px;font-size:12px;color:var(--text3)">No new notifications.</div>`;
  document.getElementById("notif-panel").classList.remove("open");
};

document.addEventListener("click", (e) => {
  if (!e.target.closest(".notif-btn") && !e.target.closest("#notif-panel")) closeNotifPanel();
  if (!e.target.closest("#avatar-btn") && !e.target.closest("#user-menu")) closeUserMenu();
});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(() => t.classList.remove("show"), 3000);
}