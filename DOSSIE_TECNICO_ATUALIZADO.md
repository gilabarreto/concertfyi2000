# 📋 Dossiê Técnico Consolidado: ConcertFYI
**Atualizado em 2026-09-19**

> Este documento descreve o que está no ar hoje. Para o que falta e o porquê de cada decisão de
> não fazer algo, ver `SUGESTOES_ATUALIZADO.md` — não duplicado aqui. Para a régua de qualidade
> (lint, testes, teto de bundle, CVEs), ver `CONSTRAINTS.md`. Para arquitetura e convenções de
> código, ver `CLAUDE.md` — este dossiê é a foto do estado, aqueles são as regras de como mexer.

---

## 🎯 Objetivo e Infraestrutura

**O que é**: SPA em React + Vite para descobrir shows: busca de artistas, histórico de setlists
(Setlist.fm), próximos eventos e ingressos (Ticketmaster), letras (LRCLib) e players embutidos
(Spotify, YouTube). Duas APIs de terceiros que não compartilham id nenhum — casadas por nome de
artista, o ponto mais frágil do app (ver `CLAUDE.md`).

### Hospedagem e Deploy
- **Repositório**: dois projetos npm independentes (`client/`, `server/`), sem workspace raiz.
- **Frontend**: GitHub Pages, publicado a partir de `client/dist` na branch `gh-pages`.
- **Backend**: Render — só proxy, sem banco, sem estado. Redeploya sozinho a cada push em `main`,
  sem workflow neste repo fazendo isso.
- **Domínio**: `concertfyi.com`.
- **Deploy é automático e imediato**: todo push em `main` builda o client e o Render reimplanta o
  server do mesmo commit. Não existe staging — cada commit é um release nos dois lados.

---

## 🏗️ Arquitetura Atual

### Frontend — `client/src/`
```
App.jsx              # Router + Suspense; Home no bundle inicial, resto em React.lazy por rota
pages/                # Home, SearchPage, ArtistPage, About, Contact, SpotifyCallback
components/
  ArtistPage/         # ArtistInfo, ConcertInfo, ConcertList (shell de PastConcerts/UpcomingConcerts),
                      # Setlist, SongDetails, Player, Map, TicketOptions, HotelOptions,
                      # ConcertReminder, VendorTiles
  Swiper.jsx          # Carrossel de shows recomendados na Home
  Navbar.jsx / Footer.jsx
  LocationSelector.jsx, SearchBar.jsx, ErrorBoundary.jsx, SEOHead.jsx, Pagination.jsx, Icon.jsx
hooks/                # useAppState, useGeolocation, useDebounce, useScreenSize
context/AppContext.js # setlist + ticketmaster da sessão atual, selectedLocation (localStorage)
api/                  # queries.js (React Query, todos os hooks de rede), api.js (axios→fetch, ver
                      # request.js), queryClient.js (retry: 1 compartilhado)
helpers/              # selectors.js (join das duas APIs, parse de datas), calendar.js,
                      # spotifyAuth.js, spotifyPlaylist.js
```
Não existe `config/` nem `icons.js` centralizados — rotas ficam direto em `App.jsx`
(`react-router-dom`), ícones são importados do FontAwesome onde usados. `Header.jsx` existiu e foi
removido em 2026-09-18 (rodada visual); About/Contact hoje só usam `SEOHead` + o próprio conteúdo.

### Backend — `server/`
```
index.js              # CORS, rate limit (60 req/min/IP em /api/*), nosniff, trust proxy (Render)
http.js                # wrapper de fetch compartilhado — toda rota reporta { status, data }
rateLimit.js / requestLog.js
routes/
  ticketmaster.js      # suggest pagina até 5 páginas/100 eventos; events faz a busca geo
  setlist.js
  spotify.js           # troca de código OAuth — segredo nunca chega ao client
  lyrics.js            # lrclib.net, sem chave
  youtube.js
  musicbrainz.js
```
Sem banco, sem estado — cada rota é um passa-adiante fino. Não existe rota `/api/locations`;
geolocalização e busca de cidade rodam no client (`useGeolocation`, fuzzy search local).

### Estado: Context para a sessão, React Query para rede
`AppContext` guarda `setlist`/`ticketmaster` atuais (não refaz fetch ao navegar entre concertos do
mesmo artista) e `selectedLocation`. Toda chamada de rede é um hook em `api/queries.js`; nada mais
no app chama a rede direto. `queryClient.js` só define `retry: 1` global — cada query ajusta seu
próprio `staleTime`/`gcTime` (o preset `songCache` para lyrics/YouTube/Spotify usa `retry: false`,
são APIs de cota).

### Variáveis de ambiente
**Client**: `VITE_API_BASE`, `VITE_GOOGLE_MAPS_KEY`, `VITE_FORMSPREE_ID`, `VITE_SPOTIFY_CLIENT_ID`
(secrets do GitHub Actions, injetadas no build do `deploy.yml`).
**Server**: `TICKETMASTER_API_KEY`, `SETLISTFM_API_KEY`, `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `YOUTUBE_API_KEY`, `PORT`.

---

## 🛣️ Rotas do Frontend

| Rota | Componente | Observação |
|---|---|---|
| `/` | `Home.jsx` | Bundle inicial |
| `/search` | `SearchPage.jsx` | Lazy |
| `/artists/:artistId/concerts/:concertId` | `ArtistPage.jsx` | Lazy; arrasta o Google Maps (155 kB) |
| `/about` | `About.jsx` | Lazy |
| `/contact` | `Contact.jsx` | Lazy |
| `/callback` | `SpotifyCallback.jsx` | Lazy; recebe o OAuth do Spotify via popup |

`ArtistPage.jsx` cobre o cold-start: link compartilhado ou refresh chega com o `AppContext` vazio,
então busca o concerto pela URL e completa com o setlist + dados da Ticketmaster do artista.

---

## 🧩 Componentes e fluxos principais

- **Swiper.jsx** (Home): carrossel dos shows próximos à localização atual (Ticketmaster). Clique
  num slide busca o artista completo e navega para `/artists/:id/concerts/:id`.
- **ArtistPage.jsx**: compõe os cards de `components/ArtistPage/`. `ConcertList.jsx` é o shell
  compartilhado — `PastConcerts` e `UpcomingConcerts` renderizam por ele via `locationOf`/`linkOf`.
  `UpcomingConcerts` expande em três painéis: `TicketOptions`, `HotelOptions`, `ConcertReminder`
  (o `.ics` de calendário, não e-mail/SMS — ver decisão em `SUGESTOES_ATUALIZADO.md`).
  `TicketOptions`/`HotelOptions` renderizam via `VendorTiles.jsx` (sizing/alinhamento fica ali,
  uma vez só). Os comentários de por que um vendedor de afiliado entrou ou saiu são load-bearing.
- **Setlist.jsx / SongDetails.jsx**: `LyricsDropdown`, player do Spotify, embed do YouTube.
- **Spotify playlist**: auth-code flow via popup. `Setlist.jsx` guarda as músicas no
  `localStorage`, abre `getSpotifyAuthUrl()`; o popup cai em `/callback`
  (`SpotifyCallback.jsx`), troca o código pelo servidor e dá `postMessage` de volta pro opener,
  que cria a playlist. Estado atravessa a janela via `localStorage`, não por props.
- **Contact.jsx**: formulário via Formspree (`VITE_FORMSPREE_ID`), desabilita o botão durante o
  envio e reporta sucesso/erro num `role="status" aria-live="polite"` — sem toast de biblioteca.
- **ErrorBoundary.jsx**: envolve só as `<Routes>`, não Navbar/Footer — um erro de página não
  derruba a navegação.

---

## 🚀 Build, CI e SEO

- **Code splitting por rota** (`React.lazy` + `Suspense`, `App.jsx`) — a entrada carrega só Home.
- **CSP**: injetada como `<meta http-equiv="Content-Security-Policy">` no `index.html` pelo
  `vite.config.js` no build (produção só; o dev server usa WebSocket de HMR que a CSP bloquearia).
  Cada domínio de terceiro na política tem o motivo comentado ali (Maps, YouTube, Spotify, os
  quatro subdomínios `t0-t3.gstatic.com` dos favicons de vendor no `VendorTiles`, etc.).
- **Fontes locais**: DM Sans self-hosted em `.woff2` (`client/public/fonts`), `font-display: swap`,
  declaradas via `@font-face` no `index.css` — zero requisição a fonts.google.com para as fontes
  do próprio app (o Maps ainda puxa Roboto do Google sozinho, coberto à parte no CSP).
- **SEO estático**: `client/scripts/static-routes.mjs` roda no build e emite um `dist/<rota>.html`
  por `<loc>` do `sitemap.xml`, porque o GitHub Pages devolve 404 para rota sem arquivo (o
  `404.html` — cópia do `index.html` — faz a tela abrir mesmo assim, mas o status que o Googlebot
  vê continua 404). Resolve `/`, `/about`, `/contact`; as páginas de artista continuam de fora —
  são infinitas, não dá para enumerar num sitemap (detalhe da decisão em `SUGESTOES_ATUALIZADO.md`).
- **Bundle**: teto de aviso em `vite.config.js` (`chunkSizeWarningLimit`), hoje 270 kB para o chunk
  de entrada — histórico e motivo de cada corte (axios→fetch, FontAwesome runtime→SVG estático)
  em `CONSTRAINTS.md`.
- **CI**: `deploy.yml` roda varredura de segredo (`gitleaks`), instala client e server, formata,
  linta e testa a árvore inteira **antes** de buildar e publicar — falhou um passo, o deploy não
  sai. `weekly-checks.yml` roda CVE scan (`osv-scanner`) nos dois lockfiles e um health-check do
  proxy no Render toda segunda, abrindo issue em vez de bloquear push (não é isso que o CVE de
  terceiro pode alcançar).
- **Testes**: `node:test`, sem framework — 66 passando hoje (`node --test` na raiz), cobrindo
  `server/http.js`, `rateLimit.js`, `requestLog.js`, as guardas de entrada das rotas
  (`routes/validation.test.js`), `api/request.js`, `helpers/calendar.js`, `helpers/selectors.js`
  (a costura entre as duas APIs) e `helpers/spotifyPlaylist.js`. Sem teste de componente — decisão
  registrada em `SUGESTOES_ATUALIZADO.md`, não esquecimento.

---

## 🏆 Qualidade de código

Régua completa e números medidos em `CONSTRAINTS.md` (lint 0 achados, `prettier --check` limpo,
0 falhas de teste, 0 segredo, 0 CVE sem exceção registrada, teto de bundle). Resumo do que mudou
desde agosto:

| Aspecto | Status |
|---|---|
| Lint | ESLint instalado e zero achados (antes: `eslintConfig` morto do Create React App, Vite não rodava nada) |
| Formatação | Prettier, `client/` inteiro formatado de uma vez |
| Error handling | `ErrorBoundary` nas rotas; sem Sentry ainda (próximo passo documentado em `SUGESTOES_ATUALIZADO.md`) |
| CI/CD | `deploy.yml` com portão antes do build; `weekly-checks.yml` para CVE e saúde do proxy |
| Acessibilidade | Lighthouse 100 em produção; navegação por setas no carrossel e `aria-current` no Navbar ainda faltam |
| Type Safety | JSDoc pontual, sem TypeScript — decisão reversível, registrada como descartada por ora |

---

## 📁 Estrutura de pastas

```
concertfyi2000/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/          # queries.js, api.js, request.js, queryClient.js
│   │   ├── components/   # inclui components/ArtistPage/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/      # AppContext.js
│   │   ├── helpers/      # selectors.js, calendar.js, spotifyAuth.js, spotifyPlaylist.js
│   │   ├── index.css     # Tailwind + @font-face da DM Sans
│   │   └── main.jsx
│   ├── public/           # favicon.svg, fonts/, robots.txt, sitemap.xml, CNAME
│   ├── scripts/static-routes.mjs
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── index.js
│   ├── http.js, rateLimit.js, requestLog.js
│   ├── routes/           # ticketmaster, setlist, spotify, lyrics, youtube, musicbrainz
│   └── package.json
├── .github/workflows/    # deploy.yml, weekly-checks.yml
├── CLAUDE.md             # arquitetura e convenções para quem mexe no código
├── CONSTRAINTS.md        # régua de qualidade medida
├── SUGESTOES_ATUALIZADO.md  # backlog: o que falta e por quê
└── package.json          # raiz só de scripts (check, check:full) — não é workspace
```

---

## 📞 Contato

https://concertfyi.com · [GitHub](https://github.com/gilabarreto/concertfyi2000) ·
gilabarreto@gmail.com
