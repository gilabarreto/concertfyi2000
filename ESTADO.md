# Estado — 2026-11-21

Último commit relevante: `3aa29a1` (Action diária do Overture, `.github/workflows/overture.yml`).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`. Frente aberta: carga do Overture Maps na tabela `venues` do D1 (270 mil de ~325 mil).
- Arquivos: `.github/workflows/overture.yml`, `scripts/overture-venues.py`, `server/overture.js`.

## Falta para terminar

- Dono, a partir de 2026-11-22 00:00 UTC: carregar 007 e 008 de `data/overture-sql/` (só na máquina dele),
  `mv data/overture-venues-2026-10-21.0.parquet data/overture-venues.parquet`, criar a Release
  `overture-data` com esse parquet + `loaded.txt` (`2026-10-21.0`) e rodar `gh workflow run overture.yml`.
  A partir daí a Action carrega sozinha o diff para o `2026-11-18.0` (2 arquivos/dia).
- Token Cloudflare dos secrets conferido em 2026-11-21 (run 44929251182 acessou o D1).
- Próximo item: CSV diário da Ticketmaster (EUA+Canadá) num repo privado à parte, nunca neste
  (público, e commit aqui redeploya). Esquema aceito em conversa: `upcoming.csv` sobrescrito a
  cada rodada, eventos passados acrescentados em `past-AAAA.csv`, coluna `last_seen`.
  Esperando o dono: chave separada e o repo com o secret `TICKETMASTER_CSV_KEY`.

## Avisos fora do código

- Termos da Ticketmaster: guardar só por "períodos razoáveis"; 24 h só se o dono do evento pedir. Backup pessoal é risco que o dono assume.
- Esperando o dono: confirmar as 4 `VITE_*` em Settings → Build do Worker `concertfyi-web` e desligar o GitHub Pages em Settings → Pages.
- Dado errado conhecido: o site que o Overture dá para o Dickens Pub de Calgary é de um Dickens de Ottawa.
- Recusado: scraping stealth do ticketmaster.com. Separar client/server em repos: desaconselhado (2026-11-19).
- Comandos que alteram produção ou publicam (`d1 execute --remote`, `gh release create`) são barrados no modo auto; o dono roda.
- `/city` apagada em `5b02289`. SETLISTFM_API_KEY: dono considera já trocada.
