CONSTRAINTS.md — Pendências e Exceções
🔴 Só você pode resolver
□ Rotacionar a SETLISTFM_API_KEY — vazou em bundle público da gh-pages em julho/2025. Sem self-service no portal do setlist.fm. Vence 2026-10-15 (abrir chamado).
□ Restringir VITE_GOOGLE_MAPS_KEY por referrer no Google Cloud Console — nunca verificado; sem isso, a chave pública é abusável. Vence 2026-10-15.
□ Sair do GitHub Pages — resolve de uma vez: CSP com frame-ancestors/report-uri/sandbox (hoje ignoradas em <meta>), status 404 real em /artists/..., e Cache-Control dos assets.
🟡 Decisões de qualidade (com vencimento ou gatilho)
□ 87 achados de gitleaks no histórico da gh-pages — bundles com a chave pública do Maps. Sem vencimento; aceito (chave de browser é pública por design).
□ 2 CVEs abertas no react-router 6.30.6 (GHSA-337j-9hxr-rhxg só afeta SSR — app não tem; GHSA-wrjc-x8rr-h8h6 é open redirect, mas as 6 chamadas prefixam segmento literal). Reavaliar se o app aceitar caminho vindo do usuário.
□ server/ sem lint nem prettier (5 arquivos de Express, sem JSX). Reavaliar quando passar de ~500 linhas.
□ Regras do React Compiler desligadas (15 regras do eslint-plugin-react-hooks v7; projeto em React 18, sem lentidão medida). Reavaliar ao migrar para React 19.
□ Geolocalização pedida no carregamento da home — deliberado (carrossel é "shows perto de você"; há fallback São Paulo e LocationSelector). Reavaliar se a taxa de negação virar problema medido.
□ Componentes e hooks sem teste — Vitest + jsdom + testing-library vetados em 2026-09-15. Reabrir ao primeiro bug que só um teste de hook pegaria (useGeolocation é o candidato).
⚪ Fechado (registro)
☑ osv-scanner fora do npm run check — fechado em 2026-09-17: roda semanal em weekly-checks.yml, abrindo issue em vez de travar deploy. Continua fora do check diário de propósito.
☑ CSP sem frame-ancestors, report-uri, sandbox — exceção registrada; volta só com a saída do GitHub Pages.
☑ Teto de bundle — 270 kB aplicado em build.chunkSizeWarningLimit no client/vite.config.js.
✅ Referência rápida — o piso (bloqueia)
O quê	Regra	Comando
Lint do client	0 achados	npm run lint --prefix client
Formatação do client	prettier --check limpo	npm run format:check --prefix client
Testes	58 passam, 0 falham	node --test (raiz)
Teste deletado/pulado	proibido	—
Segredo no que vai ser commitado	0	gitleaks git --staged --redact --no-banner
CVE em dependência de runtime	0	osv-scanner scan source --config osv-scanner.toml ...
CI (deploy.yml): gitleaks dir . na árvore recém-clonada antes de instalar/buildar; depois formatação, lint e teste antes do build. Falhou, não publica.

✅ Referência rápida — medido, sem portão (2026-09-15)
JS gzipado na entrada: 84,64 kB (era 154,77 kB).

CSS: 24,00 kB (5,23 kB gzip).

Linhas JS/JSX: 3.840.

Rate limit: 60 req/min por IP em /api/*.

Cobertura de testes: não medida (proposital).

Lighthouse mobile: performance 71–80, acessibilidade 100, best practices 96, SEO 100.

LCP mobile: 4,8–6,8 s (FCP 1,7–2,6 s, CLS 0,001–0,019, TBT 0–90 ms).

Peso de imagem na home: ~0,5 MB em 7 requisições (era 21,7 MB em 38).

Sitemap: 200 nas três URLs (eram 404 em /about e /contact).

JS não usado na entrada: 29 kB (era 44 kB).

⚠️ Armadilhas de medição
Lighthouse não roda no check — depende de rede e deploy concluído. Rodar de diretório descartável (mktemp -d) por causa do chrome-launcher no WSL.

Ruído da home é ±7–9 pontos (carrossel sorteia artistas). Comparar antes/depois exige métrica determinística (chunk, bytes de imagem, JS não usado) ou mediana de várias rodadas.

Página de artista não mede no ar — gh-pages responde 404 em /artists/...; Lighthouse aborta com ERRORED_DOCUMENT_REQUEST. Medir servindo client/dist local na porta 3000 com fallback SPA em 200 e VITE_API_BASE=https://concertfyi2000.onrender.com.

Página de artista local (2026-09-16, Coldplay, mobile, 3 rodadas): performance 55/57/59 → 59/61/61; CLS 0,173 → 0,001–0,002; LCP 7,3–7,5 s (é o mapa do Google); FCP 3,2–3,3 s → 3,1 s.

⚠️ Regra da própria régua
Subir limite, remover checagem ou adicionar exceção: commit separado, motivo escrito, data de medição atualizada. Baixar número para o código passar não é passar.

