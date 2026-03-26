/* Claude: 2026-03-25 — converted to ES5 var/function style + XSS fix */
/* Claude: 2026-03-25 — added .catch() for unhandled fetch/JSON errors */

/* Claude: 2026-03-25 — XSS escape helper */
function _escSug(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function suggestMeal() {
  fetch('base-meal-plan-mary.json')
    .then(function(r) {
      if (!r.ok) throw new Error('Could not load meal plan (' + r.status + ')');
      return r.json();
    })
    .then(function(plan) {
      // Ask which meal time
      var timeSlots = Object.keys(plan).filter(function(k) { return k !== 'NOTES'; });
      var choice = prompt("Which meal?\n" + timeSlots.map(function(t,i) { return (i+1) + '. ' + t; }).join("\n"));
      var index = parseInt(choice) - 1;
      var timeSlot = timeSlots[index] || timeSlots[0];

      var meals = plan[timeSlot] || [];
      if(meals.length === 0) {
        alert('No suggestions for this time');
        return;
      }

      var shuffled = meals.slice().sort(function() { return 0.5 - Math.random(); });
      var suggestions = shuffled.slice(0, Math.min(3, meals.length));
      showSuggestionsModal(suggestions, timeSlot);
    })
    .catch(function(err) {
      console.error('[AA] suggestMeal error:', err);
      alert('Could not load meal suggestions. Please try again.');
    });
}

function showSuggestionsModal(suggestions, timeSlot) {
  var html = suggestions.map(function(meal, i) {
    return '<div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 6px;">' +
      '<strong>' + (i+1) + '. ' + _escSug(meal) + '</strong><br>' +
      '<button class="primary" style="margin-top: 5px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;" ' +
        'onclick="addSuggestionToPlan(\'' + _escSug(meal).replace(/'/g, "\\'") + '\')">' +
        'Add to Plan' +
      '</button>' +
    '</div>';
  }).join('');

  var container = document.createElement('div');
  container.innerHTML = '<h3>Suggested meals for ' + _escSug(timeSlot) + ':</h3>' + html +
    '<button onclick="closeSuggestionsModal()" style="margin-top: 10px; padding: 8px 16px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Close</button>';
  container.id = 'suggestions-modal';
  container.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000; max-width: 500px;';

  var overlay = document.createElement('div');
  overlay.id = 'suggestions-overlay';
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
  overlay.onclick = closeSuggestionsModal;

  document.body.appendChild(overlay);
  document.body.appendChild(container);
}

function closeSuggestionsModal() {
  var overlay = document.getElementById('suggestions-overlay');
  var modal = document.getElementById('suggestions-modal');
  if(overlay) document.body.removeChild(overlay);
  if(modal) document.body.removeChild(modal);
}

function addSuggestionToPlan(mealName) {
  var now = new Date();
  var h = now.getHours().toString();
  var m = now.getMinutes().toString();
  while (h.length < 2) h = '0' + h;
  while (m.length < 2) m = '0' + m;
  var time = h + ':' + m;
  todaysMeals.push({name: mealName, time: time, notes: 'Auto-suggested'});
  localStorage.setItem('maryMealPlan', JSON.stringify(todaysMeals));
  displayMeals();
  closeSuggestionsModal();
  alert('Added to plan!');
}
