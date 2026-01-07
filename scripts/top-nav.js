// year-nav.js
// Handles building and updating the year navigation bar

(function () {
  function initYearNav({
    cells,
    yearNav,
    prevBtn,
    nextBtn,
    getSelectedIndex,
    setSelectedIndex,
    onChange
  }) {
    if (!cells || !yearNav) return;

    // Build year nav buttons
    yearNav.innerHTML = '';

    cells.forEach((cell, i) => {
      const year = cell.dataset.year || cell.id || String(i + 1);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = year;
      btn.dataset.index = i;

      btn.addEventListener('click', () => {
        setSelectedIndex(i);
        onChange();
      });

      yearNav.appendChild(btn);
    });

    const yearButtons = Array.from(yearNav.querySelectorAll('button'));

    function updateActive() {
      const selectedIndex = getSelectedIndex();
      yearButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === selectedIndex);
      });
    }

    // Hook arrows
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        setSelectedIndex(getSelectedIndex() - 1);
        onChange();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        setSelectedIndex(getSelectedIndex() + 1);
        onChange();
      });
    }

    return { updateActive };
  }

  // Expose globally
  window.initYearNav = initYearNav;
})();
