# 💡 Sugestões de Melhorias - ConcertFYI
**Atualizado em 2026-08-23** | Baseado em estado atual + mudanças recentes

---

## 🔴 CRÍTICO - Problema de SEO/Discovery

> **Revisado em 2026-09-15.** A premissa original era "o Googlebot não executa JavaScript na
> maioria dos casos". Isso deixou de valer em 2019: o Googlebot renderiza JS. O que eu medi no
> site no ar foi um problema diferente, menor de consertar e pior de ignorar. Texto original
> preservado no fim da seção.

### ❌ O problema medido: as URLs do seu próprio sitemap devolviam 404

```
/            200
/about       404   ← anunciada no sitemap.xml
/contact     404   ← anunciada no sitemap.xml
/artists/…   404
```

O GitHub Pages devolve 404 para todo caminho que não tem arquivo, e o `404.html` é uma cópia do
app — então a página abre, ninguém percebe olhando a tela, e o status continua 404. Nenhum
buscador indexa 404. O sitemap estava, na prática, anunciando duas páginas inexistentes.

Renderização nunca foi o gargalo: o Lighthouse dá **SEO 100** e o `SEOHead.jsx` já monta title,
description, Open Graph e canonical por página com `react-helmet-async`.

- [x] **Resolvido** (`741ac0b`). `client/scripts/static-routes.mjs` emite um `dist/<rota>.html` por
      `<loc>` do sitemap, no build. A lista sai do próprio sitemap para que rota anunciada e
      arquivo emitido não possam divergir. Conferido em produção depois do deploy: as três URLs do
      sitemap respondem **200**.

### 🔵 O que sobra: as páginas de artista

`/artists/:artistId/concerts/:concertId` continua em 404 (com o app abrindo por cima). São
infinitas e vêm da busca, então não dá para enumerar num sitemap nem copiar um arquivo por rota.
É o único lugar onde a conversa de pre-render/SSR ainda faz sentido — e aí ela é sobre o conteúdo
que traria tráfego de verdade ("setlist do show tal"), não sobre o `/about`.

| Opção | Esforço | Observação |
|---|---|---|
| Pre-render dos artistas mais buscados | Médio | Precisa de uma lista — os N artistas mais pedidos. Hoje não existe essa métrica; o passo anterior é medir. |
| SSR (Next.js / Remix) | Alto | Resolve tudo e muda a hospedagem: sai o GitHub Pages, entra um servidor. O proxy do Render passaria a ser desnecessário. |
| Prerender.io | Baixo | Serviço pago; adia a decisão em vez de tomá-la. |

**Opinião: nada disso antes de haver tráfego para medir.** O que estava barato e quebrado (status
404 em página estática) foi consertado; o resto é uma migração de arquitetura atrás de uma
hipótese de crescimento que ainda não foi testada.

<details><summary>Texto original de 2026-08-23</summary>

**Opção A (Melhor)**: Migrar para **SSR** com **Next.js** ou **Remix** — renderização do servidor,
SEO automático, mantém a funcionalidade React. Esforço alto, mas essencial.
**Opção B (Médio esforço)**: Pre-rendering estático com `@vitejs/plugin-ssr`.
**Opção C (Rápido)**: Prerender.io, serviço terceirizado que simula JavaScript.

</details>

---

## 🟠 ALTA PRIORIDADE (1-2 meses)

### 1. Diferenciação de Mercado
**Contexto**: Competidores estabelecidos (Bandsintown, Songkick, Spotify Concerts Near You)

**O que fazer**:
- [ ] Definir proposta de valor única:
  - Curadoria humana de artistas?
  - Foco em cenas regionais/locais?
  - Integração social (amigos, seguidores)?
  - Descoberta de artistas emergentes?
  - Análise/comparação de setlists?
- [ ] Documentar e comunicar o diferencial no `/about`
- [ ] Validar com primeiros usuários

**Exemplo**: "ConcertFYI é o ÚNICO app que mostra setlists completas + lyrics de CADA MÚSICA ao vivo"

---

### 2. Error Handling Robusto
**Problema atual**: Sem tratamento de erros explícito → usuário vê branco

**Implementar**:
```jsx
// Criar Error Boundary component
<ErrorBoundary fallback={<ErrorPage />}>
  <Routes>...</Routes>
</ErrorBoundary>

// Adicionar try/catch em todos os useEffect
try {
  const data = await fetchConcerts();
} catch (error) {
  showToast.error("Não conseguimos carregar os shows. Tente novamente.");
  logErrorToSentry(error);
}
```

**Checklist**:
- [x] Error Boundary com fallback UI — `components/ErrorBoundary.jsx`, entrou em 2026-09-15
- [ ] Toast/mensagens amigáveis para timeouts — **parcial, sem biblioteca de toast**: as mensagens
      existem inline (`Could not load lyrics`, `No setlist found`, os três estados do
      `LocationSelector`, o `role="status"` do contato). O que não existe é timeout próprio: o
      `request.js` espera o navegador desistir
- [x] Retry logic com exponential backoff — é o padrão do React Query; o `queryClient.js` só
      aperta o orçamento para `retry: 1`, e o preset `songCache` usa `retry: false` de propósito
      (APIs com cota)
- [ ] Logging de erros (Sentry, LogRocket) — **é seu, precisa de conta.** Ver a lista do dono no fim
- [ ] Loading skeletons enquanto dados carregam — não existe nenhum no projeto

---

### 3. Performance & Code Splitting
**Implementar**:
```jsx
// pages/
const ArtistPage = React.lazy(() => import('./pages/ArtistPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));

// Em Routes
<Suspense fallback={<LoadingSkeleton />}>
  <Route path="/search" element={<SearchPage />} />
</Suspense>
```

**Checklist**:
- [x] Code splitting por rota (React.lazy + Suspense) — as cinco rotas em `App.jsx:13-17`
- [ ] Lazy loading de imagens (next-gen formats: webp) — **meio feito**: `loading="lazy"` está nos
      dois iframes e nos tiles de vendedor, e o carrossel só baixa foto até `depth 3` (`5c892ec`).
      Webp não: as fotos vêm da Ticketmaster no formato que ela serve, e não passam por nós
- [x] Caching de requisições API — React Query desde a migração; cada query em `queries.js` tem
      seu `staleTime`/`gcTime`
- [ ] Service Worker para offline mode — não existe. App de descoberta de show sem sessão: offline
      não tem muito o que mostrar
- [ ] Monitoramento de performance (Core Web Vitals) — Lighthouse roda na mão (receita no
      `CONSTRAINTS.md`); contínuo não existe, e o CrUX não enxerga a página de artista enquanto
      ela responder 404

---

### 4. Acessibilidade (WCAG 2.1 AA)
**Implementar**:
```jsx
// ARIA labels
<IconButton aria-label="Abrir mapa do venue" />
<input aria-label="Pesquisar artista" />

// Navegação por teclado
<Swiper onKeyDown={handleSwipeByArrows} />

// Semantic HTML
<header>
  <nav aria-label="Navegação principal">
  <main>
  <footer role="contentinfo">
```

**Checklist**:
- [x] `aria-label` em todos os ícones/botões sem texto — nenhum botão só-ícone ficou sem label, e
      o `button-name` do Lighthouse passa (**acessibilidade 100 medida em produção**)
- [ ] `aria-current='page'` em link ativo — existe na `Pagination.jsx`, **falta nos links do
      `Navbar`**. É de uma linha cada, mas muda o que o leitor de tela anuncia; fica aqui como item
      de verdade
- [ ] Navegação por teclado (Tab, Enter, Arrows) — **parcial**: tudo é `<button>` ou `<Link>`
      nativo, então Tab e Enter funcionam de graça. Setas no carrossel nunca foram implementadas
      nem testadas
- [x] Contraste mínimo AA (4.5:1) — o `color-contrast` do Lighthouse passa (100 em produção); o
      par mais usado, branco sobre `red-600`, dá 4,85:1
- [ ] Testar com screen readers (NVDA, JAWS) — nunca foi feito. Lighthouse é automação, não troca
      por alguém ouvindo a página

---

## 🟡 MÉDIA PRIORIDADE (1-3 meses)

### Refatorações de Componentes

#### ✅ Já feito:
- ✅ `useAppState()` hook customizado
- ✅ `useGeolocation()` para localização
- ✅ `useDebounce()` para busca
- ✅ `AppContext` para estado global
- ✅ `config/routes.js` centralizado

#### ⏳ Ainda a fazer:

**1. Extrair Componentes Reutilizáveis** — **descartado**, ver tabela no fim do documento.
`ErrorBoundary.jsx` entrou em 2026-09-15 porque tinha um problema real atrás; extrair
`ArtistCard`, `SongItem`, `Logo` e `EmptyState` seria abstração com um uso só.

**2. Hooks Customizados Adicionais**
```jsx
// useCity.js - encapsula geolocalização + localStorage
const { city, setCity, resetCity } = useCity();

// useConcertData.js - cache inteligente de shows
const { concerts, loading, error } = useConcertData(artistId);

// useLocalStorage.js - abstração para localStorage
const [saved, setSaved] = useLocalStorage('saved_concerts', []);
```

**3. Organização de Pastas** — **descartado**, ver tabela no fim do documento.
A estrutura atual (`components/`, `components/ArtistPage/`, `pages/`, `hooks/`, `helpers/`, `api/`)
acha tudo em 3.3k linhas. A proposta antiga criava `common/`, `layout/`, `services/`, `utils/` e
`constants/` — vinte e poucos arquivos movidos, todo `import` do repositório reescrito, zero
mudança de comportamento.

---

### Melhorias de UX/UI

**SearchBar.jsx**:
- [x] Debounce controlado
- [ ] Ícone de loading enquanto busca — não existe; a busca é por debounce de 700 ms e nada avisa
      que ela está acontecendo
- [x] Botão 'Clear input' — é o nativo do `type="search"`; o `index.css` estiliza o
      `::-webkit-search-cancel-button` e o `::-moz-search-clear-button` para aparecer no fundo
      vermelho. Zero JS
- [x] Placeholder dinâmico por breakpoint — `SearchBar.jsx:38-52`, "Search" abaixo de 768 px
- [x] Suporte a Enter para buscar — **item sem objeto**: a busca acontece ao digitar, e o `form`
      dá `preventDefault` justamente para o Enter não recarregar a página. Não há o que o Enter
      dispare que já não tenha disparado

**Setlist.jsx**:
- [x] LyricsDropdown integrado
- [ ] Tooltip nos ícones (Spotify, YouTube, Genius)
- [ ] Paginação se houver muitas músicas (> 50)
- [ ] Mostrar tempo estimado do show
- [ ] Expandir/recolher "encore"
- [ ] Botão "Copiar setlist" (clipboard)

**ConcertInfo.jsx**:
- [ ] Botão "Favoritar" com localStorage
- [ ] Botão "Compartilhar" (social)
- [x] Info de ingressos — `TicketOptions.jsx` + `VendorTiles.jsx` na linha expandida de próximos
      shows; os comentários de qual vendedor entrou e por quê são load-bearing
- [ ] Loading skeleton enquanto dados carregam

**SongDetails.jsx**:
- [x] LyricsDropdown (já implementado)
- [x] YouTube embed (provavelmente já tem)
- [x] Spotify player
- [ ] Genius link como fallback

---

## 🟢 BAIXA PRIORIDADE (Nice-to-have)

### Features Adicionais

1. **Dark Mode** (Tailwind já suporta)
   - Preferência no localStorage
   - Toggle no Navbar

2. **Favoritar/Salvar Shows**
   - Coração no card do show
   - Salvo em localStorage ou DB
   - Página de "Meus Shows"

3. **Autenticação (Opcional)**
   - Login com Spotify (via OAuth)
   - Sincronizar favorites com perfil
   - Salvar preferências

4. **Analytics**
   - Google Analytics
   - Rastreamento de buscas
   - Heatmaps (Hotjar, Microsoft Clarity)

5. **Social Features**
   - Compartilhar show em redes sociais
   - Seguir artistas
   - Ver amigos em eventos

6. **Dados Avançados**
   - Comparação entre setlists do mesmo artista
   - Histórico de mudanças (quando o artista muda repertório)
   - Prediction de próximas cidades/datas
   - Estatísticas de musicas (mais tocadas, raridades)

7. **Calendar View**
   - Ver próximos eventos em calendário
   - ✅ Integração com Google Calendar (botão por show em `ConcertReminder.jsx`)

8. **API Pública** (Monetização futura)
   - Permitir devs integrarem ConcertFYI
   - Rate limiting, key management

---

## 📋 Checklist de Qualidade

### Testing
- [x] Testes de unidade em `node:test`, sem framework — 17 passando
- [ ] Testes de componente: só quando houver um bug de render que os de unidade não pegariam
- Coverage como meta percentual: **descartado**, ver tabela no fim do documento

### Type Safety
- TypeScript: **descartado**, ver tabela no fim do documento

### Documentation
- [x] CLAUDE.md com contexto do projeto (no repo desde 2026-09-15)
- [x] CONSTRAINTS.md com a régua de qualidade (2026-09-15)
- [x] README com setup e deploy (`211dbf5`) — todo comando citado foi rodado antes de entrar
- Storybook: **descartado**, ver tabela no fim do documento

### DevOps
- [x] **CI/CD** no GitHub Actions — lint e teste antes do build (2026-09-15)
- [x] **GitHub Pages** deploy automático
- [x] **Render** deploy automático
- [ ] **Sentry** para error tracking — depois do Error Boundary, que já entrou

### Monitoring
- [ ] **Sentry** para erros de produção
- [ ] **Google Analytics** para eventos de usuário
- [ ] **Lighthouse** CI para performance
- LogRocket: **descartado**, ver tabela no fim do documento

---

## 🎯 Resumo: O que foi feito vs O que falta

| Feature | Status | Notas |
|---------|--------|-------|
| Busca de artistas | ✅ Implementado | Com debounce, integrado ao SearchBar |
| Geolocalização | ✅ Implementado | Fuzzy search de cidades, localStorage |
| Detalhes do show | ✅ Implementado | ConcertInfo, Setlist, Map, etc |
| Lyrics | ✅ Implementado | LRCLib + fallbacks |
| Spotify player | ✅ Implementado | Embed do player |
| YouTube | ✅ Implementado | Videos ao vivo |
| SEO/Meta tags | ⚠️ Parcial | Helmet implementado, mas SPA não é indexável |
| Error handling | ✅ Bom | Error Boundary nas rotas; falta logging externo (Sentry) |
| Mobile UX | ✅ Bom | Melhorias recentes em touch events |
| Dark mode | ❌ Não implementado | Tailwind suporta, falta UI toggle |
| Favoritar shows | ❌ Não implementado | localStorage ready |
| Analytics | ❌ Não implementado | Recomendado implementar |
| Testing | ⚠️ Mínimo | `node --test` cobre `server/http.js` e `helpers/calendar.js`; sem testes de componente |
| Lint | ✅ Implementado | ESLint 10 no client, `npm run lint`, 0 achados |
| Régua de qualidade | ✅ Implementado | `CONSTRAINTS.md` + `npm run check` (2,5s) |
| Portão no CI | ❌ Não implementado | `deploy.yml` publica sem rodar nada |
| TypeScript | ⚪ Descartado | Ver tabela "Descartado"; decisão reversível |

---

## 🚀 Proposta de Roadmap (Próximas 3 meses)

### Mês 1: SEO & Performance
1. Implementar SSR (Next.js) OU pre-render estático
2. Code splitting + lazy loading
3. Core Web Vitals otimizados

### Mês 2: Qualidade & Confiabilidade
1. ~~Error handling robusto~~ — feito em 2026-09-15 (Error Boundary + CI + CONSTRAINTS.md)
2. Sentry para ver os erros que o Error Boundary engole hoje no console
3. Testes E2E: só depois do Sentry mostrar onde quebra de verdade

### Mês 3: Diferencial & Growth
1. Validar diferencial competitivo
2. Favoritar/Salvar shows
3. Social sharing

---

## 🆕 Adicionado em 2026-09-15

### 1. Não existe lint configurado
`client/package.json` tem um bloco `eslintConfig` (`react-app`, `react-app/jest`) que sobrou do
Create React App, mas o ESLint não está instalado e o Vite não o executa. Ou seja: o projeto
*parece* ter lint e não tem. Escolher um dos dois:
- [x] Remover o `eslintConfig` morto — feito em 2026-09-15 (`f4edd3f`), junto com o `browserslist`
      que o Vite ignora e os devDeps `gh-pages`/`concurrently` que nenhum script usa
- [x] Ou instalar ESLint de verdade + `eslint-plugin-react-hooks` — feito em 2026-09-15 (`4335a06`).
      Achou 4 problemas, todos corrigidos: `useLoadScript` chamado depois de um `return` no
      `Map.jsx` (`32e939e`, bug latente de ordem de hooks), duas variáveis mortas (`4a89702`) e
      uma dependência faltando no `Swiper` (`a93153f`)

Este era o bloqueador do item "CI/CD (lint, test, build)" mais acima. Está destravado.

### 2. Preferências de workflow só existem na memória global
O fluxo "uma correção por vez, commit + push no `main` a cada item, usuário testa antes do próximo"
vive na memória pessoal do Claude, não no repo. Qualquer outra pessoa (ou máquina) que abrir o
projeto não o conhece.
- [x] **Resolvido em 2026-09-17.** A regra vale para o projeto, e o motivo não é preferência: não
      há staging. Um push no `main` publica o client na `gh-pages` **e** faz o Render redeployar o
      servidor do mesmo commit — todo commit é um release dos dois lados. Cinco mudanças que sobem
      juntas não têm falha bissetável e o dono não consegue experimentar uma sem levar as outras
      quatro. Está no `CLAUDE.md`.

---

## 🆕 Saldo do `/agent-skills:constraints` — 2026-09-15

A régua ficou no `CONSTRAINTS.md` (`8777a9a`), com `npm run check` e `npm run check:full` na raiz.
O que a skill levantou e não foi resolvido no mesmo dia está abaixo.

### 🔴 Pendente com o Victor (fora do repositório)

> Esta é a lista canônica do que só você pode fazer. Tudo que eu esbarrar e não puder resolver
> sozinho entra aqui, não no chat.

- [x] **`gh auth login`** — feito em 2026-09-15. Autenticado como `gilabarreto`, protocolo SSH.
      Com isso eu consigo conferir run do Actions sem depender de você abrir o navegador.

- [ ] **Restringir a `VITE_GOOGLE_MAPS_KEY` por referrer** no console do Google Cloud.
      A chave está no bundle — isso é normal e inevitável para chave de browser. O que não é
      normal é ela aceitar requisição de qualquer origem. Sem a restrição, qualquer um consome
      sua cota e sua fatura. Cinco minutos. Vence em 2026-10-15.
- [ ] **Rotacionar a `SETLISTFM_API_KEY`.** Vazou num bundle publicado na `gh-pages` em julho de
      2025, junto com a do Ticketmaster. A do Ticketmaster foi rotacionada em 2026-09-15; esta não,
      porque não há self-service no portal do setlist.fm. Abrir chamado. Vence em 2026-10-15.

> Contexto: até julho de 2025 o client chamava Setlist.fm e Ticketmaster direto do browser com as
> chaves embutidas. O proxy Express corrigiu isso, mas os bundles antigos continuam no histórico
> da `gh-pages` e são públicos. Apagar a branch não resolve — só rotacionar resolve.

### 🟠 Fila — tudo o que estava aqui foi feito em 2026-09-15

- [x] **Rodar o piso no CI** — feito em 2026-09-15. O `deploy.yml` roda lint e teste antes do
      build; falhou, o deploy não acontece. Ficou de fora a varredura de segredo, que continua
      dependendo do `npm run check` local (motivo na tabela de exceções do `CONSTRAINTS.md`).
- [x] **Error Boundary** — feito (`5965839`). Envolve só as `Routes`, então Navbar e Footer
      sobrevivem ao erro e dá para navegar para fora da página quebrada.
- [x] **Code splitting por rota** — feito (`a6e787e`). Entrada de 517,34 kB para 356,10 kB (−31%),
      gzip de 154,99 kB para 116,45 kB (−25%). `ArtistPage` virou um chunk de 155 kB que só desce
      quando alguém abre um show. Teto do `CONSTRAINTS.md` desceu junto, para 380 kB.
- [x] **Testes na costura entre as duas APIs** — feito (`9ff818b`). 12 para 17 testes.
      `getNextConcertsByArtist` saiu do `NextConcerts.jsx` para o `selectors.js` para poder ser
      testada, ao lado da irmã que cuida do passado.

### ⚪ Descartado — opinião do Claude, sujeita a veto

Estes itens estão recomendados mais acima neste mesmo documento. Discordo deles, pelo critério do
`CLAUDE.md`: são 3.310 linhas de JS/JSX, dois fetches e nenhum banco. Cada um resolve um problema
de escala que o projeto não tem, e custa semanas que não mudam nada para o usuário.

| Item | Por que não |
|---|---|
| Migrar para TypeScript | O custo é proporcional ao tamanho do código; o ganho, à quantidade de gente mexendo nele. Aqui é uma pessoa. O `eslint-plugin-react-hooks` já pega a classe de bug que mais aparece. |
| Storybook | Existe para times que compartilham componentes entre produtos. Há um produto. |
| Reorganizar pastas (`common/`, `layout/`, `services/`, `constants/`) | Move arquivo de lugar sem mudar comportamento, e quebra todo `import` do repositório. A estrutura atual acha tudo. |
| Extrair `ArtistCard`, `EmptyState`, `Logo`, `SongItem` | Abstração com uma implementação. `ConcertList.jsx` já é o caso onde extrair valeu — porque tinha dois usos reais. |
| Cobertura mínima de 80% | Com 2 arquivos de teste, a meta se cumpre escrevendo teste fácil onde não importa. A regra útil está no `CONSTRAINTS.md`: não deletar teste para passar. |
| LogRocket, Service Worker, offline mode | Resolvem problemas que ninguém reportou. |

**Aprovada pelo Victor em 2026-09-15.** As recomendações contrárias que existiam no corpo deste
documento foram removidas na mesma data, para o arquivo parar de dizer duas coisas. Reverter
qualquer linha continua sendo decisão dele — a tabela é o registro, não uma lápide.

---

## 🆕 Saldo do `/agent-skills:review` — 2026-09-15

Revisão nos cinco eixos sobre os 17 commits do dia e a costura entre as duas APIs.

### 🔴 Decisão pendente com o Victor

- [x] **Resolvido em 2026-09-15 (`35fc4d7`).** O Victor mandou ir para produção e deixou o número
      comigo: **60 req/min por IP** em `/api/*`, janela fixa em memória, sem dependência nova.
      `trust proxy` ligado junto — sem ele o `req.ip` no Render é o proxy para todo mundo e o
      primeiro visitante trancaria o site inteiro. Verificado contra servidor de pé: 1-60 passam,
      a 61ª devolve 429 com `Retry-After`. Se aparecer relato de usuário legítimo bloqueado, o
      número está num lugar só (`server/index.js`) e sobe em um commit.
      *Descrição original do achado abaixo, para o registro:*

- [ ] ~~**O proxy do Render é aberto — não tem rate limit.**~~ `server/index.js:16-21` usa
      `cors({ origin: allowedOrigins })`, e CORS só governa o que o *navegador* deixa o JS ler.
      `curl` ignora e a rota executa igual. Busca no YouTube custa 100 unidades de uma cota
      diária de 10.000: **100 chamadas encerram o dia** e lyrics/vídeo somem para os usuários
      reais até a virada. Ticketmaster e setlist.fm caem pelo mesmo caminho, mais devagar.
      É a mesma classe do vazamento de julho — o servidor protege a chave e não protege a cota
      que a chave compra. Não implementei sozinho porque um limitador mal calibrado devolve 429
      para usuário legítimo, em produção, num serviço que eu não consigo testar nem reverter.
      Precisa da sua decisão sobre o número.

### 🟢 Resolvido na própria revisão

- [x] **Venue sem city derrubava a árvore de rotas** (`6e9448a`). O guard parava em `venues?.[0]`
      e `city.name` estourava no render. O ErrorBoundary pega — mas pega o `<Routes>` inteiro.
- [x] **"Next Concerts" listava show que já aconteceu** (`9a60c15`). `getNextConcertsByArtist`
      não tinha o corte de data que a irmã sempre teve, e em ordem crescente o passado ia para o
      topo. Coberto por teste; as datas do arquivo de teste viraram relativas a hoje no mesmo
      commit, porque data fixa em teste que depende de "agora" é falha marcada no calendário.
- [x] **`catch { break }` mudo na paginação da Ticketmaster** (`59fd106`). Um 429 na página 2 saía
      como 200 com 20 eventos, idêntico a um artista que só tem 20.
- [x] **`lyrics.js` era a única rota fora do wrapper** (`a719f4e`). Fazia o `CLAUDE.md` mentir, e
      misturava "música fora do catálogo" com "lrclib fora do ar" no mesmo 404.

### ⚪ Eu tinha proposto deixar para depois — o Victor mandou corrigir tudo

Os três primeiros foram feitos em 2026-09-15. Ficou registrado que a recomendação original era
adiar, e que ela foi vetada.

| Achado | Desfecho |
|---|---|
| `Swiper.jsx` usava `alert()` em dois caminhos de erro | Feito (`b873a2d`). Virou painel na própria UI com `role="alert"`. Achei um bug que o `alert` escondia: o effect só dispara quando `selectedArtist` muda, então depois de uma falha clicar no mesmo slide não fazia nada. Fechar o painel limpa os dois. |
| `[...].sort(() => Math.random() - 0.5)` é embaralhamento enviesado | Feito (`b873a2d`). Fisher-Yates, 5 linhas. |
| `routes/spotify.js:29` não validava `code`/`redirectUri` | Feito (`5e773f5`). Devolve 400 em vez de repassar lixo para a Spotify. |
| `console.error` em `queries.js` vai para o bundle de produção | **Fica — decidido pelo Victor em 2026-09-15.** São 3 chamadas no caminho de erro que o `useArtistData` engole de propósito. Tirar não ganha nada mensurável e apaga o único rastro que sobra quando um dos dois lados da costura falha no browser do usuário. Item fechado, não reabrir sem motivo novo. |

---

## 🆕 Saldo do `/agent-skills:test` — 2026-09-15

### 🟢 Feito

- [x] **`findTrackUri` coberta** (`911e4e7`). É o placar que decide se a música entra na playlist
      do usuário: 70 pontos de corte, 50 do artista, +40 nome exato ou +25 nome contido. Abaixo
      disso a música some da playlist **em silêncio**. 8 casos, incluindo os dois que têm de
      devolver `null` (título certo de banda cover; artista certo com título sem relação).
- [x] **`createSpotifyPlaylist` recebe o token por parâmetro.** Era o único dado que ela pegava
      escondido no localStorage, e era o que prendia o módulo ao `spotifyAuth` — que lê `window` e
      `import.meta.env` no topo e por isso não carrega fora do Vite.

- [x] **Data do Setlist.fm parseada num lugar só** (`a2d2c1b`). Três arquivos partiam `DD-MM-YYYY`
      por conta própria e **um fazia diferente**: a `SearchPage` montava a string `"2026-09-16"` e
      entregava ao `Date`, que pela especificação é meia-noite **UTC** — 21h do dia anterior em
      São Paulo. Resultado: nas últimas 3 horas de todo dia, show de amanhã aparecia entre os
      passados. Agora existe `parseSetlistDate` e os três chamam ela. Verificado por mutação.

Testes: 21 → 30.

### 🔵 Sugestão futura — Vitest para componentes e hooks (**decidido: não agora**)

**O Victor vetou em 2026-09-15.** Não entra por enquanto; fica aqui como sugestão para quando o
gatilho abaixo acontecer. Não reabrir sem motivo novo.

**O fato:** o `node:test` só alcança arquivo que o node consegue resolver sozinho. Hoje isso são
três helpers. Componentes, hooks (`useGeolocation`, `useAppState`, `useDebounce`) e qualquer coisa
com JSX ou `import.meta.env` estão fora do alcance — não por falta de vontade, por falta de runner.

**Para passar disso seria preciso Vitest + jsdom + @testing-library/react** — 3 dependências de
dev. O Vitest reaproveita o `vite.config.js` que já existe, então não é arquivo de config novo.

**Minha opinião, e ela é contra:** os componentes deste app são quase todos marcação. A lógica que
podia errar calado — a costura entre as duas APIs, o parse das duas datas, o placar da playlist —
está coberta agora. Testar `<VendorTiles>` renderizar um `<div>` é o teatro de cobertura que o
`CLAUDE.md` existe para evitar. O que me faria mudar de ideia é bug em hook: `useGeolocation` tem
estado e caminho de erro de verdade, e é o único lugar onde eu aceitaria o framework hoje.

**O gatilho para reabrir:** o primeiro bug que só um teste de hook pegaria. `useGeolocation` é o
candidato — tem estado e caminho de erro de verdade. Até lá, o custo (3 dependências de dev) não
compra nada que a lógica coberta hoje já não cubra.

### ⚪ Não testei de propósito

| O quê | Por quê |
|---|---|
| Lote de 100 faixas em `createSpotifyPlaylist` | O laço só tem segunda volta com mais de 100 músicas. Setlist de show real tem ~20. É caminho praticamente morto neste app. |
| `spotifyAuth.js` | São quatro linhas em cima do `localStorage` e uma montagem de URL. Não carrega fora do Vite e não guarda decisão nenhuma. |
| Rotas do `server/` | O `http.js` (o wrapper que todas usam) e o `rateLimit.js` estão cobertos. As rotas em si são repasse fino — testá-las seria testar o `fetch`. |

---

## 🔦 Fechamento do `/agent-skills:review` — eixo performance e acessibilidade (2026-09-15)

A última linha "não medido" do `CONSTRAINTS.md` era Lighthouse. O site está no ar, então foi medido
de verdade, com o Chrome for Testing instalado local (`npx @puppeteer/browsers install chrome@stable`,
sem sudo). O comando ficou registrado no `CONSTRAINTS.md`.

### 🟢 Resolvido

- [x] **A home baixava 21,7 MB de imagem** (`797e895`). O `getBestImage` chamava "best" o que na
      verdade era "maior": a Ticketmaster manda a mesma foto em 100/205/640/1024/1136/2048 e, em
      parte do catálogo, um `_SOURCE` de vários MB — 27 desses originais eram 18,1 MB dos 21,7.
      Agora "best" é a menor variante que ainda cobre o espaço onde a foto aparece. **LCP mobile:
      115,6 s → 6,5 s.** Coberto por 5 testes novos em `selectors.test.mjs`.
- [x] **Slides invisíveis do carrossel baixavam foto** (`5c892ec`). O `getSlideStyle` põe
      `opacity: 0` acima de `depth > 2` e mesmo assim montava o `background` — o navegador baixava
      tudo. Carrega até depth 3 (um anel de folga, para quem desliza não ver a imagem aparecer).
      **Medido depois do deploy: 38 imagens / 21,7 MB → 7 imagens / 0,57 MB (−97%), LCP 4,8 s,
      performance 67 → 78.**
- [x] **`heading-order`: a home pulava de h1 para h3** (`5916557`). Três dos quatro "headings" da
      home não eram headings — a marca repete o link do Navbar e o texto de três linhas é corpo.
      Sobrou um h1 (a tagline) e o título do slide virou h2.
- [x] **`label-content-name-mismatch` no link da marca** (`5a593ac`). O `aria-label="Home"`
      sobrescrevia o "concert{fyi}" visível, então quem usa controle por voz não alcançava o link
      dizendo o que estava lendo na tela. Tirar o label deixa o nome ser o próprio texto.

**As duas correções de acessibilidade foram medidas em produção depois do deploy: 98 → 100.**

### 🔵 Aberto — medido, não resolvido

| Achado | Tamanho | Por que ficou |
|---|---|---|
| ~~`unused-javascript` — 44 kB não usados no chunk de entrada~~ | — | **Investigado e parcialmente resolvido, ver abaixo.** |
| ~~Google Fonts bloqueia a renderização (847 ms)~~ **resolvido em 2026-09-17 (`7b876cb`)**, hospedando a DM Sans aqui — e sem FOUT, porque `font-display: swap` continua o mesmo | pequeno | O `<link>` do DM Sans no `index.html` trava o first paint. A correção conhecida é `preconnect` + `media="print" onload`, mas mexer em carregamento de fonte troca um problema por FOUT. Precisa de uma medição antes/depois própria. |
| `cache-insight` — vida útil de cache curta | fora do alcance | Os assets estáticos são servidos pelo GitHub Pages, que não deixa configurar `Cache-Control`. Só muda migrando de host. |
| Geolocalização pedida no carregamento | deliberado | Virou exceção registrada no `CONSTRAINTS.md`: o carrossel da home *é* "shows perto de você". Trocar por botão é decisão de produto. |

**Testes: 30 → 34.** Régua atualizada com os números medidos (antes diziam "não medido").

---

## 🔍 O que havia no chunk de entrada (2026-09-15)

O item "44 kB de JS não usado" ficou em aberto por falta de saber *qual* biblioteca. Medido com
`vite build --sourcemap` + `npx source-map-explorer` — nenhuma dependência nova no projeto:

| | kB no chunk | |
|---|---|---|
| `react-dom` | 128,8 | inevitável |
| **`@fortawesome/fontawesome-svg-core`** | **87,0** | **removido** |
| **`axios`** | **50,5** | **removido** |
| `@tanstack/query-core` | 35,1 | inevitável |
| código do app | 29,9 | |
| `react-helmet-async` | 14,0 | |
| `react-router` + `@remix-run/router` | 17,1 | |
| ícones do FontAwesome (os 20 usados) | 8,8 | |

### 🟢 Resolvido

- [x] **`axios` fora, `fetch` no lugar** (`57f3b88`). 50,5 kB do chunk de entrada para dois GETs,
      uma querystring e um timeout — tudo isso é nativo. Estava importado em **um arquivo só**
      (`api/api.js`), então a troca foi contida. O wrapper foi para `api/request.js` pelo mesmo
      motivo que o `server/http.js` existe separado: o `api.js` lê `import.meta.env` no topo e por
      isso não carrega fora do Vite, e o `node:test` não o alcança. O `request.js` não tem nada de
      Vite e ganhou 9 testes. **Entrada 408,49 → 356,76 kB; gzip 130,12 → 110,99 kB; JS não usado
      44 → 37 kB.** Verificado contra a API no ar: 400 com corpo, busca real com acento, a chamada
      ao Photon e um timeout forçado.
- [x] **Teto do bundle baixado de 430 para 380 kB** (`eca072d`), em commit próprio, como a régua
      exige. Com 73 kB de folga o aviso nunca dispararia.
- [x] **Erro do nosso servidor voltou a aparecer** (`7c70c1f`). As dez rotas do `server/` respondem
      `{ error }`, mas o interceptor do axios só lia `{ message }` — que é o formato de terceiro.
      Toda falha do nosso proxy chegava ao `queries.js` como o genérico "Request failed", com o
      motivo real descartado. Achado enquanto eu portava o wrapper, não procurado.
- [x] **Runtime do FontAwesome fora** (`d335254`), com o seu "faça o que você acha melhor". Eu
      tinha estimado 13 arquivos; contando os usos de verdade eram **10 chamadas em 9 arquivos**, e
      entre todas elas só três props (`className`, `size`, `aria-hidden`). O
      `@fortawesome/react-fontawesome` mais o `fontawesome-svg-core` que ele arrasta custavam
      94,6 kB para transformar `{ icon: [largura, altura, , , path] }` num `<svg>` — o resto do que
      eles trazem (registro global, injeção de CSS, troca de `<i class="fa-">` no DOM, máscaras,
      transformações) este app nunca usou. `components/Icon.jsx` faz o desenho em cinco linhas.
      Os pacotes de ícones ficam: 8,8 kB pelos vinte em uso. **Entrada 356,76 → 258,28 kB; gzip
      110,99 → 84,64 kB.** Teto baixado para 270 kB em commit próprio (`d851501`).

      Vale registrar o erro do caminho, porque ele quase passou: a primeira versão do `Icon.jsx`
      mexia na **altura** em vez do `font-size`, e nas capturas de tela ficou indistinguível. Medindo
      a caixa de cada `<svg>` no browser, não. Antes: 17,5×14, 22,5×18, 30×24, 30×24, 30×24. Aquela
      versão: 14×14, 15,8×18, 21×24, 15×24, 24×24, todas meio fora da linha de base. O FontAwesome
      escala pelo `font-size` justamente para a altura (1em) e o alinhamento (−0,125em) andarem
      juntos. A versão que ficou mede idêntico ao original, caixa e `vertical-align`.

- [x] **JS não usado: 37 → 29 kB**, medido contra o site no ar depois do deploy (três rodadas do
      Lighthouse, todas 29 kB). O `fontawesome-svg-core` era a segunda maior fatia; o que sobra é
      `react-dom`, que não sai. Acessibilidade **100** nas três, performance 71/77/80 — a mesma
      faixa de ruído de antes, então **não afirmo ganho de performance**, só de bytes.

### 🔵 Aberto

Nada deste eixo. O chunk de entrada saiu de 516,53 kB para 258,28 kB e o que sobra é `react-dom`
(128,8 kB) mais o código do app.

---

## 📞 Próximas Conversas

1. **Diferencial**: qual é a proposta de valor do ConcertFYI que o separa do Bandsintown? É a
   pergunta que decide as outras — sem ela, SEO e features novas são chute caro.
2. **SEO**: Next.js ou pre-render estático? Semanas de trabalho, e só vale se tráfego orgânico for
   a meta real. Depende da resposta 1.
3. **Sentry**: o Error Boundary hoje manda o erro para o `console` do usuário, onde ninguém lê.
   Sentry é o próximo passo natural — ~20 linhas e uma conta grátis.

---

## 🆕 Saldo do `/agent-skills:code-simplify` — 2026-09-16

Alvo: `Swiper.jsx`, o maior arquivo do projeto (284 linhas), mais o `Setlist.jsx` que o
troca-ícones já tinha tocado. A régua do skill é "mesmo comportamento, leitura mais rápida" —
então cada mudança abaixo veio com prova de equivalência, não com olhômetro.

### 🟢 Resolvido

- [x] **A montagem dos slides saiu do `useEffect`** (`9d65952`). Eram 35 linhas de transformação
      pura presas dentro de um efeito: descartar evento sem attraction, um evento por artista,
      embaralhar, mapear para o formato do slide. Nada disso precisa de React — e dentro de um
      componente o `node:test` não alcança, que é exatamente por que o carrossel não tinha teste.
      Agora é `getCarouselSlides` no `helpers/selectors.js`, com **5 testes**. A deduplicação virou
      um `Map` no lugar de array + `Set`: mesma ordem, primeiro vence, um laço em vez de dois.
      Como o sorteio é aleatório, os testes conferem o **conjunto** de artistas e não a sequência —
      conferir a sequência seria testar o `Math.random`.
- [x] **Ternário aninhado do `getSlideStyle` virou guarda** (`59aca6a`). O slide do meio estava dito
      três vezes (`offset === 0 ? … : …` dentro de `transform`, `filter` e `opacity`, com os dois
      transforms aninhados no primeiro). É um caso só. Provado, não olhado: rodei as duas versões
      em toda a grade que o carrossel produz — offsets −8 a 8, com e sem imagem, mobile e desktop,
      **68 combinações, saída idêntica**.
- [x] **Efeito duplicado removido** (`f53b4d9`). Dois efeitos gravavam a mesma coisa no contexto.
      O `git blame` explicou a cerca: o `fbb425d` (migração para React Query) criou o segundo com
      três `console.log` no corpo — era para *ver* o dado chegando. O `c6ed37a` limpou os logs do
      arquivo e deixou os dois setters órfãos, já duplicando o que o handler fazia.
      **Uma diferença de comportamento, e ela vai para o lado certo:** quando não há setlist, o
      handler mostra "No setlist found" e de propósito não toca no contexto; o efeito órfão
      sobrescrevia assim mesmo, com setlist vazia, jogando fora o artista carregado antes.
      Como nenhum teste unitário alcança esse fluxo, verifiquei no browser: home → clique num
      slide lateral → navega para `/artists/:id/concerts/:id` e a página mostra o artista clicado,
      sem erro no console.
- [x] **`Setlist.jsx`: prop desestruturada e import duplicado juntado** (`dbbc104`).
- [x] **`aria-hidden` que o troca-ícones deixou para trás** (`2eb2818`). O `<Icon>` já põe o atributo
      por dentro; oito chamadas repetiam. Ficaram só os que estão em `<span>` no `SearchPage`.
- [x] **Os três estados da lista vazia do `LocationSelector` ganharam nome** (`c76e978`). "Deu erro",
      "ainda procurando" e "procurei e não achei" eram um ternário de três níveis dentro do JSX.
      Viraram `emptyMessage()` com guardas. O `displayName` tinha um `city ? … : city` — devolver a
      própria string vazia é só `&&`.
- [x] **Um helper para o popup do Spotify** (`eb1c7e5`). As mesmas seis linhas de centralização
      estavam copiadas no `SongDetails` e no `Setlist`; foram para o `spotifyAuth.js`, ao lado da URL
      que elas abrem — que agora deixou de ser exportada, porque ninguém mais a chama de fora.
      No mesmo commit: o ternário de três níveis que escolhe o painel do Spotify virou guardas, o
      gradiente da máscara da letra (escrito duas vezes, um para o Safari) virou constante, e o
      `try/catch` em volta do `Promise.all` do `useArtistData` saiu — os dois lados já engolem o
      próprio erro, então ele nunca podia disparar. Verificado no browser: abrir um show, expandir
      uma música, painel no estado "Connect to Listen" e letra na tela, sem erro no console.
- [x] **Linhas de show que não existiam mais** (`51d9225`). A linha podia ser três elementos: `Link`,
      `<a>` para fora, ou `div` sem link. Hoje só o `Link` acontece — o `NextConcerts` passa `expand`,
      que devolve o botão de sanfona antes de o link ser lido, e ainda assim entregava a URL da
      Ticketmaster para ninguém. O `LastConcerts` sempre monta rota interna. Duas das três variantes
      eram código morto desde que a linha de próximos shows virou lista de vendedores.

`Swiper.jsx`: 284 → 251 linhas. `ConcertList.jsx`: 121 → 106. Testes: 46 → 51.

### ⚪ Olhei e deixei quieto — opinião, pode vetar

| O quê | Por que não mexi |
|---|---|
| `Setlist.jsx` tem 213 linhas | O tamanho é marcação, não lógica emaranhada. Quebrar em subcomponentes com um uso só cada é a abstração que o CLAUDE.md manda evitar neste tamanho de app. |
| `key={songIndex}` no map das músicas | É smell de verdade, mas a chave alternativa (nome da música) não é única — banda repete música no bis. Trocar sem essa garantia é arriscar remontagem errada de linha. Vale se aparecer bug de render. |
| `Navbar.jsx`: as duas listas de links (desktop e mobile) | Já saem do mesmo `navLinks`; o que se repete é só a classe CSS de cada uma. Unificar exigiria um componente para dois usos que nem se parecem na tela. |

### 🟡 Não é simplificação, é decisão sua — `Contact.jsx`

- [x] **O formulário fala por `alert()` e não trava o botão enquanto envia.**
      **Resolvido em 2026-09-17 (`4440698`);** o texto original fica abaixo. ~~Três `alert()`
      (sucesso, erro do Formspree, falha de conexão) e nenhum estado de "enviando": dá para apertar
      *Send Message* várias vezes e mandar a mesma mensagem repetida. Trocar por uma mensagem inline
      abaixo do botão mais um `disabled` resolve as duas coisas em ~10 linhas. **Não mexi porque é
      mudança visível de UX** e você pode preferir o alerta nativo — diga e eu faço.~~
- [ ] **O botão de perfil do `Navbar` não faz nada.** Ele existe, recebe foco e o leitor de tela o
      anuncia como "User profile", mas o clique não tem efeito. Ou ele vira o começo do login, ou
      sai da barra. **É seu:** depende de haver conta de usuário no plano.

### 🔴 Achado de passagem, é seu (fora do repositório)

- [ ] **A `SETLISTFM_API_KEY` do `server/.env` local responde 403.** Descobri porque o clique no
      carrossel falhava em desenvolvimento e funcionava em produção; tive de apontar o dev para a
      API do Render para conseguir verificar. A chave da produção está boa — é a cópia local que
      está velha. Enquanto ficar assim, qualquer teste de fluxo de artista na sua máquina falha por
      um motivo que não é o código. Encaixa no chamado que você já ia abrir no setlist.fm
      (exceção com vencimento em 2026-10-15 no `CONSTRAINTS.md`).

---

## 🆕 Saldo do `/agent-skills:security-and-hardening` — 2026-09-16

Modelo de ameaça deste app em três linhas: o único bem que vale roubar aqui são as **chaves de
API**, e elas nunca chegam ao browser — quem fala com Setlist.fm, Ticketmaster, YouTube e Spotify é
o proxy no Render. Não há login, não há banco, não há dado pessoal guardado. Sobra uma fronteira de
confiança real: **tudo que entra pela query string do proxy**. E sobra um risco que não é roubo e
sim conta a pagar: como o proxy é aberto, qualquer um pode gastar a cota das nossas chaves.

### ✅ Resolvido agora

- [x] **As rotas passavam adiante o que viesse** (`25eece8`). `/api/ticketmaster/events` sem
      coordenada mandava `latlong=undefined,undefined`; `/api/setlist/search` sem nome de artista
      perdia o parâmetro no caminho e a setlist.fm devolvia a lista inteira do mundo. As duas
      gastavam uma chamada da cota para receber lixo. Agora há guarda com formato definido (número
      em faixa válida, texto não-vazio de até 200 caracteres) e três testes que batem em cada forma
      recusada — 54 testes no total.
- [x] **`X-Powered-By` saiu e `X-Content-Type-Options: nosniff` entrou** (`25eece8`). O primeiro só
      dizia a quem varre a internet qual framework procurar; o segundo impede o navegador de decidir
      tratar uma resposta JSON como HTML.
- [x] **O erro do `/api/spotify/token` parou de ecoar `details`** (`25eece8`). A mensagem carregava
      o endpoint que chamamos e o cliente não lia esse campo. O que a Spotify respondeu continua.

### ✅ Conferido, já estava certo

| O quê | Estado |
|---|---|
| SSRF | Nenhuma rota monta URL com dado do usuário: os quatro hosts são literais no código. O `:id` do setlist vai `encodeURIComponent`. |
| Injeção | Não há banco, não há shell, não há `eval` nem `innerHTML`. O React escapa a saída. |
| Rate limit | 60 req/min por IP em `/api/*`, com `trust proxy` para o Render não virar um visitante só. |
| CORS | Três origens nomeadas, sem curinga. |
| Segredo em log | O `setlist.js` loga **"Set"/"Missing"**, nunca o valor. |
| `npm audit` do servidor | 0 vulnerabilidades. |
| `npm audit` do client | as 2 do `react-router` já registradas como exceção no `CONSTRAINTS.md`; reconferi hoje a alcançabilidade do open redirect: as seis navegações do app prefixam segmento literal, nenhuma aceita caminho digitado. |

### 🟡 Vale fazer, mas é decisão sua

- [x] **Não há CSP.** **Resolvida em 2026-09-17 (`351fd83`)** — fechamento na última seção. O `index.html` é servido pelo GitHub Pages, que não deixa configurar cabeçalho
      — dá para pôr por `<meta http-equiv>`. O motivo de eu não ter mandado: a política teria de
      liberar Spotify, YouTube, Google Maps, Formspree e os domínios de imagem da Ticketmaster, e um
      domínio esquecido quebra em produção **sem erro visível na tela**, só no console. Vale fazer
      com verificação no browser rota a rota; é meia hora, não cinco minutos. Diga e eu faço.
- [ ] **O token da Spotify mora no `localStorage`.** A cartilha diz para não guardar token de sessão
      onde o JS alcança. O atenuante honesto: é token de terceiro com escopo de criar playlist, não
      sessão nossa, e sem backend com sessão não há onde mais pôr num SPA de página estática. Trocar
      isso significa cookie `httpOnly` emitido pelo servidor — arquitetura nova. **Registro como
      risco aceito**, não como coisa a fazer amanhã.

---

## 🆕 Saldo do `/agent-skills:ci-cd-and-automation` — 2026-09-16

### ✅ Resolvido agora

- [x] **O CI estava vermelho e a culpa era minha** (`61af09d`). O passo de teste roda `node --test` da raiz, que enxerga os
      testes do servidor também — e o workflow só instalava as dependências do `client/`. Os testes
      de rota que entraram na varredura de segurança usam `express`, então três deploys seguidos
      falharam com `Cannot find module 'express'`. O site no ar nunca quebrou (a `gh-pages` continua
      com o último build bom), mas nada novo subia. Corrigido e verificado: run verde.
- [x] **Os dois `npm install` do CI viraram `npm ci`.** Instala o que está no lockfile e falha se
      ele divergir do `package.json` — o que vai ao ar passa a ser o que foi resolvido aqui, não o
      que a data do build resolveria.
- [x] **O CI agora varre segredo** — fecha a exceção "CI não varre segredos" do `CONSTRAINTS.md`.
      `gitleaks dir . --redact` roda logo depois do checkout, **antes** de instalar ou buildar, com
      a versão do binário fixa. O que é varrido é exatamente o que vai ao ar, sem `node_modules` nem
      `dist` no meio. Primeira rodada: 234 kB, zero achados. O modo `--staged` local continua como
      está; ele pega o segredo antes de virar commit, este pega o que escapou disso.
- [x] **Dois deploys não correm mais um por cima do outro.** Sem `concurrency`, dois pushes com um
      minuto de diferença publicavam a `gh-pages` ao mesmo tempo e quem terminasse por último
      ganhava — podia ser o commit mais velho. Agora enfileira (não cancela: deploy interrompido no
      meio da publicação deixa a branch pela metade).

### 🟡 Ficou para depois

- [ ] **`osv-scanner` ainda roda só na mão.** Agora que existe um passo de segurança no CI, ele tem
      onde morar; o motivo de eu não ter posto junto é que o banco de CVE muda sem o código mudar, e
      um deploy que falha por causa de advisory publicada de madrugada trava o push de quem não
      mexeu em dependência. O lugar certo é um workflow **agendado** (semanal, abrindo issue), não o
      deploy. Vale fazer — é a próxima automação óbvia.
- [ ] **Nenhum workflow roda em pull request.** Hoje todo commit vai direto para `main`, então o CI
      é sempre pós-fato: quando ele reprova, o commit já está publicado no repositório. Se em algum
      momento passar a existir branch de trabalho, o mesmo job deve rodar em `pull_request`.

---

## 🆕 Saldo do `/agent-skills:observability-and-instrumentation` — 2026-09-16

### ✅ Resolvido agora

- [x] **O proxy agora escreve uma linha por requisição** (`dbea635`). O Render guarda o stdout, e a
      única coisa que ia para lá eram os `console.error` das falhas: dava para ver *que* quebrou,
      nunca quanto tráfego havia, o que estava lento nem quantas vezes o rate limit devolveu 429.
      Agora vai método, caminho, status e duração, escritos no evento `finish` (antes dele o status
      ainda pode virar 500). **Sem IP e sem query string**: o caminho já diz qual rota rodou, e o que
      a query carrega é o que a pessoa digitou e onde ela está. Dois testes cobrem o formato e a
      ausência da query. Achei um defeito meu no meio: com `req.path` o Express corta o prefixo
      dentro do router e o log saía `/events`, sem dizer de qual API — passou a usar `originalUrl`.

### 🟡 É seu — precisa de conta em serviço

- [ ] **Erro de JavaScript no navegador do usuário não chega a ninguém.** O `ErrorBoundary` mostra a
      tela de falha e escreve no console **da pessoa**, que é o único lugar onde ninguém vai olhar.
      Quer dizer que uma quebra de render em produção só aparece se alguém reclamar. O caminho normal
      é Sentry (plano grátis cobre este volume de sobra), e o custo real não é dinheiro: é uma
      dependência nova no bundle (~30 kB gzip, e o teto do chunk está em 270 kB), mais uma conta,
      mais uma chave. **Não instalei porque isso é escolha de dono**, não correção de defeito.
      Se disser que sim, é meia hora: `@sentry/react` com `tracesSampleRate` baixo e o DSN entrando
      pelos secrets do deploy, como as outras `VITE_*`.
- [ ] **Não há alerta de nada.** Se o Render cair, ou a cota do YouTube estourar, ninguém é avisado —
      descobre-se abrindo o site. O passo mais barato aqui não é ferramenta paga: é um workflow
      agendado que bate numa rota do proxy e abre issue se ela não responder 200. Anda junto com o
      `osv-scanner` semanal da seção do CI.

---

## 🆕 Saldo do `/agent-skills:webperf` — 2026-09-16

Rodado em modo profundo: Lighthouse de verdade, não leitura de código. A novidade é o alvo — até
agora tudo que foi medido neste projeto era a home, e a home é a página mais leve do app. Esta
rodada foi na **página de artista**, que é onde as pessoas ficam. Três rodadas por build, mesma
URL, servidor local (ver a seção nova do `CONSTRAINTS.md` sobre por que não dá para medir no ar).

Ponto de partida: performance **55/57/59**, FCP 3,2–3,3 s, LCP 7,3–7,5 s, CLS **0,173**.

### ✅ Resolvido agora

- [x] **A página inteira pulava quando a foto do artista chegava** (`6fb62ff`) — CLS de **0,173 para
      0,002**, de longe o pior número da página. A foto não vem com o show: vem da segunda chamada,
      a da Ticketmaster. Então o card nascia sem ela e crescia ~210 px depois, empurrando mapa,
      setlist e tudo abaixo. A correção é uma caixa `aspect-video` reservada antes de a foto chegar.
      Vale registrar o erro, porque ele custou três tentativas: eu tinha certeza de que bastava dar
      proporção à imagem, e o CLS voltava **idêntico até a 16ª casa decimal** em três builds
      diferentes — sinal de que eu estava chutando. Parei e perguntei ao navegador, com um
      `PerformanceObserver` de `layout-shift` listando cada elemento que se moveu. O culpado era
      outro: o pai usa `items-center`, a coluna da imagem não tinha largura definida, e por isso o
      `w-full` da caixa reservada resolvia para **zero** — reservando zero altura. Faltava um
      `w-full` no meio. Duas linhas, e só apareceram porque a medição substituiu o palpite.
- [x] **A fonte estava escondida dentro do CSS** (`d7fa48d`) — FCP 3,2–3,3 s para **3,1 s** nas três
      rodadas, e a estimativa de bloqueio de render do Lighthouse de 600 ms para 450 ms. O
      `@import` do DM Sans ficava no topo do `index.css`, o que põe três idas em fila antes da
      primeira pintura: baixar o nosso CSS, só então descobrir a folha do Google, só então o
      `.woff2`. Movido para um `<link>` no `index.html`, com `preconnect`. O ganho medido é pequeno
      porque aqui o nosso CSS vem de `localhost` — no ar, que é onde essa espera custa, deve ser
      maior. A nota de performance andou dentro do próprio ruído, então não conto como ganho dela.

### ❌ Testado e descartado (não vale repetir)

- [x] **Carregar o mapa só quando ele aparece na tela.** Parece óbvio — são ~400 kB de JS de
      terceiro — e eu cheguei a implementar, com `IntersectionObserver`. Ficou **pior**: performance
      caiu de 55/57/59 para 51/54/55, e as 25 requisições do Google Maps continuaram acontecendo.
      O motivo é simples e eu devia ter medido antes: no celular o topo do card do mapa está a
      **592 px** numa tela de 823 px, ou seja, **já está na primeira dobra**. Adiar o que já é
      visível só atrasa. Revertido (`Map.jsx` voltou ao `useLoadScript`, o `GoogleMapPanel.jsx`
      deixou de existir). Fica registrado para ninguém tentar de novo pelo mesmo raciocínio.

### 🟡 É seu — muda comportamento, não é defeito

- [ ] **O mapa é o elemento de LCP e custa ~400 kB de JS de terceiro.** É o que segura o LCP em
      7,3–7,5 s, e nenhuma das duas correções acima encostou nisso. As saídas reais não são
      técnicas, são de produto: (a) trocar o mapa interativo por uma **imagem estática** da Static
      Maps API (o painel tem 380×256 — uma imagem resolve, e quem quiser navegar clica e abre o
      Google Maps), ou (b) manter o mapa, mas atrás de um **clique** ("ver no mapa"). As duas
      cortam quase todo o peso; as duas mudam o que a pessoa vê ao chegar. Por isso não fiz.
      Se topar a (a), é a de melhor retorno do projeto inteiro hoje.
- [ ] **A página de artista responde 404 no GitHub Pages.** O app aparece porque o `404.html` é uma
      cópia do `index.html`, e o navegador não liga. Mas o Lighthouse se recusa a auditar, e o
      PageSpeed, o CrUX e o Search Console também não enxergam. Ou seja: a página mais importante do
      site é invisível para toda ferramenta de campo, e provavelmente para indexação. Resolver isso
      é sair do GitHub Pages para qualquer hospedagem com reescrita de verdade (Netlify, Vercel,
      Cloudflare Pages — todas de graça neste volume, e o domínio continua o mesmo). É mudança de
      infraestrutura, então é sua.

### 🟡 Ficou para depois — vi, não medi

Achados plausíveis que **não** testei nesta rodada; ficam anotados para não se perderem, mas
nenhum deles tem número por trás ainda:

- [ ] **As chamadas de API acontecem em fila, não em paralelo.** Ao abrir um link direto, a página
      busca `/api/setlist/:id`, e só quando essa responde é que dispara `/api/setlist/search` e
      `/api/ticketmaster/suggest`. A segunda etapa depende do `mbid` que vem da primeira, então não
      é só juntar — exigiria adivinhar o artista pela URL ou mudar a rota. Custa uma viagem inteira
      ao Render (que ainda por cima hiberna no plano grátis).
- [x] **Não há `preconnect` para o host do Render.** ~~Uma linha no `index.html`. Barato, mas quero
      medir antes de afirmar.~~ Medido e resolvido na rodada do `plan` (`4c89e7d`): 233 ms de
      DNS+TCP+TLS em série. Fechamento na seção do `plan`.
- [x] **O iframe do Spotify não tem `loading="lazy"`** (`Player.jsx`). Resolvido na rodada do
      `plan` (`19e6e40`), depois de confirmar que o player fica fora da primeira dobra.

---

## 🆕 Saldo do `/agent-skills:ship` — 2026-09-16

Esta é diferente das outras: em vez de uma varredura, são três revisores independentes
(qualidade, segurança, testes) lendo o mesmo diff das últimas seis entregas sem falar entre si.
Acharam três defeitos meus que passaram pelas minhas próprias revisões. Vale dizer isso com
todas as letras, porque o valor da rodada está aí.

### ✅ Resolvido agora

- [x] **O log de requisições não registrava justamente a requisição lenta** (`c59b252`). Ele
      escutava o evento `finish`, que só dispara quando a resposta saiu inteira. Quem desiste no
      meio não gerava linha nenhuma — e o nosso cliente desiste em **10 segundos** em toda chamada
      (`AbortSignal.timeout` no `request.js`). Ou seja: o log foi criado para mostrar "o que estava
      lento" e era cego exatamente aí. Reproduzido contra um Express de verdade antes e depois:
      resposta de 800 ms com o cliente abortando aos 150 ms não escrevia nada, agora escreve
      `GET /slow ABORTED 150ms`. Passou a escutar `close`, que vale para os dois finais, com
      `writableFinished` para nunca registrar como `200` uma resposta que não chegou.
      Junto vieram três correções no teste: ele não verificava que o middleware chama o `next()`
      (e um log que esquece o `next()` **derruba o site inteiro** — é o primeiro middleware da
      pilha; o `rateLimit.test.js` já fazia isso certo e eu não copiei), e a duração era conferida
      por `\d+ms`, que aceitaria um timestamp cru no lugar do tempo decorrido.
- [x] **Um cliente só podia entupir o log do Render** (`c6812d8`). O caminho vai para o log como
      veio, e cabem ~16 kB nele. O rate limit não protege: ele responde 429 **e escreve a linha**,
      de propósito, porque ver os 429 é metade do motivo do log existir. Cortado em 120 caracteres
      (a rota mais longa daqui não passa de 60). No mesmo commit, um comentário no `http.js`
      explicando que a mensagem de erro usa `url` e **não** `target` de propósito: as chaves de API
      moram na query do `target`, e esse erro é impresso com `console.error` no mesmo stdout.
      Um "arrumadinha" futuro ali publicaria as chaves nos logs.
- [x] **Link social do artista agora só abre `http(s)`** (`2cd90ed`). O `href` vem do
      `externalLinks` da Ticketmaster, dado de terceiro renderizado direto na âncora. O React 18
      avisa no console quando o href é `javascript:` mas **renderiza mesmo assim** — um clique
      rodaria o script na origem do `concertfyi.com`, onde o fluxo do Spotify guarda estado no
      localStorage. Precisa de registro ruim lá em cima para acontecer, por isso é guarda e não
      alarme; mas a guarda é uma linha e a fronteira é real.

### 🟡 É seu — 5 minutos no painel do Render

- [ ] **O "sem IP e sem query" vale para o nosso código, não necessariamente para a plataforma.**
      O middleware não escreve IP nem query, e tem teste provando. Só que o Render mantém o log de
      acesso **dele**, e esse tipo de log costuma guardar IP e a URL completa — com as coordenadas
      do `/api/ticketmaster/events?lat=…&long=…` e o que a pessoa digitou na busca. Se estiver
      ligado, a garantia que o `CONSTRAINTS.md` agora afirma não é a garantia que o sistema tem, e
      geolocalização amarrada a IP é outra categoria de dado perante a LGPD. Não é regressão (o
      Render já fazia isso antes), mas foi a nossa mudança que transformou um padrão nunca olhado
      em promessa escrita. Dá para conferir no painel: o que o log de acesso guarda e por quanto
      tempo. Conforme a resposta, ou confirmamos a frase ou a trocamos por "a aplicação não
      escreve IP nem query".

### 🟡 Vale, mas quero medir antes — ou custa binário no repositório

- [x] **Hospedar o DM Sans aqui dentro em vez de pedir ao Google.** **Feito em 2026-09-17 (`7b876cb`)**, com dois arquivos em vez de quatro — fechamento na última seção. Ganha nos três eixos ao mesmo
      tempo: tira dois handshakes de DNS+TLS do caminho da primeira pintura (provavelmente mais
      rápido que o `<link>` que acabei de subir), elimina a dependência de terceiro no `<head>` e
      fecha de vez a questão do Google Fonts sob GDPR — a decisão de Munique de 2022 é sobre
      exatamente isto. São ~20 linhas de `@font-face` e **quatro arquivos `.woff2` versionados no
      repositório**. Não fiz por causa dos binários: é o tipo de coisa que quem é dono decide.
      Observação honesta: o vazamento de IP para o Google já acontece de qualquer jeito hoje, pelo
      mapa — então isto só fecha a porta de vez junto com a decisão sobre o mapa.
- [x] **Não existe CSP.** **Resolvida em 2026-09-17 (`351fd83`).** O GitHub Pages não deixa mandar cabeçalho de resposta, então a única via
      seria um `<meta http-equiv>`, que não cobre tudo. Com o site sem login, sem sessão e sem
      pagamento, o teto de uma injeção de CSS é desfiguração, não roubo de dado. Fica anotado
      porque anda junto com a saída do GitHub Pages já registrada na seção do `webperf`.

### 🟡 Anotado como troca aceita, não como defeito

- [ ] **Foto que não é 16:9 agora é cortada.** O `getBestImage` *prefere* 16:9 mas cai para
      qualquer proporção quando o artista não tem essa variante (tem teste cobrindo a queda).
      Dentro da caixa `aspect-video` com `object-cover`, essas fotos perdem topo e base. A troca é
      claramente boa — 0,17 de CLS no catálogo inteiro é pior que corte numa minoria de fotos —
      mas ninguém tinha escrito que a troca existe.
- [ ] **O log tem cardinalidade alta e por isso não agrega por rota.** `/api/setlist/:id` gera um
      caminho diferente por show (`/api/setlist/abc`, `/api/setlist/def`). Dá para contar 429,
      porque aí o caminho é fixo, mas não dá para agrupar volume ou latência por rota sem
      normalizar o id antes. Não é defeito; só não entrega tudo que o commit prometia, e é melhor
      estar escrito aqui do que ser descoberto no primeiro dia ruim.

### ❌ Descartado — é opinião minha, pode vetar

- [x] **Teste de componente com jsdom + Testing Library para a correção de CLS.** O revisor de
      testes mediu em vez de supor: instalou o jsdom e deu a ele uma caixa com `aspect-ratio: 16/9`
      de verdade. Resultado: `aspect-ratio` computa certo, **altura dá zero** — o jsdom implementa a
      cascata do CSS e não tem motor de layout. Num navegador são 225 px. Então a única asserção
      possível seria procurar a string `aspect-video` no HTML, que é testar a implementação e fica
      **verde no exato cenário que quebraria a página de novo** (o Tailwind parar de emitir a
      regra). Custo: **+57 pacotes** no client (+20%) para comprar um teste que comprovadamente não
      pega este defeito. Descartado. O Playwright pegaria, mas são 120 MB de Chromium — se um dia
      entrar, entra pelo fluxo de link direto da página de artista, que é o caminho não testado de
      maior valor do projeto, e a asserção de CLS pega carona.
- [x] **Asserção de build conferindo o `<link>` da fonte no HTML emitido.** Sugerida como coberta
      barata (~6 linhas, zero dependência). Não fiz: as cópias por rota são `writeFileSync` do
      mesmo buffer do `dist/index.html`, então o `<link>` não pode sumir em uma e ficar na outra —
      e se a cópia quebrar, a página inteira some, o que é bem mais visível que a fonte. O teste
      também exigiria um build feito antes do `node --test`, que hoje roda sozinho.

---

## 🆕 Saldo do `/agent-skills:plan` — 2026-09-17

A skill que faltava da fila combinada em 2026-09-15: `plan` era o item 2 e nunca rodou — as outras
nove passaram na frente. A entrada não foi um `SPEC.md` (não existe), foi este arquivo.

O plano está em `tasks/plan.md`, as tarefas em `tasks/todo.md` (`11ff66f`). **As cinco fecharam.**

### O corte que o plano fez, e por que importa

Dos ~30 itens `[ ]` daqui, **cinco** eram tarefa. O resto é decisão de dono (sair do GitHub Pages,
mapa estático, Sentry, rotacionar a chave da setlist.fm, o log de acesso do Render) ou risco aceito
e já registrado. Escrever isso deu o número que faltava: o backlog não tem 30 coisas a fazer, tem
cinco — e elas couberam numa tarde.

### ✅ Resolvido agora

- [x] **`preconnect` para o host do Render** (`4c89e7d`). Medido antes com `curl -w`, porque a nota
      do Lighthouse tem ruído de ±7 pontos e o que o `preconnect` compra não é nota: é handshake.
      Primeira conexão fria: **37 ms de DNS + 6 ms de TCP + 190 ms de TLS = 233 ms** em série, que
      hoje só começam depois de o bundle baixar, parsear e executar. Agora correm em paralelo com o
      download. Conferido no `dist/index.html` e nas cópias por rota.
- [x] **`loading="lazy"` no iframe da Spotify** (`19e6e40`). O contraponto do mapa: adiar o mapa
      piorou a medição porque ele está **dentro** da primeira dobra (topo a 592 px num viewport de
      823 px). O player vem depois do mapa e da setlist inteira, então está fora dela por
      construção, e adiar tira concorrência de rede de quem está na tela.
- [x] **Varredura semanal de CVE + health check do proxy** (`2143d91`, `3015158`). Fecha os dois
      itens que sobraram do `ci-cd`. Moram num workflow **agendado**, não no `deploy.yml`: os dois
      falham por motivo que não é commit de ninguém, e gate que reprova sem culpado é gate que se
      aprende a ignorar. Abrem issue, e só uma — a segunda rodada com o mesmo problema diz "já
      existe issue aberta" em vez de duplicar. A sonda bate em `/api/ticketmaster/events` sem
      parâmetro, que devolve 400 na **nossa** guarda de entrada: prova que o processo subiu, o
      router está montado e o nosso código roda, sem gastar cota de terceiro.
- [x] **README com setup e deploy** (`211dbf5`). O que uma pessoa que clona o repositório precisa
      estava só no `CLAUDE.md`, que é documento para agente. Todo comando citado foi rodado antes
      de entrar no arquivo.
- [x] **A regra de fluxo saiu da memória pessoal** (`361426b`). Item aberto desde 2026-09-15.
      Vale para o projeto, e o motivo não é preferência: **não há staging**. Um push no `main`
      publica o client na `gh-pages` e faz o Render redeployar o servidor do mesmo commit.

### 🔴 Dois defeitos que não estavam no plano

Apareceram porque o plano mandou verificar, não porque alguém suspeitava deles.

- [x] **O alarme novo morria calado** (`3015158`). O passo que abre a issue rodava `gh issue
      create` num job **sem `checkout`** — o `gh` procura o repositório no remote do git, não achava
      e saía com `not a git repository`. O workflow teria ficado verde na rotina e mudo no dia em
      que o proxy caísse. Só apareceu porque o caminho de falha foi **executado**: numa branch
      descartável, com a sonda forçada a falhar. A issue nasceu (`#1`), a segunda rodada não
      duplicou, a issue foi fechada e a branch apagada. Um alarme que nunca tocou é um alarme sobre
      o qual você está chutando.
- [x] **O teto de bundle do `CONSTRAINTS.md` não era aplicado por ninguém** (`5cdf3b2`). O
      documento afirma, com todas as letras, que os 270 kB saem do `build.chunkSizeWarningLimit` do
      `vite.config.js`. Lá estava **430**: os dois ratchets de 2026-09-15 (430 → 380 → 270) mexeram
      só no documento. Por dois dias houve **172 kB de folga silenciosa** sobre o chunk de entrada —
      uma biblioteca pesada entraria sem acender luz nenhuma, que é exatamente o que o limite existe
      para impedir. Descoberto lendo o `vite.config.js` para conferir uma frase do README. Corrigido
      para 270, e o aviso foi visto disparar (baixando para 250 de propósito) antes de entrar.
- [x] **O piso dizia 56 testes e são 58** (`7f0d852`). Os dois que a rodada do `ship` acrescentou
      ao `requestLog.test.js` nunca entraram no número contra o qual o piso está escrito.

### ⚪ Sobre a skill, para a próxima vez

`plan` foi a de menor custo e maior retorno até aqui — não por causa das cinco tarefas, que eram
pequenas, mas porque **separar o que é tarefa do que é decisão de dono** transformou um backlog de
58 kB numa lista de cinco linhas. E porque o hábito que ela impõe (critério de aceite antes de
código, verificação depois) foi o que achou os dois defeitos acima, que nenhuma das dez rodadas
anteriores tinha visto. O que ela **não** substitui: nada aqui precisou de `spec`, e insistir nele
teria sido cerimônia — o `CLAUDE.md` já diz que a implementação é do ponytail.

---

## 🆕 Saldo avulso — o envelope `{ data }` do client (2026-09-17)

Não é rodada de skill: saiu de uma leitura do `client/src/api/request.js` depois de fechar o `plan`.

### ✅ Resolvido agora

- [x] **O wrapper de `fetch` do client devolvia `{ data }` e ninguém precisava disso** (`38ad292`).
      Era imitação do axios, que saiu do projeto em `57f3b88`. Oito `queryFn` pagavam por ele com um
      `.then(res => res.data)` para desembrulhar um objeto de um campo só. O `server/http.js` sempre
      devolveu o corpo direto; agora os dois lados combinam. Os 58 testes continuam verdes, e o
      `request.test.mjs` foi ajustado junto — é o que provaria a quebra se o desembrulho tivesse
      ficado para trás em alguma chamada.

---

## 🆕 Saldo da rodada de decisões do dono — 2026-09-17

Os quatro itens que estavam parados esperando você escolher. Você mandou fazer os quatro; um
não deu, e o motivo não é código.

**Troquei a ordem de propósito:** a CSP foi por último, não em terceiro. Ela precisa listar os
domínios exatos, e tanto o mapa estático quanto hospedar a fonte mexem nessa lista — escrita antes,
teria de ser escrita duas vezes.

### ✅ Resolvido agora

- [x] **O formulário de contato responde na página e não aceita segundo clique** (`4440698`).
      Os três `alert()` viraram um `<p role="status">` embaixo do botão, e o botão desabilita
      enquanto a requisição está aberta — era por aí que a mesma mensagem chegava duplicada ao
      Formspree. Verificado no navegador **com o id do Formspree propositalmente errado**, para o
      caminho de falha rodar de verdade: em voo o botão lê "Sending…" com `disabled=true` e a área
      de status vazia; depois do 404 a mensagem aparece inline e o botão volta. O parágrafo reserva
      a altura da linha, então a resposta não empurra o rodapé. Branco sobre `red-600` dá 4,85:1,
      o mesmo par que os rótulos do formulário já usavam.
- [x] **A DM Sans é servida daqui** (`7b876cb`). Saem dois handshakes do caminho da primeira
      pintura (`fonts.googleapis.com` para a folha e `fonts.gstatic.com` para o arquivo) e o IP de
      quem visita deixa de ir ao Google por causa da fonte.
      **Dois arquivos, não quatro.** O woff2 da DM Sans é variável — o mesmo arquivo serve 400 e
      700, que é exatamente o que o `css2` do Google já devolvia. Declarei os dois pesos como faces
      separadas, e não como intervalo, para `font-medium` e `font-semibold` continuarem caindo no
      mesmo peso de hoje: **isto é paridade, não melhoria** (veja o item aberto abaixo). O itálico
      ficou de fora: a única marcação em itálico do app é a linha `"Could not load lyrics"`, e
      60 kB de binário no repositório não se pagam por ela — o navegador sintetiza a oblíqua.
      Verificado contra o build de produção: `document.fonts` reporta DM Sans 400 e 700 carregadas,
      a única requisição de fonte é `/fonts/dm-sans-latin.woff2` da nossa própria origem, nada bate
      em `gstatic` nem em `googleapis`, e o `latin-ext` desce sob demanda quando aparece nome
      acentuado (Sigur Rós, Björk, Łódź). Chunk de entrada inalterado em 258,15 kB. A licença OFL
      está versionada ao lado dos arquivos.
- [x] **Existe CSP** (`351fd83`). Cada origem saiu do app **rodando**, não de leitura de código:
      carrossel da home, página de artista com mapa, embed da Spotify, música expandida com letra e
      YouTube, `LocationSelector`, `/about`, `/contact` e `/callback`. Duas origens só apareceriam
      assim: `fonts.googleapis.com` e `fonts.gstatic.com` continuam sendo contatadas — **pelo
      loader do Google Maps**, que puxa a Roboto por conta própria. Ou seja, tirar a nossa fonte do
      Google fechou a nossa porta, não a do mapa; as duas só fecham junto com a decisão sobre o
      mapa.
      Vai por `<meta>` num plugin do Vite com `apply: "build"`, porque em desenvolvimento a política
      barraria o script inline do Vite e o WebSocket do HMR. Como o `transformIndexHtml` roda antes
      da cópia, `index.html`, `404.html` e as cópias por rota saem todas com a política — conferido
      nas quatro. **Zero violação em todas as rotas**, com o mapa desenhando, os dois iframes
      carregando, a letra chegando, e Formspree, Spotify, Photon e Nominatim alcançáveis.
      O que o `<meta>` descarta em silêncio (`frame-ancestors`, `report-uri`, `sandbox`) virou
      exceção no `CONSTRAINTS.md`, para ninguém ler esta política como defesa de clickjacking.

### ✅ Ainda na mesma rodada, depois que você pediu

- [x] **A lista de agosto foi conferida contra o código que existe hoje** (`a02d230`). 22 linhas
      reescritas com a evidência ao lado. Onze estavam feitas e por marcar (5 rotas em `lazy` no
      `App.jsx:13-17`, cache do React Query com `retry: 1`, `ErrorBoundary.jsx`, contraste e
      `button-name` em 100 na auditoria, o botão de limpar nativo do `type="search"`, o
      placeholder rotativo do `SearchBar.jsx:38-52`, `TicketOptions`/`VendorTiles`, o README do
      `211dbf5`). Quatro estavam pela metade, e agora dizem qual metade. Dois são "não" honesto:
      não há service worker e ninguém passou um leitor de tela no app. "Enter para buscar" foi
      aposentado por não ter objeto. **Um item andou para trás**: o `aria-current="page"` está no
      `Pagination.jsx:53` mas não nos links do Navbar — item aberto de verdade que ninguém tinha
      visto.
- [x] **O botão de perfil do Navbar saiu** (`215deae`). Desenhava um ícone de pessoa, recebia foco
      pelo teclado, era anunciado como "User profile" — e não tinha `onClick`. Você deu duas
      saídas, "vira login ou sai"; virar login exigiria um sistema de contas que o app não tem, e
      seria um segundo beco sem saída com mais preparo. Volta no dia em que houver login.

### 🔴 Bloqueado em você — mapa estático

- [ ] **A chave `VITE_GOOGLE_MAPS_KEY` não tem permissão para a Maps Static API.** Está por
      inteiro na lista única do fim do arquivo, com o 403 que recebi.

### 🔵 Apareceu ao hospedar a fonte — e já foi

- [x] **`font-medium` e `font-semibold` não desenhavam 500 e 600.** **Resolvido (`a35bc40`).**
      Há 20 usos de `font-medium` e 19 de `font-semibold` no app, e o `css2` do Google só entregava faces 400 e 700 — então 500
      arredonda para 400 e 600 arredonda para 700. **Sempre foi assim**, não é regressão do
      `7b876cb`; só ficou visível ao escrever as declarações à mão. O arquivo que já está no
      repositório é variável e tem os pesos intermediários: trocar `font-weight: 400` / `700` por
      `font-weight: 100 1000` numa face só faz 39 lugares passarem a desenhar o peso que a classe
      diz. **Não fiz porque muda como o texto aparece em 39 lugares** e isso é chamada sua — o
      escopo daquele commit era tirar o Google do caminho, não redesenhar tipografia. Você mandou
      ligar. As quatro faces discretas viraram duas com `font-weight: 100 1000`, e
      `format("woff2-variations")` virou `format("woff2")` — aquela é uma forma de rascunho que
      navegador atual nenhum aceita, e deixá-la ali é arriscar a `src` inteira ser descartada. Medido no navegador com `measureText` em "Foo Fighters Setlist" a 40px:
      100→318,24 · 300→348,16 · 400→352,64 · 500→359,40 · 600→367,76 · 700→374,00 · 900→380,31.
      Sete larguras distintas, onde antes 500 e 400 davam o mesmo número e 600 e 700 também.
      **Zero byte novo**: é o mesmo arquivo, que sempre teve o eixo inteiro. O CSS até encolheu
      (25,28 → 24,66 kB) por serem duas declarações a menos.

---

## 🙋 Só você pode decidir — lista única (2026-09-17)

Tudo que está parado esperando **você**, num lugar só. Nada aqui é trabalho que eu possa fazer
sozinho: ou depende de um toggle numa conta que é sua, ou é uma escolha de arquitetura, ou é um
risco que alguém precisa aceitar com o nome em cima. O detalhe longo continua na seção de origem;
aqui fica a decisão e o custo dela.

### Precisa de um clique seu numa conta

- [ ] **Liberar a Maps Static API na chave `VITE_GOOGLE_MAPS_KEY`.** Testei antes de escrever
      qualquer linha:

      ```
      GET .../staticmap?center=…&key=…
      403  "This API key is not authorized to use this service or API."
      ```

      A chave tem restrição por API e a **Maps Static API não está na lista**. Se eu tivesse
      subido a troca, a página de artista mostraria imagem quebrada onde havia mapa — e é a página
      mais importante do site. É um toggle no Google Cloud Console. Libere e eu faço a troca: é a
      mudança de melhor retorno do projeto (LCP 7,3–7,5 s é o mapa).
- [ ] **Restringir essa mesma chave por referrer** — é a mesma visita ao console, e a exceção
      vence em 2026-10-15 no `CONSTRAINTS.md`. Detalhe na seção do `constraints` (2026-09-15).
- [ ] **Rotacionar a `SETLISTFM_API_KEY`.** Vazou num bundle publicado na `gh-pages` em julho.
      Só você tem a conta. Detalhe na seção do `constraints` (2026-09-15).
- [ ] **Sentry e Google Analytics.** Hoje o `ErrorBoundary` manda o erro para o `console` do
      visitante, onde ninguém lê — não sabemos o que quebra em produção. São ~20 linhas cada,
      **e uma conta que é sua**; o plano grátis cobre este volume de sobra. O custo real não é
      dinheiro, é a decisão de mandar dado de quem visita para um terceiro (e de acrescentar as
      origens deles na CSP). Detalhe nas seções do `observability` (2026-09-16) e na lista de
      alta prioridade.

### Escolha de arquitetura

- [ ] **Sair do GitHub Pages.** Uma decisão, dois problemas resolvidos de uma vez:
      **(a)** a página de artista responde **404** de verdade — o app aparece porque o `404.html`
      é cópia do `index.html` e o navegador não liga, mas Lighthouse, PageSpeed, CrUX e Search
      Console se recusam a enxergar a página mais importante do site;
      **(b)** a CSP deixa de depender de `<meta>`. O GitHub Pages não manda cabeçalho de resposta,
      e o `<meta>` descarta em silêncio `frame-ancestors`, `report-uri` e `sandbox` — está como
      exceção no `CONSTRAINTS.md` justamente para ninguém ler a política de hoje como defesa de
      clickjacking. Netlify, Vercel e Cloudflare Pages fazem reescrita de verdade e mandam
      cabeçalho, todas de graça neste volume, e o domínio continua o mesmo. Fecharia de quebra o
      `Cache-Control` dos assets, que hoje é do GitHub.

### Risco aceito — confirme ou mande trocar

- [ ] **O token da Spotify mora no `localStorage`.** A cartilha diz para não guardar token de
      sessão onde o JS alcança. O atenuante honesto: é token de terceiro com escopo de criar
      playlist, não sessão nossa, e num SPA estático sem backend de sessão não há outro lugar.
      Trocar significa cookie `httpOnly` emitido pelo servidor — arquitetura nova, e o servidor
      hoje não guarda estado nenhum. **Minha opinião é aceitar**; a assinatura é sua.
- [ ] **Foto que não é 16:9 é cortada.** O `getBestImage` prefere 16:9 e cai para qualquer
      proporção quando o artista não tem a variante; dentro da caixa `aspect-video` com
      `object-cover`, essas perdem topo e base. A troca é claramente boa (0,17 de CLS no catálogo
      inteiro é pior que corte numa minoria de fotos), só nunca tinha sido escrita. **Se o corte
      incomodar visualmente**, dá para `object-contain` com fundo — aí volta letterbox.

### Espera um "pode fazer" seu — é trabalho meu, não decisão de conta

- [ ] **Normalizar o id no log de acesso.** `/api/setlist/:id` gera um caminho por show
      (`/api/setlist/abc`, `/api/setlist/def`), então dá para contar 429 mas não para agrupar
      volume ou latência **por rota**. É trocar o caminho cru pelo padrão da rota antes de logar —
      poucas linhas em `server/`. Só não entrei porque a seção do `ship` registrou como dívida e
      ninguém pediu.
- [ ] **`aria-current="page"` nos links do Navbar.** Existe no `Pagination.jsx:53` e falta no
      Navbar; quem usa leitor de tela não ouve em qual página está. Apareceu na auditoria de hoje
      (`a02d230`), é de uma linha por link.
