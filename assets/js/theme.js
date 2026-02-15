(function () {
  const THEME_KEY = 'theme';
  const DARK_CLASS = 'dark-mode';

  function updateThemeButton(theme) {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☾' : '☀';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    btn.setAttribute('title', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
  }

  function applyTheme(theme) {
    document.body.classList.toggle(DARK_CLASS, theme === 'dark');
    updateThemeButton(theme);
    document.dispatchEvent(new CustomEvent('playnorth:theme-applied', { detail: { theme: theme } }));
  }

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }

  document.addEventListener('playnorth:set-theme', function (event) {
    const theme = event.detail && event.detail.theme === 'dark' ? 'dark' : 'light';
    setTheme(theme);
  });

  window.addEventListener('storage', function (event) {
    if (event.key === THEME_KEY) {
      applyTheme(getSavedTheme());
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getSavedTheme());

    const themeBtn = document.getElementById('themeBtn');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', function () {
      const nextTheme = document.body.classList.contains(DARK_CLASS) ? 'light' : 'dark';
      setTheme(nextTheme);
    });
  });
})();
