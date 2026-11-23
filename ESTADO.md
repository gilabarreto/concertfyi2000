# Estado — 2026-11-23

Último commit relevante: `3aa29a1` (Action diária do Overture, `.github/workflows/overture.yml`).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`. Frente aberta: primeira atualização automática do Overture Maps no D1.
- Arquivos: `.github/workflows/overture.yml`, `scripts/overture-venues.py`, `server/overture.js`.

## Falta para terminar

- Carga inicial do Overture completa em 2026-11-23: 325.589 venues (62,4 MB) no D1, Release `overture-data`
  com o parquet + `loaded.txt` (`2026-10-21.0`). A Action diária (01:30 UTC) deve calcular e carregar
  sozinha o diff para o `2026-11-18.0`, 2 arquivos/dia — conferir a primeira rodada em 2026-11-24.
- Token Cloudflare dos secrets conferido em 2026-11-21 (run 44929251182 acessou o D1).
- CSV diário da Ticketmaster no ar desde 2026-11-22 no repo privado `concertfyi-data` (fora deste,
  que é público e redeploya a cada commit). Mesma chave de produção, teto de 1.000 chamadas/rodada.

## Avisos fora do código

- Termos da Ticketmaster: guardar só por "períodos razoáveis"; 24 h só se o dono do evento pedir. Backup pessoal é risco que o dono assume.
- Esperando o dono: confirmar as 4 `VITE_*` em Settings → Build do Worker `concertfyi-web` e desligar o GitHub Pages em Settings → Pages.
- Dado errado conhecido: o site que o Overture dá para o Dickens Pub de Calgary é de um Dickens de Ottawa.
- Recusado: scraping stealth do ticketmaster.com. Separar client/server em repos: desaconselhado (2026-11-19).
- Comandos que alteram produção ou publicam (`d1 execute --remote`, `gh release create`) são barrados no modo auto; o dono roda.
- `/city` apagada em `5b02289`. SETLISTFM_API_KEY: dono considera já trocada.
