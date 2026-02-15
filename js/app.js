(function () {
  function getData() {
    return {
      teams: window.TEAMS_DATA || [],
      games: window.GAMES_DATA || [],
      news: window.NEWS_DATA || []
    };
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme !== 'light');
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.textContent = theme === 'light' ? '☀' : '☾';
  }

  function bindMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const overlay = document.getElementById('sidebarOverlay');
    if (!menuBtn || !overlay) return;

    function setOpen(open) {
      document.body.classList.toggle('sidebar-open', open);
      overlay.hidden = !open;
      document.getElementById('sidebar').hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    }

    menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('sidebar-open')));
    overlay.addEventListener('click', () => setOpen(false));
    document.getElementById('sidebar').addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
  }

  function renderPage() {
    const page = Router.getPageName();
    const currentLeague = Router.detectLeagueFromPage();
    const query = Router.getQueryParams();
    const state = StorageService.getState();
    const data = getData();

    document.body.insertAdjacentHTML('afterbegin', UI.renderHub(page));
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
      if (modeBtn) {
        StorageService.setSidebarMode(modeBtn.dataset.sidebarMode);
        UI.renderSidebar({ mode: modeBtn.dataset.sidebarMode, league: currentLeague, currentPage: page });
      }
    });

    root.addEventListener('click', (event) => {
      const favTeamBtn = event.target.closest('#favoriteTeamBtn');
      const followTeamBtn = event.target.closest('#followTeamBtn');
      const followPill = event.target.closest('[data-follow-team]');

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
    });
  }

  document.addEventListener('DOMContentLoaded', renderPage);
})();
