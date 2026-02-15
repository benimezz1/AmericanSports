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

  function linksMarkup(linkClass) {
    return links
      .map(function (item) {
        const classes = [linkClass, item.href === currentPage ? 'active' : ''].filter(Boolean).join(' ');
        const active = item.href === currentPage ? ' aria-current=\"page\"' : '';
        const classAttr = classes ? ' class=\"' + classes + '\"' : '';
        return '<a href=\"' + item.href + '\"' + classAttr + active + '>' + item.label + '</a>';
      })
      .join('');
  }

  let menuBtn = document.getElementById('menuBtn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.id = 'menuBtn';
    menuBtn.className = 'hamburger';
    menuBtn.type = 'button';
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    headerBar.insertBefore(menuBtn, headerBar.firstChild);
  }

  menuBtn.type = 'button';
  menuBtn.setAttribute('aria-label', 'Abrir menu');
  menuBtn.setAttribute('aria-controls', 'sidebar');
  menuBtn.setAttribute('aria-expanded', 'false');

  const topNav = headerBar.querySelector('nav, .nav, .menu');
  if (topNav) {
    topNav.innerHTML = linksMarkup('navlink');
  }

  let overlay = document.getElementById('sidebarOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);
  }
  overlay.hidden = true;

  let sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    sidebar = document.createElement('aside');
    sidebar.id = 'sidebar';
    sidebar.setAttribute('aria-label', 'Menu lateral');
    document.body.appendChild(sidebar);
  }
  sidebar.hidden = true;
  sidebar.innerHTML = linksMarkup('');

  function setOpenState(isOpen) {
    document.body.classList.toggle('sidebar-open', isOpen);
    overlay.hidden = !isOpen;
    sidebar.hidden = !isOpen;
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  }

  function closeMenu() {
    setOpenState(false);
  }

  menuBtn.addEventListener('click', function () {
    setOpenState(!document.body.classList.contains('sidebar-open'));
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
