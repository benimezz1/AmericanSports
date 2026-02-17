const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'data', 'teams_raw');
const outputPath = path.join(__dirname, '..', 'data', 'teams-data.js');

const LEGACY_IDS = {
  NFL: {
    'Kansas City Chiefs': 'chiefs',
    'Philadelphia Eagles': 'eagles',
    'San Francisco 49ers': '49ers'
  },
  NBA: {
    'Los Angeles Lakers': 'lakers',
    'Boston Celtics': 'celtics',
    'Golden State Warriors': 'warriors'
  },
  NHL: {
    'New York Rangers': 'rangers',
    'Edmonton Oilers': 'oilers',
    'Boston Bruins': 'bruins'
  },
  MLB: {
    'Los Angeles Dodgers': 'dodgers',
    'New York Yankees': 'yankees',
    'Houston Astros': 'astros'
  },
  MLS: {
    'Inter Miami CF': 'inter-miami',
    'Los Angeles FC': 'lafc',
    'Seattle Sounders FC': 'sounders'
  }
};

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getConference(rawTeam) {
  return rawTeam.conference ?? rawTeam.league ?? null;
}

function getStadium(rawTeam) {
  return rawTeam.stadium ?? rawTeam.arena ?? null;
}

function build() {
  if (!fs.existsSync(rawDir)) {
    throw new Error(`Raw teams directory not found: ${rawDir}`);
  }

  const files = fs.readdirSync(rawDir)
    .filter((file) => file.toLowerCase().endsWith('.json'))
    .sort();

  const usedIds = new Map();
  const teams = [];

  for (const file of files) {
    const league = path.basename(file, '.json').toUpperCase();
    const source = JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'));

    for (const rawTeam of source) {
      const legacyId = LEGACY_IDS[league]?.[rawTeam.name] || null;
      const baseSlug = legacyId || toSlug(rawTeam.name || 'team');
      const count = (usedIds.get(baseSlug) || 0) + 1;
      usedIds.set(baseSlug, count);

      const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;

      teams.push({
        league,
        id,
        name: rawTeam.name ?? null,
        city: rawTeam.city ?? null,
        conference: getConference(rawTeam),
        division: rawTeam.division ?? null,
        founded: rawTeam.founded ?? null,
        stadium: getStadium(rawTeam),
        logo: rawTeam.logo ?? null,
        abbreviation: null,
        trending: false
      });
    }
  }

  const fileContents = `window.TEAMS_DATA = ${JSON.stringify(teams, null, 2)};\n`;
  fs.writeFileSync(outputPath, fileContents);

  console.log(`Generated ${teams.length} teams into ${path.relative(process.cwd(), outputPath)}`);
}

build();
