(function () {
  const headerBar = document.querySelector('header .navbar');
  if (!headerBar) return;

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

  let menuBtn = document.getElementById('menuBtn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.id = 'menuBtn';
    menuBtn.className = 'hamburger site-nav-toggle';
    menuBtn.setAttribute('aria-label', 'Abrir menu lateral');
    menuBtn.setAttribute('aria-controls', 'sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<div class="bars"><span></span><span></span><span></span></div>';
    headerBar.insertBefore(menuBtn, headerBar.firstChild);
  }


  if (!menuBtn.querySelector('.bars')) {
    menuBtn.innerHTML = '<div class="bars"><span></span><span></span><span></span></div>';
  }

  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);
  }

  let sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    sidebar = document.createElement('aside');
    sidebar.id = 'sidebar';
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
    document.body.appendChild(sidebar);
  }

  let lastFocused = null;

  function isOpen() {
    return document.body.classList.contains('sidebar-open');
  }

  function firstFocusable() {
    return sidebar.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
  }

  function openSidebar() {
    if (isOpen()) return;
    lastFocused = document.activeElement;

    overlay.hidden = false;
    sidebar.hidden = false;
    document.body.classList.add('sidebar-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Fechar menu lateral');

    const first = firstFocusable();
    if (first) first.focus();
  }

  function closeSidebar() {
    if (!isOpen()) return;

    document.body.classList.remove('sidebar-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menu lateral');

    window.setTimeout(function () {
      overlay.hidden = true;
      sidebar.hidden = true;
    }, 220);

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    } else {
      menuBtn.focus();
    }
  }

  menuBtn.addEventListener('click', function () {
    if (isOpen()) {
      closeSidebar();
      return;
    }
    openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      closeSidebar();
    }
  });

  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      closeSidebar();
    }
  });
})();
