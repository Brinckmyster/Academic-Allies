/* ============================================================
   dark-mode.js — Academic Allies Dark Mode (User Setting)
   Created: 2026-03-09 by Claude
   Loaded from shared-header.html on every page.
   Saves preference to localStorage; syncs to Firestore when signed in.
   Toggle via header button or window.AA_toggleDarkMode().
   ============================================================ */
(function() {
  'use strict';

  var STORAGE_KEY = 'AA_DARK_MODE';
  var CLASS_NAME  = 'aa-dark';
  var _styleEl    = null;

  /* ── Dark mode CSS overrides ──────────────────────────── */
  var DARK_CSS = [
    /* --- Root variable overrides --- */
    'html.' + CLASS_NAME + ' {',
    '  --bg:      #121212;',
    '  --card:    #1e1e1e;',
    '  --border:  #3a3f40;',
    '  --text:    #e0e0e0;',
    '  --muted:   #a0a8a9;',
    '  --shadow:  0 2px 8px rgba(0,0,0,.3);',
    '  --teal:    #7db8bb;',
    '  --teal-dk: #9dd0d3;',
    '  color-scheme: dark;',
    '}',
    '',
    /* --- Body & page backgrounds --- */
    'html.' + CLASS_NAME + ' body {',
    '  background: #121212 !important;',
    '  color: #e0e0e0 !important;',
    '}',
    '',
    /* --- Header --- */
    'html.' + CLASS_NAME + ' .site-header {',
    '  background: #1a1a1a !important;',
    '  border-bottom-color: #333 !important;',
    '}',
    'html.' + CLASS_NAME + ' .tagline { color: #aaa !important; }',
    'html.' + CLASS_NAME + ' .nav-list a { color: #ccc !important; }',
    'html.' + CLASS_NAME + ' .nav-list a:hover { background-color: #2a2a2a !important; color: #fff !important; }',
    '',
    /* --- Cards, panels, frames --- */
    'html.' + CLASS_NAME + ' .module-card,',
    'html.' + CLASS_NAME + ' .flag-card,',
    'html.' + CLASS_NAME + ' .resource-link,',
    'html.' + CLASS_NAME + ' .msc-item,',
    'html.' + CLASS_NAME + ' .template-card,',
    'html.' + CLASS_NAME + ' .mode-tile,',
    'html.' + CLASS_NAME + ' .mode-config-card,',
    'html.' + CLASS_NAME + ' .letter-frame,',
    'html.' + CLASS_NAME + ' .gen-panel,',
    'html.' + CLASS_NAME + ' .invite-card,',
    'html.' + CLASS_NAME + ' .perm-toggle-panel {',
    '  background: #1e1e1e !important;',
    '  border-color: #3a3f40 !important;',
    '  color: #e0e0e0 !important;',
    '}',
    '',
    /* --- Generic white backgrounds (catch-all for inline bg:#fff) --- */
    'html.' + CLASS_NAME + ' [style*="background:#fff"],',
    'html.' + CLASS_NAME + ' [style*="background: #fff"],',
    'html.' + CLASS_NAME + ' [style*="background:#FFFFFF"],',
    'html.' + CLASS_NAME + ' [style*="background: #FFFFFF"],',
    'html.' + CLASS_NAME + ' [style*="background: white"],',
    'html.' + CLASS_NAME + ' [style*="background:white"] {',
    '  background: #1e1e1e !important;',
    '}',
    '',
    /* --- Hover states for cards --- */
    'html.' + CLASS_NAME + ' .module-card:hover,',
    'html.' + CLASS_NAME + ' .mode-tile:hover,',
    'html.' + CLASS_NAME + ' .template-card:hover {',
    '  background: #2a2a2a !important;',
    '  border-color: #7db8bb !important;',
    '}',
    'html.' + CLASS_NAME + ' .module-card:hover .module-name { color: #9dd0d3 !important; }',
    '',
    /* --- Text color overrides for hardcoded values --- */
    'html.' + CLASS_NAME + ' h1,',
    'html.' + CLASS_NAME + ' h2,',
    'html.' + CLASS_NAME + ' h3 {',
    '  color: #9dd0d3 !important;',
    '}',
    'html.' + CLASS_NAME + ' .module-name,',
    'html.' + CLASS_NAME + ' .mode-name,',
    'html.' + CLASS_NAME + ' .t-title,',
    'html.' + CLASS_NAME + ' .ic-title { color: #9dd0d3 !important; }',
    '',
    'html.' + CLASS_NAME + ' .section-label {',
    '  color: #7db8bb !important;',
    '  border-bottom-color: #2a3a3b !important;',
    '}',
    '',
    'html.' + CLASS_NAME + ' p,',
    'html.' + CLASS_NAME + ' span,',
    'html.' + CLASS_NAME + ' label,',
    'html.' + CLASS_NAME + ' li { color: #d0d0d0; }',
    '',
    'html.' + CLASS_NAME + ' .subtitle,',
    'html.' + CLASS_NAME + ' .hint,',
    'html.' + CLASS_NAME + ' .mode-desc,',
    'html.' + CLASS_NAME + ' .t-desc,',
    'html.' + CLASS_NAME + ' .ic-subtitle,',
    'html.' + CLASS_NAME + ' .mode-config-desc { color: #999 !important; }',
    '',
    /* --- Links --- */
    'html.' + CLASS_NAME + ' a { color: #7db8bb; }',
    'html.' + CLASS_NAME + ' a:visited { color: #9da8bb; }',
    'html.' + CLASS_NAME + ' a:hover { color: #a0d8db; }',
    '',
    /* --- Hero section --- */
    'html.' + CLASS_NAME + ' .hero {',
    '  background: linear-gradient(135deg, #2a5a5c 0%, #1a3a3c 100%) !important;',
    '}',
    'html.' + CLASS_NAME + ' .status-pill {',
    '  background: rgba(255,255,255,0.1) !important;',
    '  border-color: rgba(255,255,255,0.2) !important;',
    '}',
    'html.' + CLASS_NAME + ' .checkin-prompt {',
    '  background: rgba(255,255,255,0.08) !important;',
    '  border-color: rgba(255,255,255,0.15) !important;',
    '}',
    'html.' + CLASS_NAME + ' .checkin-prompt a {',
    '  background: #1e1e1e !important;',
    '  color: #7db8bb !important;',
    '}',
    '',
    /* --- Inputs, textareas, selects --- */
    'html.' + CLASS_NAME + ' input,',
    'html.' + CLASS_NAME + ' textarea,',
    'html.' + CLASS_NAME + ' select {',
    '  background: #252525 !important;',
    '  color: #e0e0e0 !important;',
    '  border-color: #4a4f50 !important;',
    '}',
    'html.' + CLASS_NAME + ' input::placeholder,',
    'html.' + CLASS_NAME + ' textarea::placeholder { color: #777 !important; }',
    'html.' + CLASS_NAME + ' .fill-in {',
    '  background: #252525 !important;',
    '  border-bottom-color: #7db8bb !important;',
    '  color: #9dd0d3 !important;',
    '}',
    '',
    /* --- Buttons --- */
    'html.' + CLASS_NAME + ' button:not(#aa-migraine-btn):not(.nope-big-btn):not(#aa-signin-btn):not(.btn-mode-save):not(.btn-generate):not(.btn-print) {',
    '  background: #2a2a2a !important;',
    '  color: #ccc !important;',
    '  border-color: #4a4f50 !important;',
    '}',
    'html.' + CLASS_NAME + ' #signOutButton { background: #8b2020 !important; color: #fff !important; }',
    '',
    /* --- Footer --- */
    'html.' + CLASS_NAME + ' .site-footer,',
    'html.' + CLASS_NAME + ' #aa-credit-footer {',
    '  background: rgba(18,18,18,0.95) !important;',
    '  border-top-color: #333 !important;',
    '  color: #888 !important;',
    '}',
    'html.' + CLASS_NAME + ' .footer-content { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .footer-content a { color: #7db8bb !important; }',
    '',
    /* --- NOPE banner --- */
    'html.' + CLASS_NAME + ' .nope-banner {',
    '  background: #0d0101 !important;',
    '  border-color: #5a0000 !important;',
    '}',
    '',
    /* --- Status flag colors (keep bright on dark bg) --- */
    'html.' + CLASS_NAME + ' .flag-card.green  { border-left-color: #28a745 !important; background: #1a2a1a !important; }',
    'html.' + CLASS_NAME + ' .flag-card.yellow { border-left-color: #ffc107 !important; background: #2a2a1a !important; }',
    'html.' + CLASS_NAME + ' .flag-card.red    { border-left-color: #dc3545 !important; background: #2a1a1a !important; }',
    'html.' + CLASS_NAME + ' .flag-label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .flag-value { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .flag-sub   { color: #777 !important; }',
    '',
    /* --- Invite card specifics --- */
    'html.' + CLASS_NAME + ' .ic-code-box {',
    '  background: #1a2a2b !important;',
    '  border-color: #7db8bb !important;',
    '}',
    'html.' + CLASS_NAME + ' .ic-code { color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' .ic-instructions {',
    '  background: #1a1a1a !important;',
    '  border-color: #333 !important;',
    '}',
    '',
    /* --- Toggle switches (modes, permissions) --- */
    'html.' + CLASS_NAME + ' .feat-slider,',
    'html.' + CLASS_NAME + ' .perm-slider { background: #555 !important; }',
    '',
    /* --- Mode config panel body --- */
    'html.' + CLASS_NAME + ' .mode-config-body { border-top-color: #333 !important; }',
    '',
    /* --- Welcome-back banner --- */
    'html.' + CLASS_NAME + ' #aa-welcome-back {',
    '  background: #1a2a2b !important;',
    '  border-color: #3a5a5b !important;',
    '  color: #9dd0d3 !important;',
    '}',
    '',
    /* --- Status circle banner --- */
    'html.' + CLASS_NAME + ' #sc-banner {',
    '  background: rgba(18,18,18,0.92) !important;',
    '  border-color: #333 !important;',
    '  color: #aaa !important;',
    '}',
    '',
    /* --- Scrollbar (WebKit) --- */
    'html.' + CLASS_NAME + ' ::-webkit-scrollbar { width: 8px; }',
    'html.' + CLASS_NAME + ' ::-webkit-scrollbar-track { background: #1a1a1a; }',
    'html.' + CLASS_NAME + ' ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }',
    '',
    /* --- Print: always light --- */
    '@media print { html.' + CLASS_NAME + ' { filter: none !important; } }',
    '@media print { html.' + CLASS_NAME + ' body { background: #fff !important; color: #000 !important; } }'
  ].join('\n');

  /* ── Inject/remove the dark mode stylesheet ── */
  function applyDark(on) {
    if (on && !_styleEl) {
      _styleEl = document.createElement('style');
      _styleEl.id = 'aa-dark-mode-css';
      _styleEl.textContent = DARK_CSS;
      document.head.appendChild(_styleEl);
      document.documentElement.classList.add(CLASS_NAME);
    } else if (!on && _styleEl) {
      _styleEl.remove();
      _styleEl = null;
      document.documentElement.classList.remove(CLASS_NAME);
    }
  }

  /* ── Read saved preference ── */
  function isDarkSaved() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /* ── Toggle ── */
  function toggle() {
    var nowDark = !document.documentElement.classList.contains(CLASS_NAME);
    applyDark(nowDark);
    localStorage.setItem(STORAGE_KEY, nowDark ? 'true' : 'false');
    updateButton(nowDark);
    syncToFirestore(nowDark);
    return nowDark;
  }

  /* ── Update the header button label ── */
  function updateButton(isDark) {
    var btn = document.getElementById('aa-dark-mode-btn');
    if (!btn) return;
    btn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  /* ── Sync preference to Firestore (if signed in) ── */
  function syncToFirestore(isDark) {
    try {
      if (!window.AA || !window.AA.auth || !window.AA.auth.currentUser) return;
      var uid = window.AA.auth.currentUser.uid;
      window.AA.db.collection('users').doc(uid).update({
        darkMode: isDark
      }).catch(function() { /* silent — localStorage is the primary store */ });
    } catch(e) {}
  }

  /* ── Load preference from Firestore on sign-in ── */
  function loadFromFirestore() {
    try {
      if (!window.AA || !window.AA.auth || !window.AA.auth.currentUser) return;
      var uid = window.AA.auth.currentUser.uid;
      window.AA.db.collection('users').doc(uid).get().then(function(doc) {
        if (!doc.exists) return;
        var data = doc.data();
        if (data.darkMode !== undefined) {
          var localPref = localStorage.getItem(STORAGE_KEY);
          /* Firestore wins on first load (no local pref set yet),
             otherwise localStorage is source of truth */
          if (localPref === null) {
            localStorage.setItem(STORAGE_KEY, data.darkMode ? 'true' : 'false');
            applyDark(data.darkMode);
            updateButton(data.darkMode);
          }
        }
      }).catch(function() {});
    } catch(e) {}
  }

  /* ── Apply immediately on page load (before paint if possible) ── */
  var saved = isDarkSaved();
  if (saved) applyDark(true);

  /* Claude: 2026-03-14 — remove early FOUC-prevention style now that full CSS is loaded */
  var _earlyStyle = document.getElementById('aa-dark-early');
  if (_earlyStyle) _earlyStyle.remove();

  /* ── Public API ── */
  window.AA_toggleDarkMode = toggle;
  window.AA_isDarkMode = function() {
    return document.documentElement.classList.contains(CLASS_NAME);
  };

  /* ── Once header is loaded, update button state ── */
  var _btnPoll = setInterval(function() {
    var btn = document.getElementById('aa-dark-mode-btn');
    if (btn) {
      clearInterval(_btnPoll);
      updateButton(isDarkSaved());
    }
  }, 200);
  setTimeout(function() { clearInterval(_btnPoll); }, 10000);

  /* ── Listen for auth to sync Firestore preference ── */
  var _authPoll = setInterval(function() {
    if (window.AA && window.AA.auth) {
      clearInterval(_authPoll);
      window.AA.auth.onAuthStateChanged(function(user) {
        if (user) loadFromFirestore();
      });
    }
  }, 300);
  setTimeout(function() { clearInterval(_authPoll); }, 15000);

})();
