# Habitly ✦

> A dark, minimal daily habit tracker with real-time sync, Google authentication, streak tracking, progress charts, and reminders.

![Habitly Screenshot](https://via.placeholder.com/1200x600/0d0d0f/2dd4bf?text=Habitly+—+Daily+Habit+Tracker)

## 🌐 Live Demo
**[habitly.vercel.app](https://habitly-web.vercel.app/)**

---

## ✨ Features

- 🔐 **Google Authentication** — Sign in with your Google account via Firebase Auth
- ⚡ **Real-time Sync** — All data syncs instantly across devices via Firestore
- ✅ **Daily Check-ins** — Mark habits complete, streaks auto-increment
- 🔥 **Streak Tracking** — Visual streak counters per habit, best streak on dashboard
- 📊 **Progress Charts** — Weekly bar chart, monthly line chart, category donut (Chart.js)
- 🗓️ **Activity Heatmap** — 12-week GitHub-style completion heatmap
- 🏷️ **Categories & Tags** — Organize habits by Health, Fitness, Learning, and more
- 🔔 **Reminders** — Set time + day-of-week reminders per habit
- ➕ **Habit Manager** — Add, edit, delete habits with icon picker and color picker
- 📱 **Responsive** — Works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Authentication | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore (real-time) |
| Charts | Chart.js |
| Deployment | Vercel |

---

## 📁 Project Structure

```
habitly/
├── index.html              ← App shell (auth screen + all pages)
├── vercel.json             ← Vercel deployment config
├── firestore.rules         ← Firestore security rules
├── css/
│   └── style.css           ← All styles (dark theme, responsive)
└── js/
    ├── firebase-config.js  ← Firebase project credentials
    ├── auth.js             ← Google sign-in / sign-out / auth state
    ├── db.js               ← All Firestore CRUD operations
    └── app.js              ← UI logic, routing, rendering, charts
```

---

## 🚀 Getting Started

### Prerequisites
- A [Firebase](https://firebase.google.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- Git installed

### 1. Clone the repo

```bash
git clone https://github.com/Addyy-07/habitly.git
cd habitly
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create project**
2. **Authentication** → Sign-in method → Enable **Google**
3. **Firestore Database** → Create database → Production mode
4. Firestore → **Rules** tab → paste contents of `firestore.rules` → **Publish**
5. **Project Settings** → Your apps → click `</>` → Register web app
6. Copy the `firebaseConfig` object

### 3. Add your Firebase config

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### 4. Run locally

```bash
# Python (built-in)
python3 -m http.server 3000

# or Node
npx serve .
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** If using Brave browser, disable Shields for localhost as it blocks Firebase requests.

### 5. Deploy to Vercel

```bash
git add .
git commit -m "Add Firebase config"
git push origin main
```

Then go to [vercel.com](https://vercel.com) → **New Project** → import this repo → **Deploy**.

### 6. Authorize your domain

Firebase Console → Authentication → Settings → **Authorized domains** → add your `*.vercel.app` URL.

---

## 🔒 Security

Firestore rules ensure each user can only access their own data:

```js
match /users/{userId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
```

---

## 📸 Screenshots

| Dashboard | My Habits | Statistics |
|---|---|---|
| ![Dashboard](https://via.placeholder.com/380x220/141418/2dd4bf?text=Dashboard) | ![Habits](https://via.placeholder.com/380x220/141418/a78bfa?text=My+Habits) | ![Stats](https://via.placeholder.com/380x220/141418/f87171?text=Statistics) |

> Replace placeholder images with real screenshots after deployment.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

[MIT](LICENSE)

---

<div align="center">
  Made with ✦ by <a href="https://github.com/Addyy-07">Addy</a>
</div>

# Habitly — Daily Habit Tracker

A dark, minimal habit tracker with real-time sync, Google authentication, streaks, charts, categories, and reminders.

**Stack:** Vanilla JS (ES Modules) · Firebase Auth · Firestore · Chart.js · Deployed on Vercel

---

## Project Structure

```
habitly/
├── index.html            ← App shell (auth + all pages)
├── vercel.json           ← Vercel deployment config
├── firestore.rules       ← Firestore security rules
├── css/
│   └── style.css         ← All styles
└── js/
    ├── firebase-config.js  ← 🔑 Your Firebase credentials go here
    ├── auth.js             ← Google sign-in / sign-out / auth state
    ├── db.js               ← All Firestore CRUD operations
    └── app.js              ← UI logic, routing, rendering, charts
```

---

## Step 1 — Set Up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `habitly` → Continue
3. Disable Google Analytics (optional) → **Create project**

### Enable Google Authentication
4. In the left sidebar → **Authentication** → **Get started**
5. **Sign-in method** tab → click **Google** → Enable → Save

### Create Firestore Database
6. In the left sidebar → **Firestore Database** → **Create database**
7. Select **Start in production mode** → choose your region → **Done**
8. Go to the **Rules** tab → paste the contents of `firestore.rules` → **Publish**

### Get your Firebase config
9. In Firebase Console → **Project Settings** (gear icon) → **General**
10. Scroll to **Your apps** → click the **</>** (Web) icon
11. Name it `habitly-web` → click **Register app**
12. Copy the `firebaseConfig` object shown

### Paste config into the project
13. Open `js/firebase-config.js`
14. Replace all `"YOUR_..."` placeholder values with your actual values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "habitly-abc.firebaseapp.com",
  projectId:         "habitly-abc",
  storageBucket:     "habitly-abc.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

### Add your domain to Firebase Auth
15. Firebase Console → **Authentication** → **Settings** → **Authorised domains**
16. After you deploy to Vercel, add your `*.vercel.app` domain here

---

## Step 2 — Push to GitHub

```bash
# In the habitly/ folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/habitly.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New → Project**
3. Import your `habitly` repository
4. Leave all settings as default (Vercel auto-detects static site)
5. Click **Deploy**

Your app will be live at `https://habitly-xxx.vercel.app` in ~30 seconds.

---

## Step 4 — Add Vercel domain to Firebase Auth

1. Copy your `.vercel.app` URL
2. Firebase Console → **Authentication** → **Settings** → **Authorised domains**
3. Click **Add domain** → paste your URL → **Add**

Google sign-in will now work on your live site.

---

## Features

- **Real Google Sign-In** via Firebase Authentication
- **Real-time sync** — all data syncs live across devices via Firestore
- **Habit management** — add, edit, delete habits with icon + color picker
- **Daily check-ins** — tap to complete, streaks auto-increment
- **Progress charts** — weekly bar chart, monthly line chart, category donut
- **Activity heatmap** — 12-week completion overview
- **Categories & tags** — filter habits by category
- **Reminders** — set time + day-of-week reminders per habit
- **Notifications panel** — in-app notifications in the topbar
- **Responsive** — works on mobile and desktop

---

## Local Development

Since this is a pure static site with ES modules, you need a local server (browsers block ES module imports from `file://`):

```bash
# Option A — Python (built-in)
cd habitly
python3 -m http.server 3000

# Option B — Node (if installed)
npx serve .

# Then open http://localhost:3000
```

---

## Customisation

| What | Where |
|------|-------|
| Add more habit categories | `CAT_COLORS` object in `js/app.js` |
| Change accent colour | `--teal` variable in `css/style.css` |
| Add more emoji options | `EMOJIS` array in `js/app.js` |
| Add more chart colours | `COLORS` array in `js/app.js` |
| Change Firestore data structure | `js/db.js` |

---

Made with ✦ by Addy
