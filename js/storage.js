(function () {
  const DEFAULTS = {
    favoritesLeagues: [],
    favoriteTeamByLeague: {},
    followedTeamsByLeague: {},
    theme: 'dark',
    sidebarModePreference: 'global'
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
        theme: read('theme', DEFAULTS.theme),
        sidebarModePreference: read('sidebarModePreference', DEFAULTS.sidebarModePreference)
      };
    },
    setTheme(theme) {
      return write('theme', theme === 'light' ? 'light' : 'dark');
    },
    setSidebarMode(mode) {
      return write('sidebarModePreference', mode === 'context' ? 'context' : 'global');
    },
    toggleFavoriteLeague(league) {
      const current = read('favoritesLeagues', DEFAULTS.favoritesLeagues);
      const next = current.includes(league) ? current.filter((item) => item !== league) : [...current, league];
      return write('favoritesLeagues', next);
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
    resetPreferences() {
      Object.keys(DEFAULTS).forEach((key) => write(key, DEFAULTS[key]));
    }
  };
})();
