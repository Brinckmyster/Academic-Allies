function showBasePlan() {
  fetch('base-meal-plan-mary.json')
    .then(r => r.json())
    .then(plan => {
      const planText = JSON.stringify(plan, null, 2);
      
      const container = document.createElement('div');
      container.innerHTML = `
        <h3>Edit Base Meal Plan</h3>
        <textarea id="planEditor" style="width: 100%; height: 400px; font-family: monospace; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">${planText}</textarea>
        <div style="margin-top: 10px; display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="saveBasePlan()" style="padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Save Changes</button>
          <button onclick="closeEditModal()" style="padding: 8px 20px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      `;
      container.id = 'edit-modal';
      container.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000; max-width: 600px; width: 90%;';
      
      const overlay = document.createElement('div');
      overlay.id = 'edit-overlay';
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;';
      overlay.onclick = closeEditModal;
      
      document.body.appendChild(overlay);
      document.body.appendChild(container);
    });
}

function closeEditModal() {
  const overlay = document.getElementById('edit-overlay');
  const modal = document.getElementById('edit-modal');
  if(overlay) document.body.removeChild(overlay);
  if(modal) document.body.removeChild(modal);
}

function saveBasePlan() {
  const text = document.getElementById('planEditor').value;
  try {
    const updated = JSON.parse(text);
    localStorage.setItem('maryBasePlan', JSON.stringify(updated));
    alert('Base plan updated! (Note: This only updates your browser storage, not the server file)');
    closeEditModal();
  } catch(err) {
    alert('Invalid JSON - please fix errors and try again');
  }
}
