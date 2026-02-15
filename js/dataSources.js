(function () {
  const SOURCE_KEY = 'dataSource';
  const DEFAULT_SOURCE = 'static';

  const registry = {
    static: () => new window.DataProvider.StaticProvider()
  };

  function getSelectedSource() {
    const raw = localStorage.getItem(SOURCE_KEY) || DEFAULT_SOURCE;
    return registry[raw] ? raw : DEFAULT_SOURCE;
  }

  function setSelectedSource(source) {
    const safeSource = registry[source] ? source : DEFAULT_SOURCE;
    localStorage.setItem(SOURCE_KEY, safeSource);
    return safeSource;
  }

  function getProvider(source = getSelectedSource()) {
    return (registry[source] || registry[DEFAULT_SOURCE])();
  }

  window.DataSources = {
    SOURCE_KEY,
    DEFAULT_SOURCE,
    registry,
    getSelectedSource,
    setSelectedSource,
    getProvider
  };
})();
