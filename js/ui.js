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
    { label: '🏠 Home', href: 'index.html' },
    { label: '🔥 Ao Vivo', href: 'live.html' },
    { label: '📅 Próximos Jogos', href: 'games.html' },
    { label: '📰 Notícias', href: 'news.html' },
    { label: '⭐ Favoritos', href: 'favorites.html' },
    { label: '🎯 Preferências', href: 'preferencias.html' },
    { label: '⚙️ Configurações', href: 'configuracoes.html' }
  ];


  function getLeagueTeamEntries(data, league) {
    return data.teams
      .filter((item) => item.league === league)
      .map((team) => ({ id: team.id, name: team.name }));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function getTeamName(teams, id) {
    return teams.find((team) => team.id === id)?.name || id;
  }

  function newsLink(index) {
    return `noticia.html?id=${index}`;
  }

  function watchGuideMarkup(league, watchGuide, compact = false) {
    const entry = watchGuide[league];
    if (!entry) return '';
    const text = compact ? entry.gameNote : entry.leagueNote;
    return `<p class="watch-guide ${compact ? 'compact' : ''}">📺 Onde assistir (Brasil): ${escapeHtml(text)}</p>`;
  }

  function renderHub(currentPage) {
    const links = HUB_LINKS.map((item) => {
      const active = item.href === currentPage ? 'active' : '';
      return `<a class="navlink ${active}" href="${item.href}">${item.label}</a>`;
    }).join('');

    return `
      <header>
        <div class="container navbar">
          <button id="menuBtn" class="hamburger" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <a class="brand" href="index.html"><div class="brand-badge"></div><span>PlayNorth</span></a>
          <nav>${links}</nav>
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
      { label: `🏟️ ${league} Hub`, href: `${league.toLowerCase()}.html` },
      { label: '📅 Jogos', href: `games.html?league=${league}` },
      { label: '🏆 Standings', href: `standings.html#${league}` },
      { label: '📊 Estatísticas', href: `stats.html?league=${league}` },
      { label: '👥 Times', href: `teams.html?league=${league}` }
    ];
  }

  function renderSidebar({ league, currentPage, sidebarScope = 'global' }) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const hasLeagueContext = Boolean(league);
    const contextual = hasLeagueContext ? getContextualItems(league) : [];
    const activeScope = hasLeagueContext && sidebarScope === 'league' ? 'league' : 'global';

    const globalItemsHtml = `<div class="sidebar-links">${GLOBAL_SIDEBAR_ITEMS.map((item) => {
      const active = item.href.split('?')[0] === currentPage ? 'aria-current="page"' : '';
      return `<a href="${item.href}" ${active}>${item.label}</a>`;
    }).join('')}</div>`;

    const leagueItemsHtml = contextual.length ? `<div class="sidebar-links">${contextual.map((item) => {
      const active = item.href.split('?')[0] === currentPage ? 'aria-current="page"' : '';
      return `<a href="${item.href}" ${active}>${item.label}</a>`;
    }).join('')}</div>` : '';

    const scopeToggle = hasLeagueContext ? `<div class="sidebar-scope-toggle" role="group" aria-label="Escopo do menu lateral">
      <button type="button" class="sidebar-scope-btn ${activeScope === 'global' ? 'active' : ''}" data-sidebar-scope="global" aria-pressed="${activeScope === 'global'}">Geral</button>
      <button type="button" class="sidebar-scope-btn ${activeScope === 'league' ? 'active' : ''}" data-sidebar-scope="league" aria-pressed="${activeScope === 'league'}">${league}</button>
    </div>` : '';

    const linksMarkup = activeScope === 'league' && leagueItemsHtml ? leagueItemsHtml : globalItemsHtml;
    sidebar.innerHTML = `${scopeToggle}${scopeToggle ? '<div class="sidebar-divider" aria-hidden="true"></div>' : ''}${linksMarkup}`;
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
      .map((item) => card(item.title, item.summary, `<div class="meta"><a href="${newsLink(data.news.indexOf(item))}">Ler notícia</a></div>`)).join('');

    const teamCards = Sorter.sortByUserPriority(teams.map((team) => ({ ...team, teams: [team.id] })), state)
      .map((team) => {
        const favorite = state.favoriteTeam[league] === team.id;
        const followed = (state.followedTeams[league] || []).includes(team.id);
        const followDisabled = favorite ? 'disabled aria-disabled="true" title="Times favoritos são sempre seguidos"' : '';
        const statusLabel = favorite ? '<span class="team-status-favorite">⭐ Favorito</span>' : (followed ? '<span class="team-status-following">✓ Acompanhando</span>' : '');
        return card(team.name, `Sigla: ${team.abbreviation}`, `<div class="meta">${teamLink(league, team.id, 'Abrir time')}</div><div class="team-status-row">${statusLabel}</div><div class="pills"><button class="pill ${favorite ? 'active' : ''}" data-favorite-team="${league}:${team.id}" aria-pressed="${favorite}">${favorite ? '⭐ Favorito' : '⭐ Favoritar'}</button><button class="pill ${followed ? 'active' : ''}" data-follow-team="${league}:${team.id}" ${followDisabled}>${favorite ? '✓ Seguindo' : (followed ? '✓ Acompanhando' : 'Acompanhar')}</button></div>`);
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
    root.innerHTML = '<section class="section"><div class="section-head"><div><h2>Ao Vivo</h2></div></div><div class="notice">No momento, ainda não conseguimos acessar os placares ao vivo.<br>Estamos trabalhando para trazer essa funcionalidade em breve.</div></section>';
  }

  function renderTeams(root, data, query) {
    const filter = (query.league || '').toUpperCase();
    const teams = data.teams.filter((team) => !filter || team.league === filter);
    const cards = teams.map((team) => card(team.name, `${team.league} • ${team.abbreviation}`, `<div class="meta">${teamLink(team.league, team.id, 'Abrir time')}</div>`)).join('');
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Times</h2><p>${filter ? `Liga ${filter}` : 'Todas as ligas'}</p></div></div><div class="grid">${cards}</div></section>`;
  }

  function renderStats(root, data, query) {
    const filter = (query.league || '').toUpperCase();
    const leagues = filter ? [filter] : Router.LEAGUES;
    const cards = leagues.map((league) => {
      const games = data.games.filter((game) => game.league === league);
      const upcoming = games.filter((game) => game.status === 'upcoming').length;
      const live = games.filter((game) => game.status === 'live').length;
      return card(`Estatísticas ${league}`, `Jogos cadastrados: ${games.length}`, `<div class="meta"><span>Ao vivo: ${live}</span><span>Próximos: ${upcoming}</span></div>`);
    }).join('');
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Estatísticas</h2></div></div><div class="grid">${cards}</div></section>`;
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
    const favorite = state.favoriteTeam[league] === team.id;
    const followed = (state.followedTeams[league] || []).includes(team.id);

    const followDisabled = favorite ? 'disabled aria-disabled="true" title="Times favoritos são sempre seguidos"' : '';

    root.innerHTML = `
      <section class="section"><div class="section-head"><div><h2>${team.name}</h2><p>${league}</p></div></div><div class="pills"><button class="pill ${favorite ? 'active' : ''}" id="favoriteTeamBtn" aria-pressed="${favorite}">${favorite ? '⭐ Favorito' : '⭐ Favoritar'}</button><button class="pill ${followed ? 'active' : ''}" id="followTeamBtn" aria-pressed="${followed}" ${followDisabled}>${favorite ? '✓ Seguindo' : (followed ? '✓ Acompanhando' : 'Acompanhar')}</button></div>${watchGuideMarkup(league, data.watchGuide, true)}</section>
      <section class="section"><div class="section-head"><div><h2>Próximos Jogos</h2></div></div><div class="grid">${nextGames.map((game) => card(`${getTeamName(data.teams, game.teamAway)} @ ${getTeamName(data.teams, game.teamHome)}`, new Date(game.datetime).toLocaleString('pt-BR'))).join('')}</div></section>
      <section class="section"><div class="section-head"><div><h2>Notícias do Time</h2></div></div><div class="grid">${teamNews.map((item) => card(item.title, item.summary, `<div class="meta"><a href="${newsLink(data.news.indexOf(item))}">Ler notícia</a></div>`)).join('')}</div></section>
    `;
  }

  function renderNewsList(root, data, state, query) {
    const filter = (query.league || '').toUpperCase();
    const items = data.news
      .map((item, index) => ({ ...item, __index: index }))
      .filter((item) => !filter || item.league === filter);

    const cards = Sorter.sortByUserPriority(items, state)
      .map((item) => card(item.title, item.summary, `<div class="meta"><span>${item.league}</span><span>${new Date(item.date).toLocaleDateString('pt-BR')}</span><a href="${newsLink(item.__index)}">Ler notícia</a></div>`))
      .join('');

    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Notícias</h2><p>${filter ? `Cobertura ${filter}` : 'Todas as ligas'}</p></div></div><div class="grid">${cards}</div></section>`;
  }

  function renderNewsArticle(root, data, query) {
    const articleId = Number(query.id);
    const article = Number.isInteger(articleId) ? data.news[articleId] : null;
    if (!article) {
      root.innerHTML = '<div class="notice">Notícia não encontrada.</div>';
      return;
    }

    const teams = article.teams.map((teamId) => getTeamName(data.teams, teamId)).join(' • ');
    root.innerHTML = `
      <section class="section">
        <div class="section-head"><div><h2>${escapeHtml(article.title)}</h2><p>${article.league} • ${new Date(article.date).toLocaleString('pt-BR')}</p></div><a href="news.html">Voltar</a></div>
        <article class="card news-article"><div class="card-body"><p class="desc">${escapeHtml(article.summary)}</p><p class="news-article-text">${escapeHtml(article.summary)} Esta matéria acompanha os times ${escapeHtml(teams)} e será atualizada ao longo da semana com novos detalhes.</p></div></article>
      </section>
    `;
  }


  function renderFavorites(root, data, state) {
    const followedLeagues = state.followLeagues || state.followedLeagues;
    const hasFollowedLeagues = followedLeagues.length > 0;

    const leaguesGridMarkup = followedLeagues.map((league) => {
      const favoriteId = state.favoriteTeam[league];
      const hasFavorite = Boolean(favoriteId) && favoriteId !== 'none';
      const followedTeamIds = state.followedTeams[league] || [];
      const followedTeamChips = followedTeamIds.map((teamId) => `<span class="league-pill">${escapeHtml(getTeamName(data.teams, teamId))}</span>`).join('');

      return `
        <article class="league-card">
          <header class="league-card-head">
            <span class="league-card-badge">${league}</span>
            <a class="league-card-link" href="preferencias.html">Preferências</a>
          </header>
          <div class="league-card-block">
            <p class="league-card-label">Favorito</p>
            ${hasFavorite
      ? `<p class="league-card-favorite">${teamLink(league, favoriteId, getTeamName(data.teams, favoriteId))}</p>`
      : `<div class="league-card-empty"><p class="league-card-empty-title">Nenhum favorito definido.</p><p class="league-card-empty-text">Explore os times desta liga e comece a acompanhar seus favoritos.</p><a class="league-card-empty-link" href="preferencias.html">Ir para Preferências</a></div>`}
          </div>
          <div class="league-card-block">
            <p class="league-card-label">Times seguidos</p>
            ${followedTeamIds.length
      ? `<div class="league-card-pills">${followedTeamChips}</div>`
      : `<div class="league-card-empty"><p class="league-card-empty-title">Nenhum time acompanhado ainda.</p><p class="league-card-empty-text">Explore os times desta liga e comece a acompanhar.</p><a class="league-card-empty-link" href="preferencias.html">Ir para Preferências</a></div>`}
          </div>
        </article>
      `;
    }).join('');

    const discoverMarkup = Router.LEAGUES
      .filter((league) => !followedLeagues.includes(league))
      .map((league) => `<a class="league-pill" href="${league.toLowerCase()}.html">${league}</a>`)
      .join('');

    root.innerHTML = `
      <section class="section">
        <div class="section-head">
          <div>
            <h2>Favoritos</h2>
            <p>Conteúdo que você marcou para acompanhar.</p>
          </div>
        </div>
        <div class="favorites-info-box">
          <p class="info-title">Este é o seu resumo personalizado.</p>
          <p class="info-subtitle">Veja as ligas que você segue, seus times acompanhados e o time definido como favorito.</p>
        </div>
        <div class="favorites-empty-box ${hasFollowedLeagues ? 'is-hidden' : ''}" id="favoritesEmptyBox">
          <p class="empty-title">Nenhum favorito ainda.</p>
          <p class="empty-subtitle">Siga seus times preferidos e defina um favorito para personalizar sua experiência.</p>
          <div class="empty-cta">
            <p class="empty-cta-label">Explore as ligas e descubra seu time:</p>
            <div class="empty-league-buttons">
              <a class="league-pill" href="nfl.html">NFL</a>
              <a class="league-pill" href="nba.html">NBA</a>
              <a class="league-pill" href="nhl.html">NHL</a>
              <a class="league-pill" href="mlb.html">MLB</a>
              <a class="league-pill" href="mls.html">MLS</a>
            </div>
          </div>
        </div>
        <h2 class="fav-section-title ${hasFollowedLeagues ? '' : 'is-hidden'}">Suas ligas</h2>
        <p class="fav-section-subtitle ${hasFollowedLeagues ? '' : 'is-hidden'}">Tudo organizado por liga, do seu jeito.</p>
        <div id="leaguesGrid" class="leagues-grid ${hasFollowedLeagues ? '' : 'is-hidden'}">${leaguesGridMarkup}</div>
        <div id="discoverLeagues" class="discover-callout ${hasFollowedLeagues ? '' : 'is-hidden'}">
          <div class="discover-text">
            <p class="discover-title">Que tal seguir e acompanhar outras ligas?</p>
            <p class="discover-subtitle">Selecione uma liga para adicionar ao seu painel.</p>
          </div>
          <div id="discoverButtons" class="discover-buttons">${discoverMarkup}</div>
        </div>
      </section>
    `;
  }

  function renderPreferences(root, data, state) {
    const followedLeagues = state.followLeagues || state.followedLeagues;

    const leagueToggles = Router.LEAGUES.map((league) => {
      const followed = followedLeagues.includes(league);
      return `<button class="pill ${followed ? 'active' : ''}" data-follow-league="${league}" aria-pressed="${followed}">${followed ? '✓ ' : ''}Acompanhar ${league}</button>`;
    }).join('');

    const followedTeamsByLeague = Router.LEAGUES.map((league) => {
      const followed = followedLeagues.includes(league);
      if (!followed) {
        return `<article class="card"><div class="card-body"><h3 class="title small">${league}</h3><p class="desc">Siga a ${league} para escolher times.</p></div></article>`;
      }

      const selected = state.followedTeams[league] || [];
      const teamPills = getLeagueTeamEntries(data, league)
        .map((team) => {
          const isFavorite = state.favoriteTeam[league] === team.id;
          const isFollowed = selected.includes(team.id);
          return `<button class="pill ${isFollowed ? 'active' : ''} ${isFavorite ? 'favorite-team' : ''}" data-follow-team="${league}:${team.id}" ${isFavorite ? 'disabled aria-disabled="true" title="Time favorito é sempre seguido"' : ''}>${isFollowed ? '✓ ' : ''}${isFavorite ? '★ ' : ''}${escapeHtml(team.name)}</button>`;
        })
        .join('');

      return `<article class="card"><div class="card-body"><h3 class="title small">${league}</h3><div class="pills">${teamPills}</div></div></article>`;
    }).join('');

    const favoriteSelectors = Router.LEAGUES.map((league) => {
      const followedTeamIds = state.followedTeams[league] || [];
      const followedTeams = followedTeamIds.map((teamId) => {
        const team = data.teams.find((item) => item.id === teamId && item.league === league);
        return team ? { id: team.id, name: team.name } : null;
      }).filter(Boolean);
      const canSetFavorite = followedTeams.length > 0;
      const options = [
        `<option value="none" ${!state.favoriteTeam[league] ? 'selected' : ''}>Nenhum</option>`,
        ...followedTeams.map((team) => `<option value="${team.id}" ${state.favoriteTeam[league] === team.id ? 'selected' : ''}>${escapeHtml(team.name)}</option>`)
      ].join('');
      const emptyStateOption = '<option value="none" selected disabled>Siga pelo menos um time para definir favorito</option>';

      return `<label class="setting-row favorite-row"><span class="favorite-label">Time favorito<br>${league}</span><select class="favorite-select" id="favorite-${league}" data-pref-favorite-team="${league}" ${canSetFavorite ? '' : 'disabled'}>${canSetFavorite ? options : emptyStateOption}</select></label>`;
    }).join('');

    root.innerHTML = `<section class="section"><div class="section-head"><div><h1 class="title">Preferências</h1><p>Personalize suas ligas e times para priorizar seu conteúdo</p></div></div></section><section class="section"><div class="section-head"><div><h2>Ligas seguidas</h2></div></div><div class="pills">${leagueToggles}</div></section><section class="section"><div class="section-head"><div><h2>Times seguidos por liga</h2></div></div><div class="grid">${followedTeamsByLeague}</div></section><section class="section"><div class="section-head"><div><h2>Time favorito por liga</h2></div></div><div class="card"><div class="card-body"><p class="favorites-helper-text">Para favoritar um time aqui, você deve segui-lo antes.</p><div class="favorites-stack">${favoriteSelectors}</div></div></div></section>`;
  }

  function renderSettings(root, data, state) {
    const themeChecked = state.theme === 'dark' ? 'checked' : '';
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Configurações</h2></div></div></section><section class="section"><div class="section-head"><div><h2>Aparência</h2></div></div><div class="card"><div class="card-body"><label class="setting-row"><span>Tema escuro</span><input type="checkbox" data-setting-theme="dark" ${themeChecked}></label></div></div></section><section class="section"><div class="section-head"><div><h2>Idioma</h2></div></div><div class="card"><div class="card-body"><label class="setting-row">Idioma<select data-language><option value="pt" ${state.language === 'pt' ? 'selected' : ''}>PT</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>EN</option></select></label></div></div></section><section class="section"><div class="section-head"><div><h2>Notificações</h2></div></div><div class="notice">Em breve: alertas de jogos e breaking news.</div></section><section class="section"><div class="section-head"><div><h2>Dados</h2></div></div><div class="card"><div class="card-body"><button class="pill" id="clearLocalData">Limpar dados locais</button></div></div></section>`;
  }

  window.UI = { renderHub, renderSidebar, renderHome, renderLeaguePage, renderGames, renderStandings, renderLive, renderTeam, renderTeams, renderStats, renderNewsList, renderNewsArticle, renderFavorites, renderPreferences, renderSettings };
})();
