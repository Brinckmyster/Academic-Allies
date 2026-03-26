/* Claude: 2026-03-23 — DEAD CODE. This file is not loaded by any live page.
   Header loading is handled inline on each page via fetch() since 2026-02.
   Archived to modular/archive/header-loader_2026-03-23_dead-code.bak.js */
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
      // Claude 2026-03-08: wait for body to exist before inserting
      function insertHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
          placeholder.innerHTML = html;
        } else {
          document.body.insertAdjacentHTML('afterbegin', html);
        }
        executeScripts(placeholder || document.body);
      }
      if (document.body) {
        insertHeader();
      } else {
        document.addEventListener('DOMContentLoaded', insertHeader);
      }
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
