/* =========================================================
   SKYLAB TECGESTOR — Firebase Configuration (Shared Module)
   Importado por todas as páginas do sistema.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
         updateProfile }
  from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
         collection, onSnapshot, query, orderBy, limit, where,
         getDocs, addDoc, serverTimestamp, Timestamp, arrayUnion, arrayRemove,
         writeBatch }
  from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ── Firebase Config ──────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAUaqWg7DPdHgRQh_6WhUayl8t8bLYI4og",
  authDomain: "tecgestor-skylab.firebaseapp.com",
  projectId: "tecgestor-skylab",
  storageBucket: "tecgestor-skylab.firebasestorage.app",
  messagingSenderId: "512077747740",
  appId: "1:512077747740:web:80bbef846cb4395f9ab1d9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth Helper ──────────────────────────────────────────
function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
      return;
    }
    callback(user);
  });
}

// ── Error Messages ───────────────────────────────────────
function getAuthErrorMessage(code) {
  const msgs = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Conta desabilitada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  };
  return msgs[code] || 'Erro ao autenticar. Tente novamente.';
}

// ── Ensure User Doc ──────────────────────────────────────
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      isOnline: true,
      lastActive: serverTimestamp()
    });
  } else {
    await updateDoc(ref, {
      isOnline: true,
      lastActive: serverTimestamp()
    });
  }
}

// ── Exports ──────────────────────────────────────────────
export {
  app, auth, db, googleProvider,
  onAuthStateChanged, signOut, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, updateProfile,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, where,
  getDocs, addDoc, serverTimestamp, Timestamp, arrayUnion, arrayRemove,
  writeBatch,
  requireAuth, getAuthErrorMessage, ensureUserDoc, GoogleAuthProvider
};
