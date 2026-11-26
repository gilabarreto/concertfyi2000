# Estado — 2026-11-26

Último commit relevante: `8915fc5` (ordem de gravação do Overture: nenhuma venue some no meio da carga).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`. Frente aberta: primeira atualização automática do Overture Maps no D1.
- Arquivos: `.github/workflows/overture.yml`, `scripts/overture-venues.py`, `server/overture.js`.

## Falta para terminar

- Atualização `2026-10-21.0` → `2026-11-18.0` em andamento pela Action (2 arquivos/dia, 9 restantes em
  2026-11-26, fim ~2026-12-01). Gerada antes do `8915fc5`: os DELETE vieram primeiro e o D1 está com
  ~55 mil venues até a carga terminar (site cai no OSM/Google nesse meio). Não mexer; próximas usam `plan()`.
- Token Cloudflare dos secrets conferido em 2026-11-21 (run 44929251182 acessou o D1).
- Backup no repo privado `concertfyi-data` (Action diária): shows da Ticketmaster EUA+CA, `artists.csv`
  (MusicBrainz+Wikipedia, ~270/dia, completo ~2026-12-08) e `venues.csv` (Overture pela mesma regra do
  site, importa `server/overture.js` deste repo). Setlists NÃO: termos do setlist.fm proíbem guardar.
  Esperando o dono: setlists (recomendado: não) e About da venue no backup (sim/não).

## Avisos fora do código

- Termos da Ticketmaster: guardar só por "períodos razoáveis"; 24 h só se o dono do evento pedir. Backup pessoal é risco que o dono assume.
- Esperando o dono: confirmar as 4 `VITE_*` em Settings → Build do Worker `concertfyi-web` e desligar o GitHub Pages em Settings → Pages.
- Dado errado conhecido: o site que o Overture dá para o Dickens Pub de Calgary é de um Dickens de Ottawa.
- Recusado: scraping stealth do ticketmaster.com. Separar client/server em repos: desaconselhado (2026-11-19).
- Comandos que alteram produção ou publicam (`d1 execute --remote`, `gh release create`) são barrados no modo auto; o dono roda.
- `/city` apagada em `5b02289`. SETLISTFM_API_KEY: dono considera já trocada.
