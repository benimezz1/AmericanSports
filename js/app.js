(function () {
  function applyTheme(theme) {
    const resolved = theme === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('dark-mode', resolved === 'dark');
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.textContent = resolved === 'light' ? '☀' : '☾';
  }

  function bindMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (!menuBtn || !overlay || !sidebar) return;

    function setOpen(open) {
      document.body.classList.toggle('sidebar-open', open);
      overlay.hidden = !open;
      sidebar.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    }

    menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('sidebar-open')));
    overlay.addEventListener('click', () => setOpen(false));
    sidebar.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
  }

  function setSidebarMode(mode, page, league) {
    const resolved = mode === 'context' ? 'context' : 'global';
    StorageService.setSidebarMode(resolved);
    UI.renderSidebar({ mode: resolved, league, currentPage: page });
  }

  async function renderPage() {
    const page = Router.getPageName();
    const currentLeague = Router.detectLeagueFromPage();
    const query = Router.getQueryParams();
    const state = StorageService.getState();
    const provider = DataSources.getProvider(state.dataSource);
    const data = {
      teams: await provider.getTeams(),
      games: await provider.getGames(),
      news: await provider.getNews(),
      standings: await provider.getStandings(),
      watchGuide: window.WATCH_GUIDE_DATA || {}
    };

    document.body.insertAdjacentHTML('afterbegin', UI.renderHub(page, state.sidebarModePreference));
    UI.renderSidebar({ mode: state.sidebarModePreference, league: currentLeague, currentPage: page });

    const root = document.getElementById('page-root');
    if (!root) return;

    if (page === 'index.html') UI.renderHome(root, data, state);
    else if (Router.LEAGUES.map((league) => `${league.toLowerCase()}.html`).includes(page)) UI.renderLeaguePage(root, currentLeague, data, state);
    else if (page === 'games.html') UI.renderGames(root, data, state, query.league ? query.league.toUpperCase() : null);
    else if (page === 'standings.html') UI.renderStandings(root, data, state);
    else if (page === 'live.html') UI.renderLive(root);
    else if (page === 'team.html') UI.renderTeam(root, data, state, query);
    else if (page === 'settings.html') UI.renderSettings(root, data, state);

    bindMenu();
    applyTheme(state.theme);

    document.getElementById('themeBtn')?.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      StorageService.setTheme(next);
      applyTheme(next);
    });

    document.getElementById('sidebar')?.addEventListener('click', (event) => {
      const modeBtn = event.target.closest('[data-sidebar-mode]');
      if (modeBtn) setSidebarMode(modeBtn.dataset.sidebarMode, page, currentLeague);
    });

    root.addEventListener('click', (event) => {
      const favTeamBtn = event.target.closest('#favoriteTeamBtn');
      const followTeamBtn = event.target.closest('#followTeamBtn');
      const followPill = event.target.closest('[data-follow-team]');
      const followLeaguePill = event.target.closest('[data-follow-league]');

      if (favTeamBtn && query.league && query.team) {
        StorageService.setFavoriteTeam(query.league.toUpperCase(), query.team);
        location.reload();
      }
      if (followTeamBtn && query.league && query.team) {
        StorageService.toggleFollowTeam(query.league.toUpperCase(), query.team);
        location.reload();
      }
      if (followPill) {
        const [league, team] = followPill.dataset.followTeam.split(':');
        StorageService.toggleFollowTeam(league, team);
        location.reload();
      }
      if (followLeaguePill) {
        StorageService.toggleFollowLeague(followLeaguePill.dataset.followLeague);
        location.reload();
      }
      if (event.target.id === 'resetPreferences') {
        StorageService.resetPreferences();
        location.reload();
      }
    });

    root.addEventListener('change', (event) => {
      if (event.target.matches('[data-fav-league]')) {
        StorageService.toggleFavoriteLeague(event.target.dataset.favLeague);
      }
      if (event.target.matches('[data-fav-team]')) {
        const league = event.target.dataset.favTeam;
        const team = event.target.value;
        if (team) StorageService.setFavoriteTeam(league, team);
      }
      if (event.target.matches('#dataSourceSelect')) {
        const source = DataSources.setSelectedSource(event.target.value);
        StorageService.setDataSource(source);
        location.reload();
      }
      if (event.target.matches('#alertsSimulationToggle')) {
        StorageService.setAlertSimulation(event.target.checked);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderPage().catch((error) => {
      console.error(error);
      const root = document.getElementById('page-root');
      if (root) root.innerHTML = '<div class="notice">Erro ao carregar dados da página.</div>';
    });
  });
})();
