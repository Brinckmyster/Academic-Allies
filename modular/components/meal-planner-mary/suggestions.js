function suggestMeal() {
  fetch('base-meal-plan-mary.json')
    .then(r => r.json())
    .then(plan => {
      const now = new Date();
      const hour = now.getHours();
      let timeSlot = '10:30am';
      if(hour >= 13 && hour < 16) timeSlot = '1:30pm';
      else if(hour >= 16 && hour < 17) timeSlot = '4:30pm';
      else if(hour >= 17) timeSlot = 'After 5pm (Liquids Only)';
      
      const meals = plan[timeSlot] || [];
      if(meals.length === 0) {
        alert('No suggestions for this time');
        return;
      }
      
      // Get 3 random unique suggestions
      const shuffled = [...meals].sort(() => 0.5 - Math.random());
      const suggestions = shuffled.slice(0, Math.min(3, meals.length));
      
      // Display modal with 3 suggestions
      showSuggestionsModal(suggestions, timeSlot);
    });
}

function showSuggestionsModal(suggestions, timeSlot) {
  const html = suggestions.map((meal, i) => `
    <div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 6px;">
      <strong>${i+1}. ${meal}</strong><br>
      <button class="primary" style="margin-top: 5px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;" 
        onclick="addSuggestionToPlan('${meal.replace(/'/g, "\\'")}')">
        Add to Plan
      </button>
    </div>
  `).join('');
  
  const container = document.createElement('div');
  container.innerHTML = `<h3>Suggested meals for ${timeSlot}:</h3>${html}<button onclick="closeSuggestionsModal()" style="margin-top: 10px; padding: 8px 16px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Close</button>`;
  container.id = 'suggestions-modal';
  container.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000; max-width: 500px;';
  
  const overlay = document.createElement('div');
  overlay.id = 'suggestions-overlay';
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
  overlay.onclick = closeSuggestionsModal;
  
  document.body.appendChild(overlay);
  document.body.appendChild(container);
}

function closeSuggestionsModal() {
  const overlay = document.getElementById('suggestions-overlay');
  const modal = document.getElementById('suggestions-modal');
  if(overlay) document.body.removeChild(overlay);
  if(modal) document.body.removeChild(modal);
}

function addSuggestionToPlan(mealName) {
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  todaysMeals.push({name: mealName, time: time, notes: 'Auto-suggested'});
  localStorage.setItem('maryMealPlan', JSON.stringify(todaysMeals));
  displayMeals();
  closeSuggestionsModal();
  alert('Added to plan!');
}
