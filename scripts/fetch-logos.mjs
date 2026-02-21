import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const LEAGUE_ENDPOINTS = {
  NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
  NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
  MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
  MLS: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams'
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function readTeamsData() {
  const teamsPath = path.join(repoRoot, 'data', 'teams-data.js');
  const raw = await fs.readFile(teamsPath, 'utf8');
  const jsonText = raw.replace(/^\s*window\.TEAMS_DATA\s*=\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(jsonText);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function getBestLogo(teamObj) {
  const logos = Array.isArray(teamObj?.logos) ? [...teamObj.logos] : [];
  logos.sort((a, b) => Number(b?.width || 0) - Number(a?.width || 0));
  return logos[0]?.href || teamObj?.logo || '';
}

async function downloadLogo(url, outputPath) {
  if (!url) return false;
  const response = await fetch(url, { headers: { 'User-Agent': 'PlayNorth Logo Pipeline/1.0' } });
  if (!response.ok) return false;
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) return false;
  await fs.writeFile(outputPath, buffer);
  return true;
}

async function run() {
  const leaguesArg = process.argv[2];
  const leagues = leaguesArg
    ? leaguesArg.split(',').map((l) => l.trim().toUpperCase()).filter((l) => LEAGUE_ENDPOINTS[l])
    : Object.keys(LEAGUE_ENDPOINTS);

  const teamsData = await readTeamsData();
  const mapping = [];

  for (const league of leagues) {
    const endpoint = LEAGUE_ENDPOINTS[league];
    const destDir = path.join(repoRoot, 'assets', 'logos', league.toLowerCase());
    await ensureDir(destDir);

    const response = await fetch(endpoint, { headers: { 'User-Agent': 'PlayNorth Logo Pipeline/1.0' } });
    if (!response.ok) throw new Error(`Falha ao consultar ${league}: ${response.status}`);
    const payload = await response.json();
    const entries = payload?.sports?.[0]?.leagues?.[0]?.teams || [];

    for (const entry of entries) {
      const teamObj = entry?.team || {};
      const teamId = String(teamObj.id || '').trim();
      if (!teamId) continue;

      const name = teamObj.displayName || teamObj.name || 'Team';
      const abbreviation = teamObj.abbreviation || '';
      const logoUrl = getBestLogo(teamObj);
      const logoRelativePath = `assets/logos/${league.toLowerCase()}/${teamId}.png`;
      const logoAbsolutePath = path.join(repoRoot, logoRelativePath);

      let downloaded = false;
      try {
        downloaded = await downloadLogo(logoUrl, logoAbsolutePath);
      } catch {
        downloaded = false;
      }

      const internal = teamsData.find((item) => item.league === league && (
        normalize(item.name) === normalize(name) ||
        normalize(item.id) === normalize(name) ||
        (abbreviation && normalize(item.abbreviation) === normalize(abbreviation))
      ));

      mapping.push({
        league,
        teamId,
        name,
        abbrev: abbreviation,
        logoPath: downloaded ? logoRelativePath : null,
        logoUrl,
        internalId: internal?.id || null
      });
    }
  }

  const outputPath = path.join(repoRoot, 'data', 'logos-map.json');
  await fs.writeFile(outputPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
  console.log(`logos-map atualizado: ${outputPath} (${mapping.length} entradas)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
