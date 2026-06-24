/* =========================================================
   SKYLAB TECGESTOR — Page Initializer (Secondary Pages)
   Shared script for nav, auth guard, and base Firestore ops.
   ========================================================= */

import {
  auth, db,
  requireAuth, signOut,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, where,
  getDocs, addDoc, serverTimestamp, Timestamp
} from '../firebase-config.js';

// ── Auth Guard ───────────────────────────────────────────
let currentUser = null;

requireAuth(async (user) => {
  currentUser = user;

  // Load store name for branding
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'settings', 'general'));
    if (snap.exists() && snap.data().storeName) {
      const brandText = document.querySelector('.nav__brand-text');
      if (brandText) {
        const sub = document.createElement('span');
        sub.className = 'nav__brand-sub';
        sub.textContent = snap.data().storeName;
        brandText.parentElement?.appendChild(sub);
      }
    }
  } catch (e) { /* silent */ }

  // Fire custom event so page-specific code can initialize
  window.dispatchEvent(new CustomEvent('skylab:ready', { detail: { user, db } }));
});

// ── Nav Scroll ───────────────────────────────────────────
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true });
}

// ── Mobile Toggle ────────────────────────────────────────
const toggle = document.getElementById('navToggle');
const mobile = document.getElementById('navMobile');
if (toggle && mobile) {
  toggle.addEventListener('click', () => {
    mobile.classList.toggle('is-open');
    toggle.classList.toggle('is-active');
  });
}

// ── Reveal Animations ────────────────────────────────────
const obs = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
}), { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Exports for page-specific scripts ────────────────────
export {
  auth, db, currentUser,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, where,
  getDocs, addDoc, serverTimestamp, Timestamp, signOut
};
