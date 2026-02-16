(function () {
  function computeScore(item, state) {
    let score = 0;
    const league = item.league;
    const favoriteTeam = state.favoriteTeam[league];
    const followed = state.followedTeams[league] || [];
    const teams = item.teams || [item.teamHome, item.teamAway].filter(Boolean);

    if (teams.includes(favoriteTeam)) score += 1000;
    if (teams.some((team) => followed.includes(team))) score += 500;
    if (item.trending) score += 100;
    if ((state.followLeagues || state.followedLeagues).includes(league)) score += 150;

    return score;
  }

  function sortByUserPriority(list, state) {
    return [...list].sort((a, b) => {
      const scoreDiff = computeScore(b, state) - computeScore(a, state);
      if (scoreDiff !== 0) return scoreDiff;
      const aDate = new Date(a.date || a.datetime || 0).getTime();
      const bDate = new Date(b.date || b.datetime || 0).getTime();
      return bDate - aDate;
    });
  }

  window.Sorter = { computeScore, sortByUserPriority };
})();
