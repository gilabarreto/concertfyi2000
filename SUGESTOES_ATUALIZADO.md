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
- [ ] Error Boundary com fallback UI
- [ ] Toast/mensagens amigáveis para timeouts
- [ ] Retry logic com exponential backoff
- [ ] Logging de erros (Sentry, LogRocket)
- [ ] Loading skeletons enquanto dados carregam

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
- [ ] Code splitting por rota (React.lazy + Suspense)
- [ ] Lazy loading de imagens (next-gen formats: webp)
- [ ] Caching de requisições API (LRU cache ou SWR)
- [ ] Service Worker para offline mode
- [ ] Monitoramento de performance (Core Web Vitals)

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
- [ ] `aria-label` em todos os ícones/botões sem texto
- [ ] `aria-current='page'` em link ativo
- [ ] Navegação por teclado (Tab, Enter, Arrows)
- [ ] Contraste mínimo AA (4.5:1 para texto)
- [ ] Testar com screen readers (NVDA, JAWS)

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
- [ ] Ícone de loading enquanto busca
- [ ] Botão 'Clear input'
- [ ] Placeholder dinâmico por breakpoint
- [ ] Suporte a Enter para buscar

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
- [ ] Info de ingressos (Ticketmaster, Vivid Seats)
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
- [ ] README com setup e deploy
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
- [ ] Mover para o `CLAUDE.md` se a regra vale para o projeto, não só para o Victor

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
| Google Fonts bloqueia a renderização (847 ms) | pequeno | O `<link>` do DM Sans no `index.html` trava o first paint. A correção conhecida é `preconnect` + `media="print" onload`, mas mexer em carregamento de fonte troca um problema por FOUT. Precisa de uma medição antes/depois própria. |
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

- [ ] **O formulário fala por `alert()` e não trava o botão enquanto envia.** Três `alert()`
      (sucesso, erro do Formspree, falha de conexão) e nenhum estado de "enviando": dá para apertar
      *Send Message* várias vezes e mandar a mesma mensagem repetida. Trocar por uma mensagem inline
      abaixo do botão mais um `disabled` resolve as duas coisas em ~10 linhas. **Não mexi porque é
      mudança visível de UX** e você pode preferir o alerta nativo — diga e eu faço.
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

- [ ] **Não há CSP.** O `index.html` é servido pelo GitHub Pages, que não deixa configurar cabeçalho
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
