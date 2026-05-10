# Personal Dashboard — Setup Guide

## 1. Firebase (required — 5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (free Spark plan).
2. **Authentication** → Sign-in method → Enable **Google**.
3. **Firestore Database** → Create database → choose **Native mode** → pick a region close to you (e.g. `europe-west1`).
4. **Firestore** → Rules → paste this and publish:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Project Settings** (gear icon) → **Your apps** → Add a **Web** app → copy the config object.
6. Open `src/firebase.js` and replace the placeholder values with your config.

## 2. Run locally

```bash
cd /Users/sebastianfkolstad/DashBoardApp
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) — sign in with Google and you're in.

## 3. Whoop integration (optional)

1. Register at [developer.whoop.com](https://developer.whoop.com) and create an app.
2. Set **Redirect URI** to: `http://localhost:5173/whoop-callback` (and your deployed domain once live).
3. In the dashboard → Home tab → ⚙ Settings → paste your **Client ID** → Save & Connect.

## 4. Deploy (to use on phone + Mac)

### Option A — Netlify (easiest)
```bash
npm run build
# Drag the `dist/` folder to app.netlify.com/drop
```
Then add your Netlify URL to Firebase Authentication → Authorised domains.

### Option B — Vercel
```bash
npm install -g vercel
vercel --prod
```

### Option C — GitHub Pages
Push to GitHub, enable Pages from the `dist/` branch, set `base` in `vite.config.js` to your repo name.

## 5. Install as an app on your phone

Once deployed, open the URL in Safari (iOS) or Chrome (Android):
- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: menu → Install app / Add to Home Screen

## 6. Guardian API (optional, News tab)

Get a free key at [open-platform.theguardian.com](https://open-platform.theguardian.com/access/) — paste it in the News tab → Settings.

## Data sync

All data is stored in **Firestore** under your Google account. Sign in with the same Google account on any device and your data is instantly available.

Export JSON backups are available on every tab via the **Export** button.
