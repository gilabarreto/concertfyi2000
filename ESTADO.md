# Estado — 2026-11-28

Último commit relevante: `25c59e9` (CLS da Home 0,13 → 0,0013: legenda do carrossel reservada).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`, tudo pushado. "Posso fazer sozinho" do SUGESTOES concluído em 2026-11-27/28:
  cache setlist.fm no D1 (`f6c379e`, apaga >23,5 h), carrossel na mesma cidade das listas (`757700d`),
  fallbacks OSM/LRCLIB/capa/bio TheAudioDB (`71b0b07`..`a5e461c`), CI em PR (`a8a5372`),
  Core Web Vitals semanal (`cce19ce`, `scripts/vitals.sh`), CLS da Home (`25c59e9`).
- Esperando o dono: riscos aceitos (token Spotify, chave grátis TheAudioDB, venue por nome) e
  descartados (SEO em inglês, frases do logo, The MLB, Pawn Shop Live) — resposta por número 1–7.
- Também do dono: tag Amazon, Sentry/Analytics, ESLint no server, festas na venue, diferencial, leitor de tela.
- Testar no aparelho: share no iPhone, skeletons em rede lenta, Top tracks sem Spotify na TM, bio/letra/capa.
- Primeira rodada do job Core Web Vitals: disparar à mão em Actions → Weekly checks e conferir.

## Falta para terminar

- Overture `2026-10-21.0` → `2026-11-18.0` carregando pela Action (fim ~2026-12-01). Conferir ~338.655
  venues no D1 depois. Próximas atualizações já usam `plan()` (`8915fc5`).
- Backup no repo privado `concertfyi-data`: `artists.csv` completo ~2026-12-08 (conferir ~3.188 com mbid).
- Entrada do bundle em 265 kB, teto 270 kB: pouca folga.

## Avisos

- Desejos só com fonte externa (pôster, horários, estatísticas, duração do show): bloco no topo do SUGESTOES.
- setlist.js, wikipedia.js e musicbrainzClient.js mandam o e-mail do dono no User-Agent; o plugin de
  privacidade barra comandos de shell que tocam neles — editar com Edit. Trocar por contato genérico: dono decide.
- Termos da Ticketmaster: guardar só por "períodos razoáveis". Backup pessoal é risco do dono.
- Comandos que alteram produção ou publicam (`d1 execute --remote`, `gh release create`): o dono roda.
- O backup importa `server/overture.js`, `routes/venueInfo.js` e `venueSite.js`: mudar assinatura quebra lá.
