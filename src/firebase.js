import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── SETUP ────────────────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com → create a project
// 2. Enable Firestore (Native mode) under Build → Firestore Database
// 3. Enable Google Authentication under Build → Authentication → Sign-in method
// 4. Register a Web App → copy config → paste below
// 5. Add Firestore rules:
//    match /users/{uid}/{document=**} { allow read, write: if request.auth.uid == uid; }
// ──────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyB42MkAwQA3ot3F3ZOIln8PonGipFTGfvs",
  authDomain: "personaldashboard-68424.firebaseapp.com",
  projectId: "personaldashboard-68424",
  storageBucket: "personaldashboard-68424.firebasestorage.app",
  messagingSenderId: "1041676756089",
  appId: "1:1041676756089:web:88a8c82d05610f668960a8"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)


