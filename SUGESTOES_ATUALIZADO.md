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

**1. Extrair Componentes Reutilizáveis**
```
- ArtistCard.jsx (em SearchPage)
  Props: {artist, image, onSelect}

- SongItem.jsx (em Setlist)
  Props: {song, concertId, onLyricsClick}

- Logo.jsx (usado em Header, Navbar)
  Props: {size, variant}

- EmptyState.jsx (mensagens "sem resultados")
  Props: {icon, title, description, action}
```

**2. Hooks Customizados Adicionais**
```jsx
// useCity.js - encapsula geolocalização + localStorage
const { city, setCity, resetCity } = useCity();

// useConcertData.js - cache inteligente de shows
const { concerts, loading, error } = useConcertData(artistId);

// useLocalStorage.js - abstração para localStorage
const [saved, setSaved] = useLocalStorage('saved_concerts', []);
```

**3. Organização de Pastas**
```
components/
├── common/              # Reutilizáveis (Button, Card, Modal)
├── layout/              # Layout (Navbar, Footer, Sidebar)
├── search/              # Busca (SearchBar, SearchPage)
├── artist/              # Página do artista
├── home/                # Home (Swiper, LocationSelector)
└── modals/              # Modais (Disclaimer, etc)

services/
├── api.js               # Funções de fetch centralizadas
├── concert.js           # Concert service
├── artist.js            # Artist service
└── lyrics.js            # Lyrics service

utils/
├── format.js            # Formatação (datas, preços)
├── validation.js        # Validação de input
└── helpers.js           # Funções helper

constants/
├── urls.js              # URLs de APIs, domínios
├── messages.js          # Mensagens de erro/sucesso
└── config.js            # Configurações
```

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
- [ ] Testes unitários com **Vitest** (componentes, utils)
- [ ] Testes de integração com **Cypress** ou **Playwright** (user flows)
- [ ] Coverage mínimo de 80%

### Type Safety
- [ ] Migrar para **TypeScript** (gradualmente)
- Começar com `components/` → `pages/` → `hooks/`

### Documentation
- [ ] **Storybook** para componentes
- [ ] JSDoc para funções
- [ ] README com setup e deploy
- [x] CLAUDE.md com contexto do projeto (arquivo no repo desde 2026-09-15)

### DevOps
- [ ] **CI/CD** no GitHub Actions (lint, test, build, deploy)
- [ ] **Sentry** para error tracking
- [ ] **GitHub Pages** deploy automático
- [ ] **Render** deploy automático

### Monitoring
- [ ] **Google Analytics** para eventos de usuário
- [ ] **Sentry** para erros de produção
- [ ] **LogRocket** para debugging de sessões
- [ ] **Lighthouse** CI para performance

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
| Error handling | ⚠️ Básico | Funciona, poderia ser robusto |
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
1. Error handling robusto
2. Testes E2E com Cypress
3. Analytics (Google Analytics + Sentry)

### Mês 3: Diferencial & Growth
1. Validar diferencial competitivo
2. Favoritar/Salvar shows
3. Social sharing
4. Começar TypeScript migration

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

### 🟠 Próximo na fila

- [ ] **Rodar `npm run check` no CI.** Hoje o `deploy.yml` builda e publica a cada push sem rodar
      lint nem teste: um push vermelho vai ao ar igual. Enquanto isso não existir, o
      `CONSTRAINTS.md` depende de alguém lembrar de rodar na mão.
- [ ] **Error Boundary.** Qualquer exceção de render hoje apaga o site para o usuário. ~20 linhas.
      É o item "Error Handling Robusto" mais acima, reduzido ao que importa primeiro.
- [ ] **Code splitting por rota.** O bundle é um chunk único de 516,53 kB (154,77 kB gzip). É o
      item de Performance mais acima, agora com número medido. Quando entrar, o teto de 550 kB no
      `CONSTRAINTS.md` precisa ser reescrito.
- [ ] **2 ou 3 testes no client**, no `selectors.js` e no join Setlist.fm × Ticketmaster por nome
      de artista — a costura frágil do app, descrita no `CLAUDE.md`. Sem perseguir cobertura.

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

Se você discordar de qualquer linha desta tabela, ela volta para a fila — o veto é seu.

---

## 📞 Próximas Conversas

1. **Quando**: Qual é a proposta de valor do ConcertFYI que o diferencia de Bandsintown?
2. **SEO**: Vamos migrar para Next.js ou fazer pre-render estático?
3. **Design System**: Criar Storybook com componentes reutilizáveis?
4. **Testing**: Começar com testes unitários ou E2E?
5. **Descartes**: você concorda com a tabela "Descartado" acima? TypeScript, Storybook e
   reorganização de pastas estão recomendados neste documento e eu os vetei — vale fechar a
   divergência em vez de deixá-la nas duas seções.
