// header-loader.js - Loads the shared header into all pages and executes scripts
(function() {
  // Calculate the correct path to shared-header.html based on current page location
  const currentPath = window.location.pathname;
  const pathDepth = currentPath.split('/').filter(p => p && p !== 'Academic-Allies').length - 1;
  const prefix = pathDepth > 0 ? '../'.repeat(pathDepth) : './';
  const headerPath = prefix + 'modular/shared-header.html';
  
  // Fetch and insert the header
  fetch(headerPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Header file not found: ' + headerPath);
      }
      return response.text();
    })
    .then(html => {
      // Find the header placeholder or insert at the beginning of body
      const placeholder = document.getElementById('header-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;
      } else {
        // Insert at beginning of body if no placeholder
        document.body.insertAdjacentHTML('afterbegin', html);
      }
      
      // Execute scripts that were in the loaded HTML
      executeScripts(placeholder || document.body);
    })
    .catch(error => {
      console.error('Failed to load shared header:', error);
    });
  
  function executeScripts(container) {
    // Find all script tags in the loaded content
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy inline script content
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      
      // Replace the old script with the new one to trigger execution
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }
})();
