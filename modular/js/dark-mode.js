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
    /* Claude: 2026-03-16 — footer inner wrapper + links */
    'html.' + CLASS_NAME + ' .site-footer-inner { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .site-footer-inner a { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .site-footer a { color: #7db8bb !important; }',
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
    /* --- Claude: 2026-03-14 — Audio Notes dark overrides --- */
    'html.' + CLASS_NAME + ' #recordBtn { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' #noteTitleInput { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #liveTranscript { background: #1e1e1e !important; color: #d0d0d0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .modal { background: #1e1e1e !important; color: #e0e0e0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .note-card { background: #1e1e1e !important; color: #e0e0e0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .note-title { color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' .cat-btn { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .cat-btn.selected { background: #1a3a3c !important; border-color: #7db8bb !important; color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' .cat-ideas { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .filter-bar select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #draftActions button { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Calendar dark overrides --- */
    'html.' + CLASS_NAME + ' .cal-btn { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .cal-btn.today-btn { background: #4a7f82 !important; color: #fff !important; }',
    'html.' + CLASS_NAME + ' .cal-grid { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .cal-dow { background: #252525 !important; color: #999 !important; border-bottom-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .cal-day { border-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .cal-day:hover { background: #2a3a3b !important; }',
    'html.' + CLASS_NAME + ' .cal-day.other-month { background: #181818 !important; }',
    'html.' + CLASS_NAME + ' .cal-day.other-month .day-num { color: #555 !important; }',
    'html.' + CLASS_NAME + ' #detail-panel { background: #1e1e1e !important; color: #e0e0e0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .detail-entry { background: #252525 !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .gcal-connect-bar { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .btn-gcal { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Check-In dark overrides --- */
    'html.' + CLASS_NAME + ' .gw-btn { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .gw-btn.sel-yes { background: #1a3a1a !important; border-color: #28a745 !important; }',
    'html.' + CLASS_NAME + ' .gw-btn.sel-no { background: #3a2a1a !important; border-color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .emoji-btn { background: #2a2a2a !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .emoji-btn.sel-g { background: #1a2a1a !important; border-color: #28a745 !important; }',
    'html.' + CLASS_NAME + ' .emoji-btn.sel-y { background: #2a2a1a !important; border-color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .emoji-btn.sel-o { background: #2a1a0a !important; border-color: #fd7e14 !important; }',
    'html.' + CLASS_NAME + ' .emoji-btn.sel-r { background: #2a1a1a !important; border-color: #dc3545 !important; }',
    'html.' + CLASS_NAME + ' .final-note-input { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #flag-bar { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' #flag-bar.flag-y { background: #2a2a1a !important; }',
    'html.' + CLASS_NAME + ' #flag-bar.flag-o { background: #2a1a0a !important; }',
    'html.' + CLASS_NAME + ' #flag-bar.flag-r { background: #2a1a1a !important; }',
    '',
    /* --- Claude: 2026-03-14 — Check-In Log dark overrides --- */
    'html.' + CLASS_NAME + ' { --card: #1e1e1e; }',
    'html.' + CLASS_NAME + ' .day-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .cat-pill { background: #1a2a2b !important; color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' .entry-note { background: #252525 !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .thumping-badge { background: #2a1a0a !important; color: #fd7e14 !important; }',
    'html.' + CLASS_NAME + ' .emergency-badge { background: #2a1a1a !important; color: #dc3545 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Message System dark overrides --- */
    'html.' + CLASS_NAME + ' .msg-layout { background: #1e1e1e !important; border-color: #3a3f40 !important; box-shadow: 0 2px 12px rgba(0,0,0,.3) !important; }',
    'html.' + CLASS_NAME + ' .contacts-panel { background: #181818 !important; border-right-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .contacts-header { color: #7db8bb !important; border-bottom-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .contact-item { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .contact-item:hover { background: #2a3a3b !important; }',
    'html.' + CLASS_NAME + ' .contact-item.active { background: #1a3a3c !important; border-left-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .contact-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .contact-avatar { border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .online-dot { border-color: #181818 !important; }',
    'html.' + CLASS_NAME + ' .thread-header { background: #1e1e1e !important; border-bottom-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .thread-header-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .thread-header-tier { color: #999 !important; }',
    'html.' + CLASS_NAME + ' #thread-placeholder { color: #666 !important; }',
    'html.' + CLASS_NAME + ' .msg-bubble.theirs { background: #2a2a2a !important; color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .compose-area { background: #1e1e1e !important; border-top-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .compose-area textarea { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #msg-tabs { background: #181818 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .msg-tab { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .msg-tab:hover { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .msg-tab.active { color: #7db8bb !important; border-bottom-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .nc-group-icon { background: #1a3a3c !important; border-color: #3a5a5b !important; }',
    'html.' + CLASS_NAME + ' #nc-student-picker-wrap { background: #1a2a2b !important; border-bottom-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' #nc-student-select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #markAllReadBtn { color: #7db8bb !important; }',
    '',
    /* --- Claude: 2026-03-14 — Broad catch-all for remaining white bg widgets --- */
    'html.' + CLASS_NAME + ' .container,',
    'html.' + CLASS_NAME + ' .wrapper,',
    'html.' + CLASS_NAME + ' .panel,',
    'html.' + CLASS_NAME + ' .card,',
    'html.' + CLASS_NAME + ' .box,',
    'html.' + CLASS_NAME + ' .section,',
    'html.' + CLASS_NAME + ' .form-card,',
    'html.' + CLASS_NAME + ' .edit-card,',
    'html.' + CLASS_NAME + ' .content-panel,',
    'html.' + CLASS_NAME + ' .main-content,',
    'html.' + CLASS_NAME + ' .inner-wrap,',
    'html.' + CLASS_NAME + ' details,',
    'html.' + CLASS_NAME + ' summary {',
    '  color: #e0e0e0;',
    '}',
    '',
    /* --- Broad: any remaining white bg on common patterns --- */
    'html.' + CLASS_NAME + ' .card,',
    'html.' + CLASS_NAME + ' .edit-card,',
    'html.' + CLASS_NAME + ' .form-card,',
    'html.' + CLASS_NAME + ' .contact-card {',
    '  background: #1e1e1e !important;',
    '  border-color: #3a3f40 !important;',
    '}',
    '',
    /* --- Settings page --- */
    'html.' + CLASS_NAME + ' .settings-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .settings-section h2 { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .settings-section .sec-desc { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .setting-row { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .setting-label { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .setting-hint { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .setting-input { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .toggle-slider { background: #555 !important; }',
    'html.' + CLASS_NAME + ' .checkbox-group label { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .account-avatar { border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .account-email { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .settings-subtitle { color: #888 !important; }',
    '',
    /* --- Accommodations page --- */
    'html.' + CLASS_NAME + ' .acc-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .acc-section li { color: #d0d0d0 !important; }',
    '',
    /* --- Bedroom planner --- */
    'html.' + CLASS_NAME + ' .bp-canvas-wrap { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .bp-sidebar { background: #181818 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .bp-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .chip { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Spoon planner / SpoonPal --- */
    'html.' + CLASS_NAME + ' .task-item { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .task-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .drag-handle { color: #666 !important; }',
    'html.' + CLASS_NAME + ' .sp-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .spoon-display { color: #9dd0d3 !important; }',
    '',
    /* --- Emergency contacts --- */
    'html.' + CLASS_NAME + ' .contact-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .contact-name { color: #e0e0e0 !important; }',
    '',
    /* --- Modes page tiles --- */
    'html.' + CLASS_NAME + ' .mode-tile img { filter: brightness(0.85); }',
    '',
    /* --- Templates page --- */
    'html.' + CLASS_NAME + ' .template-preview { background: #1e1e1e !important; border-color: #3a3f40 !important; color: #d0d0d0 !important; }',
    '',
    /* --- Admin page --- */
    'html.' + CLASS_NAME + ' .admin-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .user-row { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .user-row:hover { background: #2a3a3b !important; }',
    '',
    /* --- Support dashboard --- */
    'html.' + CLASS_NAME + ' .dash-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .dash-action-btn { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .dash-action-btn:hover { background: #2a3a3b !important; border-color: #7db8bb !important; }',
    '',
    /* --- Audit log --- */
    'html.' + CLASS_NAME + ' .audit-table-wrap { background: #1e1e1e !important; border-color: #3a3f40 !important; box-shadow: 0 1px 3px rgba(0,0,0,.3) !important; }',
    'html.' + CLASS_NAME + ' .audit-entry { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .audit-entry:nth-child(even) { background: #1a1a1a !important; }',
    'html.' + CLASS_NAME + ' .filter-wrap select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .filter-wrap label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .entry-count { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .timestamp-col { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .who-col { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' tr:hover { background: #252525 !important; }',
    'html.' + CLASS_NAME + ' #loading { color: #777 !important; }',
    'html.' + CLASS_NAME + ' #no-logs { color: #777 !important; }',
    '',
    /* --- Resources page --- */
    'html.' + CLASS_NAME + ' .res-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .search-input { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — User Tiers / My Support Network dark overrides --- */
    'html.' + CLASS_NAME + ' .network-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .network-card.owner-card { border-color: #4a7f82 !important; background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .network-card.nl-self-card { border-color: #2d6a4f !important; background: #1a2a1a !important; }',
    'html.' + CLASS_NAME + ' .card-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .card-email { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .card-desc { color: #777 !important; }',
    'html.' + CLASS_NAME + ' .tier-select-sm { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .btn-remove { background: #2a1a1a !important; color: #e06060 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .btn-remove:hover { background: #3a1a1a !important; }',
    'html.' + CLASS_NAME + ' .btn-revoke { background: #2a1a1a !important; color: #e06060 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .btn-revoke:hover { background: #3a1a1a !important; }',
    'html.' + CLASS_NAME + ' .add-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .add-row input { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .add-row select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .invite-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .invite-row select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .redeem-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .redeem-row input { background: #252525 !important; color: #9dd0d3 !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' .profile-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .profile-block { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .profile-label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .profile-empty { color: #666 !important; }',
    'html.' + CLASS_NAME + ' .p-tag { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .p-tag.sugg { background: #252525 !important; color: #888 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .p-tag.sugg:hover { background: #1a2a2b !important; color: #7db8bb !important; border-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .mod-chip.on { background: #1a2a2b !important; border-color: #4a7f82 !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .mod-chip.off { background: #252525 !important; color: #666 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .mod-badge.on { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .mod-badge.off { background: #252525 !important; color: #666 !important; }',
    'html.' + CLASS_NAME + ' .prompt-row input { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .prompt-row .btn-px { background: #2a1a1a !important; color: #e06060 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' #profile-notes-edit { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .pending-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .pending-code { color: #a5b4fc !important; }',
    'html.' + CLASS_NAME + ' .code-display { background: #1a2a2b !important; border-color: #4a7f82 !important; color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' #student-status-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .live-status-row { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .live-dot.unknown { background: #555 !important; }',
    'html.' + CLASS_NAME + ' .perms-section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .perms-list li { color: #d0d0d0 !important; border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .perms-list li:nth-child(odd) { background: #1a1a1a !important; }',
    'html.' + CLASS_NAME + ' .perms-list li:nth-child(even) { background: #1e1e1e !important; }',
    'html.' + CLASS_NAME + ' .perm-toggle-row { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .perm-slider { background: #555 !important; }',
    'html.' + CLASS_NAME + ' .btn-perms-toggle { background: #2a2a2a !important; color: #7db8bb !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' .btn-perms-reset { background: #252525 !important; color: #888 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #student-picker-wrap { background: #1a2a2b !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' #student-picker { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' #nl-student-picker-wrap { background: #1a2a1a !important; border-color: #2d6a4f !important; }',
    'html.' + CLASS_NAME + ' #nl-student-picker { background: #252525 !important; color: #e0e0e0 !important; border-color: #2d6a4f !important; }',
    /* Claude: 2026-03-15 — fixed selector: was #mirror-banner, actual element is #aa-mirror-banner */
    'html.' + CLASS_NAME + ' #aa-mirror-banner { background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%) !important; border-color: #6366f1 !important; color: #a5b4fc !important; }',
    'html.' + CLASS_NAME + ' #mirror-banner { background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%) !important; border-color: #6366f1 !important; }',
    'html.' + CLASS_NAME + ' #mirror-banner h2 { color: #a5b4fc !important; }',
    'html.' + CLASS_NAME + ' #mirror-banner p { color: #818cf8 !important; }',
    'html.' + CLASS_NAME + ' #nl-banner { background: linear-gradient(135deg, #1a2a1a 0%, #1e2e1e 100%) !important; border-color: #2d6a4f !important; }',
    'html.' + CLASS_NAME + ' #nl-banner h2 { color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' #nl-banner p { color: #40916c !important; }',
    'html.' + CLASS_NAME + ' .card-perms-wrap { border-top-color: #2a2a2a !important; }',
    '',
    /* --- Claude: 2026-03-14 — Meal Planner dark overrides --- */
    'html.' + CLASS_NAME + ' .meal-entry { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .meal-entry h3 { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .meal-item { background: #252525 !important; color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .meal-item .mtype { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .meal-item .meta { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .base-plan-panel { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .base-plan-section h4 { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .base-plan-section li { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' #meal-mirror-banner.nl-banner { background: linear-gradient(135deg, #1a2a1a 0%, #1e2e1e 100%) !important; color: #6abf7b !important; border-color: #2d6a4f !important; }',
    'html.' + CLASS_NAME + ' #meal-mirror-banner.mirror-banner { background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%) !important; color: #a5b4fc !important; border-color: #6366f1 !important; }',
    'html.' + CLASS_NAME + ' .meal-entry select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Modes page dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .mode-tile.active-mode { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .feat-slider:before { background: #ccc !important; }',
    'html.' + CLASS_NAME + ' .feature-row { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .feature-row label { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .btn-mode-reset { background: #252525 !important; color: #999 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Bedroom Planner dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .room { background: #1a1a1a !important; }',
    'html.' + CLASS_NAME + ' .cwrap { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .furn { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .furn.mo { background: rgba(61,107,82,.35) !important; color: #8fd4a8 !important; border-color: #3d6b52 !important; }',
    'html.' + CLASS_NAME + ' .furn.fs { background: rgba(90,61,138,.3) !important; color: #c8b8e8 !important; border-color: #5a3d8a !important; }',
    'html.' + CLASS_NAME + ' .furn.bad { background: rgba(204,34,34,.25) !important; color: #f08080 !important; border-color: #cc2222 !important; }',
    'html.' + CLASS_NAME + ' .clabel { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .leg { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .ok { color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .err { color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' .sub { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .cd { color: #999 !important; }',
    '',
    /* --- Claude: 2026-03-14 — SpoonPal dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .section { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .modal-content { background: #1e1e1e !important; color: #e0e0e0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .modal-close { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .modal-close:hover { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' #statusPicker { background: #252525 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #spoonBudgetBar { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .qe-btn { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .qe-btn:hover { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .qe-btn.selected[data-color="green"] { background: #1a2a1a !important; color: #6abf7b !important; border-color: #28a745 !important; }',
    'html.' + CLASS_NAME + ' .qe-btn.selected[data-color="yellow"] { background: #2a2a1a !important; color: #ffc107 !important; border-color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .qe-btn.selected[data-color="orange"] { background: #2a1a0a !important; color: #fd7e14 !important; border-color: #fd7e14 !important; }',
    'html.' + CLASS_NAME + ' .qe-btn.selected[data-color="red"] { background: #2a1a1a !important; color: #e06060 !important; border-color: #dc3545 !important; }',
    'html.' + CLASS_NAME + ' .qe-label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' #timestamp { color: #999 !important; }',
    'html.' + CLASS_NAME + ' #spoonBreakdown { color: #888 !important; }',
    'html.' + CLASS_NAME + ' #spoonStatsRow { color: #999 !important; }',
    'html.' + CLASS_NAME + ' #legend { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .sp-status-btn { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .sp-status-btn:hover { background: #2a3a3b !important; border-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .sp-status-btn.active { border-color: #4a8ae8 !important; background: #1a2a3a !important; }',
    'html.' + CLASS_NAME + ' .time-bump-row button { background: #1a2a3a !important; color: #8ab4f8 !important; border-color: #3a5a8a !important; }',
    'html.' + CLASS_NAME + ' .time-bump-row button:hover { background: #2a3a4a !important; }',
    'html.' + CLASS_NAME + ' #debtWarning { background: #2a1a1a !important; color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' #taskBudgetImpact.tbi-ok { background: #1a2a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' #taskBudgetImpact.tbi-low { background: #2a2a1a !important; color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' #taskBudgetImpact.tbi-debt { background: #2a1a1a !important; color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' .ro-row { background: #252525 !important; }',
    'html.' + CLASS_NAME + ' .ro-ok { background: #1a2a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .ro-low { background: #2a2a1a !important; color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .ro-debt { background: #2a1a1a !important; color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' tr.overdue { background: #2a1a1a !important; }',
    'html.' + CLASS_NAME + ' tr.completed { background: #1a2a1a !important; }',
    'html.' + CLASS_NAME + ' tr.outoforder { background: #2a2a1a !important; }',
    'html.' + CLASS_NAME + ' tr.task-nextup { background: #2a2a1a !important; }',
    'html.' + CLASS_NAME + ' .template-item { border-bottom-color: #3a3f40 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Emergency Contacts dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' #mirror-notice { background: #1a2a2b !important; color: #7db8bb !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' .contact-photo { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .empty-box { background: #1e1e1e !important; border-color: #3a3f40 !important; color: #888 !important; }',
    'html.' + CLASS_NAME + ' .edit-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .edit-card label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .edit-card input, html.' + CLASS_NAME + ' .edit-card select, html.' + CLASS_NAME + ' .edit-card textarea { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .contact-rel { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .contact-msg { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .btn-delete { background: #2a1a1a !important; color: #e06060 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' #seed-defaults-btn { background: #2a2a1a !important; color: #ffc107 !important; border-color: #8a6800 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Support Dashboard dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .toggle-bar { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .toggle-bar label { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .student-badge { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .student-picker { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .msc-item { background: #1e1e1e !important; color: #d0d0d0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .msc-item:hover { border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' .msc-item.active { background: #1a2a2b !important; border-color: #4a7f82 !important; }',
    'html.' + CLASS_NAME + ' .nope-details { background: #2a1a1a !important; color: #f08080 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .checkin-alert-bar { background: #2a2a1a !important; color: #ffc107 !important; border-color: #8a6800 !important; }',
    'html.' + CLASS_NAME + ' .checkin-alert-bar .alert-dismiss { color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .notif-item { background: #1e1e1e !important; color: #d0d0d0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-red_flag { background: #2a1a1a !important; color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-yellow_flag { background: #2a2a1a !important; color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-nope_activated { background: #1a1a2a !important; color: #a78bfa !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-nope_canceled { background: #1a2a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-mode_recovery { background: #1a2a2b !important; color: #20c997 !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-mode_bad_brain { background: #1a1a2a !important; color: #a78bfa !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-missed_meal { background: #2a1a0a !important; color: #fd7e14 !important; }',
    'html.' + CLASS_NAME + ' .notif-item.type-low_spoons { background: #2a2a1a !important; color: #eab308 !important; }',
    'html.' + CLASS_NAME + ' .last-seen-bar { background: #1a2a3a !important; color: #8ab4f8 !important; border-color: #3a5a8a !important; }',
    'html.' + CLASS_NAME + ' .badge-sm { background: #1a2a2b !important; color: #7db8bb !important; border-color: #3a5a5b !important; }',
    'html.' + CLASS_NAME + ' .badge-sm.bad { background: #2a1a1a !important; color: #f08080 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .meal-type-tag { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .meal-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .meal-time { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .checkin-date { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .checkin-mood { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .checkin-notes { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .quiz-bar-bg { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .quiz-sub { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .quiz-label { color: #999 !important; }',
    'html.' + CLASS_NAME + ' .empty-msg { color: #777 !important; }',
    'html.' + CLASS_NAME + ' .status-since { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .notif-time { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .nl-action-links a { background: #252525 !important; color: #6abf7b !important; border-color: #2d6a4f !important; }',
    'html.' + CLASS_NAME + ' .mirror-notice.mirror-readonly { background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%) !important; border-color: #6366f1 !important; color: #a5b4fc !important; }',
    'html.' + CLASS_NAME + ' .mirror-notice.mirror-nl { background: linear-gradient(135deg, #1a2a1a 0%, #1e2e1e 100%) !important; border-color: #2d6a4f !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .section-header { border-bottom-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .checkin-row { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .meal-row { border-bottom-color: #2a2a2a !important; }',
    '',
    /* --- Claude: 2026-03-15 — Recovery Mode dark overrides (expanded) ---
       Archive: dark-mode_2026-03-15_pre-recovery-fix.bak.js --- */
    /* Cards & containers */
    'html.' + CLASS_NAME + ' .recovery-container .card { background: #1e1e1e !important; box-shadow: 0 2px 8px rgba(0,0,0,.4) !important; }',
    'html.' + CLASS_NAME + ' .recovery-container .card h2 { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .spoon-counter { background: #1a3a3c !important; }',
    /* Session bar & timezone picker */
    'html.' + CLASS_NAME + ' .session-bar { background: #1e1e1e !important; color: #d0d0d0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .session-tz-btn { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .tz-picker-row { background: #1e1e1e !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .tz-picker-row select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .new-day-btn { background: #2a2a1a !important; color: #ffc107 !important; border-color: #8a6800 !important; }',
    /* Quiz buttons & result area */
    'html.' + CLASS_NAME + ' .quiz-btn { background: #252525 !important; color: #7db8bb !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .quiz-btn:hover { background: #2a3a3b !important; border-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' #quiz-result { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a5a5b !important; }',
    'html.' + CLASS_NAME + ' .progress-bar { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .achievement { background: linear-gradient(135deg, #1a3a2a 0%, #1a2a3a 100%) !important; color: #e0e0e0 !important; }',
    /* Energy check-in */
    'html.' + CLASS_NAME + ' .energy-option { background: #252525 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .energy-option:hover, html.' + CLASS_NAME + ' .energy-option:focus { background: #1a2a2b !important; }',
    /* Scripture verse — bright yellow gradient → dark muted gold */
    'html.' + CLASS_NAME + ' #scripture-verse { background: linear-gradient(135deg, #2a2a1a 0%, #2a2510 100%) !important; color: #e0d8b0 !important; }',
    /* Support message area */
    'html.' + CLASS_NAME + ' #support-message { background: #252525 !important; color: #e0e0e0 !important; }',
    /* Journal prompt & textarea */
    'html.' + CLASS_NAME + ' #journal-prompt { background: #1e2a2b !important; color: #d0d0d0 !important; border-left-color: #4a7a7c !important; }',
    'html.' + CLASS_NAME + ' .journal-textarea { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    /* Journal "Different prompt" button */
    'html.' + CLASS_NAME + ' #journal-prompt + div button, html.' + CLASS_NAME + ' [onclick="journalNext()"] { background: #1e2a2b !important; color: #7db8bb !important; border-color: #4a5a5b !important; }',
    /* Genus practice info box & toggle buttons */
    'html.' + CLASS_NAME + ' .recovery-container [style*="background:#f0f7f8"], html.' + CLASS_NAME + ' .recovery-container [style*="background: #f0f7f8"] { background: #1e2a2b !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .recovery-container [style*="background:#f0f4f5"] { background: #252525 !important; color: #d0d0d0 !important; }',
    /* Todo items */
    'html.' + CLASS_NAME + ' .todo-item { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .todo-item.todo-completed { background: #1a1a1a !important; }',
    'html.' + CLASS_NAME + ' .todo-item.todo-completed .todo-text { color: #666 !important; }',
    /* Breathing exercise */
    'html.' + CLASS_NAME + ' .breathing-phase { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .breathing-timer { color: #888 !important; }',
    /* Report button (orange) */
    'html.' + CLASS_NAME + ' #report-btn { background: #8a4500 !important; color: #ffc080 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Bad Brain Day dark overrides --- */
    'html.' + CLASS_NAME + ' .card-title { color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .btn-emergency { background: #2a1a1a !important; color: #f08080 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .btn-messages { background: #1a2a2b !important; color: #7db8bb !important; border-color: #3a5a5b !important; }',
    'html.' + CLASS_NAME + ' .btn-secondary { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .skip-notice { background: #1a1a1a !important; color: #888 !important; }',
    'html.' + CLASS_NAME + ' .energy-item:hover, html.' + CLASS_NAME + ' .energy-item:focus { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .energy-def { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .checkin-logged { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .font-size-controls button { background: #1a2a2b !important; color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .back-btn { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .skip-btn { color: #888 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .skip-btn:hover { color: #aaa !important; border-color: #666 !important; }',
    'html.' + CLASS_NAME + ' .setting-desc { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .setting-row { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .back-note { color: #777 !important; }',
    'html.' + CLASS_NAME + ' .threshold-line { color: #777 !important; }',
    'html.' + CLASS_NAME + ' .threshold-line::before, html.' + CLASS_NAME + ' .threshold-line::after { background: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .log-entry { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' #font-size-label { color: #999 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Nope / Semi-Nope auth button + suggestion flash --- */
    'html.' + CLASS_NAME + ' #auth-gate button { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Templates page dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .tag-print { background: #1a2a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .tag-interactive { background: #1a2a3a !important; color: #8ab4f8 !important; }',
    'html.' + CLASS_NAME + ' .btn-back { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Audio Converter dark overrides --- */
    'html.' + CLASS_NAME + ' .drop-zone { background: #1e1e1e !important; border-color: #4a7f82 !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .drop-zone:hover, html.' + CLASS_NAME + ' .drop-zone.drag-over { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .file-card { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .file-name { color: #e0e0e0 !important; }',
    'html.' + CLASS_NAME + ' .format-btn { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .format-btn:hover { background: #2a3a3b !important; border-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .format-btn.selected { background: #1a3a3c !important; border-color: #7db8bb !important; color: #9dd0d3 !important; }',
    'html.' + CLASS_NAME + ' .sample-select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .progress-bar-outer { background: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .result-card { background: #1a2a1a !important; border-color: #28a745 !important; }',
    'html.' + CLASS_NAME + ' .result-text { color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .btn-reset { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .error-msg { background: #2a1a1a !important; border-color: #5a2020 !important; color: #f08080 !important; }',
    'html.' + CLASS_NAME + ' .formats-hint { background: #1e1e1e !important; border-color: #3a3f40 !important; color: #999 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Check-In dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .gw-btn.sel-skip { background: #252525 !important; color: #999 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #thumping-banner { background: #2a2a1a !important; color: #ffc107 !important; border-color: #8a6800 !important; }',
    'html.' + CLASS_NAME + ' #flag-bar.flag-g { background: #1a2a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' #bbd-toggle-btn { background: #252525 !important; color: #7db8bb !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' #skip-all-btn { background: #252525 !important; color: #999 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .emerg-btn { background: #252525 !important; color: #d0d0d0 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .emerg-btn.sel-yes { background: #2a1a1a !important; color: #f08080 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .emerg-btn.sel-no { background: #1a2a1a !important; color: #6abf7b !important; border-color: #28a745 !important; }',
    'html.' + CLASS_NAME + ' #reset-btn { background: #252525 !important; color: #999 !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .note-wrap textarea { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Check-In Log dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .day-header:hover { background: #1a2a2b !important; }',
    'html.' + CLASS_NAME + ' .log-controls select { background: #252525 !important; color: #e0e0e0 !important; border-color: #4a4f50 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Privacy page dark overrides --- */
    'html.' + CLASS_NAME + ' .plain { background: #1a2a3a !important; border-color: #3a5a8a !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .plain h3 { color: #8ab4f8 !important; }',
    'html.' + CLASS_NAME + ' .legal { background: #1a1a1a !important; border-color: #3a3f40 !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .last-updated { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .toc { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .toc a { color: #7db8bb !important; }',
    '',
    /* --- Claude: 2026-03-14 — Icon Gallery dark overrides --- */
    'html.' + CLASS_NAME + ' .icon-item { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .icon-item:hover { background: #2a3a3b !important; border-color: #7db8bb !important; }',
    'html.' + CLASS_NAME + ' .icon-block { background: #1e1e1e !important; color: #9dd0d3 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .icon-filename { background: #4a7f82 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Index page dark overrides (additional) --- */
    'html.' + CLASS_NAME + ' .status-pill.alert-yellow { background: #2a2a1a !important; color: #ffc107 !important; border-color: #8a6800 !important; }',
    'html.' + CLASS_NAME + ' .status-pill.alert-red { background: #2a1a1a !important; color: #f08080 !important; border-color: #5a2020 !important; }',
    'html.' + CLASS_NAME + ' .nope-hint { color: #888 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Meal Planner Mary dark overrides --- */
    'html.' + CLASS_NAME + ' .meal-controls button { background: #2a2a2a !important; color: #ccc !important; border-color: #4a4f50 !important; }',
    'html.' + CLASS_NAME + ' .meal-controls button.primary { background: #1a3a1a !important; color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' .meal-controls button.secondary { background: #1a2a3a !important; color: #8ab4f8 !important; }',
    'html.' + CLASS_NAME + ' .meal-controls button.danger { background: #2a1a1a !important; color: #f08080 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Loading spinner / auth gate shared --- */
    'html.' + CLASS_NAME + ' #auth-gate { color: #888 !important; }',
    'html.' + CLASS_NAME + ' #signin-notice { color: #888 !important; }',
    'html.' + CLASS_NAME + ' #signin-msg { color: #888 !important; }',
    'html.' + CLASS_NAME + ' .loading { color: #888 !important; }',
    'html.' + CLASS_NAME + ' #loading-msg { color: #888 !important; }',
    '',
    /* --- Claude: 2026-03-14 — Suggestion flash (used by nope/semi-nope/modes) --- */
    'html.' + CLASS_NAME + ' [style*="background:#fef3c7"] { background: #2a2a1a !important; border-color: #8a6800 !important; }',
    'html.' + CLASS_NAME + ' [style*="color:#92400e"] { color: #ffc107 !important; }',
    'html.' + CLASS_NAME + ' [style*="color:#78350f"] { color: #eab308 !important; }',
    '',
    /* --- Generic remaining patterns --- */
    'html.' + CLASS_NAME + ' table { border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' th { background: #252525 !important; color: #d0d0d0 !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' td { border-color: #3a3f40 !important; color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' tr:nth-child(even) { background: #1a1a1a !important; }',
    'html.' + CLASS_NAME + ' hr { border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' blockquote { border-left-color: #4a7f82 !important; color: #bbb !important; }',
    'html.' + CLASS_NAME + ' code { background: #252525 !important; color: #9dd0d3 !important; }',
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
