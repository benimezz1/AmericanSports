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


  function initTeamTabs(root, query = {}) {
    const tabs = Array.from(root.querySelectorAll('.tab-btn[data-tab]'));
    const panels = Array.from(root.querySelectorAll('.team-panel[data-panel]'));
    if (!tabs.length || !panels.length) return;

    const valid = new Set(panels.map((panel) => panel.dataset.panel));
    const league = String(query.league || '').toUpperCase();
    const teamId = String(query.team || '').toLowerCase();
    const storageKey = `teamTab:last:${league}:${teamId}`;

    function activate(inputKey, pushHash = true, persist = true) {
      const key = valid.has(inputKey) ? inputKey : 'noticias';
      tabs.forEach((btn) => {
        const active = btn.dataset.tab === key;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.setAttribute('tabindex', active ? '0' : '-1');
      });

      panels.forEach((panel) => {
        const active = panel.dataset.panel === key;
        panel.toggleAttribute('hidden', !active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      if (pushHash) history.replaceState(null, '', `#${key}`);
      if (persist) {
        try {
          localStorage.setItem(storageKey, key);
        } catch (error) {
          // noop
        }
      }
    }

    tabs.forEach((btn) => {
      if (btn.dataset.tabsBound === 'true') return;
      btn.dataset.tabsBound = 'true';
      btn.addEventListener('click', () => activate(btn.dataset.tab, true, true));
      btn.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const currentIndex = tabs.indexOf(btn);
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(currentIndex + offset + tabs.length) % tabs.length];
        next.focus();
        activate(next.dataset.tab, true, true);
      });
    });

    const hash = decodeURIComponent((location.hash || '').replace('#', '').trim());
    let initial = 'noticias';
    if (valid.has(hash)) {
      initial = hash;
    } else {
      try {
        const remembered = localStorage.getItem(storageKey);
        if (remembered && valid.has(remembered)) initial = remembered;
      } catch (error) {
        // noop
      }
    }
    activate(initial, false, false);

    if (root.dataset.teamHashBound !== 'true') {
      root.dataset.teamHashBound = 'true';
      window.addEventListener('hashchange', () => {
        const nextHash = decodeURIComponent((location.hash || '').replace('#', '').trim());
        if (valid.has(nextHash)) activate(nextHash, false, true);
      });
    }
  }

  async function loadLogosMap() {
    try {
      const response = await fetch('data/logos-map.json', { cache: 'no-store' });
      if (!response.ok) return [];
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    } catch (error) {
      return [];
    }
  }

  function applyLocalLogos(teams, logosMap) {
    if (!Array.isArray(teams) || !Array.isArray(logosMap) || !logosMap.length) return teams;
    const mapByInternal = new Map();
    logosMap.forEach((entry) => {
      if (entry?.internalId && entry?.logoPath) mapByInternal.set(`${entry.league}:${entry.internalId}`, entry.logoPath);
    });

    return teams.map((team) => {
      const key = `${team.league}:${team.id}`;
      const localLogo = mapByInternal.get(key);
      if (!localLogo) return team;
      return { ...team, logo: localLogo };
    });
  }

  async function detectTeamHeroDarkLogo(root) {
    const wrap = root.querySelector('.team-hero-logoWrap');
    const img = root.querySelector('.team-hero-logoImg');
    if (!wrap || !img) return;

    const evaluate = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let totalLum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 20) continue;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
          totalLum += luminance;
          count += 1;
        }
        if (!count) return;
        const avgLum = totalLum / count;
        wrap.classList.toggle('is-darkLogo', avgLum < 0.22);
      } catch (error) {
        wrap.classList.remove('is-darkLogo');
      }
    };

    if (img.complete) {
      evaluate();
      return;
    }
    img.addEventListener('load', evaluate, { once: true });
  }

  function syncThemeInputs(theme) {
    const settingThemeToggle = document.querySelector('[data-setting-theme]');
    if (settingThemeToggle) settingThemeToggle.checked = theme === 'dark';
  }

  async function loadData() {
    const teams = window.TEAMS_DATA || [];
    const logosMap = await loadLogosMap();
    return {
      teams: applyLocalLogos(teams, logosMap),
      games: window.GAMES_DATA || [],
      news: window.NEWS_DATA || [],
      standings: window.STANDINGS_DATA || {},
      watchGuide: window.WATCH_GUIDE_DATA || {}
    };
  }

  async function renderPage() {
    const page = Router.getPageName();
    const currentLeague = Router.detectLeagueFromPage();
    const query = Router.getQueryParams();
    let state = StorageService.getState();
    const data = await loadData();

    document.body.insertAdjacentHTML('afterbegin', UI.renderHub(page));

    const root = document.getElementById('page-root');
    if (!root) return;

    const rerender = () => {
      state = StorageService.getState();
      renderContent(root, page, currentLeague, query, data, state);
      detectTeamHeroDarkLogo(root);
      initTeamTabs(root, query);
    };

    rerender();
    bindMenu();
    PlayNorthCore.applyTheme(state.theme);
    syncThemeInputs(state.theme);

    document.getElementById('themeBtn')?.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      StorageService.setTheme(next);
      PlayNorthCore.applyTheme(next);
      syncThemeInputs(next);
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
        syncThemeInputs(next);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await renderPage();
    } catch (error) {
      console.error(error);
      const root = document.getElementById('page-root');
      if (root) root.innerHTML = '<div class="notice">Erro ao carregar dados da página.</div>';
    }
  });
})();
