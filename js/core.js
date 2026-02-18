(function () {
  const LEAGUES = ['NFL', 'NBA', 'NHL', 'MLB', 'MLS'];
  const STORAGE_KEYS = {
    followedLeagues: 'followedLeagues',
    legacyFollowLeagues: 'followLeagues',
    followedTeams: 'followedTeams',
    favoriteTeam: 'favoriteTeam',
    theme: 'theme'
  };

  function normalizeTheme(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function createLeagueRecord(initialValue) {
    return Object.fromEntries(LEAGUES.map((league) => [league, initialValue]));
  }

  function loadTheme() {
    const stored = readJson(STORAGE_KEYS.theme, 'dark');
    return normalizeTheme(stored);
  }

  function applyTheme(theme) {
    const resolved = normalizeTheme(theme);
    document.body.classList.toggle('dark-mode', resolved === 'dark');
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.textContent = resolved === 'light' ? '☀' : '☾';
    return resolved;
  }

  function bootstrapThemeClass() {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.toggle('dark-mode', loadTheme() === 'dark');
  }

  function loadPreferences() {
    const followedLeagues = readJson(STORAGE_KEYS.followedLeagues, null);
    const fallbackLeagues = followedLeagues === null
      ? readJson(STORAGE_KEYS.legacyFollowLeagues, [])
      : followedLeagues;

    return {
      followedLeagues: Array.isArray(fallbackLeagues) ? fallbackLeagues : [],
      followedTeams: readJson(STORAGE_KEYS.followedTeams, createLeagueRecord([])),
      favoriteTeam: readJson(STORAGE_KEYS.favoriteTeam, createLeagueRecord(null))
    };
  }

  function teamSubtitle(team) {
    if (!team || typeof team !== 'object') return 'Dados indisponíveis';
    if (team.abbreviation) return `Sigla: ${team.abbreviation}`;
    const city = team.city || '';
    const conference = team.conference || '';
    if (city && conference) return `${city} • ${conference}`;
    return city || conference || team.league || 'Dados indisponíveis';
  }

  window.PlayNorthCore = {
    LEAGUES,
    STORAGE_KEYS,
    loadTheme,
    applyTheme,
    bootstrapThemeClass,
    loadPreferences,
    teamSubtitle
  };
})();
