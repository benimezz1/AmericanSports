(function () {
  const DEFAULTS = {
    favoritesLeagues: [],
    favoriteTeamByLeague: {},
    followedTeamsByLeague: {},
    followedLeagues: [],
    alertSimulationEnabled: true,
    theme: 'dark',
    dataSource: 'static',
    sidebarScope: 'global'
  };

  function uniq(values) {
    return [...new Set(values)];
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

  function toggleList(key, value) {
    const current = read(key, DEFAULTS[key]);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    return write(key, next);
  }

  function ensureFollowed(league, teamId) {
    const current = read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague);
    const leagueTeams = Array.isArray(current[league]) ? current[league] : [];
    if (!leagueTeams.includes(teamId)) {
      current[league] = uniq([...leagueTeams, teamId]);
      write('followedTeamsByLeague', current);
    }
  }

  function normalizeFollowedTeamsByLeague(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(Object.entries(source).map(([league, teams]) => {
      if (!Array.isArray(teams)) return [league, []];
      return [league, uniq(teams.filter(Boolean))];
    }));
  }

  window.StorageService = {
    defaults: DEFAULTS,
    getState() {
      const state = {
        favoritesLeagues: read('favoritesLeagues', DEFAULTS.favoritesLeagues),
        favoriteTeamByLeague: read('favoriteTeamByLeague', DEFAULTS.favoriteTeamByLeague),
        followedTeamsByLeague: read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague),
        followedLeagues: read('followedLeagues', DEFAULTS.followedLeagues),
        alertSimulationEnabled: read('alertSimulationEnabled', DEFAULTS.alertSimulationEnabled),
        theme: read('theme', DEFAULTS.theme),
        dataSource: read('dataSource', DEFAULTS.dataSource),
        sidebarScope: read('sidebarScope', DEFAULTS.sidebarScope)
      };

      state.followedTeamsByLeague = normalizeFollowedTeamsByLeague(state.followedTeamsByLeague);
      return state;
    },
    setTheme(theme) {
      return write('theme', theme === 'light' ? 'light' : 'dark');
    },
    setDataSource(source) {
      const safe = source || DEFAULTS.dataSource;
      return write('dataSource', safe);
    },
    toggleFavoriteLeague(league) {
      return toggleList('favoritesLeagues', league);
    },
    toggleFollowLeague(league) {
      return toggleList('followedLeagues', league);
    },
    setFavoriteTeam(league, teamId) {
      const current = read('favoriteTeamByLeague', DEFAULTS.favoriteTeamByLeague);
      if (teamId) current[league] = teamId;
      else delete current[league];
      write('favoriteTeamByLeague', current);
      if (teamId) ensureFollowed(league, teamId);
      return current;
    },
    toggleFavoriteTeam(league, teamId) {
      const current = read('favoriteTeamByLeague', DEFAULTS.favoriteTeamByLeague);
      const isFavorite = current[league] === teamId;
      if (isFavorite) delete current[league];
      else current[league] = teamId;
      write('favoriteTeamByLeague', current);
      if (!isFavorite) ensureFollowed(league, teamId);
      return { favoriteTeamByLeague: current, favorite: !isFavorite };
    },
    toggleFollowTeam(league, teamId) {
      const favorites = read('favoriteTeamByLeague', DEFAULTS.favoriteTeamByLeague);
      if (favorites[league] === teamId) {
        return { followedTeamsByLeague: read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague), blocked: true };
      }

      const current = read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague);
      const leagueTeams = Array.isArray(current[league]) ? current[league] : [];
      current[league] = leagueTeams.includes(teamId)
        ? leagueTeams.filter((item) => item !== teamId)
        : uniq([...leagueTeams, teamId]);
      return { followedTeamsByLeague: write('followedTeamsByLeague', current), blocked: false };
    },
    setSidebarScope(scope) {
      const safe = scope === 'league' ? 'league' : 'global';
      return write('sidebarScope', safe);
    },
    setAlertSimulation(enabled) {
      return write('alertSimulationEnabled', Boolean(enabled));
    },
    resetPreferences() {
      Object.keys(DEFAULTS).forEach((key) => write(key, DEFAULTS[key]));
    }
  };
})();
