ConcertFYI — Pendências e Decisões
🔴 Só você pode resolver (fora do repositório)
□ Liberar Maps Static API na chave VITE_GOOGLE_MAPS_KEY (Google Cloud Console). Hoje retorna 403: "This API key is not authorized to use this service or API." Sem isso, não dá para trocar o mapa interativo por imagem estática.
□ Restringir a mesma chave por referrer (mesma visita ao console). Vence 2026-10-15.
□ Rotacionar a SETLISTFM_API_KEY (vazou em bundle público na gh-pages em julho/2025). Abrir chamado no setlist.fm. Vence 2026-10-15.
☑ A SETLISTFM_API_KEY do server/.env local responde 403 — resolvido sozinho: respondeu 200 em 2026-10-01, testando o API Lab.
□ Sentry e/ou Google Analytics — contas suas; ~20 linhas cada. Hoje erros de produção só aparecem no console do visitante.
□ Conferir no painel do Render o que o log de acesso da plataforma guarda (IP? query?) e por quanto tempo — a promessa "sem IP e sem query" vale só para o nosso middleware.
□ Sair do GitHub Pages (Netlify/Vercel/Cloudflare Pages). Resolve: página de artista responder 404 real, CSP via header em vez de <meta>, e Cache-Control dos assets.
□ Tag de afiliado da Amazon Associates Canadá — os discos abaixo do player (`03a9664`, no ar em 2026-09-27) linkam para busca na amazon.ca sem tag, então não comissionam. Pegar a tag (formato `xxxx-20`) no painel do Associates e preencher `AMAZON_TAG` em `client/src/components/ArtistPage/Albums.jsx`.
□ Definir `API_LAB_TOKEN` no painel do Render (Environment) com uma senha longa, para o `/api-lab` funcionar no site no ar (código em `1ca0e4a` e `bdf1c60`, 2026-10-02). Sem a variável a rota continua não existindo em produção.
🟡 Decisões de produto/arquitetura
□ Pôster oficial por tour — pesquisa de 25/09/2026: Event Art Archive fornece arte por MBID de evento, sem endpoint documentado por nome de tour. Experimento retirado da ArtistPage por decisão do dono em 26/09/2026; consultas mantidas no API Lab. Retomar associação à tour somente com fonte explícita; não tratar pôster de outra data como o show atual. Resumo e fontes em `docs/APIS_E_FONTES.md`.
□ Enriquecimento visual e descoberta — Miniaturas TheAudioDB via MBID aprovadas pelo dono em 26/09/2026, com Ticketmaster como foto inicial. A revisão dos termos do provedor segue pendente. Cover Art Archive para capas de álbuns e ListenBrainz/Last.fm para recomendações seguem como candidatos pesquisados em 25/09/2026. Ver `docs/APIS_E_FONTES.md`.
□ Concert Times em Past Concerts — adiado por decisão do dono em 2026-09-21; prévia e dados fictícios removidos. Ideia: Doors, início/fim do show e lineup com horário de cada artista. A API pública documentada do setlist.fm não expõe campos estruturados para esses horários nem lineup com horários; o campo livre `info` pode conter observações, mas não garante esses dados. Retomar somente com uma fonte confiável ou suporte oficial da API. Referências: [modelo da API](https://api.setlist.fm/docs/1.0/json_Setlist.html) e [pedido de inclusão dos horários](https://www.setlist.fm/forum/setlistfm/setlistfm-api/feature-request-api-add-fields-to-responses-1bd705e8).
□ Mapa estático ou mapa atrás de clique — o mapa é o LCP (7,3–7,5 s) e custa ~400 kB de JS de terceiro. Bloqueado pela chave acima.
□ Token da Spotify no localStorage — risco aceito; trocar exige cookie httpOnly com servidor stateful.
□ Foto não-16:9 é cortada (object-cover na caixa aspect-video). Alternativa: object-contain com letterbox.
□ Pre-render/SSR para páginas de artista — só vale depois de haver tráfego para medir. Opções: pre-render dos N artistas mais buscados (precisa de métrica), SSR Next.js/Remix (muda hospedagem), Prerender.io (pago).
□ Diferencial de mercado — definir proposta de valor única (curadoria? cenas locais? social? setlists/lyrics?) e documentar no /about.
□ Dark mode — Tailwind suporta; falta toggle + localStorage.
☑ PDF de pôsteres — conteúdo consolidado em `docs/APIS_E_FONTES.md`; PDF e Zone.Identifier removidos da árvore local em 01/10/2026. Nenhuma reescrita do histórico Git.
□ Share no iPhone depois do `await` da compressão (review de 2026-09-29) — desde `1bcb841`, `shareOrCopy` comprime o payload antes de chamar `navigator.share`. O Safari do iOS exige gesto do usuário "fresco" e pode recusar com NotAllowedError depois de um `await`; o catch engole e o botão parece não fazer nada. Não reproduzido — testar no iPhone. Se falhar, a correção é gerar o token antes do clique (no render), não no handler.
🟢 Tarefas minhas, aguardando seu "pode fazer"
☑ Normalizar id no log de acesso — resolvido em `41a0e3d`.
☑ Lint quebrado em SearchBar.jsx:11 (`setPlaceholder` não usado) — resolvido em `5ce7c2a`. Achado e já corrigido revisando o Swiper em 2026-09-20.
⚪ Itens abertos no repositório (sem decisão sua pendente)
☑ Atualizar DOSSIE_TECNICO_ATUALIZADO.md — resolvido em `b0619a48` (2026-09-19): incorpora testes/CI, React Query, fetch, imagens/bundle, CSP, fontes locais e contato; separa entregue de propostas futuras.
☑ Paginação no Setlist.jsx se >20 músicas — resolvido em `7156262`.
☑ Atração da Ticketmaster casada pelo nome do artista (achado do /code-review de `ae0abbf`, 2026-09-26) — gênero em `84db691`; foto, sociais e Spotify em `7ca76af`. Antes liam `attractions[0]`, que às vezes é tributo ou banda de abertura. Sem par por nome, os cards ficam vazios.
☑ Gêneros só da Ticketmaster — decisão do dono em 2026-09-26: não voltar o top 4 do MusicBrainz que saiu em `ae0abbf`.
☑ Código sem uso após `ae0abbf` (useEventArt, concertArtwork.js, formatArtistBackground, rotas /api/musicbrainz e /api/event-art) — removido em `836ee41`; o API Lab segue usando musicbrainzClient e eventArt.js pelo servidor.
□ Tempo estimado do show no Setlist.jsx.
☑ Sinalizar onde começa o "encore" no Setlist.jsx — resolvido em `c9f4f5e` (pedido original era expandir/recolher; o dono preferiu só sinalizar, sem esconder nada).
☑ Botão "Copiar setlist" (clipboard) — resolvido em `8a5a94c`.
☑ Favoritar — resolvido em `3e8398d`. Pedido original era favoritar o show em ConcertInfo.jsx; o dono não curtiu, preferiu favoritar o artista (coração em ArtistInfo.jsx) e marcar presença no show ("I WAS THERE" em ConcertInfo.jsx) — os dois já existiam desabilitados na UI, agora ligados em localStorage.
☑ Botão "Compartilhar" — resolvido em `5f881a0` (2026-09-26). ConcertInfo.jsx não existe mais; entrou ao lado do "I WAS THERE" em LastConcert.jsx. Share sheet nativo no celular, cópia do link no desktop.
□ Loading skeleton em ConcertInfo.jsx.
□ Genius link como fallback em SongDetails.jsx.
□ Ícone de loading na busca (SearchBar.jsx) — tentado em `01696ef` (spinner ao lado do X) e revertido a pedido do dono em 2026-09-26. Reabrir só com outro formato.
☑ Timeout próprio nas requisições — já existia (achado 2026-09-26): request.js aborta em 10 s desde a saída do axios e o erro vem como "Request timed out".
☑ Mensagem de erro na busca — resolvido em `4e06b7b` ("Search failed. Try again" abaixo do campo). Toast descartado por opinião: mensagem inline como nas outras telas basta; o dono pode vetar.
□ Loading skeletons enquanto dados carregam — nenhum existe.
□ Monitoramento contínuo de Core Web Vitals — Lighthouse só roda na mão.
□ Testar com screen readers (NVDA, JAWS).
□ osv-scanner semanal — rodar em workflow agendado (não no deploy), abrindo issue.
□ Bundle de entrada acima do teto de 270 kB — achado em 2026-10-02: a `main` em `6951817` já buildava 282,66 kB (o build avisa, mas não trava). Não veio do API Lab (que soma 0,3 kB). Falta achar qual commit passou do teto e cortar, ou subir o teto em commit próprio com motivo. Em 2026-10-01 as seções novas do setlist.fm somaram ~5 kB (286,20 → 290,94 kB): `queries.js` e `api.js` entram na entrada pela Home, então cada hook novo pesa ali mesmo com as páginas em lazy.
□ Workflow em pull_request — hoje o CI é sempre pós-fato (todo commit vai direto para main).
☑ Seções novas a partir da resposta do setlist.fm (rodada de 2026-10-01, pedido do dono):
  - lista da página de artista pelo mbid em vez do nome (a busca por nome trazia ~17% de outros artistas) — `5e2a264`;
  - cover, convidado, tape, nota da música, nome do set e nota do show no Setlist — `9c75099`;
  - card Tour Statistics com mapa da turnê abaixo do Artist Info — `ceab820`;
  - página do venue + botão VENUE acima da lista de Upcoming Concerts — `d9caf59`;
  - página My City + botão MY CITY — `3764d1f`;
  - `3764d1f` apagou sem querer o `locationOf` da UpcomingConcerts e toda página de artista quebrou em produção até `1d0f89c`. Os botões eram para a Home e foram para lá em `52de73b`. Na Home, o VENUE abre `/venues` (venues da cidade ordenados por shows no ano), já que lá não existe show aberto de onde tirar o venue.
  - card Recently Added na Home — `9d56540`.
□ Cota do setlist.fm nas seções novas — Tour Statistics gasta até 5 chamadas por turnê, Venue e My City até 3 cada, todas sem cache no servidor (só o React Query, por navegador). (Corrigido no review de 2026-10-02: o cache de 30 min do Recently Added saiu quando a rota virou busca por cidade; hoje nenhuma rota do setlist.fm tem cache no servidor.)
□ Venue: o Ticketmaster é casado pelo nome do venue a até 50 km das coordenadas da cidade no setlist.fm (os dois não compartilham id). É a mesma costura frágil do nome do artista: um nome diferente nas duas APIs deixa os Upcoming do venue vazios.
□ Na Home, a linha VENUE / MY CITY empurra o título "Upcoming Concerts" uns 30 px para baixo do "Concerts Near You" ao lado. Se incomodar: botões abaixo do título, ou a mesma altura reservada na coluna da direita.
□ My City usa só o ano corrente do setlist.fm: em janeiro a lista de passados fica quase vazia. Trocar por "últimos 12 meses" custa uma segunda busca com o ano anterior.

Review de 2026-10-02 (`/agent-skills:review`, de `5e2a264` a `171a7a6`, incluindo os commits da outra sessão):
☑ CRÍTICO — resolvido em `8acba4c` (cache de 30 min por consulta em todas as rotas paginadas, com fetch compartilhado entre visitantes simultâneos; `/recent` arredondado para o dia). Cota do setlist.fm na Home: cada visita nova dispara `/recent` (3 páginas) + `/city` (3 páginas) = até 6 chamadas, sem cache no servidor. A cota diária estourada derruba também a página de artista, que é o núcleo do app. O rate limit de 60 req/min por IP vira 300 chamadas/min ao setlist.fm, porque cada rota paginada multiplica por 3 a 5. Correção: cache em memória por chave nas rotas paginadas (`allPages`), o mesmo formato de `venueInfo.js`. O limite diário exato da chave é de memória; conferir no painel do setlist.fm.
☑ IMPORTANTE — resolvido em `b3e80ab` (log, `partial: true`, fora do cache, e o Tour Statistics avisa quantas datas vieram). `allPages` (server/routes/setlist.js) engole a falha das páginas 2+ sem log. Um 429 na página 2 sai como 200 com 20 shows, e o Tour Statistics mostra "Shows played: 20" numa turnê de 34. É exatamente o caso que o comentário de `/suggest` no ticketmaster.js diz para não deixar mudo. Correção: logar e devolver `partial: true`.
□ IMPORTANTE — Google Places (server/routes/venueServices.js) é API paga: cada página de venue gasta details + reviews + até 3 mídias de foto (o place id fica 24 h em cache, o conteúdo não pode por termos do Google). `GOOGLE_PLACES_API_KEY` e `OVERPASS_API_URL` não estão no CLAUDE.md nem no README. Antes de configurar a chave no Render: limite de orçamento e de cota no Google Cloud Console.
□ IMPORTANTE — Parcial: 302,51 → 276,10 kB com HomeDiscovery em lazy (`d7e22b7`) e ícones da entrada importados pelo caminho (`4b65b10`). Faltam 6 kB para o teto de 270; dos 276, ~230 são bibliotecas (react-dom 129, react-query 35, helmet 14, router 20) e ~40 são código do app (Swiper 9, LocationSelector 4,5, Navbar 4). Decisão do dono: subir o teto para ~280 em commit próprio com esse motivo, ou cortar mais (trocar react-helmet-async pelo suporte nativo a <title>/<meta> do React 19 economiza ~14 kB, mas exige migrar de React 18). Era: Bundle de entrada em 302,51 kB (teto de 270 kB). Eram 281,94 kB no início da sessão, 290,94 kB depois das seções novas, e agora a Home importa direto o `HomeDiscovery` (TicketOptions, HotelOptions, ConcertReminder, ViewConcertButton). Correção: `React.lazy` no HomeDiscovery, que fica abaixo da dobra, ou subir o teto em commit próprio com motivo.
☑ SUGESTÃO — resolvido em `3c3bbe6`. Sem teste de guarda para `/recent` e `/venue-details/:venueId` em validation.test.js; as outras rotas novas têm.
☑ SUGESTÃO — resolvido em `3c3bbe6`. O comentário "Venue page. Newest first…" em setlist.js ficou acima de `/venue-details`, mas descreve `/venue/:venueId`.
□ SUGESTÃO — esperando o dono: pôr ESLint + Prettier no server é mudança da régua (CONSTRAINTS.md), traz dependências novas e reformata todos os arquivos do server de uma vez, inclusive os da outra sessão. server/ passou de 500 linhas de rotas (1.482 sem testes): é o gatilho que o CONSTRAINTS.md marcou para pôr lint/prettier no server. venueServices.js tem linhas de 300+ caracteres.
☑ SUGESTÃO — resolvido em `e3a27a3` (`distanceKm` em selectors.js; as três cópias eram do client, o server segue com a sua em venueIdentity.js). Haversine em três lugares: `venueIdentity.nearby` (server), `findTourUpcomingEvent` (tourStats.js) e o mapa. O client não pode importar do server, mas os dois do client podem virar um só.

⚪ Descartado (registro, decisão reversível)
TypeScript · Storybook · reorganização de pastas (common/, layout/, services/, constants/) · extrair ArtistCard/EmptyState/Logo/SongItem · cobertura mínima de 80% · LogRocket · Service Worker/offline · Vitest + jsdom + Testing Library (reabrir só com bug que só teste de hook pegaria — candidato: useGeolocation) · Playwright (120 MB de Chromium) · aria-current="page" no Navbar (achado 2026-09-20: item ficou obsoleto — o Navbar de hoje não tem link de navegação nenhum, só 4 botões de ícone, 3 deles disabled como placeholder; os links existiram no passado, `31da572`, e saíram depois; reabrir se o Navbar ganhar links de novo).

✅ Referência rápida — o que já está feito
SEO: rotas do sitemap respondem 200 (static-routes.mjs); SEOHead.jsx com Helmet.

Error Boundary nas rotas; retry via React Query (retry: 1; songCache com retry: false).

Code splitting por rota (5 rotas em App.jsx:13-17); entrada em 258,28 kB.

CI/CD com lint + teste + gitleaks antes do build; npm ci; concurrency no deploy.

Rate limit 60 req/min por IP em /api/* com trust proxy.

Log de requisições em close (pega aborts), caminho truncado em 120 chars, sem IP/query.

CSP via <meta> em plugin Vite (build-only); zero violação nas rotas testadas.

DM Sans hospedada localmente, variável, pesos 100–1000.

Lighthouse produção: acessibilidade 100; SEO 100; CLS 0,002 na página de artista.

58 testes (node:test); CONSTRAINTS.md + npm run check; teto de bundle 270 kB aplicado no vite.config.js.

Formulário de contato inline com role="status" e botão desabilitado durante envio.

Botão de perfil do Navbar removido (não tinha onClick).

Tooltips nos ícones de Spotify e YouTube em SongDetails.jsx e Setlist.jsx (achado 2026-09-20, revisando o item — já existiam via `title`). Genius ainda não é feature no app; ver item de fallback do Genius, separado.

Review de 2026-09-29: contraste dos botões do menu de seções subiu para WCAG AA (eb92be3); rota `/share/:token` ganhou teste, incluindo a bomba de deflate (5adf0a3).

□ Agregação de concertos e cobertura Brasil — catálogo e origem/fallbacks em `docs/APIS_E_FONTES.md` e API Lab. Antes de produção, comparar amostras equivalentes e resolver credenciais/licenças, especialmente Bandsintown, Sympla/Ingresse e planos comerciais.
□ Fallbacks gratuitos — avaliar link Spotify via MusicBrainz/Wikidata, biografia TheAudioDB por MBID, busca LRCLIB, placeholder de capas e link OSM; propostas documentadas, sem mudança automática na ArtistPage.
□ Localização divergente — Home configura Calgary nas listas e o hook usa Vancouver como fallback; carrossel pode usar seleção manual. Revisar unificação em tarefa própria.

□ Estatísticas adicionais de tour — card retirado da ArtistPage por decisão do dono; países, cidades, músicas por show, músicas mais tocadas, abertura/encerramento e raridades preservados para futura avaliação em `docs/TOUR_STATISTICS.md`. Mapa e legenda ficam acessíveis pelo nome da tour em Last/Next Concert.

☑ Perfil de venues — implementado localmente com dados do setlist.fm/Ticketmaster e fallback Wikidata/Wikipedia; sem nova chave. Endereço, inauguração, links, descrição e serviços aparecem apenas quando confirmados. Fontes, limites e comportamento em falhas documentados em `docs/APIS_E_FONTES.md`.
☑ Complemento de venues — Google Places API (New) e OpenStreetMap/Overpass implementados localmente e validados ao vivo com Wembley. `GOOGLE_PLACES_API_KEY` configurada no servidor local; configurar também no Render quando publicar. Phone/Opening hours separados da bilheteria; Reviews consulta somente ao abrir o popup. Fontes e configuração em `docs/APIS_E_FONTES.md`; Yelp fica para outra etapa.
