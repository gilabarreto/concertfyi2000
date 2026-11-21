# Estado — 2026-11-18

Último commit relevante: `83c3b4c` (About da venue lido do site da própria venue, `server/venueSite.js`).
Backlog completo em SUGESTOES_ATUALIZADO.md — só consultar quando o dono pedir.

## Agora

- Branch `main`, árvore limpa. Frente aberta: dados de venue sem Google (Overture Maps no D1).
- Arquivos: `server/overture.js`, `server/venueSite.js`, `server/routes/venueServices.js`, `scripts/overture-venues.py`.

## Falta para terminar

- Carga remota do Overture: 001–006 no D1 (270 mil venues, 51,6 MB); faltam 007 e 008, **2 por dia** (limite 100 mil gravações/dia do D1).
  Os `.sql` estão em `data/overture-sql/`, que só existe na máquina local do dono — a nuvem não consegue fazer a carga.
  Comando: `npx wrangler d1 execute concertfyi --remote --config server/wrangler.toml --file data/overture-sql/00N.sql -y`
  Depois do 008: `mv data/overture-venues-2026-10-21.0.parquet data/overture-venues.parquet`.
- Próxima decisão pendente (dono): GitHub Action mensal para atualizar o Overture — precisa de token Cloudflare (D1: Edit) como secret `CLOUDFLARE_API_TOKEN`.
- Fila depois disso (ordem do dono, 2026-11-17): Explore Events na página de cidade/venue + share de `/venues/` com prévia; CSV diário da Ticketmaster pela Discovery API (faltam chave separada e lista de países).

## Avisos fora do código

- Esperando o dono: confirmar as 4 `VITE_*` em Settings → Build do Worker `concertfyi-web` e desligar o GitHub Pages em Settings → Pages.
- Dado errado conhecido: o site que o Overture dá para o Dickens Pub de Calgary parece ser de um Dickens de Ottawa. Não corrigido.
- Recusado: scraping stealth do ticketmaster.com. Não reabrir; o caminho é a Discovery API.
- Google Maps Platform: não guardar nada do Google além do place ID (termos). Nota/reviews/fotos só no clique.
- Comandos que alteram produção (`wrangler deploy`, `d1 execute --remote`) são barrados no modo auto; o dono roda.
- Render suspenso (não apagado). SETLISTFM_API_KEY: dono considera já trocada (2026-11-21); não está no histórico atual.
- `server/` ainda tem advisory de minimatch via nodemon (só dev) — esperando versão nova do nodemon.
