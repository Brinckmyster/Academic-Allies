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
    'html.' + CLASS_NAME + ' .setting-row { border-bottom-color: #2a2a2a !important; }',
    'html.' + CLASS_NAME + ' .setting-label { color: #d0d0d0 !important; }',
    'html.' + CLASS_NAME + ' .setting-hint { color: #888 !important; }',
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
    'html.' + CLASS_NAME + ' .audit-entry { background: #1e1e1e !important; border-color: #3a3f40 !important; }',
    'html.' + CLASS_NAME + ' .audit-entry:nth-child(even) { background: #1a1a1a !important; }',
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
    'html.' + CLASS_NAME + ' #mirror-banner { background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%) !important; border-color: #6366f1 !important; }',
    'html.' + CLASS_NAME + ' #mirror-banner h2 { color: #a5b4fc !important; }',
    'html.' + CLASS_NAME + ' #mirror-banner p { color: #818cf8 !important; }',
    'html.' + CLASS_NAME + ' #nl-banner { background: linear-gradient(135deg, #1a2a1a 0%, #1e2e1e 100%) !important; border-color: #2d6a4f !important; }',
    'html.' + CLASS_NAME + ' #nl-banner h2 { color: #6abf7b !important; }',
    'html.' + CLASS_NAME + ' #nl-banner p { color: #40916c !important; }',
    'html.' + CLASS_NAME + ' .card-perms-wrap { border-top-color: #2a2a2a !important; }',
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
