# PlayNorth

Portal de esportes americanos (NFL, NBA, NHL, MLB, MLS) em HTML/CSS/JS puro, com foco em UX mobile para público brasileiro.

## O que mudou

- **Dark mode corrigido**: variáveis de superfície/header/nav com override completo no `body.dark-mode`.
- **Header/nav mais robusto**: links sem quebra de linha, scroll horizontal suave e hamburger com animação mais limpa.
- **Controle rápido de sidebar (3 setinhas)**: alterna entre modo Global/Context sem abrir a sidebar.
- **Novo bloco “Onde assistir (Brasil)”**:
  - NBA: placeholder com ESPN/Disney+ e jogos grátis no YouTube da NBA Brasil em dias específicos.
  - NFL: placeholder com Game Pass International/DAZN.
- **Novo fluxo “Acompanhar / Alertas”**:
  - Toggle por time e por liga.
  - Painel de alertas simulados em Configurações.
- **Camada de dados pronta para APIs reais**:
  - `js/dataProvider.js`: interface de leitura (`getTeams`, `getGames`, `getNews`, `getStandings`).
  - `StaticProvider` usando os mocks atuais.
  - `js/dataSources.js` com registry e seletor via `localStorage` (`dataSource`).
  - Seletor de fonte de dados em Settings (hoje apenas Static habilitado).
- **Documentação de triagem**: `docs/TRIAGEM_APIS.md` com checklist e tabela para avaliação de provedores.

## Como rodar localmente

- Abra `index.html` com servidor estático:
  - VS Code: extensão **Live Server**
  - ou qualquer servidor estático simples

## Estrutura de dados atual (mock)

- `data/teams-data.js`
- `data/games-data.js`
- `data/news-data.js`
- `data/standings-data.js`
- `data/watch-guide.js`

## Como plugar uma API real depois

1. Crie um provider novo em `js/dataProvider.js` (ex.: `EspnProvider`) implementando:
   - `getTeams()`
   - `getGames()`
   - `getNews()`
   - `getStandings()`
2. Normalize o retorno para o mesmo formato usado pela UI.
3. Registre o provider em `js/dataSources.js`.
4. Habilite a opção no select de Settings.
5. Faça fallback para `static` em caso de erro/rede.
6. Use o checklist de `docs/TRIAGEM_APIS.md` antes de entrar em produção.

## Pipeline de logos (automático)

O projeto inclui um coletor de logos por liga em `scripts/fetch-logos.mjs`.

### Executar

```bash
node scripts/fetch-logos.mjs
```

Opcional: rodar só algumas ligas:

```bash
node scripts/fetch-logos.mjs NFL,NBA,MLS
```

### O que o script faz

1. Consulta a ESPN Site API por liga.
2. Coleta `teamId`, nome, abreviação e melhor URL de logo.
3. Baixa PNG local em `assets/logos/<liga>/<teamId>.png`.
4. Atualiza `data/logos-map.json` com:
   - `league`
   - `teamId`
   - `name`
   - `abbrev`
   - `logoPath`
   - `logoUrl`
   - `internalId` (quando casar com `data/teams-data.js`)

No runtime, o app tenta usar `logoPath` local primeiro. Se não existir, usa o `logo` original de `teams-data.js`. Se também falhar, cai no fallback de iniciais do time.

### Bônus: varredura de logos faltantes via Wikimedia

Para times sem logo definido no JSON atual, use:

```bash
node scripts/fetch_logos.mjs
```

O script gera `data/logos_manifest.json` com os links encontrados na Wikimedia Commons e tenta baixar para `assets/logos/<league>/<slug>.(svg|png)` quando possível.
