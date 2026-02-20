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

  function hashNumber(value) {
    return String(value).split('').reduce((acc, char, index) => acc + (char.charCodeAt(0) * (index + 7)), 0);
  }

  function formatFollowers(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return String(value);
  }

  const REGION_POINTS = {
    'washington': [7, 32],
    'oregon': [8, 36],
    'california': [9, 50],
    'nevada': [14, 48],
    'arizona': [16, 57],
    'colorado': [24, 45],
    'utah': [18, 46],
    'new mexico': [21, 55],
    'texas': [30, 62],
    'oklahoma': [31, 56],
    'missouri': [38, 50],
    'minnesota': [38, 37],
    'illinois': [45, 47],
    'wisconsin': [45, 42],
    'michigan': [49, 41],
    'ohio': [54, 45],
    'tennessee': [52, 54],
    'georgia': [60, 61],
    'florida': [65, 73],
    'north carolina': [65, 56],
    'south carolina': [63, 60],
    'virginia': [63, 53],
    'district of columbia': [67, 49],
    'd.c.': [67, 49],
    'maryland': [67, 49],
    'pennsylvania': [63, 46],
    'new jersey': [66, 47],
    'new york': [67, 43],
    'massachusetts': [73, 42],
    'quebec': [70, 33],
    'ontario': [58, 37],
    'alberta': [25, 30],
    'british columbia': [14, 27],
    'manitoba': [37, 33]
  };

  function getMapPoint(team, index) {
    const parts = String(team.city || '').split(',').map((part) => part.trim().toLowerCase());
    const region = parts[1] || parts[0] || '';
    const base = REGION_POINTS[region] || [15 + (hashNumber(team.id) % 60), 25 + (hashNumber(team.name) % 45)];
    const jitterSeed = hashNumber(`${team.id}-${index}`);
    const x = Math.max(6, Math.min(94, base[0] + ((jitterSeed % 5) - 2) * 0.8));
    const y = Math.max(8, Math.min(88, base[1] + (((jitterSeed >> 2) % 5) - 2) * 0.8));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }

  function buildPopularityRanking(data) {
    const ranked = data.teams.map((team) => {
      const seed = hashNumber(`${team.league}:${team.id}`);
      const followers = 650000 + (seed % 3200000);
      const hype = 52 + (seed % 44);
      const variation = (seed % 9) - 4;
      const score = followers + (hype * 17000) + (variation * 22000);
      return { ...team, followers, hype, variation, score };
    }).sort((a, b) => b.score - a.score).map((team, index) => ({ ...team, position: index + 1 }));

    const byLeague = Router.LEAGUES.reduce((acc, league) => {
      acc[league] = ranked.filter((team) => team.league === league).slice(0, 5);
      return acc;
    }, {});

    return { top10: ranked.slice(0, 10), byLeague, all: ranked };
  }

  function renderHypeMeter(value, compact = false) {
    const safeValue = Math.max(1, Math.min(100, Number(value) || 0));
    return `
      <div class="hype-meter ${compact ? 'compact' : ''}" data-hype-meter="${safeValue}">
        <div class="hype-track"><div class="hype-fill" style="--hype:${safeValue}"></div></div>
        <span class="hype-value">${safeValue}%</span>
      </div>
    `;
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
    const feedItems = Sorter.sortByUserPriority(data.news.map((item, index) => ({ ...item, __index: index })), state).slice(0, 9);
    const ranking = buildPopularityRanking(data);

    const heroSlides = heroItems.map((item, index) => `
      <a class="hero-feature ${index === 0 ? 'is-active' : ''}" data-hero-feature data-index="${index}" href="${item.href}" style="background-image:linear-gradient(180deg, rgba(3,7,19,.2), rgba(3,7,19,.98)), url('${item.image}')">
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

    const heroIndicators = heroItems.map((_, index) => `<button type="button" class="hero-indicator ${index === 0 ? 'is-active' : ''}" aria-label="Destaque ${index + 1}" data-hero-indicator="${index}"></button>`).join('');
    const radarMain = radarItems[0];
    const radarSide = radarItems.slice(1);

    const feedMarkup = feedItems.map((item, index) => {
      if (index % 5 === 2) {
        const pulse = (62 + (index * 3)) % 98;
        return `<article class="feed-highlight"><span class="feed-highlight-kicker">Momento da Liga</span><h3>${escapeHtml(item.league)} em alta</h3><p>${escapeHtml(item.summary)}</p><div class="feed-highlight-meta"><span>${escapeHtml(item.title)}</span>${renderHypeMeter(pulse, true)}</div></article>`;
      }
      if (index % 4 === 0) {
        return `<a class="feed-item feed-featured" href="${newsLink(item.__index)}"><div class="feed-media" style="background-image:linear-gradient(160deg, rgba(6,11,26,.2), rgba(6,11,26,.72)), url('${imageForLeague(item.league)}')"></div><div><span class="feed-league">${escapeHtml(item.league)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p>${renderHypeMeter(58 + (index * 4), true)}</div></a>`;
      }
      if (index % 2 === 0) {
        return `<a class="feed-item feed-editorial" href="${newsLink(item.__index)}"><div class="feed-media" style="background-image:linear-gradient(160deg, rgba(6,11,26,.2), rgba(6,11,26,.72)), url('${imageForLeague(item.league)}')"></div><div><span class="feed-league">${escapeHtml(item.league)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div></a>`;
      }
      return `<a class="feed-item feed-compact" href="${newsLink(item.__index)}"><div class="feed-thumb" style="background-image:linear-gradient(150deg, rgba(7,12,29,.15), rgba(7,12,29,.75)), url('${imageForLeague(item.league)}')"></div><div><span class="feed-league">${escapeHtml(item.league)}</span><h4>${escapeHtml(item.title)}</h4></div></a>`;
    }).join('<div class="feed-divider"></div>');

    const rankingRows = ranking.top10.map((team) => {
      const trend = team.variation > 0 ? `↑ ${team.variation}` : (team.variation < 0 ? `↓ ${Math.abs(team.variation)}` : '• 0');
      const trendClass = team.variation > 0 ? 'up' : team.variation < 0 ? 'down' : 'flat';
      const topClass = team.position === 1 ? 'leader' : '';
      return `<li class="ranking-row ${topClass}"><span class="ranking-position">${String(team.position).padStart(2, '0')}</span><div class="ranking-team"><span class="ranking-logo">${team.logo ? `<img src="${team.logo}" alt="${escapeHtml(team.name)}" loading="lazy" />` : escapeHtml(team.name.slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(team.name)}</strong><small>${escapeHtml(team.league)}</small></div></div><div class="ranking-meta"><strong>${formatFollowers(team.followers)}</strong><span class="ranking-trend ${trendClass}"><b>${trend.split(' ')[0]}</b>${trend.split(' ').slice(1).join(' ') || '0'}</span></div></li>`;
    }).join('');

    const mapTeams = ranking.all.slice(0, 26).map((team, index) => ({ ...team, point: getMapPoint(team, index) }));
    const mapMarkers = mapTeams.map((team) => `<button class="north-map-marker" type="button" style="--x:${team.point.x}%;--y:${team.point.y}%" aria-label="${escapeHtml(team.name)}"><span class="north-map-ping"></span><span class="north-map-tooltip"><strong>${escapeHtml(team.name)}</strong><em>${escapeHtml(team.league)}</em><small>Popularidade ${formatFollowers(team.followers)}</small><small>Hype ${team.hype}%</small></span></button>`).join('');

    const leaguePanels = Router.LEAGUES.map((league) => {
      const leaders = ranking.byLeague[league] || [];
      return `<article class="league-ranking-card"><h4>${league}</h4><ul>${leaders.map((team) => `<li><span>#${team.position}</span><strong>${escapeHtml(team.name)}</strong><em>${formatFollowers(team.followers)}</em></li>`).join('')}</ul></article>`;
    }).join('');

    root.innerHTML = `
      <section class="home-hero" data-home-hero>
        <div class="hero-stage" data-hero-stage>${heroSlides}<div class="hero-indicators">${heroIndicators}</div></div>
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
        <div class="section-head"><div><h2>Ranking de Popularidade</h2><p>Top 10 geral + leitura rápida por liga.</p></div></div>
        <div class="ranking-dashboard">
          <article class="ranking-main"><ol>${rankingRows}</ol></article>
          <div class="ranking-side">
            ${leaguePanels}
            <article class="hype-panel"><h4>Termômetro de hype</h4><p>Oscilação em tempo real dos líderes.</p>${renderHypeMeter(ranking.top10[0]?.hype || 74)}${renderHypeMeter(ranking.top10[1]?.hype || 68)}${renderHypeMeter(ranking.top10[2]?.hype || 64)}</article>
          </div>
        </div>
      </section>

      <section class="section premium-block">
        <div class="section-head"><div><h2>Mapa Interativo • EUA + Canadá</h2><p>Base geográfica dos times com leitura dinâmica de popularidade e hype.</p></div></div>
        <article class="north-map-shell">
          <div class="north-map-canvas" role="img" aria-label="Mapa estilizado de EUA e Canadá com times">
            <svg class="north-map-outline" viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 15 L8 10 L20 8 L29 3 L40 4 L49 6 L58 8 L65 7 L72 9 L78 14 L83 18 L90 24 L95 26 L96 31 L92 35 L89 37 L87 43 L84 50 L77 56 L67 59 L56 57 L45 58 L38 56 L31 58 L23 56 L17 52 L10 46 L6 40 L3 33 Z" />
            </svg>
            ${mapMarkers}
          </div>
        </article>
      </section>

      <section class="section premium-block">
        <div class="section-head"><div><h2>Feed PlayNorth</h2><p>Fluxo editorial com ritmo visual premium.</p></div></div>
        <div class="feed-stack">${feedMarkup}</div>
      </section>
    `;

    const heroRoot = root.querySelector('[data-home-hero]');
    const heroStage = root.querySelector('[data-hero-stage]');
    const features = Array.from(root.querySelectorAll('[data-hero-feature]'));
    const minis = Array.from(root.querySelectorAll('[data-hero-mini]'));
    const indicators = Array.from(root.querySelectorAll('[data-hero-indicator]'));
    if (homeHeroTimer) clearInterval(homeHeroTimer);
    if (!heroRoot || !features.length) return;

    let active = 0;
    const syncHero = (next) => {
      active = (next + features.length) % features.length;
      features.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
      indicators.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
      const miniOrder = [...Array(features.length).keys()].filter((idx) => idx !== active);
      minis.forEach((el) => {
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
      if (mini) {
        syncHero(Number(mini.dataset.index));
        return;
      }
      const indicator = event.target.closest('[data-hero-indicator]');
      if (indicator) syncHero(Number(indicator.dataset.heroIndicator));
    });

    if (heroStage) {
      heroStage.addEventListener('mousemove', (event) => {
        const rect = heroStage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) - 0.5;
        const y = ((event.clientY - rect.top) / rect.height) - 0.5;
        heroStage.style.setProperty('--parallax-x', (x * 10).toFixed(2));
        heroStage.style.setProperty('--parallax-y', (y * 10).toFixed(2));
      });
      heroStage.addEventListener('mouseleave', () => {
        heroStage.style.setProperty('--parallax-x', '0');
        heroStage.style.setProperty('--parallax-y', '0');
      });
    }

    syncHero(0);
    homeHeroTimer = setInterval(() => syncHero(active + 1), 6200);
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

    const ranking = buildPopularityRanking(data);
    const teamSignal = ranking.all.find((item) => item.id === team.id && item.league === team.league) || { position: 0, followers: 0, hype: 70, variation: 0 };

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
          <div class="team-command-center">
            <div class="team-command-card">
              <span>Seguidores</span>
              <strong>${formatFollowers(teamSignal.followers)}</strong>
            </div>
            <div class="team-command-card">
              <span>Ranking Global</span>
              <strong>#${String(teamSignal.position).padStart(2, '0')}</strong>
            </div>
            <div class="team-command-card variation">
              <span>Variação</span>
              <strong class="${teamSignal.variation >= 0 ? 'trend-up' : 'trend-down'}">${teamSignal.variation >= 0 ? '↑' : '↓'} ${Math.abs(teamSignal.variation)}</strong>
            </div>
            <div class="team-command-card hype">
              <span>Hype</span>
              ${renderHypeMeter(teamSignal.hype, true)}
            </div>
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
        <div class="section-head"><div><h2>Painel do time</h2><p>Visão de dashboard com contexto e momentum.</p></div></div>
        <div class="team-fluid-panel">
          <div class="team-fluid-row"><span>Cidade</span><strong>${escapeHtml(team.city || 'Não informado')}</strong></div>
          <div class="team-fluid-row"><span>Conferência</span><strong>${escapeHtml(team.conference || 'Não informado')}</strong></div>
          <div class="team-fluid-row"><span>Fundação</span><strong>${escapeHtml(team.founded || 'Não informado')}</strong></div>
          <div class="team-fluid-row"><span>Estádio/Arena</span><strong>${escapeHtml(team.stadium || 'Não informado')}</strong></div>
          <div class="team-fluid-row"><span>Hype atual</span><strong>${teamSignal.hype}%</strong></div>
          <div class="team-fluid-row"><span>Popularidade</span><strong>Top ${Math.max(1, Math.ceil(teamSignal.position / 10) * 10)}</strong></div>
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
