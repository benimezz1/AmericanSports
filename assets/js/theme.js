(function () {
  const THEME_KEY = 'theme';
  const DARK_CLASS = 'dark-mode';

  function applyTheme(theme) {
    document.body.classList.toggle(DARK_CLASS, theme === 'dark');
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☾' : '☀';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
      btn.setAttribute('title', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
  }

  function getSavedTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getSavedTheme());

    const themeBtn = document.getElementById('themeBtn');
    if (!themeBtn) {
      return;
    }

    themeBtn.addEventListener('click', function () {
      const nextTheme = document.body.classList.contains(DARK_CLASS) ? 'light' : 'dark';
      setTheme(nextTheme);
    });
  });
})();
