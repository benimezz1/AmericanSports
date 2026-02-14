/* PlayNorth prototype — render from local JSON (data/). No build tools needed. */

const LEAGUES = ["NFL","NBA","NHL","MLB","MLS"];
const TYPE_LABEL = {
  breaking: "Breaking",
  game: "Jogo",
  injury: "Lesão",
  trade: "Trade/Transferência",
  contract: "Contrato",
  rumor: "Rumor",
  stats: "Stats/Recorde",
  power: "Power Ranking",
  opinion: "Opinião",
  calendar: "Calendário"
};

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }
function byId(id){ return document.getElementById(id); }

const THEME_KEY = "playnorth-theme";

function updateThemeToggleText(theme){
  const btn = byId("themeToggle");
  if(!btn) return;
  btn.textContent = theme === "theme-dark" ? "Modo Claro" : "Modo Escuro";
}

function applyTheme(theme){
  const body = document.body;
  if(!body) return;
  const finalTheme = theme === "theme-light" ? "theme-light" : "theme-dark";
  body.classList.remove("theme-dark", "theme-light");
  body.classList.add(finalTheme);
  updateThemeToggleText(finalTheme);
  localStorage.setItem(THEME_KEY, finalTheme);
}

function setupThemeToggle(){
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme || "theme-dark");

  const btn = byId("themeToggle");
  if(!btn) return;

  btn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("theme-dark");
    applyTheme(isDark ? "theme-light" : "theme-dark");
  });
}

function formatDate(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(d);
  }catch(e){ return iso; }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function badgeHTML(league, type){
  const t = TYPE_LABEL[type] || (type ? type : "Notícia");
  return `
    <div class="kicker">
      <span class="chip"><strong>${escapeHtml(league)}</strong></span>
      <span class="chip">${escapeHtml(t)}</span>
    </div>
  `;
}

function newsCard(item, {size="normal"} = {}){
  const mediaClass = size === "small" ? "card-media small" : "card-media";
  const titleClass = size === "small" ? "title small" : "title";
  const href = `news.html?id=${encodeURIComponent(item.id)}`;

  return `
    <a class="card" href="${href}" aria-label="${escapeHtml(item.title)}">
      <div class="${mediaClass}" style="${item.image ? `background-image:url('${escapeHtml(item.image)}'); background-size:cover; background-position:center;` : ""}"></div>
      <div class="card-body">
        ${badgeHTML(item.league, item.type)}
        <h3 class="${titleClass}">${escapeHtml(item.title)}</h3>
        <p class="desc">${escapeHtml(item.summary || "")}</p>
        <div class="meta">
          <span>${formatDate(item.dateISO)}</span>
          ${item.source_name && item.source_url ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">Fonte: ${escapeHtml(item.source_name)}</a>` : (item.source_name ? `<span>Fonte: ${escapeHtml(item.source_name)}</span>` : "")}
        </div>
      </div>
    </a>
  `;
}

async function loadJSON(path){
  const res = await fetch(path, {cache: "no-store"});
  if(!res.ok) throw new Error(`Falha ao carregar ${path} (${res.status})`);
  return await res.json();
}

function setActiveNav(){
  const p = location.pathname.split("/").pop() || "index.html";
  qsa("a.navlink").forEach(a => {
    const href = a.getAttribute("href");
    if(href === p) a.classList.add("active");
  });
}

function ensureLeague(league){
  if(!league) return null;
  const up = league.toUpperCase();
  return LEAGUES.includes(up) ? up : null;
}

function renderHome({news, games, standings}){
  // Destaques do dia (hero + grid)
  const sorted = [...news].sort((a,b)=> new Date(b.dateISO) - new Date(a.dateISO));
  const highlights = sorted.filter(n => n.is_highlight).slice(0, 8);
  const hero = highlights[0] || sorted[0];
  const side = highlights.slice(1, 5);

  byId("heroMain").innerHTML = hero ? newsCard(hero, {size:"normal"}) : `<div class="notice">Sem notícias (por enquanto).</div>`;
  byId("heroSide").innerHTML = side.length ? side.map(n => newsCard(n, {size:"small"})).join("") : `<div class="notice">Sem destaques adicionais (ainda).</div>`;

  // Mini-seções por liga
  for(const lg of LEAGUES){
    const target = byId(`league_${lg}`);
    if(!target) continue;
    const items = sorted.filter(n => n.league === lg).slice(0, 3);
    target.innerHTML = items.length ? items.map(n => newsCard(n, {size:"small"})).join("") : `<div class="notice">Sem notícias de ${lg} por enquanto.</div>`;
  }

  // Jogos da semana
  const gamesSorted = [...games].sort((a,b)=> new Date(a.dateISO) - new Date(b.dateISO));
  const week = gamesSorted.slice(0, 8);
  byId("gamesGrid").innerHTML = week.map(g => gameCard(g)).join("");

  // Standings (resumo)
  byId("standingsGrid").innerHTML = LEAGUES.map(lg => standingsCard(lg, standings)).join("");
}

function gameCard(g){
  const label = g.status === "final" ? "Final" : (g.status === "live" ? "Ao vivo" : "Agendado");
  const score = (g.status === "final" || g.status === "live") ? ` • ${g.away_score ?? 0}–${g.home_score ?? 0}` : "";
  return `
    <div class="card">
      <div class="card-body">
        <div class="kicker">
          <span class="chip"><strong>${escapeHtml(g.league)}</strong></span>
          <span class="chip">${escapeHtml(label)}${escapeHtml(score)}</span>
        </div>
        <h3 class="title small">${escapeHtml(g.away)} @ ${escapeHtml(g.home)}</h3>
        <p class="desc">${formatDate(g.dateISO)}</p>
      </div>
    </div>
  `;
}

function standingsCard(league, standings){
  const rows = (standings[league] || []).slice(0, 5);
  const body = rows.length ? `
    <div class="tablewrap">
      <table>
        <thead><tr><th>Time</th><th>W</th><th>L</th><th>%</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${escapeHtml(r.team)}</td><td>${r.w}</td><td>${r.l}</td><td>${r.pct}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  ` : `<div class="notice">Sem ranking ainda.</div>`;

  return `
    <div class="card">
      <div class="card-body">
        <div class="kicker">
          <span class="chip"><strong>${escapeHtml(league)}</strong></span>
          <span class="chip">Top 5</span>
        </div>
        <h3 class="title small">Ranking / Standings</h3>
        ${body}
        <div class="meta"><a href="standings.html#${escapeHtml(league)}">Ver completo</a></div>
      </div>
    </div>
  `;
}

function renderLeaguePage({news}, league){
  const sorted = [...news].filter(n => n.league === league).sort((a,b)=> new Date(b.dateISO) - new Date(a.dateISO));
  const top = sorted.slice(0, 6);
  const latest = sorted.slice(0, 24);

  byId("leagueTitle").textContent = `${league} — Destaques`;

  // Filtros por tipo (para caber todos os tipos de notícia)
  const types = [...new Set(sorted.map(n => n.type).filter(Boolean))].sort();
  const pills = ["all", ...types];
  byId("typePills").innerHTML = pills.map(t => `
    <button class="pill ${t==="all" ? "active" : ""}" data-type="${escapeHtml(t)}">
      ${t==="all" ? "Tudo" : escapeHtml(TYPE_LABEL[t] || t)}
    </button>
  `).join("");

  const renderList = (type) => {
    const items = type === "all" ? latest : latest.filter(n => n.type === type);
    byId("leagueGrid").innerHTML = items.length ? items.map(n => newsCard(n, {size:"small"})).join("") : `<div class="notice">Sem notícias para esse filtro.</div>`;
  };

  renderList("all");

  qsa("#typePills .pill").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa("#typePills .pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderList(btn.dataset.type);
    });
  });

  byId("topGrid").innerHTML = top.length ? top.map(n => newsCard(n, {size:"small"})).join("") : `<div class="notice">Sem destaques.</div>`;
}

function renderNewsPage({news}){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const item = news.find(n => n.id === id) || news[0];

  if(!item){
    byId("newsBody").innerHTML = `<div class="notice">Notícia não encontrada.</div>`;
    return;
  }

  qs("title").textContent = `${item.title} • PlayNorth`;

  byId("newsHero").innerHTML = `
    <div class="card">
      <div class="card-media" style="${item.image ? `background-image:url('${escapeHtml(item.image)}'); background-size:cover; background-position:center;` : ""}"></div>
      <div class="card-body">
        ${badgeHTML(item.league, item.type)}
        <h1 class="title">${escapeHtml(item.title)}</h1>
        <p class="desc">${escapeHtml(item.summary || "")}</p>
        <div class="meta">
          <span>${formatDate(item.dateISO)}</span>
          ${item.source_name && item.source_url ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">Fonte: ${escapeHtml(item.source_name)}</a>` : ""}
        </div>
        ${item.tags?.length ? `<div class="pills">${item.tags.map(t => `<span class="chip">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      </div>
    </div>
  `;

  const content = item.content || "Conteúdo completo ainda não gerado (protótipo). Em breve: texto, contexto, estatísticas, e links relacionados.";
  byId("newsContent").innerHTML = `
    <div class="card">
      <div class="card-body">
        <p class="desc" style="font-size:14px; color: var(--text)">${escapeHtml(content)}</p>
      </div>
    </div>
  `;

  const related = news
    .filter(n => n.id !== item.id && (n.league === item.league || (n.tags || []).some(t => (item.tags || []).includes(t))))
    .sort((a,b)=> new Date(b.dateISO) - new Date(a.dateISO))
    .slice(0, 6);

  byId("relatedGrid").innerHTML = related.length ? related.map(n => newsCard(n, {size:"small"})).join("") : `<div class="notice">Sem relacionadas ainda.</div>`;
}

function renderGamesPage({games}){
  const pills = ["all", ...LEAGUES];
  byId("leaguePills").innerHTML = pills.map(lg => `
    <button class="pill ${lg==="all" ? "active" : ""}" data-league="${escapeHtml(lg)}">
      ${lg==="all" ? "Todas" : escapeHtml(lg)}
    </button>
  `).join("");

  const sorted = [...games].sort((a,b)=> new Date(a.dateISO) - new Date(b.dateISO));

  const render = (lg) => {
    const items = lg === "all" ? sorted : sorted.filter(g => g.league === lg);
    byId("gamesList").innerHTML = items.length ? items.map(g => gameCard(g)).join("") : `<div class="notice">Sem jogos para esse filtro.</div>`;
  };
  render("all");

  qsa("#leaguePills .pill").forEach(btn => {
    btn.addEventListener("click", () => {
      qsa("#leaguePills .pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render(btn.dataset.league);
    });
  });
}

function renderStandingsPage({standings}){
  const pills = LEAGUES;
  byId("standingsPills").innerHTML = pills.map(lg => `
    <a class="pill" href="#${escapeHtml(lg)}">${escapeHtml(lg)}</a>
  `).join("");

  byId("standingsBlocks").innerHTML = LEAGUES.map(lg => standingsBlock(lg, standings[lg] || [])).join("");
}

function standingsBlock(league, rows){
  const body = rows.length ? `
    <div class="tablewrap">
      <table>
        <thead><tr><th>Time</th><th>W</th><th>L</th><th>%</th><th>Streak</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td>${escapeHtml(r.team)}</td>
            <td>${r.w}</td>
            <td>${r.l}</td>
            <td>${r.pct}</td>
            <td>${escapeHtml(r.streak || "-")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  ` : `<div class="notice">Sem dados.</div>`;

  return `
    <div class="section" id="${escapeHtml(league)}">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(league)} — Ranking / Standings</h2>
          <p>Protótipo (dados fake em JSON para teste)</p>
        </div>
      </div>
      ${body}
    </div>
  `;
}

async function boot(){
  setupThemeToggle();
  setActiveNav();

  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const news = await loadJSON("data/news.json");
  const games = await loadJSON("data/games.json");
  const standings = await loadJSON("data/standings.json");

  // Normaliza liga para garantir consistência
  news.forEach(n => n.league = ensureLeague(n.league) || n.league);
  games.forEach(g => g.league = ensureLeague(g.league) || g.league);

  if(page === "index.html" || page === ""){
    renderHome({news, games, standings});
  }else if(["nfl.html","nba.html","nhl.html","mlb.html","mls.html"].includes(page)){
    const league = page.replace(".html","").toUpperCase();
    renderLeaguePage({news}, league);
  }else if(page === "news.html"){
    renderNewsPage({news});
  }else if(page === "games.html"){
    renderGamesPage({games});
  }else if(page === "standings.html"){
    renderStandingsPage({standings});
  }
}

document.addEventListener("DOMContentLoaded", () => {
  boot().catch(err => {
    console.error(err);
    const el = document.getElementById("appError");
    if(el) el.textContent = "Erro ao carregar dados do protótipo. Veja o console do navegador.";
  });
});
