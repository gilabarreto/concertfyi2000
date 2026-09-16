# 💡 Sugestões de Melhorias - ConcertFYI
**Atualizado em 2026-08-23** | Baseado em estado atual + mudanças recentes

---

## 🔴 CRÍTICO - Problema de SEO/Discovery

### ❌ Problema: SPAs não são indexadas pelo Google
- O Googlebot não executa JavaScript na maioria dos casos
- Site aparece como "página em branco" nos resultados de busca
- Zero tráfego orgânico = crescimento limitado

### ✅ Solução Recomendada
**Opção A (Melhor)**: Migrar para **SSR** com **Next.js** ou **Remix**
- Renderização do servidor
- SEO automático com meta tags corretas
- Mantém toda a funcionalidade React
- Esforço: Alto, mas essencial

**Opção B (Médio esforço)**: Pre-rendering estático
- Gerar versões HTML estáticas de cada artista/show
- Usar ferramentas como `@vitejs/plugin-ssr`
- Funciona bem para conteúdo semi-estático

**Opção C (Rápido)**: Usar Prerender.io
- Serviço terceirizado que simula JavaScript
- Menos código, mas custa dinheiro

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

## 📞 Próximas Conversas

1. **Diferencial**: qual é a proposta de valor do ConcertFYI que o separa do Bandsintown? É a
   pergunta que decide as outras — sem ela, SEO e features novas são chute caro.
2. **SEO**: Next.js ou pre-render estático? Semanas de trabalho, e só vale se tráfego orgânico for
   a meta real. Depende da resposta 1.
3. **Sentry**: o Error Boundary hoje manda o erro para o `console` do usuário, onde ninguém lê.
   Sentry é o próximo passo natural — ~20 linhas e uma conta grátis.
