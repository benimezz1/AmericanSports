(function () {
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

  function renderContent(root, page, currentLeague, query, data, state) {
    UI.renderSidebar({ league: currentLeague, currentPage: page, sidebarScope: state.sidebarScope });

    if (page === 'index.html') UI.renderHome(root, data, state);
    else if (Router.LEAGUES.map((league) => `${league.toLowerCase()}.html`).includes(page)) UI.renderLeaguePage(root, currentLeague, data, state);
    else if (page === 'games.html') UI.renderGames(root, data, state, query.league ? query.league.toUpperCase() : null);
    else if (page === 'standings.html') UI.renderStandings(root, data);
    else if (page === 'live.html') UI.renderLive(root);
    else if (page === 'team.html') UI.renderTeam(root, data, state, query);
    else if (page === 'favorites.html') UI.renderFavorites(root, data, state);
    else if (page === 'settings.html' || page === 'configuracoes.html') UI.renderSettings(root, data, state);
    else if (page === 'preferencias.html') UI.renderPreferences(root, data, state);
    else if (page === 'news.html') UI.renderNewsList(root, data, state, query);
    else if (page === 'noticia.html') UI.renderNewsArticle(root, data, query);
    else if (page === 'teams.html') UI.renderTeams(root, data, query);
    else if (page === 'stats.html') UI.renderStats(root, data, query);
    else root.innerHTML = '<div class="notice">Página não encontrada.</div>';
  }


  function bindTeamTabs(root) {
    if (root.dataset.teamTabsBound === 'true') return;
    root.dataset.teamTabsBound = 'true';
    const copy = {
      news: ['Painel do time', 'Visão de dashboard com contexto e momentum.'],
      stats: ['Estatísticas', 'Indicadores premium da equipe (preview).'],
      compare: ['Comparação', 'Bloco editorial comparativo (preview).'],
      history: ['Histórico', 'Linha do tempo e marcos recentes (preview).']
    };

    root.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-team-tab]');
      if (!tab) return;
      const key = tab.dataset.teamTab;
      const tabs = Array.from(root.querySelectorAll('[data-team-tab]'));
      const panels = Array.from(root.querySelectorAll('[data-team-panel]'));
      const title = root.querySelector('[data-team-tab-title]');
      const subtitle = root.querySelector('[data-team-tab-subtitle]');
      tabs.forEach((btn) => btn.classList.toggle('is-active', btn === tab));
      panels.forEach((panel) => panel.classList.toggle('is-hidden', panel.dataset.teamPanel !== key));
      if (title) title.textContent = copy[key]?.[0] || 'Painel do time';
      if (subtitle) subtitle.textContent = copy[key]?.[1] || '';
    });
  }

  function loadData() {
    return {
      teams: window.TEAMS_DATA || [],
      games: window.GAMES_DATA || [],
      news: window.NEWS_DATA || [],
      standings: window.STANDINGS_DATA || {},
      watchGuide: window.WATCH_GUIDE_DATA || {}
    };
  }

  function renderPage() {
    const page = Router.getPageName();
    const currentLeague = Router.detectLeagueFromPage();
    const query = Router.getQueryParams();
    let state = StorageService.getState();
    const data = loadData();

    document.body.insertAdjacentHTML('afterbegin', UI.renderHub(page));

    const root = document.getElementById('page-root');
    if (!root) return;

    const rerender = () => {
      state = StorageService.getState();
      renderContent(root, page, currentLeague, query, data, state);
    };

    rerender();
    bindMenu();
    bindTeamTabs(root);
    PlayNorthCore.applyTheme(state.theme);

    document.getElementById('themeBtn')?.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      StorageService.setTheme(next);
      PlayNorthCore.applyTheme(next);
    });

    root.addEventListener('click', (event) => {
      const favTeamBtn = event.target.closest('#favoriteTeamBtn, #btnFavorite');
      const followTeamBtn = event.target.closest('#followTeamBtn, #btnFollow');
      const favoritePill = event.target.closest('[data-favorite-team]');
      const followPill = event.target.closest('[data-follow-team]');
      const followLeaguePill = event.target.closest('[data-follow-league]');

      if (favTeamBtn && query.league && query.team) {
        StorageService.toggleFavoriteTeam(query.league.toUpperCase(), query.team);
        rerender();
      }
      if (followTeamBtn && query.league && query.team) {
        StorageService.toggleFollowTeam(query.league.toUpperCase(), query.team);
        rerender();
      }
      if (favoritePill) {
        const [league, team] = favoritePill.dataset.favoriteTeam.split(':');
        StorageService.toggleFavoriteTeam(league, team);
        rerender();
      }
      if (followPill) {
        const [league, team] = followPill.dataset.followTeam.split(':');
        StorageService.toggleFollowTeam(league, team);
        rerender();
      }
      if (followLeaguePill) {
        StorageService.toggleFollowLeague(followLeaguePill.dataset.followLeague);
        rerender();
      }
      if (event.target.id === 'resetPreferences') {
        StorageService.resetPreferences();
        rerender();
      }
      if (event.target.id === 'clearLocalData') {
        StorageService.clearLocalData();
        location.reload();
      }
    });

    document.getElementById('sidebar')?.addEventListener('click', (event) => {
      const sidebarScopeBtn = event.target.closest('[data-sidebar-scope]');
      if (!sidebarScopeBtn) return;
      StorageService.setSidebarScope(sidebarScopeBtn.dataset.sidebarScope);
      rerender();
    });

    root.addEventListener('change', (event) => {
      if (event.target.matches('[data-pref-favorite-team]')) {
        const league = event.target.dataset.prefFavoriteTeam;
        const team = event.target.value;
        StorageService.setFavoriteTeam(league, team);
        rerender();
      }
      if (event.target.matches('[data-language]')) {
        StorageService.setLanguage(event.target.value);
        rerender();
      }
      if (event.target.matches('[data-setting-theme]')) {
        const next = event.target.checked ? 'dark' : 'light';
        StorageService.setTheme(next);
        PlayNorthCore.applyTheme(next);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      renderPage();
    } catch (error) {
      console.error(error);
      const root = document.getElementById('page-root');
      if (root) root.innerHTML = '<div class="notice">Erro ao carregar dados da página.</div>';
    }
  });
})();
