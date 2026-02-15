# Triagem de APIs esportivas (PlayNorth)

Checklist para avaliar APIs reais antes da integração:

- [ ] **Custo**: plano free, limites de uso e custo de escala.
- [ ] **Cobertura**: NFL/NBA/MLB/NHL/MLS + notícias + estatísticas.
- [ ] **Rate limit**: requests/min, requests/day, políticas de burst.
- [ ] **CORS**: permite consumo direto no front-end? exige proxy?
- [ ] **Auth**: API Key, OAuth, rotação de token, segurança.
- [ ] **Atualização**: tempo real, atraso médio, webhooks/polling.
- [ ] **Termos**: uso comercial, redistribuição, cache, branding obrigatório.
- [ ] **Qualidade de schema**: estabilidade de campos, versionamento.
- [ ] **Suporte Brasil**: timezones, idioma, sinalização de transmissão local.

## Tabela de comparação

| Provedor | Custo | Cobertura ligas | Rate limit | CORS | Auth | Frequência de atualização | Termos/limites | Observações |
|---|---|---|---|---|---|---|---|---|
| Static (JSON atual) | Sem custo | Mock interno | N/A | Local | Nenhum | Manual | Livre | Base de desenvolvimento |
| ESPN (avaliar) |  |  |  |  |  |  |  |  |
| SportsData (avaliar) |  |  |  |  |  |  |  |  |
| Outro: ______ |  |  |  |  |  |  |  |  |

## Plano de integração sugerido

1. Criar provider dedicado (`EspnProvider`, `SportsDataProvider`) em `js/dataProvider.js`.
2. Registrar no `js/dataSources.js`.
3. Ativar via `settings.html` no seletor de fonte de dados.
4. Normalizar schema de retorno para: `teams`, `games`, `news`, `standings`.
5. Adicionar fallback para `static` quando API falhar.
