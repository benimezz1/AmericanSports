(function () {
  const headerBar = document.querySelector('header .navbar');
  if (!headerBar || document.getElementById('siteSidebar')) return;

  document.body.classList.add('nav-mounted');

  const menuItems = [
    { label: 'Home', href: 'index.html' },
    { label: 'Notícias', href: 'news.html' },
    { label: 'Jogos / Calendário', href: 'games.html' },
    { label: 'Tabelas / Classificação', href: 'standings.html' },
    { label: 'Times', href: 'teams.html' },
    { label: 'Estatísticas', href: 'stats.html' },
    { label: 'Ao vivo', href: 'live.html' },
    { label: 'Favoritos', href: 'favorites.html' },
    { label: 'Configurações', href: 'settings.html' }
  ];

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'site-nav-toggle';
  toggle.id = 'siteNavToggle';
  toggle.setAttribute('aria-label', 'Abrir menu lateral');
  toggle.setAttribute('aria-controls', 'siteSidebar');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span class="hamburger" aria-hidden="true"></span>';
  headerBar.insertBefore(toggle, headerBar.firstChild);

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.hidden = true;

  const sidebar = document.createElement('aside');
  sidebar.className = 'site-sidebar';
  sidebar.id = 'siteSidebar';
  sidebar.setAttribute('aria-label', 'Menu principal de navegação');
  sidebar.hidden = true;
  sidebar.innerHTML = `
    <h2 class="title">Menu de Esportes</h2>
    <nav>
      ${menuItems.map(item => {
        const active = item.href === currentPage ? 'aria-current="page"' : '';
        return `<a class="menu-link" href="${item.href}" ${active}>${item.label}</a>`;
      }).join('')}
    </nav>
  `;

  document.body.append(overlay, sidebar);

  let lastFocused = null;

  function getFirstMenuItem() {
    return sidebar.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
  }

  function isMenuOpen() {
    return document.body.classList.contains('sidebar-open');
  }

  function openMenu() {
    if (isMenuOpen()) return;
    lastFocused = document.activeElement;
    sidebar.hidden = false;
    overlay.hidden = false;
    document.body.classList.add('sidebar-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu lateral');

    const first = getFirstMenuItem();
    if (first) first.focus();
  }

  function closeMenu() {
    if (!isMenuOpen()) return;
    document.body.classList.remove('sidebar-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu lateral');

    window.setTimeout(() => {
      sidebar.hidden = true;
      overlay.hidden = true;
    }, 260);

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', function () {
    if (isMenuOpen()) {
      closeMenu();
      return;
    }
    openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      closeMenu();
    }
  });

  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });
})();
