(function () {
  const LEAGUES = ['NFL', 'NBA', 'NHL', 'MLB', 'MLS'];

  function createLeagueRecord(initialValue) {
    return Object.fromEntries(LEAGUES.map((league) => [league, initialValue]));
  }

  const DEFAULTS = {
    followedLeagues: [],
    followedTeams: createLeagueRecord([]),
    favoriteTeam: createLeagueRecord(null),
    language: 'pt',
    theme: 'dark',
    dataSource: 'static',
    sidebarScope: 'global',
    alertSimulationEnabled: true
  };

  function uniq(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function normalizeLeagueList(value) {
    const list = Array.isArray(value) ? value : [];
    return uniq(list.filter((league) => LEAGUES.includes(league)));
  }

  function normalizeFollowedTeams(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(LEAGUES.map((league) => {
      const teams = Array.isArray(source[league]) ? source[league] : [];
      return [league, uniq(teams)];
    }));
  }

  function normalizeFavoriteTeam(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(LEAGUES.map((league) => [league, source[league] || null]));
  }

  function ensureLeagueIsFollowed(league) {
    const current = normalizeLeagueList(read('followedLeagues', DEFAULTS.followedLeagues));
    if (!current.includes(league)) {
      write('followedLeagues', [...current, league]);
    }
  }

  function ensureTeamIsFollowed(league, teamId) {
    const current = normalizeFollowedTeams(read('followedTeams', DEFAULTS.followedTeams));
    if (!current[league].includes(teamId)) {
      current[league] = uniq([...current[league], teamId]);
      write('followedTeams', current);
    }
  }

  function migrateLegacyKeys() {
    const legacyFollowedTeams = read('followedTeamsByLeague', null);
    const legacyFavoriteTeam = read('favoriteTeamByLeague', null);

    if (legacyFollowedTeams && !localStorage.getItem('followedTeams')) {
      write('followedTeams', normalizeFollowedTeams(legacyFollowedTeams));
    }
    if (legacyFavoriteTeam && !localStorage.getItem('favoriteTeam')) {
      write('favoriteTeam', normalizeFavoriteTeam(legacyFavoriteTeam));
    }

    if (localStorage.getItem('favoritesLeagues') && !localStorage.getItem('followedLeagues')) {
      write('followedLeagues', normalizeLeagueList(read('favoritesLeagues', [])));
    }
  }

  function persistNormalized(state) {
    write('followedLeagues', state.followedLeagues);
    write('followedTeams', state.followedTeams);
    write('favoriteTeam', state.favoriteTeam);
    write('language', state.language);
    write('theme', state.theme);
    write('dataSource', state.dataSource);
    write('sidebarScope', state.sidebarScope);
    write('alertSimulationEnabled', state.alertSimulationEnabled);
  }

  window.StorageService = {
    defaults: DEFAULTS,
    leagues: LEAGUES,
    getState() {
      migrateLegacyKeys();

      const state = {
        followedLeagues: normalizeLeagueList(read('followedLeagues', DEFAULTS.followedLeagues)),
        followedTeams: normalizeFollowedTeams(read('followedTeams', DEFAULTS.followedTeams)),
        favoriteTeam: normalizeFavoriteTeam(read('favoriteTeam', DEFAULTS.favoriteTeam)),
        language: (read('language', DEFAULTS.language) || 'pt').toLowerCase() === 'en' ? 'en' : 'pt',
        theme: read('theme', DEFAULTS.theme) === 'light' ? 'light' : 'dark',
        dataSource: read('dataSource', DEFAULTS.dataSource) || DEFAULTS.dataSource,
        sidebarScope: read('sidebarScope', DEFAULTS.sidebarScope) === 'league' ? 'league' : 'global',
        alertSimulationEnabled: read('alertSimulationEnabled', DEFAULTS.alertSimulationEnabled) !== false
      };

      persistNormalized(state);
      return state;
    },
    setTheme(theme) {
      return write('theme', theme === 'light' ? 'light' : 'dark');
    },
    setLanguage(language) {
      return write('language', String(language).toLowerCase() === 'en' ? 'en' : 'pt');
    },
    setDataSource(source) {
      return write('dataSource', source || DEFAULTS.dataSource);
    },
    toggleFollowLeague(league) {
      const current = normalizeLeagueList(read('followedLeagues', DEFAULTS.followedLeagues));
      const followedTeams = normalizeFollowedTeams(read('followedTeams', DEFAULTS.followedTeams));
      const favoriteTeam = normalizeFavoriteTeam(read('favoriteTeam', DEFAULTS.favoriteTeam));

      if (current.includes(league)) {
        const next = current.filter((item) => item !== league);
        followedTeams[league] = [];
        favoriteTeam[league] = null;
        write('followedTeams', followedTeams);
        write('favoriteTeam', favoriteTeam);
        return write('followedLeagues', next);
      }

      return write('followedLeagues', [...current, league]);
    },
    toggleFollowTeam(league, teamId) {
      const followedTeams = normalizeFollowedTeams(read('followedTeams', DEFAULTS.followedTeams));
      const favoriteTeam = normalizeFavoriteTeam(read('favoriteTeam', DEFAULTS.favoriteTeam));

      if (favoriteTeam[league] === teamId) {
        return { followedTeams, blocked: true };
      }

      const teams = followedTeams[league] || [];
      followedTeams[league] = teams.includes(teamId)
        ? teams.filter((item) => item !== teamId)
        : uniq([...teams, teamId]);

      ensureLeagueIsFollowed(league);
      return { followedTeams: write('followedTeams', followedTeams), blocked: false };
    },
    setFavoriteTeam(league, teamId) {
      const favoriteTeam = normalizeFavoriteTeam(read('favoriteTeam', DEFAULTS.favoriteTeam));
      if (!teamId) {
        favoriteTeam[league] = null;
        return write('favoriteTeam', favoriteTeam);
      }

      favoriteTeam[league] = teamId;
      write('favoriteTeam', favoriteTeam);
      ensureLeagueIsFollowed(league);
      ensureTeamIsFollowed(league, teamId);
      return favoriteTeam;
    },
    toggleFavoriteTeam(league, teamId) {
      const favoriteTeam = normalizeFavoriteTeam(read('favoriteTeam', DEFAULTS.favoriteTeam));
      const isFavorite = favoriteTeam[league] === teamId;
      favoriteTeam[league] = isFavorite ? null : teamId;
      write('favoriteTeam', favoriteTeam);

      if (!isFavorite && teamId) {
        ensureLeagueIsFollowed(league);
        ensureTeamIsFollowed(league, teamId);
      }

      return { favoriteTeam, favorite: !isFavorite };
    },
    setSidebarScope(scope) {
      return write('sidebarScope', scope === 'league' ? 'league' : 'global');
    },
    setAlertSimulation(enabled) {
      return write('alertSimulationEnabled', Boolean(enabled));
    },
    resetPreferences() {
      write('followedLeagues', DEFAULTS.followedLeagues);
      write('followedTeams', DEFAULTS.followedTeams);
      write('favoriteTeam', DEFAULTS.favoriteTeam);
    },
    clearLocalData() {
      [
        'followedLeagues', 'followedTeams', 'favoriteTeam', 'language', 'theme', 'dataSource', 'sidebarScope', 'alertSimulationEnabled',
        'favoritesLeagues', 'favoriteTeamByLeague', 'followedTeamsByLeague'
      ].forEach((key) => localStorage.removeItem(key));
    }
  };
})();
