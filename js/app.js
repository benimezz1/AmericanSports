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


  let onboardingShouldOpenOnBootstrap = null;

  function initOnboarding(state, rerender) {
    if (!window.StorageService) return;
    const canOpen = onboardingShouldOpenOnBootstrap === null
      ? !StorageService.hasStoredSettings()
      : onboardingShouldOpenOnBootstrap;
    onboardingShouldOpenOnBootstrap = null;
    if (!canOpen) return;

    const leagues = ['NBA', 'NFL', 'NHL', 'MLB', 'MLS'];
    const suggestedTeams = [
      { id: 'lakers', league: 'NBA', name: 'Los Angeles Lakers', initials: 'LA' },
      { id: 'eagles', league: 'NFL', name: 'Philadelphia Eagles', initials: 'PHI' },
      { id: '49ers', league: 'NFL', name: 'San Francisco 49ers', initials: 'SF' }
    ];

    const onboardingState = {
      step: 1,
      name: 'Torcedor',
      leagues: new Set(['NBA', 'NFL']),
      favorites: new Set(suggestedTeams.map((team) => team.id)),
      theme: state.theme === 'light' ? 'light' : 'dark',
      language: state.language === 'en' ? 'en' : 'pt'
    };

    const modal = document.createElement('div');
    modal.className = 'welcome-overlay';
    modal.innerHTML = `
      <div class="welcome-backdrop" data-onboarding-close></div>
      <section class="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle" tabindex="-1">
        <button class="welcome-skip" type="button" data-onboarding-skip>Pular</button>
        <div class="welcome-progress"><span id="welcomeProgress">Passo 1 de 2</span></div>
        <div class="welcome-step welcome-step--active" data-step="1">
          <h2 id="welcomeTitle">Bem-vindo ao PlayNorth</h2>
          <p>Personalize sua experiência em poucos cliques.</p>
          <label class="welcome-label" for="welcomeName">Seu nome</label>
          <input id="welcomeName" class="welcome-input" maxlength="32" placeholder="Como você quer ser chamado?" />
          <div class="welcome-error" id="welcomeNameError" aria-live="polite"></div>
          <div class="welcome-actions">
            <button type="button" class="welcome-btn welcome-btn--primary" data-step-next>Continuar</button>
          </div>
        </div>
        <div class="welcome-step" data-step="2">
          <h2 id="welcomeTitleStep2">Preferências iniciais</h2>
          <p>Configure recomendações, aparência e idioma.</p>

          <h3>Escolha suas ligas</h3>
          <p class="welcome-sub">Vamos priorizar seu feed com base nisso.</p>
          <div class="welcome-chips" data-league-chips></div>

          <h3>Times sugeridos para seguir</h3>
          <div class="welcome-team-grid" data-team-grid></div>

          <h3>Aparência e idioma</h3>
          <div class="welcome-controls">
            <label>Tema</label>
            <div class="welcome-toggle-group" data-theme-toggle>
              <button type="button" data-theme="dark">Dark</button>
              <button type="button" data-theme="light">Light</button>
            </div>
            <label for="welcomeLanguage">Idioma</label>
            <select id="welcomeLanguage" class="welcome-select">
              <option value="pt">PT-BR</option>
              <option value="en">EN</option>
            </select>
          </div>

          <div class="welcome-actions">
            <button type="button" class="welcome-btn" data-step-back>Voltar</button>
            <button type="button" class="welcome-btn welcome-btn--primary" data-step-finish>Concluir</button>
          </div>
        </div>
      </section>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('is-visible'));

    const stepEls = Array.from(modal.querySelectorAll('.welcome-step'));
    const progress = modal.querySelector('#welcomeProgress');
    const nameInput = modal.querySelector('#welcomeName');
    const nameError = modal.querySelector('#welcomeNameError');
    const languageSelect = modal.querySelector('#welcomeLanguage');
    const chipsWrap = modal.querySelector('[data-league-chips]');
    const teamGrid = modal.querySelector('[data-team-grid]');

    function sparkle() {
      const sparkleWrap = document.createElement('div');
      sparkleWrap.className = 'welcome-sparkle';
      sparkleWrap.innerHTML = Array.from({ length: 18 }).map(() => '<span></span>').join('');
      modal.querySelector('.welcome-modal')?.appendChild(sparkleWrap);
      setTimeout(() => sparkleWrap.remove(), 800);
    }

    function close() {
      modal.classList.remove('is-visible');
      setTimeout(() => modal.remove(), 180);
      rerender();
    }

    function persist(skip = false) {
      if (skip) {
        StorageService.completeOnboarding({
          name: 'Torcedor',
          leagues: [],
          favorites: [],
          theme: onboardingState.theme,
          language: onboardingState.language
        });
        close();
        return;
      }

      const favoritesPayload = suggestedTeams
        .filter((team) => onboardingState.favorites.has(team.id))
        .map((team) => ({ league: team.league, teamId: team.id }));

      StorageService.completeOnboarding({
        name: onboardingState.name,
        leagues: Array.from(onboardingState.leagues),
        favorites: favoritesPayload,
        theme: onboardingState.theme,
        language: onboardingState.language
      });
      sparkle();
      setTimeout(close, 260);
    }

    function renderLeagueChips() {
      chipsWrap.innerHTML = leagues.map((league) => `
        <button type="button" class="welcome-chip ${onboardingState.leagues.has(league) ? 'is-active' : ''}" data-league="${league}">${league}</button>
      `).join('');
    }

    function renderTeamCards() {
      teamGrid.innerHTML = suggestedTeams.map((team) => {
        const isFollowing = onboardingState.favorites.has(team.id);
        return `
          <article class="welcome-team-card">
            <span class="welcome-badge">${team.league}</span>
            <div class="welcome-team-logo">${team.initials}</div>
            <strong>${team.name}</strong>
            <button type="button" class="welcome-btn ${isFollowing ? 'welcome-btn--primary' : ''}" data-team="${team.id}">${isFollowing ? 'Seguindo' : 'Seguir'}</button>
          </article>
        `;
      }).join('');
    }

    function syncStepFocus() {
      const selector = onboardingState.step === 1 ? '[data-step-next]' : '[data-step-finish]';
      modal.querySelector(selector)?.focus();
    }

    function renderStep() {
      stepEls.forEach((el) => el.classList.toggle('welcome-step--active', Number(el.dataset.step) === onboardingState.step));
      progress.textContent = `Passo ${onboardingState.step} de 2`;
      renderLeagueChips();
      renderTeamCards();
      languageSelect.value = onboardingState.language;
      const themeBtns = Array.from(modal.querySelectorAll('[data-theme]'));
      themeBtns.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.theme === onboardingState.theme));
      syncStepFocus();
    }

    function trapFocus(event) {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll('button, input, select, [href], [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    modal.addEventListener('click', (event) => {
      const closeBtn = event.target.closest('[data-onboarding-close], [data-onboarding-skip]');
      if (closeBtn) {
        persist(true);
        return;
      }

      const nextBtn = event.target.closest('[data-step-next]');
      if (nextBtn) {
        const typedName = String(nameInput.value || '').trim();
        if (typedName.length < 2) {
          nameError.textContent = 'Informe ao menos 2 caracteres.';
          nameInput.focus();
          return;
        }
        onboardingState.name = typedName;
        nameError.textContent = '';
        onboardingState.step = 2;
        renderStep();
        return;
      }

      if (event.target.closest('[data-step-back]')) {
        onboardingState.step = 1;
        renderStep();
        return;
      }

      if (event.target.closest('[data-step-finish]')) {
        persist(false);
        return;
      }

      const leagueBtn = event.target.closest('[data-league]');
      if (leagueBtn) {
        const league = leagueBtn.dataset.league;
        if (onboardingState.leagues.has(league)) onboardingState.leagues.delete(league);
        else onboardingState.leagues.add(league);
        renderLeagueChips();
        return;
      }

      const teamBtn = event.target.closest('[data-team]');
      if (teamBtn) {
        const teamId = teamBtn.dataset.team;
        if (onboardingState.favorites.has(teamId)) onboardingState.favorites.delete(teamId);
        else onboardingState.favorites.add(teamId);
        renderTeamCards();
      }
    });

    modal.querySelector('[data-theme-toggle]')?.addEventListener('click', (event) => {
      const themeBtn = event.target.closest('[data-theme]');
      if (!themeBtn) return;
      onboardingState.theme = themeBtn.dataset.theme === 'light' ? 'light' : 'dark';
      PlayNorthCore.applyTheme(onboardingState.theme);
      renderStep();
    });

    languageSelect.addEventListener('change', () => {
      onboardingState.language = languageSelect.value === 'en' ? 'en' : 'pt';
    });

    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        persist(true);
        return;
      }
      trapFocus(event);
    });

    renderStep();
  }

  async function renderPage() {
    const page = Router.getPageName();
    const currentLeague = Router.detectLeagueFromPage();
    const query = Router.getQueryParams();
    onboardingShouldOpenOnBootstrap = !StorageService.hasStoredSettings();
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
    initOnboarding(state, rerender);
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
      if (event.target.closest('#resetPreferences')) {
        StorageService.resetPreferences();
        rerender();
      }
      if (event.target.closest('#clearLocalData')) {
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
