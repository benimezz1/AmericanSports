(function () {
  const headerBar = document.querySelector('header .navbar');
  document.body.classList.add('nav-mounted');
  if (!headerBar || document.getElementById('siteSidebar')) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'site-nav-toggle';
  toggle.id = 'siteNavToggle';
  toggle.setAttribute('aria-label', 'Abrir menu de navegação');
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
  sidebar.setAttribute('aria-label', 'Menu lateral');
  sidebar.hidden = true;
  sidebar.innerHTML = `
    <h2 class="title">Menu</h2>
    <nav>
      <a class="menu-link" href="index.html">Início</a>
      <a class="menu-link" href="form.html">Começar</a>
      <a class="menu-link" href="final.html">Perguntas finais (beta)</a>
      <a class="menu-link" href="result.html">Treino da semana</a>
      <a class="menu-link" href="result.html#cinco-semanas">5 semanas</a>
      <button class="menu-action" type="button" data-action="print">Baixar PDF</button>
    </nav>
  `;

  document.body.append(overlay, sidebar);

  const firstFocusable = () => sidebar.querySelector('a,button');
  let lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    sidebar.hidden = false;
    overlay.hidden = false;
    document.body.classList.add('sidebar-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu de navegação');
    const first = firstFocusable();
    if (first) first.focus();
  }

  function closeMenu() {
    document.body.classList.remove('sidebar-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu de navegação');
    setTimeout(() => {
      sidebar.hidden = true;
      overlay.hidden = true;
    }, 250);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    } else {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('sidebar-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      closeMenu();
    }
  });

  sidebar.addEventListener('click', (event) => {
    const printTrigger = event.target.closest('[data-action="print"]');
    if (printTrigger) {
      closeMenu();
      window.print();
      return;
    }

    if (event.target.closest('a')) {
      closeMenu();
    }
  });
})();
