/* =========================================================
   SKYLAB TECGESTOR — Main Application Logic
   Dashboard, search, notifications, shortcuts, FAB, auth
   ========================================================= */

// 🔥 FIREBASE: Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, serverTimestamp, Timestamp, getDocs, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Deixa o db e o auth globais para o resto do site conseguir usar depois se precisar
window.db = db;
window.auth = auth;

(() => {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const escHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (s) => (s == null ? '' : String(s)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const digits = (s) => (s == null ? '' : String(s)).replace(/\D/g, '');

  // ── SVG Icons (inline for zero dependencies) ──────────────
  const ICONS = {
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
    'shield-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    banknote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    'shopping-bag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
    'alert-triangle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    'x-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    'shield-alert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  };

  function icon(name, w = 20, h = 20) {
    return ICONS[name] ? ICONS[name].replace('viewBox', `width="${w}" height="${h}" viewBox`) : '';
  }

  // ── Default Shortcuts Configuration ────────────────────────
  const DEFAULT_CONFIG = {
    buttons: [
      { id: 'b1', label: 'Iniciar Reparo', icon: 'wrench', url: 'pages/technical-control.html', style: 'primary' },
      { id: 'b2', label: 'Painel de Estoque', icon: 'box', url: 'pages/inventory.html', style: 'secondary' }
    ],
    cards: [
      { id: 'c1', title: 'Reparos', desc: 'Controle total de entrada e saída.', icon: 'cpu', url: 'pages/technical-control.html', color: 'brand' },
      { id: 'c2', title: 'Caixa', desc: 'Gestão financeira e cobranças.', icon: 'wallet', url: 'pages/billing.html', color: 'emerald' },
      { id: 'c3', title: 'Peças', desc: 'Alertas de estoque baixo.', icon: 'layers', url: 'pages/inventory.html', color: 'purple' },
      { id: 'c4', title: 'Análises', desc: 'Crescimento da sua loja.', icon: 'activity', url: 'pages/analytics.html', color: 'orange' }
    ]
  };

  const AVAILABLE_PAGES = [
    { label: 'Análise detalhada', icon: 'activity', url: 'pages/analytics.html', color: 'orange' },
    { label: 'Minhas vendas', icon: 'shopping-bag', url: 'pages/my-sales.html', color: 'brand' },
    { label: 'Orçamentos', icon: 'file-text', url: 'pages/orcamentos.html', color: 'cyan' },
    { label: 'Controle Técnico', icon: 'wrench', url: 'pages/technical-control.html', color: 'brand' },
    { label: 'Iniciar Reparo', icon: 'wrench', url: 'pages/technical-control.html', color: 'brand' },
    { label: 'Reparos', icon: 'wrench', url: 'pages/technical-control.html', color: 'brand' },
    { label: 'Garantias', icon: 'shield-check', url: 'pages/warranty.html', color: 'cyan' },
    { label: 'Estoque de Peças', icon: 'box', url: 'pages/inventory.html', color: 'purple' },
    { label: 'Gestão de Cobranças', icon: 'banknote', url: 'pages/billing.html', color: 'emerald' },
    { label: 'Tabela de Preços', icon: 'tag', url: 'pages/price.html', color: 'amber' },
    { label: 'Histórico de Vendas', icon: 'history', url: 'pages/my-sales.html', color: 'brand' },
    { label: 'Películas compatíveis', icon: 'layers', url: 'pages/film.html', color: 'cyan' },
    { label: 'Sugerir uma ideia', icon: 'lightbulb', url: 'pages/suggestions.html', color: 'amber' },
    { label: 'Configurações', icon: 'settings', url: 'pages/settings.html', color: 'brand' }
  ];

  const COLOR_OPTIONS = ['brand', 'emerald', 'purple', 'orange', 'cyan', 'pink', 'red', 'amber'];
  const MAX_BUTTONS = 4;
  const MAX_CARDS = 8;
  const CACHE_KEY = 'skylab:home:shortcuts';
  const DISMISS_KEY = 'skylab:home:banner-dismiss';

  // ── State ──────────────────────────────────────────────────
  let currentConfig = clone(DEFAULT_CONFIG);
  let draftConfig = null;
  let expandedKey = null;
  let pickerKind = null;

  // ── Notification State ─────────────────────────────────────
  let systemNotifications = [];
  let adminNotifications = [];
  let activeNotifTab = 'sistema';
  const READ_KEY = 'skylab:read_notifs';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ══════════════════════════════════════════════════════════
  // 1. AUTH CHECK FIREBASE
  // ══════════════════════════════════════════════════════════

  // Ouve as mudanças de estado da conta. Redireciona se não estiver logado.
  onAuthStateChanged(auth, async (user) => {
    if (!user) { 
      window.location.href = "index.html"; 
      return; 
    }
    hideAuthOverlay();
    await initDashboard(user);
  });

  function hideAuthOverlay() {
    const overlay = $('#auth-guard');
    if (overlay) {
      overlay.classList.add('is-hidden');
      setTimeout(() => overlay.style.display = 'none', 500);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. NAVBAR
  // ══════════════════════════════════════════════════════════

  const nav = $('#nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  const navToggle = $('#navToggle');
  const navMobile = $('#navMobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  const menuBtn = $('#menu-btn');
  const dropdownMenu = $('#dropdown-menu');
  const notifBtn = $('#notif-btn');
  const notifPanel = $('#notif-panel');

  function closeAll() {
    dropdownMenu?.classList.remove('is-open');
    notifPanel?.classList.remove('is-open');
  }

  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = dropdownMenu.classList.contains('is-open');
    closeAll();
    if (!wasOpen) dropdownMenu.classList.add('is-open');
  });

  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = notifPanel.classList.contains('is-open');
    closeAll();
    if (!wasOpen) {
      notifPanel.classList.add('is-open');
      switchNotifTab('admin');
    }
  });

  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
      dropdownMenu.classList.remove('is-open');
    }
    if (notifPanel && !notifPanel.contains(e.target) && !notifBtn?.contains(e.target)) {
      notifPanel.classList.remove('is-open');
    }
  });

  const themeToggle = $('#theme-toggle');
  const iconMoon = $('#icon-moon');
  const iconSun = $('#icon-sun');

  function applyTheme(dark) {
    document.body.style.setProperty('--void', dark ? '#050810' : '#f0f4f8');
    document.body.style.setProperty('--void-card', dark ? '#0a0e1a' : '#ffffff');
    document.body.style.setProperty('--text-1', dark ? '#f3f7fc' : '#1a202c');
    document.body.style.setProperty('--text-2', dark ? '#93a4c2' : '#4a5568');
    document.body.style.setProperty('--text-3', dark ? '#5a6c8c' : '#718096');
    document.body.style.setProperty('--border', dark ? 'rgba(166,206,255,0.12)' : 'rgba(0,0,0,0.1)');
    document.body.style.setProperty('--glass-bg', dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.012))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))');
    document.body.style.background = dark ? '#050810' : '#f0f4f8';
    if (iconMoon && iconSun) {
      iconMoon.classList.toggle('hidden', !dark);
      iconSun.classList.toggle('hidden', dark);
    }
  }

  if (themeToggle) {
    const savedTheme = localStorage.getItem('skylab:theme') || 'dark';
    applyTheme(savedTheme === 'dark');
    themeToggle.addEventListener('click', () => {
      const isDark = localStorage.getItem('skylab:theme') !== 'light';
      localStorage.setItem('skylab:theme', isDark ? 'light' : 'dark');
      applyTheme(!isDark);
    });
  }

  // Logout com o Firebase
  $('#logout-btn')?.addEventListener('click', async () => {
    try {
      await signOut(auth);
      // Redirecionamento já é tratado pelo onAuthStateChanged acima
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  });

  $('#plan-banner-close')?.addEventListener('click', () => {
    $('#plan-banner')?.classList.add('is-hidden');
    setTimeout(() => $('#plan-banner')?.classList.add('hidden'), 400);
  });

  // ══════════════════════════════════════════════════════════
  // 3. NOTIFICATIONS
  // ══════════════════════════════════════════════════════════

  const NOTIF_TYPE_CONFIG = {
    info:     { cls: 'notif-item--info',     icon: 'info' },
    success:  { cls: 'notif-item--success',  icon: 'check-circle' },
    warning:  { cls: 'notif-item--warning',  icon: 'alert-triangle' },
    error:    { cls: 'notif-item--error',    icon: 'x-circle' },
    stock:    { cls: 'notif-item--stock',    icon: 'package' },
    warranty: { cls: 'notif-item--warranty', icon: 'shield-alert' },
    plan:     { cls: 'notif-item--error',    icon: 'clock' },
  };

  function getReadIds() {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
  }
  function saveReadIds(ids) {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return mins + ' min atrás';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h atrás';
    return Math.floor(hours / 24) + 'd atrás';
  }

  function switchNotifTab(tab) {
    activeNotifTab = tab;
    $$('.notif-panel__tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    renderNotifications();
  }

  $('#tab-admin')?.addEventListener('click', () => switchNotifTab('admin'));
  $('#tab-sistema')?.addEventListener('click', () => switchNotifTab('sistema'));
  $('#mark-all-read')?.addEventListener('click', () => {
    const current = activeNotifTab === 'sistema' ? systemNotifications : adminNotifications;
    const readIds = getReadIds();
    current.forEach(n => { if (!readIds.includes(n.id)) readIds.push(n.id); });
    saveReadIds(readIds);
    renderNotifications();
  });

  function renderNotifications() {
    const readIds = getReadIds();
    const unreadSystem = systemNotifications.filter(n => !readIds.includes(n.id)).length;
    const unreadAdmin = adminNotifications.filter(n => !readIds.includes(n.id)).length;
    const total = unreadSystem + unreadAdmin;

    const badge = $('#notif-badge');
    const count = $('#notif-count');
    const tabSysCount = $('#tab-sistema-count');
    const tabAdmCount = $('#tab-admin-count');
    const list = $('#notif-list');

    if (badge) badge.classList.toggle('hidden', total === 0);
    if (count) count.textContent = total;
    if (tabSysCount) tabSysCount.textContent = unreadSystem;
    if (tabAdmCount) tabAdmCount.textContent = unreadAdmin;

    const currentList = activeNotifTab === 'sistema' ? systemNotifications : adminNotifications;

    if (!list) return;
    if (currentList.length === 0) {
      list.innerHTML = '<p style="text-align:center;font-size:.82rem;color:var(--text-3);padding:40px 0;">Sem novidades no momento.</p>';
      return;
    }

    list.innerHTML = currentList.map(n => {
      const cfg = NOTIF_TYPE_CONFIG[n.type] || NOTIF_TYPE_CONFIG.info;
      const isRead = readIds.includes(n.id);
      return `<div class="notif-item ${cfg.cls} ${isRead ? 'is-read' : ''}" ${n.link ? `onclick="window.location.href='${escHtml(n.link)}'" style="cursor:pointer;"` : ''}>
        <div class="notif-item__head">
          <span class="notif-item__icon">${icon(cfg.icon, 18, 18)}</span>
          <div class="notif-item__body">
            <div class="notif-item__title">${escHtml(n.title)}</div>
            <div class="notif-item__message">${escHtml(n.message)}</div>
            <span class="notif-item__time">${timeAgo(n.timestamp)}</span>
          </div>
          ${!isRead ? `<button class="notif-item__dismiss" onclick="event.stopPropagation();window.__markOneRead('${n.id}')" title="Marcar como lida">${icon('check', 14, 14)}</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  window.__markOneRead = (nid) => {
    const readIds = getReadIds();
    if (!readIds.includes(nid)) readIds.push(nid);
    saveReadIds(readIds);
    renderNotifications();
  };

  systemNotifications = [
    { id: 'demo-1', type: 'success', title: 'Novo Serviço', message: 'João Silva - iPhone 14 Pro: Troca de tela', timestamp: Date.now() - 300000 },
    { id: 'demo-2', type: 'stock', title: 'Estoque Baixo', message: '3 itens precisam de reposição: Tela iPhone 13, Bateria Samsung S22...', timestamp: Date.now() - 600000 },
    { id: 'demo-3', type: 'warning', title: 'Garantia Expirando', message: 'Maria Oliveira - Galaxy S23: faltam 3 dias para expirar.', timestamp: Date.now() - 3600000 },
  ];
  adminNotifications = [
    { id: 'admin-1', type: 'info', title: 'Atualização do Sistema', message: 'Nova versão disponível com melhorias de performance e novos recursos.', timestamp: Date.now() - 7200000 },
  ];
  renderNotifications();

  // ══════════════════════════════════════════════════════════
  // 4. GLOBAL SEARCH
  // ══════════════════════════════════════════════════════════

  const searchInput = $('#global-search-input');
  const searchPanel = $('#global-search-panel');
  let searchDebounce;

  const demoSearchData = {
    services: [
      { id: 's1', osNumber: '001', client: 'João Silva', model: 'iPhone 14 Pro', serviceType: 'Troca de tela', status: 'Em andamento', imei: '123456789012345' },
      { id: 's2', osNumber: '002', client: 'Maria Oliveira', model: 'Galaxy S23', serviceType: 'Troca de bateria', status: 'Aguardando peça', imei: '987654321098765' },
      { id: 's3', osNumber: '003', client: 'Pedro Santos', model: 'Xiaomi 13', serviceType: 'Conector de carga', status: 'Concluído' },
    ],
    warranties: [
      { id: 'w1', client: 'Ana Costa', device: 'iPhone 13', osNumber: '097', type: 'Tela', endDate: '2026-07-15' },
    ],
    inventory: [
      { id: 'i1', name: 'Tela iPhone 13', category: 'Telas', quantity: 2, code: 'TL-IP13' },
      { id: 'i2', name: 'Bateria Samsung S22', category: 'Baterias', quantity: 0, code: 'BT-SS22' },
      { id: 'i3', name: 'Conector USB-C Universal', category: 'Conectores', quantity: 15, code: 'CN-USBC' },
    ],
    clients: [
      { id: 'cl1', name: 'João Silva', phone: '(11) 99999-0001', email: 'joao@email.com' },
      { id: 'cl2', name: 'Maria Oliveira', phone: '(11) 99999-0002', email: 'maria@email.com' },
      { id: 'cl3', name: 'Pedro Santos', phone: '(11) 99999-0003' },
    ]
  };

  function searchMatches(term, fields) {
    const n = norm(term);
    const d = digits(term);
    for (const f of fields) {
      if (norm(f).includes(n)) return true;
      if (d && digits(f).includes(d)) return true;
    }
    return false;
  }

  function highlight(text, term) {
    const safe = escHtml(text);
    if (!term) return safe;
    try {
      const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      return safe.replace(re, '<mark>$1</mark>');
    } catch { return safe; }
  }

  function renderSearch(term) {
    const t = term.trim();
    if (!t) { searchPanel.classList.remove('is-open'); return; }

    const data = demoSearchData; 
    const svcHits = data.services.filter(s => searchMatches(t, [s.client, s.model, s.osNumber, s.serviceType, s.imei, s.status])).slice(0, 6);
    const warHits = data.warranties.filter(w => searchMatches(t, [w.client, w.device, w.osNumber, w.type])).slice(0, 6);
    const invHits = data.inventory.filter(i => searchMatches(t, [i.name, i.category, i.code])).slice(0, 6);
    const cliHits = data.clients.filter(c => searchMatches(t, [c.name, c.phone, c.email])).slice(0, 6);

    const total = svcHits.length + warHits.length + invHits.length + cliHits.length;
    if (!total) {
      searchPanel.innerHTML = `<div style="padding:40px;text-align:center;font-size:.88rem;color:var(--text-3)">Nenhum resultado para "<span style="color:var(--text-1);font-weight:600;">${escHtml(t)}</span>"</div>`;
      searchPanel.classList.add('is-open');
      return;
    }

    let html = '';

    if (svcHits.length) {
      html += `<div class="search-panel__section-title" style="color:var(--blue-bright)">Ordens de Serviço · ${svcHits.length}</div>`;
      html += svcHits.map(s => `
        <div class="search-panel__item" onclick="window.location.href='pages/technical-control.html?id=${s.id}'">
          <div class="search-panel__item-icon" style="background:rgba(43,98,232,.12);color:var(--blue-bright)">${icon('wrench', 18, 18)}</div>
          <div style="flex:1;min-width:0">
            <div class="search-panel__item-title"><strong>#${highlight(s.osNumber, t)}</strong> ${highlight(s.client, t)}</div>
            <div class="search-panel__item-sub">${highlight(s.model, t)}${s.imei ? ' · <span class="mono">' + highlight(s.imei, t) + '</span>' : ''}</div>
          </div>
          ${s.status ? `<span class="search-panel__item-badge">${escHtml(s.status)}</span>` : ''}
        </div>`).join('');
    }

    if (cliHits.length) {
      html += `<div class="search-panel__section-title" style="color:var(--emerald)">Clientes · ${cliHits.length}</div>`;
      html += cliHits.map(c => `
        <div class="search-panel__item" onclick="window.location.href='pages/billing.html?client=${c.id}'">
          <div class="search-panel__item-icon" style="background:rgba(16,185,129,.12);color:var(--emerald)">${icon('user', 18, 18)}</div>
          <div style="flex:1;min-width:0">
            <div class="search-panel__item-title"><strong>${highlight(c.name, t)}</strong></div>
            <div class="search-panel__item-sub">${c.phone ? highlight(c.phone, t) : ''}${c.email ? ' · ' + highlight(c.email, t) : ''}</div>
          </div>
        </div>`).join('');
    }

    if (invHits.length) {
      html += `<div class="search-panel__section-title" style="color:var(--purple)">Estoque · ${invHits.length}</div>`;
      html += invHits.map(i => `
        <div class="search-panel__item" onclick="window.location.href='pages/inventory.html?item=${i.id}'">
          <div class="search-panel__item-icon" style="background:rgba(139,92,246,.12);color:var(--purple)">${icon('package', 18, 18)}</div>
          <div style="flex:1;min-width:0">
            <div class="search-panel__item-title"><strong>${highlight(i.name, t)}</strong></div>
            <div class="search-panel__item-sub">${i.code ? 'Cód ' + highlight(i.code, t) + ' · ' : ''}Qtd ${i.quantity}</div>
          </div>
          ${i.quantity <= 0 ? '<span class="search-panel__item-badge" style="background:rgba(239,68,68,.12);color:var(--red)">Sem estoque</span>' : ''}
        </div>`).join('');
    }

    if (warHits.length) {
      html += `<div class="search-panel__section-title" style="color:var(--orange)">Garantias · ${warHits.length}</div>`;
      html += warHits.map(w => `
        <div class="search-panel__item" onclick="window.location.href='pages/warranty.html?id=${w.id}'">
          <div class="search-panel__item-icon" style="background:rgba(249,115,22,.12);color:var(--orange)">${icon('shield-check', 18, 18)}</div>
          <div style="flex:1;min-width:0">
            <div class="search-panel__item-title"><strong>${highlight(w.client, t)}</strong>${w.osNumber ? ' <span style="color:var(--text-3)">#' + highlight(w.osNumber, t) + '</span>' : ''}</div>
            <div class="search-panel__item-sub">${highlight(w.device, t)}${w.type ? ' · ' + escHtml(w.type) : ''}</div>
          </div>
        </div>`).join('');
    }

    searchPanel.innerHTML = html;
    searchPanel.classList.add('is-open');
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => renderSearch(searchInput.value), 150);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { searchInput.value = ''; searchPanel.classList.remove('is-open'); searchInput.blur(); }
    });
  }

  document.addEventListener('click', (e) => {
    const wrap = $('#global-search-wrapper');
    if (wrap && !wrap.contains(e.target)) searchPanel?.classList.remove('is-open');
  });

  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if ((isMac ? e.metaKey : e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  });

  // ══════════════════════════════════════════════════════════
  // 5. SHORTCUTS (Buttons + Cards)
  // ══════════════════════════════════════════════════════════

  function loadConfig() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : clone(DEFAULT_CONFIG);
    } catch { return clone(DEFAULT_CONFIG); }
  }

  function saveConfig(cfg) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch {}
  }

  function sanitize(cfg) {
    const out = clone(DEFAULT_CONFIG);
    if (cfg && Array.isArray(cfg.buttons)) {
      out.buttons = cfg.buttons.slice(0, MAX_BUTTONS).map((b, i) => ({
        id: b.id || 'b' + (i + 1),
        label: String(b.label || '').slice(0, 40) || 'Botão',
        icon: String(b.icon || 'star').slice(0, 40),
        url: String(b.url || '#').slice(0, 200),
        style: b.style === 'secondary' ? 'secondary' : 'primary'
      }));
    }
    if (cfg && Array.isArray(cfg.cards)) {
      out.cards = cfg.cards.slice(0, MAX_CARDS).map((c, i) => ({
        id: c.id || 'c' + (i + 1),
        title: String(c.title || '').slice(0, 30) || 'Item',
        desc: String(c.desc || '').slice(0, 100),
        icon: String(c.icon || 'star').slice(0, 40),
        url: String(c.url || '#').slice(0, 200),
        color: COLOR_OPTIONS.includes(c.color) ? c.color : 'brand'
      }));
    }
    return out;
  }

  function renderShortcuts(cfg) {
    const btnWrap = $('#home-quick-actions');
    const gridWrap = $('#home-dashboard-grid');
    if (!btnWrap || !gridWrap) return;

    btnWrap.innerHTML = cfg.buttons.map(b => {
      const isPrimary = b.style === 'primary';
      return `<a href="${escHtml(b.url)}" class="btn ${isPrimary ? 'btn--primary' : 'btn--secondary'}" style="padding:16px 32px;font-size:1rem;">
        ${icon(b.icon, 20, 20)} ${escHtml(b.label)}
      </a>`;
    }).join('');

    gridWrap.innerHTML = cfg.cards.map(c => {
      return `<a href="${escHtml(c.url)}" class="card card--${c.color}" style="text-decoration:none;">
        <div class="card__ring"></div>
        <div class="card__icon">${icon(c.icon, 26, 26)}</div>
        <h3 class="card__title">${escHtml(c.title)}</h3>
        <p class="card__desc">${escHtml(c.desc)}</p>
      </a>`;
    }).join('');
  }

  // ══════════════════════════════════════════════════════════
  // 6. SHORTCUT EDITOR
  // ══════════════════════════════════════════════════════════

  function renderEditor(cfg) {
    const bWrap = $('#home-edit-buttons');
    const cWrap = $('#home-edit-cards');
    if (!bWrap || !cWrap) return;

    $('#home-edit-bcount').textContent = `(${cfg.buttons.length}/${MAX_BUTTONS})`;
    $('#home-edit-ccount').textContent = `(${cfg.cards.length}/${MAX_CARDS})`;

    bWrap.innerHTML = cfg.buttons.map((b, i) => editItemHTML('buttons', i, b)).join('')
      || '<p style="font-size:.78rem;color:var(--text-3);padding:12px;font-style:italic;">Nenhum botão. Clique em <strong>+ Adicionar</strong>.</p>';
    cWrap.innerHTML = cfg.cards.map((c, i) => editItemHTML('cards', i, c)).join('')
      || '<p style="font-size:.78rem;color:var(--text-3);padding:12px;font-style:italic;">Nenhum card. Clique em <strong>+ Adicionar</strong>.</p>';

    bindEditorEvents();
  }

  function editItemHTML(kind, idx, item) {
    const isExpanded = expandedKey === kind + ':' + idx;
    const title = kind === 'buttons' ? (item.label || 'Botão') : (item.title || 'Item');
    const sub = kind === 'buttons' ? (item.url || '') : (item.desc || item.url || '');
    const color = item.color || 'brand';

    let fields = '';
    if (isExpanded) {
      if (kind === 'buttons') {
        fields = `<div class="edit-item__body">
          <div class="edit-item__row">
            <div class="edit-item__field"><label>Texto</label><input data-field="label" value="${escHtml(item.label)}" maxlength="40" /></div>
            <div class="edit-item__field"><label>Estilo</label>
              <select data-field="style">
                <option value="primary" ${item.style === 'primary' ? 'selected' : ''}>Primário (destaque)</option>
                <option value="secondary" ${item.style === 'secondary' ? 'selected' : ''}>Secundário</option>
              </select>
            </div>
          </div>
        </div>`;
      } else {
        fields = `<div class="edit-item__body">
          <div class="edit-item__row">
            <div class="edit-item__field"><label>Título</label><input data-field="title" value="${escHtml(item.title)}" maxlength="30" /></div>
            <div class="edit-item__field"><label>Cor</label>
              <select data-field="color">${COLOR_OPTIONS.map(co => `<option value="${co}" ${color === co ? 'selected' : ''}>${co}</option>`).join('')}</select>
            </div>
          </div>
          <div class="edit-item__row edit-item__row--full">
            <div class="edit-item__field"><label>Descrição</label><input data-field="desc" value="${escHtml(item.desc || '')}" maxlength="100" /></div>
          </div>
        </div>`;
      }
    }

    return `<div class="edit-item ${isExpanded ? 'is-expanded' : ''}" data-kind="${kind}" data-idx="${idx}" draggable="true">
      <div class="edit-item__head">
        <span class="edit-item__handle" title="Arrastar">${icon('grip', 16, 16)}</span>
        <div class="edit-item__icon" style="background:rgba(43,98,232,.12);color:var(--blue-bright)">${icon(item.icon || 'star', 16, 16)}</div>
        <div class="edit-item__info">
          <div class="edit-item__name">${escHtml(title)}</div>
          <div class="edit-item__sub">${escHtml(sub)}</div>
        </div>
        <button class="edit-item__toggle" title="Editar">${isExpanded ? icon('chevronUp', 16, 16) : icon('pencil', 16, 16)}</button>
        <button class="edit-item__delete" title="Remover">${icon('trash', 16, 16)}</button>
      </div>
      ${fields}
    </div>`;
  }

  function bindEditorEvents() {
    $$('#home-edit-modal .edit-item').forEach(el => {
      const kind = el.dataset.kind;
      const idx = parseInt(el.dataset.idx, 10);
      const key = kind + ':' + idx;

      el.querySelector('.edit-item__head')?.addEventListener('click', (e) => {
        if (e.target.closest('.edit-item__delete') || e.target.closest('.edit-item__handle')) return;
        expandedKey = expandedKey === key ? null : key;
        renderEditor(draftConfig);
      });

      el.querySelector('.edit-item__delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        draftConfig[kind].splice(idx, 1);
        if (expandedKey === key) expandedKey = null;
        renderEditor(draftConfig);
      });

      el.querySelectorAll('[data-field]').forEach(input => {
        const update = () => { draftConfig[kind][idx][input.dataset.field] = input.value; };
        input.addEventListener('input', update);
        input.addEventListener('change', () => { update(); renderEditor(draftConfig); });
        input.addEventListener('click', e => e.stopPropagation());
      });

      el.addEventListener('dragstart', (e) => {
        el.style.opacity = '.4';
        e.dataTransfer.setData('text/plain', key);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', () => el.style.opacity = '');
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.style.borderColor = 'rgba(43,98,232,.5)';
      });
      el.addEventListener('dragleave', () => el.style.borderColor = '');
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.style.borderColor = '';
        const [srcKind, srcIdxStr] = (e.dataTransfer.getData('text/plain') || '').split(':');
        const srcIdx = parseInt(srcIdxStr, 10);
        if (srcKind !== kind || isNaN(srcIdx) || srcIdx === idx) return;
        const arr = draftConfig[kind];
        const [moved] = arr.splice(srcIdx, 1);
        arr.splice(idx, 0, moved);
        expandedKey = null;
        renderEditor(draftConfig);
      });
    });
  }

  function openPicker(kind) {
    const max = kind === 'buttons' ? MAX_BUTTONS : MAX_CARDS;
    if (draftConfig[kind].length >= max) {
      alert(`Limite máximo de ${max} ${kind === 'buttons' ? 'botões' : 'cards'} atingido.`);
      return;
    }
    pickerKind = kind;
    renderPicker('');
    const p = $('#home-picker');
    p.classList.add('is-open');
    const searchEl = $('#home-picker-search');
    searchEl.value = '';
    setTimeout(() => searchEl.focus(), 50);
  }

  function closePicker() {
    $('#home-picker')?.classList.remove('is-open');
  }

  function renderPicker(filter) {
    const list = $('#home-picker-list');
    const f = (filter || '').toLowerCase().trim();
    const items = AVAILABLE_PAGES.filter(p => !f || p.label.toLowerCase().includes(f) || p.url.toLowerCase().includes(f));

    list.innerHTML = items.map((p, i) => `
      <div class="picker-item" data-pick="${i}">
        <div class="picker-item__icon" style="background:rgba(43,98,232,.12);color:var(--blue-bright)">${icon(p.icon, 16, 16)}</div>
        <div style="flex:1;min-width:0;">
          <div class="picker-item__label">${escHtml(p.label)}</div>
          <div class="picker-item__url">${escHtml(p.url)}</div>
        </div>
      </div>
    `).join('') || '<p style="grid-column:1/-1;font-size:.82rem;color:var(--text-3);font-style:italic;padding:16px;">Nada encontrado.</p>';

    list.querySelectorAll('.picker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = items[parseInt(btn.dataset.pick, 10)];
        if (!page || !pickerKind) return;
        if (pickerKind === 'buttons') {
          draftConfig.buttons.push({
            id: 'b' + Date.now(),
            label: page.label, icon: page.icon, url: page.url,
            style: draftConfig.buttons.length === 0 ? 'primary' : 'secondary'
          });
        } else {
          draftConfig.cards.push({
            id: 'c' + Date.now(),
            title: page.label, desc: '', icon: page.icon, url: page.url, color: page.color || 'brand'
          });
        }
        closePicker();
        renderEditor(draftConfig);
      });
    });
  }

  function openEditModal() {
    draftConfig = clone(currentConfig);
    expandedKey = null;
    renderEditor(draftConfig);
    $('#home-edit-modal')?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    $('#home-edit-modal')?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  $('#home-edit-btn')?.addEventListener('click', openEditModal);
  $('#home-customize-open')?.addEventListener('click', openEditModal);
  $('#home-edit-close')?.addEventListener('click', closeEditModal);
  $('#home-edit-cancel')?.addEventListener('click', closeEditModal);
  $('#home-edit-reset')?.addEventListener('click', () => {
    if (confirm('Restaurar os atalhos padrão?')) {
      draftConfig = clone(DEFAULT_CONFIG);
      renderEditor(draftConfig);
    }
  });
  $('#home-edit-save')?.addEventListener('click', () => {
    currentConfig = sanitize(draftConfig);
    saveConfig(currentConfig);
    renderShortcuts(currentConfig);
    localStorage.setItem(DISMISS_KEY, '1');
    $('#home-customize-banner')?.classList.add('hidden');
    closeEditModal();
  });

  $('#home-add-button')?.addEventListener('click', () => openPicker('buttons'));
  $('#home-add-card')?.addEventListener('click', () => openPicker('cards'));
  $('#home-picker-close')?.addEventListener('click', closePicker);
  $('#home-picker')?.addEventListener('click', (e) => { if (e.target.id === 'home-picker') closePicker(); });
  $('#home-picker-search')?.addEventListener('input', (e) => renderPicker(e.target.value));

  $('#home-customize-dismiss')?.addEventListener('click', () => {
    localStorage.setItem(DISMISS_KEY, '1');
    $('#home-customize-banner')?.classList.add('hidden');
  });

  // ══════════════════════════════════════════════════════════
  // 7. FAB WHATSAPP
  // ══════════════════════════════════════════════════════════

  let fabOpen = false;
  const fabBtn = $('#fab-btn');
  const fabMenu = $('#fab-menu');
  const fabIconOpen = $('#fab-icon-open');
  const fabIconClose = $('#fab-icon-close');

  function toggleFab() {
    fabOpen = !fabOpen;
    fabMenu?.classList.toggle('is-open', fabOpen);
    fabBtn?.classList.toggle('is-open', fabOpen);
    fabIconOpen?.classList.toggle('hidden', fabOpen);
    fabIconClose?.classList.toggle('hidden', !fabOpen);
  }

  fabBtn?.addEventListener('click', toggleFab);
  document.addEventListener('click', (e) => {
    if (fabOpen && !$('#fab-container')?.contains(e.target)) toggleFab();
  });

  // ══════════════════════════════════════════════════════════
  // 8. ANNOUNCEMENT MODAL
  // ══════════════════════════════════════════════════════════

  function showAnnouncement(text, link, buttonText) {
    const overlay = $('#announcement-overlay');
    const textEl = $('#announcement-text');
    const linkEl = $('#announcement-link');
    const btnTextEl = $('#announcement-btn-text');

    if (!overlay || !textEl) return;
    textEl.textContent = text;

    if (link) {
      linkEl.href = link;
      linkEl.classList.remove('hidden');
      if (buttonText) btnTextEl.textContent = buttonText;
    } else {
      linkEl.classList.add('hidden');
    }

    overlay.classList.add('is-open');
  }

  $('#announcement-close')?.addEventListener('click', () => {
    $('#announcement-overlay')?.classList.remove('is-open');
  });
  $('#announcement-dismiss')?.addEventListener('click', () => {
    $('#announcement-overlay')?.classList.remove('is-open');
  });
  $('#announcement-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'announcement-overlay') {
      $('#announcement-overlay').classList.remove('is-open');
    }
  });

  // ══════════════════════════════════════════════════════════
  // 9. REVEAL ANIMATIONS
  // ══════════════════════════════════════════════════════════

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  // ══════════════════════════════════════════════════════════
  // 10. INITIALIZATION
  // ══════════════════════════════════════════════════════════

  async function initDashboard(user) {
    currentConfig = loadConfig();
    renderShortcuts(currentConfig);

    const editBtn = $('#home-edit-btn');
    if (editBtn) editBtn.classList.remove('hidden');

    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    const hasCustom = !!localStorage.getItem(CACHE_KEY);
    if (!dismissed && !hasCustom) {
      $('#home-customize-banner')?.classList.remove('hidden');
    }
  }

})();
