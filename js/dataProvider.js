(function () {
  function clone(value, fallback) {
    if (value == null) return fallback;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return fallback;
    }
  }

  function defaultStandingsFromTeams(teams) {
    return (window.Router?.LEAGUES || []).reduce((acc, league) => {
      const leagueTeams = teams.filter((team) => team.league === league).map((team, index) => ({
        team: team.name,
        w: 12 - index,
        l: index + 4,
        pct: (0.75 - index * 0.05).toFixed(3),
        streak: index % 2 === 0 ? `W${(index % 3) + 1}` : `L${(index % 3) + 1}`
      }));
      acc[league] = leagueTeams;
      return acc;
    }, {});
  }

  function StaticProvider() {}

  StaticProvider.prototype.getTeams = async function getTeams() {
    return clone(window.TEAMS_DATA, []);
  };

  StaticProvider.prototype.getGames = async function getGames() {
    return clone(window.GAMES_DATA, []);
  };

  StaticProvider.prototype.getNews = async function getNews() {
    return clone(window.NEWS_DATA, []);
  };

  StaticProvider.prototype.getStandings = async function getStandings() {
    const teams = await this.getTeams();
    const standings = clone(window.STANDINGS_DATA, null);
    return standings || defaultStandingsFromTeams(teams);
  };

  window.DataProvider = { StaticProvider };
})();
