ConcertFYI — Pendências e Decisões
🔴 Só você pode resolver (fora do repositório)
□ Liberar Maps Static API na chave VITE_GOOGLE_MAPS_KEY (Google Cloud Console). Hoje retorna 403: "This API key is not authorized to use this service or API." Sem isso, não dá para trocar o mapa interativo por imagem estática.
□ Restringir a mesma chave por referrer (mesma visita ao console). Vence 2026-10-15.
□ Rotacionar a SETLISTFM_API_KEY (vazou em bundle público na gh-pages em julho/2025). Abrir chamado no setlist.fm. Vence 2026-10-15.
□ A SETLISTFM_API_KEY do server/.env local responde 403 — cópia velha; apontar para produção ou renovar.
□ Sentry e/ou Google Analytics — contas suas; ~20 linhas cada. Hoje erros de produção só aparecem no console do visitante.
□ Conferir no painel do Render o que o log de acesso da plataforma guarda (IP? query?) e por quanto tempo — a promessa "sem IP e sem query" vale só para o nosso middleware.
□ Sair do GitHub Pages (Netlify/Vercel/Cloudflare Pages). Resolve: página de artista responder 404 real, CSP via header em vez de <meta>, e Cache-Control dos assets.
🟡 Decisões de produto/arquitetura
□ Mapa estático ou mapa atrás de clique — o mapa é o LCP (7,3–7,5 s) e custa ~400 kB de JS de terceiro. Bloqueado pela chave acima.
□ Token da Spotify no localStorage — risco aceito; trocar exige cookie httpOnly com servidor stateful.
□ Foto não-16:9 é cortada (object-cover na caixa aspect-video). Alternativa: object-contain com letterbox.
□ Pre-render/SSR para páginas de artista — só vale depois de haver tráfego para medir. Opções: pre-render dos N artistas mais buscados (precisa de métrica), SSR Next.js/Remix (muda hospedagem), Prerender.io (pago).
□ Diferencial de mercado — definir proposta de valor única (curadoria? cenas locais? social? setlists/lyrics?) e documentar no /about.
□ Dark mode — Tailwind suporta; falta toggle + localStorage.
🟢 Tarefas minhas, aguardando seu "pode fazer"
☑ Normalizar id no log de acesso — resolvido em `41a0e3d`.
☑ Lint quebrado em SearchBar.jsx:11 (`setPlaceholder` não usado) — resolvido em `5ce7c2a`. Achado e já corrigido revisando o Swiper em 2026-09-20.
⚪ Itens abertos no repositório (sem decisão sua pendente)
☑ Atualizar DOSSIE_TECNICO_ATUALIZADO.md — resolvido em `b0619a48` (2026-09-19): incorpora testes/CI, React Query, fetch, imagens/bundle, CSP, fontes locais e contato; separa entregue de propostas futuras.
□ Paginação no Setlist.jsx se >50 músicas.
□ Tempo estimado do show no Setlist.jsx.
□ Expandir/recolher "encore" no Setlist.jsx.
□ Botão "Copiar setlist" (clipboard).
□ Botão "Favoritar" em ConcertInfo.jsx (localStorage).
□ Botão "Compartilhar" em ConcertInfo.jsx.
□ Loading skeleton em ConcertInfo.jsx.
□ Genius link como fallback em SongDetails.jsx.
□ Ícone de loading na busca (SearchBar.jsx) — hoje o debounce de 700 ms não avisa nada.
□ Toast/mensagens amigáveis para timeouts — parcial; falta timeout próprio no request.js (hoje espera o navegador desistir).
□ Loading skeletons enquanto dados carregam — nenhum existe.
□ Monitoramento contínuo de Core Web Vitals — Lighthouse só roda na mão.
□ Testar com screen readers (NVDA, JAWS).
□ osv-scanner semanal — rodar em workflow agendado (não no deploy), abrindo issue.
□ Workflow em pull_request — hoje o CI é sempre pós-fato (todo commit vai direto para main).
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

