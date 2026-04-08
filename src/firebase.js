import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const u = result.user;
  const token = await u.getIdToken();
  await fetch("/api/credits", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action: "init" }),
  });
  return { uid: u.uid, name: u.displayName || "User", email: u.email, photoURL: u.photoURL };
}

export const logOut = () => signOut(auth);

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, (u) => {
    cb(u ? { uid: u.uid, name: u.displayName || "User", email: u.email, photoURL: u.photoURL } : null);
  });
}

export async function getIdToken() {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export function subscribeCredits(uid, cb) {
  return onSnapshot(doc(db, "credits", uid), (snap) => {
    if (snap.exists()) cb(snap.data());
    else cb(null);
  });
}

export async function serverCredits(action, extra = {}) {
  const token = await getIdToken();
  if (!token) return null;
  const res = await fetch("/api/credits", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json();
}
