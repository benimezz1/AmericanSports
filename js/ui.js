(function () {
  const HUB_LINKS = [
    { label: 'Home', href: 'index.html' },
    { label: 'NFL', href: 'nfl.html' },
    { label: 'NBA', href: 'nba.html' },
    { label: 'NHL', href: 'nhl.html' },
    { label: 'MLB', href: 'mlb.html' },
    { label: 'MLS', href: 'mls.html' },
    { label: 'Jogos da Semana', href: 'games.html' },
    { label: 'Ranking / Standings', href: 'standings.html' }
  ];

  const GLOBAL_SIDEBAR_ITEMS = [
    { label: '🔥 Ao Vivo', href: 'live.html' },
    { label: '📅 Próximos Jogos', href: 'games.html' },
    { label: '📰 Notícias', href: 'news.html' },
    { label: '⭐ Favoritos', href: 'favorites.html' },
    { label: '⚙️ Configurações', href: 'settings.html' }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function getTeamName(teams, id) {
    return teams.find((team) => team.id === id)?.name || id;
  }

  function watchGuideMarkup(league, watchGuide, compact = false) {
    const entry = watchGuide[league];
    if (!entry) return '';
    const text = compact ? entry.gameNote : entry.leagueNote;
    return `<p class="watch-guide ${compact ? 'compact' : ''}">📺 Onde assistir (Brasil): ${escapeHtml(text)}</p>`;
  }

  function renderHub(currentPage, sidebarMode) {
    const links = HUB_LINKS.map((item) => {
      const active = item.href === currentPage ? 'active' : '';
      return `<a class="navlink ${active}" href="${item.href}">${item.label}</a>`;
    }).join('');
    const contextMode = sidebarMode === 'context';

    return `
      <header>
        <div class="container navbar">
          <button id="menuBtn" class="hamburger" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <a class="brand" href="index.html"><div class="brand-badge"></div><span>PlayNorth</span></a>
          <nav>${links}</nav>
          <button id="sidebarModeQuickToggle" class="sidebar-mode-quick" type="button" aria-pressed="${contextMode}" aria-label="${contextMode ? 'Alternar para modo global da sidebar' : 'Alternar para modo contextual da sidebar'}">${contextMode ? '≪≪≪' : '≫≫≫'}</button>
          <button id="themeBtn" class="theme-toggle" type="button" aria-label="Alternar tema"></button>
        </div>
      </header>
      <div id="sidebarOverlay" hidden></div>
      <aside id="sidebar" hidden></aside>
    `;
  }

  function getContextualItems(league) {
    if (!league) return [];
    return [
      { label: `${league === 'NBA' ? '🏀' : '🏈'} Visão Geral`, href: `${league.toLowerCase()}.html` },
      { label: '📅 Jogos', href: `games.html?league=${league}` },
      { label: '🏆 Standings', href: `standings.html#${league}` },
      { label: '📊 Estatísticas', href: `stats.html?league=${league}` },
      { label: '👥 Times', href: `teams.html?league=${league}` },
      { label: `📰 Notícias ${league}`, href: `${league.toLowerCase()}.html` }
    ];
  }

  function renderSidebar({ mode, league, currentPage }) {
    const sidebar = document.getElementById('sidebar');
    const modeTitle = league || 'Esta Liga';
    const contextual = getContextualItems(league);
    const items = mode === 'context' && contextual.length ? contextual : GLOBAL_SIDEBAR_ITEMS;

    sidebar.innerHTML = `
      <div class="sidebar-toggle">
        <button class="pill ${mode === 'global' ? 'active' : ''}" data-sidebar-mode="global" aria-pressed="${mode === 'global'}">Global</button>
        <button class="pill ${mode === 'context' ? 'active' : ''}" data-sidebar-mode="context" aria-pressed="${mode === 'context'}">${modeTitle}</button>
      </div>
      <div class="sidebar-links">
        ${items.map((item) => {
          const active = item.href.split('?')[0] === currentPage ? 'aria-current="page"' : '';
          return `<a href="${item.href}" ${active}>${item.label}</a>`;
        }).join('')}
      </div>
    `;
  }

  function card(title, subtitle, extra = '') {
    return `<article class="card"><div class="card-body"><h3 class="title small">${escapeHtml(title)}</h3><p class="desc">${escapeHtml(subtitle)}</p>${extra}</div></article>`;
  }

  function teamLink(league, teamId, label) {
    return `<a href="team.html?league=${league}&team=${teamId}">${escapeHtml(label)}</a>`;
  }

  function renderHome(root, data, state) {
    const leaguesOrdered = Sorter.sortByUserPriority(
      Router.LEAGUES.map((league) => ({ league, teams: data.teams.filter((team) => team.league === league).map((team) => team.id), trending: true })),
      state
    ).map((item) => item.league);

    const leagueCards = leaguesOrdered.map((league) => {
      const teams = data.teams.filter((team) => team.league === league).slice(0, 2);
      return card(league, teams.map((team) => team.name).join(' • '), `<div class="meta"><a href="${league.toLowerCase()}.html">Abrir hub</a></div>${watchGuideMarkup(league, data.watchGuide, true)}`);
    }).join('');

    const upcoming = Sorter.sortByUserPriority(data.games.filter((game) => game.status === 'upcoming'), state)
      .slice(0, 6)
      .map((game) => {
        const home = getTeamName(data.teams, game.teamHome);
        const away = getTeamName(data.teams, game.teamAway);
        return card(`${away} @ ${home}`, new Date(game.datetime).toLocaleString('pt-BR'), `<div class="meta">${teamLink(game.league, game.teamAway, away)} • ${teamLink(game.league, game.teamHome, home)}</div>${watchGuideMarkup(game.league, data.watchGuide, true)}`);
      }).join('');

    root.innerHTML = `
      <section class="section"><div class="section-head"><div><h2>Home</h2><p>Hub com prioridade inteligente de conteúdo.</p></div></div><div class="grid">${leagueCards}</div></section>
      <section class="section"><div class="section-head"><div><h2>Próximos Jogos</h2></div><a href="games.html">Ver todos</a></div><div class="grid">${upcoming}</div></section>
    `;
  }

  function renderLeaguePage(root, league, data, state) {
    const teams = data.teams.filter((team) => team.league === league);
    const news = Sorter.sortByUserPriority(data.news.filter((item) => item.league === league), state)
      .map((item) => card(item.title, item.summary, `<div class="meta">${new Date(item.date).toLocaleDateString('pt-BR')}</div>`)).join('');

    const teamCards = Sorter.sortByUserPriority(teams.map((team) => ({ ...team, teams: [team.id] })), state)
      .map((team) => {
        const followed = (state.followedTeamsByLeague[league] || []).includes(team.id);
        return card(team.name, `Sigla: ${team.abbreviation}`, `<div class="meta">${teamLink(league, team.id, 'Abrir time')}</div><div class="pills"><button class="pill ${followed ? 'active' : ''}" data-follow-team="${league}:${team.id}">${followed ? '✓ Acompanhando' : 'Acompanhar'}</button></div>`);
      }).join('');

    root.innerHTML = `
      <section class="section"><div class="section-head"><div><h2>${league}</h2><p>Página modular da liga.</p></div></div><div class="card"><div class="card-body">${watchGuideMarkup(league, data.watchGuide)}</div></div></section>
      <section class="section"><div class="section-head"><div><h2>Times em destaque</h2></div></div><div class="grid">${teamCards}</div></section>
      <section class="section"><div class="section-head"><div><h2>Notícias ${league}</h2></div></div><div class="grid">${news}</div></section>
    `;
  }

  function renderGames(root, data, state, leagueFilter) {
    const filtered = leagueFilter ? data.games.filter((game) => game.league === leagueFilter) : data.games;
    const cards = Sorter.sortByUserPriority(filtered, state).map((game) => {
      const home = getTeamName(data.teams, game.teamHome);
      const away = getTeamName(data.teams, game.teamAway);
      return card(`${game.league} • ${away} @ ${home}`, `${new Date(game.datetime).toLocaleString('pt-BR')} • ${game.status}`, `<div class="meta">${teamLink(game.league, game.teamAway, away)} • ${teamLink(game.league, game.teamHome, home)}</div>${watchGuideMarkup(game.league, data.watchGuide, true)}`);
    }).join('');
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Jogos da Semana</h2></div></div><div class="grid">${cards}</div></section>`;
  }

  function renderStandings(root, data) {
    const blocks = Router.LEAGUES.map((league) => {
      const rows = (data.standings[league] || []).map((team, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(team.team)}</td><td>${team.w}-${team.l}</td><td>${team.streak || '-'}</td></tr>`).join('');
      return `<article class="card" id="${league}"><div class="card-body"><h3 class="title small">${league}</h3><div class="tablewrap"><table><thead><tr><th>#</th><th>Time</th><th>Campanha</th><th>Trend</th></tr></thead><tbody>${rows}</tbody></table></div></div></article>`;
    }).join('');
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Ranking / Standings</h2></div></div><div class="grid">${blocks}</div></section>`;
  }

  function renderLive(root) {
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Ao Vivo</h2></div></div><div class="notice">No momento, ainda não conseguimos acessar os placares ao vivo.<br>Estamos trabalhando para trazer essa funcionalidade em breve.</div></section>`;
  }

  function renderTeam(root, data, state, query) {
    const league = (query.league || '').toUpperCase();
    const team = data.teams.find((item) => item.league === league && item.id === query.team);
    if (!team) {
      root.innerHTML = '<div class="notice">Time não encontrado.</div>';
      return;
    }

    const nextGames = data.games.filter((game) => game.league === league && (game.teamHome === team.id || game.teamAway === team.id));
    const teamNews = data.news.filter((item) => item.league === league && item.teams.includes(team.id));
    const favorite = state.favoriteTeamByLeague[league] === team.id;
    const followed = (state.followedTeamsByLeague[league] || []).includes(team.id);

    root.innerHTML = `
      <section class="section"><div class="section-head"><div><h2>${team.name}</h2><p>${league}</p></div></div><div class="pills"><button class="pill ${favorite ? 'active' : ''}" id="favoriteTeamBtn" aria-pressed="${favorite}">⭐ Favoritar</button><button class="pill ${followed ? 'active' : ''}" id="followTeamBtn" aria-pressed="${followed}">${followed ? '✓ Acompanhando' : 'Acompanhar'}</button></div>${watchGuideMarkup(league, data.watchGuide, true)}</section>
      <section class="section"><div class="section-head"><div><h2>Próximos Jogos</h2></div></div><div class="grid">${nextGames.map((game) => card(`${getTeamName(data.teams, game.teamAway)} @ ${getTeamName(data.teams, game.teamHome)}`, new Date(game.datetime).toLocaleString('pt-BR'))).join('')}</div></section>
      <section class="section"><div class="section-head"><div><h2>Notícias do Time</h2></div></div><div class="grid">${teamNews.map((item) => card(item.title, item.summary)).join('')}</div></section>
    `;
  }

  function renderSettings(root, data, state) {
    const leagueOptions = Router.LEAGUES.map((league) => `<label class="setting-row"><input type="checkbox" data-fav-league="${league}" ${state.favoritesLeagues.includes(league) ? 'checked' : ''}> Liga favorita: ${league}</label>`).join('');
    const favoriteTeams = Router.LEAGUES.map((league) => {
      const options = data.teams.filter((team) => team.league === league).map((team) => `<option value="${team.id}" ${state.favoriteTeamByLeague[league] === team.id ? 'selected' : ''}>${team.name}</option>`).join('');
      return `<label class="setting-row">Time favorito ${league}<select data-fav-team="${league}"><option value="">Nenhum</option>${options}</select></label>`;
    }).join('');

    const leagueFollowPills = Router.LEAGUES.map((league) => `<button class="pill ${state.followedLeagues.includes(league) ? 'active' : ''}" data-follow-league="${league}">${state.followedLeagues.includes(league) ? '✓' : ''} Acompanhar ${league}</button>`).join('');

    const followedTeams = Router.LEAGUES.map((league) => {
      const selected = state.followedTeamsByLeague[league] || [];
      const pills = data.teams.filter((team) => team.league === league).map((team) => `<button class="pill ${selected.includes(team.id) ? 'active' : ''}" data-follow-team="${league}:${team.id}">${selected.includes(team.id) ? '✓ ' : ''}${team.name}</button>`).join('');
      return `<div class="section"><div class="section-head"><div><h2>Acompanhar times ${league}</h2></div></div><div class="pills">${pills}</div></div>`;
    }).join('');

    const alertExamples = [
      '🔔 Lakers x Celtics começa em 30 min (simulação).',
      '🔔 Chiefs confirmaram lista de inativos (simulação).',
      '🔔 Nova notícia da sua liga seguida foi publicada (simulação).'
    ].map((text) => `<li>${text}</li>`).join('');

    const sourceOptions = [
      { value: 'static', label: 'Static (JSON)' },
      { value: 'espn', label: 'ESPN (em breve)' },
      { value: 'sportsdata', label: 'SportsData (em breve)' }
    ].map((source) => `<option value="${source.value}" ${state.dataSource === source.value ? 'selected' : ''} ${source.value === 'static' ? '' : 'disabled'}>${source.label}</option>`).join('');

    root.innerHTML = `
      <section class="section"><div class="section-head"><div><h2>Configurações</h2></div></div>
        <div class="card"><div class="card-body">${leagueOptions}${favoriteTeams}
          <label class="setting-row">Fonte de dados<select id="dataSourceSelect">${sourceOptions}</select></label>
          <label class="setting-row"><input id="alertsSimulationToggle" type="checkbox" ${state.alertSimulationEnabled ? 'checked' : ''}> Ativar alertas simulados</label>
          <button class="pill" id="resetPreferences">Resetar preferências</button>
        </div></div>
      </section>
      <section class="section"><div class="section-head"><div><h2>Ligas seguidas</h2></div></div><div class="pills">${leagueFollowPills}</div></section>
      ${followedTeams}
      <section class="section"><div class="section-head"><div><h2>Alertas (simulação)</h2></div></div><div class="card"><div class="card-body"><ul class="alerts-list">${alertExamples}</ul></div></div></section>
    `;
  }

  window.UI = { renderHub, renderSidebar, renderHome, renderLeaguePage, renderGames, renderStandings, renderLive, renderTeam, renderSettings };
})();
