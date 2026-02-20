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


  const LEAGUE_VISUALS = {
    NFL: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1400&q=80',
    NBA: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
    NHL: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?auto=format&fit=crop&w=1400&q=80',
    MLB: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1400&q=80',
    MLS: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1400&q=80'
  };

  let homeHeroTimer = null;

  function imageForLeague(league) {
    return LEAGUE_VISUALS[league] || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80';
  }


  

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

  function teamSubtitle(team) {
    return (window.PlayNorthCore && PlayNorthCore.teamSubtitle(team)) || 'Dados indisponíveis';
  }

  function renderHome(root, data, state) {
    const topNews = Sorter.sortByUserPriority(data.news.map((item, index) => ({ ...item, __index: index })), state).slice(0, 4);
    const heroItems = topNews.map((item) => ({
      league: item.league,
      title: item.title,
      summary: item.summary,
      href: newsLink(item.__index),
      image: imageForLeague(item.league)
    }));

    const radarItems = Sorter.sortByUserPriority(data.news.map((item, index) => ({ ...item, __index: index })), state).slice(0, 4);
    const feedItems = Sorter.sortByUserPriority(data.news.map((item, index) => ({ ...item, __index: index })), state).slice(0, 8);

    const heroSlides = heroItems.map((item, index) => `
      <a class="hero-feature ${index === 0 ? 'is-active' : ''}" data-hero-feature data-index="${index}" href="${item.href}" style="background-image:linear-gradient(150deg, rgba(5,8,19,.35), rgba(5,8,19,.92)), url('${item.image}')">
        <div class="hero-feature-content">
          <span class="hero-badge">${escapeHtml(item.league)}</span>
          <h1>${escapeHtml(item.title)}</h1>
          <p>${escapeHtml(item.summary)}</p>
          <span class="hero-cta">Ver matéria</span>
        </div>
      </a>
    `).join('');

    const heroMini = heroItems.map((item, index) => `
      <a class="hero-mini ${index > 0 ? 'is-visible' : ''}" data-hero-mini data-index="${index}" href="${item.href}" style="background-image:linear-gradient(180deg, rgba(5,8,19,.1), rgba(5,8,19,.9)), url('${item.image}')">
        <span class="hero-mini-league">${escapeHtml(item.league)}</span>
        <h3>${escapeHtml(item.title)}</h3>
      </a>
    `).join('');

    const radarMain = radarItems[0];
    const radarSide = radarItems.slice(1);

    const feedMarkup = feedItems.map((item, index) => {
      if (index % 2 === 0) {
        return `<a class="feed-item feed-editorial" href="${newsLink(item.__index)}"><div class="feed-media" style="background-image:linear-gradient(160deg, rgba(6,11,26,.2), rgba(6,11,26,.72)), url('${imageForLeague(item.league)}')"></div><div><span class="feed-league">${escapeHtml(item.league)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div></a>`;
      }
      return `<a class="feed-item feed-compact" href="${newsLink(item.__index)}"><div class="feed-thumb" style="background-image:linear-gradient(150deg, rgba(7,12,29,.15), rgba(7,12,29,.75)), url('${imageForLeague(item.league)}')"></div><div><span class="feed-league">${escapeHtml(item.league)}</span><h4>${escapeHtml(item.title)}</h4></div></a>`;
    }).join('');

    root.innerHTML = `
      <section class="home-hero" data-home-hero>
        <div class="hero-stage">${heroSlides}</div>
        <div class="hero-mini-column">${heroMini}</div>
      </section>

      <section class="section premium-block">
        <div class="section-head"><div><h2>Radar do Dia</h2><p>Destaques com leitura rápida e impacto visual.</p></div></div>
        <div class="radar-layout">
          <a class="radar-main" href="${newsLink(radarMain.__index)}" style="background-image:linear-gradient(165deg, rgba(8,13,30,.15), rgba(8,13,30,.9)), url('${imageForLeague(radarMain.league)}')">
            <span>${escapeHtml(radarMain.league)}</span>
            <h3>${escapeHtml(radarMain.title)}</h3>
            <p>${escapeHtml(radarMain.summary)}</p>
          </a>
          <div class="radar-side">${radarSide.map((item) => `<a class="radar-card" href="${newsLink(item.__index)}" style="background-image:linear-gradient(165deg, rgba(8,13,30,.25), rgba(8,13,30,.88)), url('${imageForLeague(item.league)}')"><span>${escapeHtml(item.league)}</span><h4>${escapeHtml(item.title)}</h4></a>`).join('')}</div>
        </div>
      </section>

      <section class="section premium-block">
        <div class="section-head"><div><h2>Feed PlayNorth</h2><p>Fluxo editorial com ritmo visual premium.</p></div></div>
        <div class="feed-stack">${feedMarkup}</div>
      </section>
    `;

    const heroRoot = root.querySelector('[data-home-hero]');
    const features = Array.from(root.querySelectorAll('[data-hero-feature]'));
    const minis = Array.from(root.querySelectorAll('[data-hero-mini]'));
    if (homeHeroTimer) clearInterval(homeHeroTimer);
    if (!heroRoot || !features.length) return;

    let active = 0;
    const syncHero = (next) => {
      active = (next + features.length) % features.length;
      features.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
      const miniOrder = [...Array(features.length).keys()].filter((idx) => idx !== active);
      minis.forEach((el, idx) => {
        el.classList.remove('is-visible');
        el.style.order = features.length;
        const originalIndex = Number(el.dataset.index);
        const position = miniOrder.indexOf(originalIndex);
        if (position >= 0 && position < 3) {
          el.classList.add('is-visible');
          el.style.order = String(position + 1);
        }
      });
    };

    heroRoot.addEventListener('click', (event) => {
      const mini = event.target.closest('[data-hero-mini]');
      if (!mini) return;
      syncHero(Number(mini.dataset.index));
    });

    syncHero(0);
    homeHeroTimer = setInterval(() => syncHero(active + 1), 6500);
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
        return card(team.name, teamSubtitle(team), `<div class="meta">${teamLink(league, team.id, 'Abrir time')}</div><div class="team-status-row">${statusLabel}</div><div class="pills"><button class="pill ${favorite ? 'active' : ''}" data-favorite-team="${league}:${team.id}" aria-pressed="${favorite}">${favorite ? '⭐ Favorito' : '⭐ Favoritar'}</button><button class="pill ${followed ? 'active' : ''}" data-follow-team="${league}:${team.id}" ${followDisabled}>${favorite ? '✓ Seguindo' : (followed ? '✓ Acompanhando' : 'Acompanhar')}</button></div>`);
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
    const cards = teams.map((team) => card(team.name, teamSubtitle(team), `<div class="meta">${teamLink(team.league, team.id, 'Abrir time')}</div>`)).join('');
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

    const favorite = state.favoriteTeam[league] === team.id;
    const followed = (state.followedTeams[league] || []).includes(team.id);
    const followDisabled = favorite ? 'disabled aria-disabled="true" title="Times favoritos são sempre seguidos"' : '';
    const subtitleParts = [team.city || 'Não informado', team.conference || 'Não informado'];
    if (team.division) subtitleParts.push(team.division);
    const subtitle = subtitleParts.join(' • ');
    const teamInitials = team.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

    root.innerHTML = `
      <section class="team-premium-hero" style="background-image:linear-gradient(160deg, rgba(4,8,20,.35), rgba(4,8,20,.92)), url('${imageForLeague(league)}')">
        <div class="team-premium-overlay">
          <div class="team-id-block">
            <div class="team-logo-wrap" id="teamLogoWrap">
              <img id="teamLogoHero" alt="Logo do time" loading="lazy" />
              <div class="team-logo-placeholder" id="teamLogoPlaceholder">${escapeHtml(teamInitials)}</div>
            </div>
            <div>
              <span class="team-league-badge" id="teamLeagueBadge">${escapeHtml(league)}</span>
              <h1 class="team-title" id="teamName">${escapeHtml(team.name)}</h1>
              <p class="team-subtitle" id="teamSubtitle">${escapeHtml(subtitle)}</p>
            </div>
          </div>
          <div class="team-top-metrics">
            <div><span>Seguidores</span><strong>2.4M</strong></div>
            <div><span>Ranking</span><strong>#04</strong></div>
            <div><span>Hype</span><strong>89%</strong></div>
          </div>
          <div class="team-cta">
            <button id="btnFavorite" class="btn-primary" aria-pressed="${favorite}">${favorite ? '⭐ Favorito' : '⭐ Favoritar'}</button>
            <button id="btnFollow" class="btn-secondary" aria-pressed="${followed}" ${followDisabled}>${favorite ? '✓ Seguindo' : (followed ? '✓ Acompanhando' : 'Acompanhar')}</button>
          </div>
        </div>
      </section>

      <section class="team-tabs-shell">
        <button class="team-tab is-active" type="button">Notícias</button>
        <button class="team-tab" type="button">Estatísticas</button>
        <button class="team-tab" type="button">Comparação</button>
        <button class="team-tab" type="button">Histórico</button>
      </section>

      <section class="section premium-block">
        <div class="section-head"><div><h2>Painel do time</h2><p>Estrutura preparada para conteúdo completo na próxima fase.</p></div></div>
        <div class="details-grid">
          <div class="detail-card"><div class="detail-label">Cidade</div><div class="detail-value">${escapeHtml(team.city || 'Não informado')}</div></div>
          <div class="detail-card"><div class="detail-label">Conferência</div><div class="detail-value">${escapeHtml(team.conference || 'Não informado')}</div></div>
          <div class="detail-card"><div class="detail-label">Fundação</div><div class="detail-value">${escapeHtml(team.founded || 'Não informado')}</div></div>
          <div class="detail-card"><div class="detail-label">Estádio/Arena</div><div class="detail-value">${escapeHtml(team.stadium || 'Não informado')}</div></div>
        </div>
      </section>
    `;

    const teamLogoHero = root.querySelector('#teamLogoHero');
    const teamLogoPlaceholder = root.querySelector('#teamLogoPlaceholder');
    if (teamLogoHero && teamLogoPlaceholder) {
      if (team.logo) {
        teamLogoHero.src = team.logo;
        teamLogoHero.alt = `Logo ${team.name}`;
        teamLogoHero.style.display = 'block';
        teamLogoPlaceholder.style.display = 'none';
      } else {
        teamLogoHero.removeAttribute('src');
        teamLogoHero.style.display = 'none';
        teamLogoPlaceholder.style.display = 'grid';
      }
    }
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
    const followedLeagues = state.followedLeagues || state.followLeagues || [];
    const hasFollowedLeagues = followedLeagues.length > 0;

    const leaguesGridMarkup = followedLeagues.map((league) => {
      const favoriteId = state.favoriteTeam[league];
      const hasFavorite = Boolean(favoriteId) && favoriteId !== 'none';
      const followedTeamIds = state.followedTeams[league] || [];
      const hasFollowedTeams = followedTeamIds.length > 0;
      const shouldShowFollowSuggestionOnly = !hasFavorite && !hasFollowedTeams;
      const followedTeamChips = followedTeamIds.map((teamId) => `<span class="league-pill">${escapeHtml(getTeamName(data.teams, teamId))}</span>`).join('');

      return `
        <article class="league-card">
          <header class="league-card-head">
            <span class="league-card-badge">${league}</span>
          </header>
          <div class="league-card-block">
            <p class="league-card-label">Favorito</p>
            ${hasFavorite
      ? `<p class="league-card-favorite">${teamLink(league, favoriteId, getTeamName(data.teams, favoriteId))}</p>`
      : shouldShowFollowSuggestionOnly
        ? `<p class="league-card-empty-text">Siga ao menos um time nesta liga para liberar a escolha de favorito.</p>`
        : `<div class="league-card-empty"><p class="league-card-empty-title">Nenhum favorito definido.</p><p class="league-card-empty-text">Você já acompanha times desta liga. Agora escolha um deles como favorito.</p><a class="league-card-empty-link" href="preferencias.html">Ir para Preferências</a></div>`}
          </div>
          <div class="league-card-block">
            <p class="league-card-label">Times seguidos</p>
            ${hasFollowedTeams
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
            <p>Este é o seu painel premium para acompanhar o que importa.</p>
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
    const followedLeagues = state.followedLeagues || state.followLeagues || [];

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

    root.innerHTML = `<section class="section"><div class="section-head"><div><h1 class="title">Preferências</h1><p>Este é o seu resumo personalizado para moldar ligas e times do seu jeito</p></div></div></section><section class="section"><div class="section-head"><div><h2>Ligas seguidas</h2></div></div><div class="pills">${leagueToggles}</div></section><section class="section"><div class="section-head"><div><h2>Times seguidos por liga</h2></div></div><div class="grid">${followedTeamsByLeague}</div></section><section class="section"><div class="section-head"><div><h2>Time favorito por liga</h2></div></div><div class="card"><div class="card-body"><p class="favorites-helper-text">Para favoritar um time aqui, você deve segui-lo antes.</p><div class="favorites-stack">${favoriteSelectors}</div></div></div></section>`;
  }

  function renderSettings(root, data, state) {
    const themeChecked = state.theme === 'dark' ? 'checked' : '';
    root.innerHTML = `<section class="section"><div class="section-head"><div><h2>Configurações</h2></div></div></section><section class="section"><div class="section-head"><div><h2>Aparência</h2></div></div><div class="card"><div class="card-body"><label class="setting-row"><span>Tema escuro</span><input type="checkbox" data-setting-theme="dark" ${themeChecked}></label></div></div></section><section class="section"><div class="section-head"><div><h2>Idioma</h2></div></div><div class="card"><div class="card-body"><label class="setting-row">Idioma<select data-language><option value="pt" ${state.language === 'pt' ? 'selected' : ''}>PT</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>EN</option></select></label></div></div></section><section class="section"><div class="section-head"><div><h2>Notificações</h2></div></div><div class="notice">Em breve: alertas de jogos e breaking news.</div></section><section class="section"><div class="section-head"><div><h2>Dados</h2></div></div><div class="card"><div class="card-body"><button class="pill" id="clearLocalData">Limpar dados locais</button></div></div></section>`;
  }

  window.UI = { renderHub, renderSidebar, renderHome, renderLeaguePage, renderGames, renderStandings, renderLive, renderTeam, renderTeams, renderStats, renderNewsList, renderNewsArticle, renderFavorites, renderPreferences, renderSettings };
})();
