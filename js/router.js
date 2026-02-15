(function () {
  const LEAGUES = ['NFL', 'NBA', 'NHL', 'MLB', 'MLS'];

  function getPageName() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function detectLeagueFromPage() {
    const page = getPageName();
    const fromLeaguePage = page.replace('.html', '').toUpperCase();
    if (LEAGUES.includes(fromLeaguePage)) return fromLeaguePage;

    const params = new URLSearchParams(location.search);
    const league = (params.get('league') || '').toUpperCase();
    if (LEAGUES.includes(league)) return league;
    return null;
  }

  function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(location.search).entries());
  }

  window.Router = { LEAGUES, getPageName, detectLeagueFromPage, getQueryParams };
})();
