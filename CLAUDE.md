CLAUDE.md — Guia do repositório
Comandos
Dois projetos npm independentes, sem workspace raiz. Sempre cd client ou cd server primeiro.

bash
# client (Vite dev em :3000, proxy /api → localhost:4000 — rode o server também)
cd client && npm run dev
cd client && npm run build       # vite build + copia dist/index.html para 404.html (SPA no GH Pages)

# server (Express em :4000)
cd server && npm run dev         # nodemon
cd server && npm start

# testes — node:test, sem framework nem config, da raiz do repo
node --test                      # os dois arquivos de teste, ~0.1s
node --test server/http.test.js  # um arquivo só

# portão de qualidade — package.json da raiz é só scripts, NÃO é workspace
npm run check                    # gitleaks (staged) + lint do client + testes, ~2.5s
npm run check:full               # check + build do client, ~5s
Ler CONSTRAINTS.md antes de mexer no código e fazer a mudança passar nele. Nunca enfraquecer limite, deletar teste ou adicionar supressão para a mudança passar — se um limite está errado, mudar em commit próprio com o motivo.

Deploy é automático dos dois lados: push em main roda deploy.yml, que builda o client e publica client/dist na branch gh-pages (concertfyi.com). O servidor está no Render, que observa main sozinho e redeploya por conta própria — nenhum workflow deste repo faz isso, mas um push em main ainda entrega server/ para produção. Verificado em 2026-09-15 sondando /api/spotify/token ao vivo para uma mudança recém-pushada.

.history/ é um dump de histórico local do VS Code (gitignored, milhares de cópias .jsx com timestamp). Excluir de toda busca — hits de grep/find ali são duplicatas velhas, nunca o arquivo vivo.

Arquitetura
Client (GitHub Pages) → proxy Express (Render) → APIs de terceiros. O servidor existe só para manter as chaves de API fora do browser; não tem banco nem estado. Toda rota é repasse fino.

As duas fontes de dados e como se juntam
O app inteiro é um join entre duas APIs que não compartilham ids:

Setlist.fm — shows passados e suas músicas. Shows com chave concert.id, artista por artist.mbid (id MusicBrainz, que é o :artistId nas URLs). Datas em DD-MM-YYYY.

Ticketmaster — eventos futuros e imagens de artista. Eventos com id próprio, datas em dates.start.localDate (YYYY-MM-DD).

São casados por string do nome do artista (attractions.find(a => a.name === concert.artist.name) em ArtistPage.jsx, mesmo filtro em UpcomingConcerts.jsx). Não há mapeamento de id entre eles — é a costura frágil do app, e é por isso que useArtistData busca os dois em paralelo e engole a falha de qualquer um em vez de quebrar a página.

Como os dois formatos de data diferem, os dois construtores de lista parseiam para um dateObj antes de ordenar (selectors.js:getPastConcertsByArtist para passado, getUpcomingConcertsByArtist para futuro).

Sempre construir um Date a partir das partes, nunca de uma string de data. new Date("2026-09-16") é meia-noite UTC pela especificação, ou seja, a noite anterior em qualquer offset negativo — isso foi ao ar como bug em que o show de amanhã aparecia entre os passados nas últimas três horas de todo dia. selectors.js:parseSetlistDate é o único parser do DD-MM-YYYY do setlist.fm; chamar ela em vez de partir a string de novo. Testes que tocam datas setam process.env.TZ antes do primeiro Date, porque o CI roda em UTC onde toda essa classe de bug é invisível.

Estado: context para a sessão, React Query para fetch
AppContext (alimentado por useAppState) guarda os payloads atuais de setlist + ticketmaster para navegar entre shows não refazer fetch, mais selectedLocation persistido em localStorage. React Query é dono de tudo que é rede; todos os hooks vivem em client/src/api/queries.js e todas as chamadas axios em api.js. Nada mais no app deve chamar a rede direto.

queryClient.js compartilha só um orçamento de retry (retry: 1); cada query em queries.js define seu próprio staleTime/gcTime, notadamente o preset songCache para lyrics/YouTube/Spotify (dados imutáveis, APIs com cota, retry: false).

ArtistPage.jsx trata o cold-start: link compartilhado ou refresh chega com context vazio, então busca o show pelo id da URL e depois backfilla o setlist completo do artista + dados do Ticketmaster.

Layout da página de artista
ArtistPage.jsx compõe os cards; tudo sob components/ArtistPage/ é um card. ConcertList.jsx é o shell de lista compartilhado — PastConcerts e UpcomingConcerts renderizam por ele com callbacks locationOf / linkOf / expand em vez de marcação própria. UpcomingConcerts fornece uma linha expandida de três painéis: TicketOptions, HotelOptions, ConcertReminder. Os dois primeiros renderizam por VendorTiles.jsx, então mudanças de tamanho/alinhamento de tile pertencem lá, uma vez.

Superfícies de monetização (vendedores de ingresso, hotéis) são alvos de link de afiliado. Os comentários dizendo por que um vendedor foi mantido ou removido são load-bearing — ler antes de adicionar ou remover um. A Ticketmaster publica priceRanges só para uma fatia do inventário, então todo tile cai para "Check price".

Rotas do servidor
server/http.js é o wrapper de fetch compartilhado; toda rota o usa e reporta erro como { status, data }. Rotas: ticketmaster (suggest pagina até 5 páginas / 100 eventos, e /events faz a busca geográfica), setlist, spotify (troca de token — o client nunca vê o segredo), lyrics (lrclib.net, sem chave), youtube.

Env do server: TICKETMASTER_API_KEY, SETLISTFM_API_KEY, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, YOUTUBE_API_KEY, PORT.
Env do client: VITE_API_BASE, VITE_GOOGLE_MAPS_KEY, VITE_FORMSPREE_ID, VITE_SPOTIFY_CLIENT_ID (todas como secrets do GitHub para o deploy).

Origens novas precisam entrar em allowedOrigins no server/index.js, ou o CORS bloqueia.

Fluxo da playlist do Spotify
Auth code flow num popup: Setlist.jsx guarda as músicas em localStorage, abre getSpotifyAuthUrl(), o popup cai em /callback (SpotifyCallback.jsx), troca o code pelo servidor e faz postMessage de SPOTIFY_AUTH_SUCCESS de volta para o opener, que então cria a playlist. O estado cruza a fronteira da janela por localStorage, não por props.

Qual processo governa o quê
Dois conjuntos de instruções estão ativos ao mesmo tempo e puxam em direções opostas: ponytail (parar no primeiro degrau que funciona, sem abstrações não pedidas) e os workflows do agent-skills (spec primeiro, TDD, uma régua de qualidade escrita). A divisão, acordada com o dono:

Planejamento, review, teste, constraints — os workflows do agent-skills lideram. É onde o projeto está genuinamente descoberto: sem lint, sem CI, e o client não tem teste nenhum.

Implementação — ponytail lidera. É um app de ~3.5k linhas com duas chamadas de API e sem banco; scaffolding para uma escala que ele não vai alcançar é o modo de falha que ele existe para prevenir.

Onde os dois colidem numa decisão concreta, dizer isso e deixar o dono escolher em vez de seguir um em silêncio. Uma spec ou um teste que o ponytail pularia não é desperdício aqui; uma interface com uma implementação só, sim.

Uma correção por commit, pushada conforme entra. Não há staging: um push em main builda o client na gh-pages e o Render redeploya o server do mesmo commit, então todo commit é release dos dois lados. Um lote de cinco mudanças que sobe junto não tem falha bissetável, e o dono não consegue testar uma sem levar as outras quatro. Então: um item, um commit, push, próximo. Quando o dono está no teclado ele testa cada uma antes da próxima; quando não está, é uma rodada autônoma e o resumo vem no fim — não é motivo para lote.

Mensagens de commit em inglês. Os docs do dono (SUGESTOES_ATUALIZADO.md, DOSSIE_TECNICO_ATUALIZADO.md, CONSTRAINTS.md) ficam em português, e a conversa também. Commits de 2026-09-15 estão em português; deixar, reescrever história por causa de idioma não vale o risco.

Fechar toda rodada de skill. Uma skill termina resolvendo o que achou. O que sobrar vai para SUGESTOES_ATUALIZADO.md com o motivo — resolvido (com hash do commit), esperando o dono, ou descartado. Um achado que não virou nem commit nem linha nesse arquivo foi perdido. Descartar um item é opinião, então marcar como tal; o dono pode vetar.

