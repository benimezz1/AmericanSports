import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const TEAMS_PATH = path.join(repoRoot, 'data', 'teams-data.js');
const MANIFEST_PATH = path.join(repoRoot, 'data', 'logos_manifest.json');

function parseTeams(raw) {
  const jsonText = raw.replace(/^\s*window\.TEAMS_DATA\s*=\s*/, '').replace(/;\s*$/, '');
  return JSON.parse(jsonText);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchCommonsTitle(teamName) {
  const search = encodeURIComponent(`${teamName} logo`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${search}&format=json&origin=*`;
  const response = await fetch(url, { headers: { 'User-Agent': 'PlayNorth Logo Finder/1.0' } });
  if (!response.ok) return null;
  const payload = await response.json();
  const title = payload?.query?.search?.[0]?.title;
  return title || null;
}

async function fetchImageInfo(title) {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
  const response = await fetch(url, { headers: { 'User-Agent': 'PlayNorth Logo Finder/1.0' } });
  if (!response.ok) return null;
  const payload = await response.json();
  const pages = payload?.query?.pages || {};
  const first = Object.values(pages)[0];
  return first?.imageinfo?.[0] || null;
}

async function maybeDownload(url, outputFile) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'PlayNorth Logo Finder/1.0' } });
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) return false;
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, buffer);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  const raw = await fs.readFile(TEAMS_PATH, 'utf8');
  const teams = parseTeams(raw);
  const missing = teams.filter((team) => !team.logo || String(team.logo).trim() === '');
  const manifest = [];

  for (const team of missing) {
    const slug = slugify(team.id || team.name);
    const league = String(team.league || 'misc').toLowerCase();
    const result = {
      league: team.league,
      teamId: team.id,
      teamName: team.name,
      slug,
      title: null,
      sourceUrl: null,
      mime: null,
      localPath: null,
      downloaded: false
    };

    try {
      const title = await fetchCommonsTitle(team.name);
      if (!title) {
        manifest.push(result);
        continue;
      }
      result.title = title;
      const imageInfo = await fetchImageInfo(title);
      const sourceUrl = imageInfo?.url || null;
      result.sourceUrl = sourceUrl;
      result.mime = imageInfo?.mime || null;

      if (sourceUrl) {
        const ext = result.mime === 'image/svg+xml' ? 'svg' : 'png';
        const rel = `assets/logos/${league}/${slug}.${ext}`;
        const abs = path.join(repoRoot, rel);
        const downloaded = await maybeDownload(sourceUrl, abs);
        result.downloaded = downloaded;
        if (downloaded) result.localPath = rel;
      }
    } catch {
      // mantém registro no manifest
    }

    manifest.push(result);
  }

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Manifesto gerado em ${MANIFEST_PATH} (${manifest.length} times sem logo).`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
