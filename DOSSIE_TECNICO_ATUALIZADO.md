# 📋 Dossiê Técnico Consolidado: ConcertFYI
**Atualizado em 2026-10-10**

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
pages/               # Home, SearchPage, ArtistPage, VenuePage, VenuesPage, CityPage,
                     # About, Contact, SpotifyCallback
components/
  ArtistPage/        # cards da página de artista; ConcertList é o shell de toda lista de shows
  VenuePage/         # VenueInfo, VenueActions, VenuePhotos, VenueRating, VenueReviewSummary
  HomeDiscovery.jsx  # listas locais, carrossel Nearby Venues e card Explore Events da Home
  ExploreEvent.jsx   # linha aberta de um evento sem artista (Next Concert sem turnê)
  Swiper.jsx, Navbar.jsx, Footer.jsx, LocationSelector.jsx, SearchBar.jsx, ...
hooks/               # useAppState, useCurrentCity, useGeolocation, useDebounce, useScreenSize
context/AppContext.js
api/                 # queries.js (todos os hooks de rede), api.js, request.js, queryClient.js
helpers/             # selectors.js (join das APIs, datas), calendar, share, tourStats,
                     # nearbyConcert, concertTarget, spotifyAuth, spotifyPlaylist
locales/             # pt/es/fr.json; o inglês é a própria chave (i18n.js)
```

### Backend — `server/`
```
index.js             # CORS, rate limit (60 req/min/IP em /api/*), nosniff, trust proxy
http.js              # wrapper de fetch compartilhado — toda rota reporta { status, data }
venueIdentity.js     # casamento de venue entre fontes (nome + proximidade, um candidato só)
rateLimit.js, requestLog.js, musicbrainzClient.js
routes/              # ticketmaster, setlist, spotify, lyrics, youtube, wikipedia, albums,
                     # audiodb, share, venueInfo, venueLookup, venueServices
```

Sem banco, sem estado — cada rota é um repasse fino, com cache em memória curto onde a cota
pesa (setlist.fm 30 min, venue-lookup 1 h). O plano de cache em banco (Neon) está no
`SUGESTOES_ATUALIZADO.md`.

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
`SPOTIFY_CLIENT_SECRET`, `YOUTUBE_API_KEY`, `GOOGLE_PLACES_API_KEY`, `PORT`.

---

## 🛣️ Rotas do Frontend

| Rota | Componente | Observação |
|---|---|---|
| `/` | `Home.jsx` | Bundle inicial |
| `/search` | `SearchPage.jsx` | Lazy |
| `/artists/:artistId/concerts/:concertId` | `ArtistPage.jsx` | Lazy; arrasta o Google Maps |
| `/venues` | `VenuesPage.jsx` | Venues da cidade atual, mais movimentados primeiro |
| `/venues/:venueId` | `VenuePage.jsx` | id do setlist.fm ou `ticketmaster:<id>` |
| `/city` | `CityPage.jsx` | My City; `?view=upcoming\|nearby\|recent` foca uma lista |
| `/about`, `/contact` | `About.jsx`, `Contact.jsx` | Lazy |
| `/callback` | `SpotifyCallback.jsx` | Lazy; recebe o OAuth |

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
- **Venues**: `VenuePage.jsx` junta setlist.fm (shows passados), Ticketmaster (próximos e
  coordenada exata), Wikipedia/Wikidata (descrição) e Google Places + OpenStreetMap (endereço,
  telefone, fotos, avaliações e o pin do mapa). As fontes não compartilham id; quem decide se
  dois nomes são o mesmo lugar é `server/venueIdentity.js`.
- **Home**: `HomeDiscovery.jsx` monta Upcoming Concerts, Concerts Near, Nearby Venues e Explore
  Events. Eventos da Ticketmaster sem artista cadastrado (festas e noites de clube vêm como
  Music) saem das listas de shows e vão para Explore Events.
- **Idiomas**: EN/PT/ES/FR via `t("texto em inglês")` de `i18n.js`; dicionários em `locales/`.
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
- **Testes**: `node:test`, sem framework — 138 passando em 2026-10-10 (`node --test` na raiz),
  22 arquivos: utilitários do servidor, guardas de entrada e respostas de cada rota (incluindo o
  casamento de venues em `venueServices.test.js` / `venueInfo.test.js`), os helpers do client
  (`selectors`, `calendar`, `tourStats`, `nearbyConcert`, `concertTarget`, `spotifyPlaylist`) e a
  cobertura de tradução (`i18n.test.mjs`). Sem teste de componente — decisão
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

## 📞 Contato

https://concertfyi.com · [GitHub](https://github.com/gilabarreto/concertfyi2000) ·
gilabarreto@gmail.com
