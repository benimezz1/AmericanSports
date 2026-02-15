(function () {
  const headerBar = document.querySelector('header .navbar');
  if (!headerBar) return;

  document.body.classList.add('nav-mounted');

  const links = [
    { label: 'Home', href: 'index.html' },
    { label: 'NFL', href: 'nfl.html' },
    { label: 'NBA', href: 'nba.html' },
    { label: 'NHL', href: 'nhl.html' },
    { label: 'MLB', href: 'mlb.html' },
    { label: 'MLS', href: 'mls.html' },
    { label: 'Jogos da Semana', href: 'games.html' },
    { label: 'Ranking / Standings', href: 'standings.html' }
  ];

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  let menuBtn = document.getElementById('menuBtn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.id = 'menuBtn';
    menuBtn.className = 'hamburger';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    menuBtn.setAttribute('aria-controls', 'sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    headerBar.insertBefore(menuBtn, headerBar.firstChild);
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
    sidebar.setAttribute('aria-label', 'Menu lateral');
    sidebar.hidden = true;
    sidebar.innerHTML = links
      .map(function (item) {
        const active = item.href === currentPage ? ' aria-current="page"' : '';
        return '<a href="' + item.href + '"' + active + '>' + item.label + '</a>';
      })
      .join('');
    document.body.appendChild(sidebar);
  }

  if (!sidebar.querySelector('a')) {
    sidebar.innerHTML = links
      .map(function (item) {
        const active = item.href === currentPage ? ' aria-current="page"' : '';
        return '<a href="' + item.href + '"' + active + '>' + item.label + '</a>';
      })
      .join('');
  }

  function setOpenState(isOpen) {
    document.body.classList.toggle('sidebar-open', isOpen);
    overlay.hidden = !isOpen;
    sidebar.hidden = !isOpen;
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  }

  function openMenu() {
    setOpenState(true);
  }

  function closeMenu() {
    setOpenState(false);
  }

  menuBtn.addEventListener('click', function () {
    const isOpen = document.body.classList.contains('sidebar-open');
    if (isOpen) closeMenu();
    else openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      closeMenu();
    }
  });

  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });
})();
