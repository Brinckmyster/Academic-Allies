/* ============================================================
   gps-social.js — GPS-based Social inference for check-in
   Written: 2026-03-03 by Claude
   Privacy: All GPS data stored in localStorage ONLY.
            Never sent to Firebase or any server.
   ============================================================ */
(function() {
  'use strict';

  // Claude: threshold in meters — less than this total displacement = "didn't go out"
  var MOVEMENT_THRESHOLD_M = 150;
  // Claude: minimum snapshots needed to make an inference (avoids false positives)
  var MIN_SNAPSHOTS = 3;

  // Haversine distance between two lat/lng points, returns meters
  function haversine(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Max displacement from first point across all snapshots
  function maxDisplacement(snapshots) {
    if (!snapshots || snapshots.length < 2) return 0;
    var origin = snapshots[0];
    var max = 0;
    for (var i = 1; i < snapshots.length; i++) {
      var d = haversine(origin.lat, origin.lng, snapshots[i].lat, snapshots[i].lng);
      if (d > max) max = d;
    }
    return max;
  }

  // Returns: 'no_movement' | 'moved' | 'insufficient_data' | 'unavailable'
  function analyzeMovement() {
    var dateKey = (function() {
      var d = new Date();
      /* Claude: 2026-03-25 — replaced .padStart() (ES2017) with ES5-safe pattern */
      return d.getFullYear() + '-' +
             ('0' + (d.getMonth()+1)).slice(-2) + '-' +
             ('0' + d.getDate()).slice(-2);
    })();
    try {
      var raw = localStorage.getItem('aa_gps_' + dateKey);
      if (!raw) return 'unavailable';
      var snapshots = JSON.parse(raw);
      if (snapshots.length < MIN_SNAPSHOTS) return 'insufficient_data';
      var dist = maxDisplacement(snapshots);
      return dist < MOVEMENT_THRESHOLD_M ? 'no_movement' : 'moved';
    } catch(e) { return 'unavailable'; }
  }

  // Exposed API
  window.AA_GPS = {
    analyzeMovement: analyzeMovement,
    MOVEMENT_THRESHOLD_M: MOVEMENT_THRESHOLD_M
  };
})();
