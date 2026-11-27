# Estado — 2026-11-27

Último commit relevante: `915672f` (link do Spotify pelo MusicBrainz quando a Ticketmaster não traz).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`, tudo pushado. Lista de 2026-11-27 concluída: share no iPhone (`e09be7a`), busca no
  Genius sem letra (`2a5bcd0`), foto inteira sobre cópia borrada (`d22572f`), skeletons (`48b2cde`),
  Spotify via MusicBrainz (`915672f`, rota `/api/artist-spotify`, só na página de show).
- Testar no aparelho: share no iPhone real; skeletons em rede lenta; card Top tracks de artista sem Spotify na TM.

## Falta para terminar

- Overture `2026-10-21.0` → `2026-11-18.0` carregando pela Action (fim ~2026-12-01). Conferir ~338.655
  venues no D1 depois. Próximas atualizações já usam `plan()` (`8915fc5`).
- Backup no repo privado `concertfyi-data` (Action diária): shows da Ticketmaster EUA+CA, `artists.csv`
  (completo ~2026-12-08, conferir ~3.188 com mbid) e `venues.csv` com About. Setlists fora (termos).
- Entrada do bundle em 265 kB, teto 270 kB: pouca folga, o build avisa quando passar.

## Avisos fora do código

- Termos da Ticketmaster: guardar só por "períodos razoáveis". Backup pessoal é risco que o dono assume.
- Dado errado conhecido: o site que o Overture dá para o Dickens Pub de Calgary é de um Dickens de Ottawa.
- Recusado: scraping stealth do ticketmaster.com. Separar client/server em repos: desaconselhado (2026-11-19).
- Comandos que alteram produção ou publicam (`d1 execute --remote`, `gh release create`) são barrados no modo auto; o dono roda.
- O backup importa `server/overture.js`, `routes/venueInfo.js` e `venueSite.js`: mudar assinatura quebra lá.
