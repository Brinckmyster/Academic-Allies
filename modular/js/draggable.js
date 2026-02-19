/* ============================================================
   draggable.js — Academic Allies Status Circle Drag
   Rewritten: 2026-02-19 by Claude
   Changes from original:
     - position:fixed (was absolute — broke drag on every page)
     - Touch event support added (mobile/tablet)
     - Position saved to localStorage (persists page to page)
     - Double-click resets to default top-right corner
     - Bounds checking keeps circle on screen
   ============================================================ */

(function () {
  var STORAGE_KEY = 'aa-status-circle-pos';
  var DEFAULT_TOP  = 16;   // px from top
  var DEFAULT_RIGHT = 16;  // px from right (used to compute left)

  function dragElement(el) {
    /* ── Switch to fixed positioning ─────────────────────── */
    el.style.position = 'fixed';
    el.style.right    = 'auto'; // clear right so left works
    el.style.margin   = '0';

    // Restore saved position (or set default)
    restorePosition(el);

    /* ── Shared drag state ───────────────────────────────── */
    var startClientX = 0, startClientY = 0;
    var startLeft    = 0, startTop     = 0;
    var dragging     = false;

    /* ── Mouse events ────────────────────────────────────── */
    el.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return; // left-click only
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      e.preventDefault();
      moveTo(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      endDrag(el);
    });

    /* ── Touch events ────────────────────────────────────── */
    el.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });

    el.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      e.preventDefault();
      var t = e.touches[0];
      moveTo(t.clientX, t.clientY);
    }, { passive: false });

    el.addEventListener('touchend', function () {
      if (!dragging) return;
      endDrag(el);
    });

    /* ── Double-click / double-tap reset ─────────────────── */
    el.addEventListener('dblclick', function () {
      resetPosition(el);
    });

    /* ── Drag helpers ────────────────────────────────────── */
    function startDrag(cx, cy) {
      dragging     = true;
      startClientX = cx;
      startClientY = cy;
      startLeft    = parseInt(el.style.left, 10) || 0;
      startTop     = parseInt(el.style.top,  10) || 0;
      el.style.cursor = 'grabbing';
      el.style.transition = 'none';
    }

    function moveTo(cx, cy) {
      var dx = cx - startClientX;
      var dy = cy - startClientY;
      var newLeft = startLeft + dx;
      var newTop  = startTop  + dy;

      // Keep within viewport
      var maxLeft = window.innerWidth  - el.offsetWidth  - 4;
      var maxTop  = window.innerHeight - el.offsetHeight - 4;
      newLeft = Math.max(4, Math.min(maxLeft, newLeft));
      newTop  = Math.max(4, Math.min(maxTop,  newTop));

      el.style.left = newLeft + 'px';
      el.style.top  = newTop  + 'px';
    }

    function endDrag(el) {
      dragging = false;
      el.style.cursor = '';
      savePosition(el);
    }
  }

  /* ── Position persistence ──────────────────────────────── */
  function savePosition(el) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        left: parseInt(el.style.left, 10),
        top:  parseInt(el.style.top,  10)
      }));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function restorePosition(el) {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { saved = null; }

    if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
      // Make sure saved position is still on screen
      var maxLeft = window.innerWidth  - (el.offsetWidth  || 40) - 4;
      var maxTop  = window.innerHeight - (el.offsetHeight || 40) - 4;
      el.style.left = Math.max(4, Math.min(maxLeft, saved.left)) + 'px';
      el.style.top  = Math.max(4, Math.min(maxTop,  saved.top))  + 'px';
    } else {
      resetPosition(el);
    }
  }

  function resetPosition(el) {
    var left = window.innerWidth - (el.offsetWidth || 40) - DEFAULT_RIGHT;
    el.style.left = left + 'px';
    el.style.top  = DEFAULT_TOP + 'px';
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /* ── Init (waits for element to exist in DOM) ────────────── */
  function initDrag() {
    var el = document.getElementById('status-circle');
    if (el) {
      dragElement(el);
    } else {
      setTimeout(initDrag, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrag);
  } else {
    initDrag();
  }
})();
