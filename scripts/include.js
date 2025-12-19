document.querySelectorAll('[data-include]').forEach(el => {
  fetch(el.getAttribute('data-include'))
    .then(resp => resp.text())
    .then(html => { el.innerHTML = html; });
});
