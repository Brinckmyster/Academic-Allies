/* Claude: 2026-03-23 — DEAD CODE. This file is not loaded by any live page.
   Dashboard navigation is handled inline in index.html via module-card links.
   Archived to modular/archive/main_2026-03-23_dead-code.bak.js */
// CAj fix: functional navigation for dashboard buttons.

// Dashboard button navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Daily Check-in button navigation
    const checkinButton = document.querySelector('#daily-checkin-btn, .daily-checkin-btn, [data-action="checkin"]');
    if (checkinButton) {
        checkinButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'modular/checkin.html';
        });
    }

    // View Logs button navigation
    const logsButton = document.querySelector('#view-logs-btn, .view-logs-btn, [data-action="logs"]');
    if (logsButton) {
        logsButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'modular/icon-gallery.html';
        });
    }

    // Emergency Contacts button navigation
    const emergencyButton = document.querySelector('#emergency-contacts-btn, .emergency-contacts-btn, [data-action="emergency"]');
    if (emergencyButton) {
        emergencyButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'modular/emergency.html';
        });
    }
});
