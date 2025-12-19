document.querySelectorAll('[data-include]').forEach(el => {
  fetch(el.getAttribute('data-include'))
    .then(response => response.text())
    .then(html => {
      el.innerHTML = html;
      const event = new Event('includesLoaded');
      window.__includesLoaded = true;
      document.dispatchEvent(event);
    });
});
