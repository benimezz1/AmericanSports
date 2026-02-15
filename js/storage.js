(function () {
  const DEFAULTS = {
    favoritesLeagues: [],
    favoriteTeamByLeague: {},
    followedTeamsByLeague: {},
    followedLeagues: [],
    alertSimulationEnabled: true,
    theme: 'dark',
    dataSource: 'static'
  };

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
      current[league] = [...leagueTeams, teamId];
      write('followedTeamsByLeague', current);
    }
  }

  window.StorageService = {
    defaults: DEFAULTS,
    getState() {
      return {
        favoritesLeagues: read('favoritesLeagues', DEFAULTS.favoritesLeagues),
        favoriteTeamByLeague: read('favoriteTeamByLeague', DEFAULTS.favoriteTeamByLeague),
        followedTeamsByLeague: read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague),
        followedLeagues: read('followedLeagues', DEFAULTS.followedLeagues),
        alertSimulationEnabled: read('alertSimulationEnabled', DEFAULTS.alertSimulationEnabled),
        theme: read('theme', DEFAULTS.theme),
        dataSource: read('dataSource', DEFAULTS.dataSource)
      };
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
      current[league] = teamId;
      write('favoriteTeamByLeague', current);
      ensureFollowed(league, teamId);
      return current;
    },
    toggleFollowTeam(league, teamId) {
      const current = read('followedTeamsByLeague', DEFAULTS.followedTeamsByLeague);
      const leagueTeams = Array.isArray(current[league]) ? current[league] : [];
      current[league] = leagueTeams.includes(teamId)
        ? leagueTeams.filter((item) => item !== teamId)
        : [...leagueTeams, teamId];
      return write('followedTeamsByLeague', current);
    },
    setAlertSimulation(enabled) {
      return write('alertSimulationEnabled', Boolean(enabled));
    },
    resetPreferences() {
      Object.keys(DEFAULTS).forEach((key) => write(key, DEFAULTS[key]));
    }
  };
})();
