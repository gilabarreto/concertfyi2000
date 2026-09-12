# 📋 Dossiê Técnico Consolidado: ConcertFYI
**Atualizado em 2026-08-23**

---

## 🎯 Objetivo e Infraestrutura

**O que é**: Aplicativo web (SPA) desenvolvido com React + Vite para pesquisar informações sobre artistas, shows passados, próximos eventos e descoberta por geolocalização.

### Hospedagem e Deploy
- **Repositório**: Monorepo contendo Client e Server
- **Frontend**: Hospedado em GitHub Pages (`gilabarreto.github.io`)
- **Backend**: Hospedado na Render
- **Domínio**: `concertfyi.com` (via GoDaddy)

---

## 🏗️ Arquitetura Atual (Bem estruturada ✅)

### Frontend
```
client/src/
├── App.jsx                      # Gerenciado com hooks + Context
├── pages/                       # 6 páginas principais
├── components/                  # Componentes reutilizáveis
│   ├── ArtistPage/            # Detalhes do show (ConcertInfo, Setlist, Player, Map, etc)
│   ├── LocationSelector.jsx    # Busca de cidades com fuzzy search
│   ├── SearchBar.jsx           # Busca com debounce
│   ├── Swiper.jsx              # Carrossel de shows recomendados
│   ├── Navbar.jsx              # Navegação
│   ├── Footer.jsx              # Rodapé
│   └── SongDetails.jsx         # Detalhes da música com Lyrics/YouTube/Spotify
├── hooks/                       # Hooks customizados ✅
│   ├── useAppState.js          # Estado global
│   ├── useGeolocation.js       # Geolocalização + localStorage
│   ├── useDebounce.js          # Debounce para busca
│   └── useScreenSize.js        # Media queries
├── context/                     # AppContext para estado
├── config/                      # Configurações (routes.js centralizado)
├── api/                         # Chamadas à API
└── icons.js                     # Ícones customizados
```

### Backend
```
server/
├── index.js                     # Express com CORS configurado
├── routes/
│   ├── ticketmaster.js          # Eventos futuros, busca por artistas
│   ├── setlist.js               # Histórico de shows, setlists
│   ├── spotify.js               # Player, dados do artista
│   ├── lyrics.js                # LRCLib (primária) + fallbacks
│   ├── youtube.js               # Vídeos de performances
│   └── locations.js             # Proxy de geolocalização (CORS/rate-limit)
```

### State Management
- **AppContext**: Armazena estado global (searchValue, city, concerts, etc)
- **useAppState**: Hook customizado que encapsula toda a lógica de estado
- **localStorage**: Persistência da localização do usuário

---

## 🔌 Serviços Integrados

| Serviço | Endpoint | Uso |
|---------|----------|-----|
| **Ticketmaster API** | `/api/ticketmaster` | Eventos futuros, busca por artistas |
| **Setlist.fm API** | `/api/setlist` | Histórico de shows, setlists |
| **Spotify** | `/api/spotify` | Player embutido, dados do artista |
| **LRCLib** | `/api/lyrics` | Lyrics (fonte primária, confiável) |
| **Lyrics.ovh** | `/api/lyrics` | Fallback para lyrics |
| **YouTube** | `/api/youtube` | Vídeos de performances ao vivo |
| **Google Maps** | Frontend direto | Exibição de mapa do venue |
| **Formspree** | Frontend direto | Gerenciamento de contato |
| **Geolocalização** | `/api/locations` | Sugestão de shows por localização |
| **Vivid Seats** | Ticketmaster | Metadata de venda de ingressos |

---

## 🔐 Variáveis de Ambiente

### Frontend (.env)
```
VITE_API_BASE=https://api.render.com           # URL base da API
VITE_GOOGLE_MAPS_KEY=xxxx                      # Chave do Google Maps
VITE_FORMSPREE_ID=xxxx                         # ID do Formspree
```

### Backend (.env)
```
SETLISTFM_API_KEY=xxxx                         # Setlist.fm
TICKETMASTER_API_KEY=xxxx                      # Ticketmaster
SPOTIFY_CLIENT_ID=xxxx                         # Spotify
SPOTIFY_CLIENT_SECRET=xxxx                     # Spotify
PORT=4000                                      # Porta do servidor
```

---

## 🛣️ Rotas Principais (Frontend)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Home.jsx` | Exibe Swiper (recomendações por localização) ou SearchPage |
| `/search` | `SearchPage.jsx` | Resultados de busca por artista |
| `/artists/:artistId/concerts/:concertId` | `ArtistPage.jsx` | Detalhes completos do show |
| `/about` | `About.jsx` | Informações sobre o projeto |
| `/contact` | `Contact.jsx` | Formulário de contato (Formspree) |
| `/callback` | `SpotifyCallback.jsx` | OAuth callback do Spotify (popup) |

---

## 🧩 Componentes e Fluxo de Dados

### Componentes Estruturais

| Componente | Props | Responsabilidade |
|-----------|-------|-----------------|
| **App.jsx** | — | Gerencia AppContext, Rotas, Navbar/Footer |
| **Navbar.jsx** | `city` (display) | Navegação, busca, logo |
| **Footer.jsx** | — | Links sociais, copyright |
| **SearchBar.jsx** | — | Input com debounce, navega para /search |
| **LocationSelector.jsx** | — | Busca de cidades, localStorage, geolocalização |

### Componentes de Busca e Home

| Componente | Dados | Responsabilidade |
|-----------|-------|-----------------|
| **SearchPage.jsx** | `ticketmaster`, `setlist` | Exibe artistas encontrados |
| **Swiper.jsx** | `ticketmaster`, geolocalização | Carrossel de shows por cidade |

### Página do Artista (ArtistPage - Complexa)

| Componente | Props | Responsabilidade |
|-----------|-------|-----------------|
| **ConcertInfo.jsx** | `concert`, `artistImage` | Título, data, venue, país |
| **Setlist.jsx** | `concert`, `setlist` | Lista de músicas do show |
| **SongDetails.jsx** | `song`, `concert` | Detalhes da música (Lyrics, YouTube, Spotify) |
| **LyricsDropdown.jsx** | `track` | Exibe/busca lyrics |
| **Player.jsx** | `concert`, `spotifyArtist` | Spotify Web Playback |
| **LastConcerts.jsx** | `artistId`, `setlist` | Histórico de shows |
| **NextConcerts.jsx** | `artistId`, `ticketmaster` | Agenda futura |
| **Map.jsx** | `concert.venue` | Google Maps do local |

### Componentes Estáticos

| Componente | Responsabilidade |
|-----------|-----------------|
| **About.jsx** | Sobre o projeto, proposta de valor |
| **Contact.jsx** | Formulário de contato (Formspree) |
| **Header.jsx** | Título/subtítulo reutilizável |

---

## 📊 Fluxo de Dados Global

```
App.jsx (useAppState)
  ├── AppContext
  │   ├── searchValue (string)
  │   ├── city (string)
  │   ├── lat/long (geolocation)
  │   ├── ticketmaster (concerts array)
  │   ├── setlist (setlist data)
  │   └── ... (outros estados)
  │
  └── Navbar → SearchBar
      └── updateSearchValue → navegação para /search
          └── SearchPage (consome ticketmaster + setlist)
              └── → ArtistPage (detalhes completos)
```

---

## 🔄 Mudanças Recentes (Últimos 30 dias)

### ✅ Implementadas

1. **Geolocalização Aprimorada**
   - LocationSelector com busca fuzzy (em vez de digitação)
   - localStorage persistence
   - Botão de clear/reset para geolocalização automática
   - Country codes integrados

2. **Mobile UX**
   - Touch event improvements (taps precisos)
   - Padding/hit area adjustments
   - Event propagation prevention

3. **Lyrics Integration**
   - LRCLib como fonte primária (confiável, sem scraping)
   - Fallback para lyrics.ovh
   - Remoção de Genius (scraping complexo, rate limiting)

4. **Dados Enriquecidos**
   - Vivid Seats metadata para ingressos

5. **Refatorações**
   - Remoção de código desnecessário
   - Consolidação de dependencies

---

## 🏆 Qualidade de Código Atual

| Aspecto | Status | Notas |
|---------|--------|-------|
| **Estrutura** | ✅ Excelente | Hooks, Context, rotas centralizadas |
| **Type Safety** | ⚠️ Parcial | Usa JSDoc, ideal TypeScript no futuro |
| **Error Handling** | ⚠️ Básico | Funciona, mas poderia ser mais robusto |
| **Performance** | ✅ Bom | Debounce, lazy loading de rotas |
| **Acessibilidade** | ⚠️ Em progresso | aria-labels parciais, melhorar navegação |
| **Testing** | ❌ Inexistente | Sem testes (recomendado adicionar) |
| **SEO** | ⚠️ Crítico | SPA não indexável pelo Google (vide roadmap) |

---

## 🚀 Próximos Passos Recomendados

### 🔴 CRÍTICO
- **SEO/SSR Strategy** → Migrar para SSR (Next.js/Remix) ou pre-render estático

### 🟠 ALTA PRIORIDADE
- Definir diferencial competitivo (vs Bandsintown, Songkick)
- Error boundaries robusto
- Performance optimization (code splitting, lazy loading)

### 🟡 MÉDIA PRIORIDADE
- Refatorações de componentes (extrair ArtistCard, SongItem, Logo)
- Hooks customizados adicionais (useCity, useConcertData)
- Organização de pastas (services/, constants/, utils/)
- Acessibilidade (WCAG 2.1 AA)

### 🟢 BAIXA PRIORIDADE
- Dark mode
- Favoritar/salvar shows
- Analytics (Google Analytics, Mixpanel)
- Compartilhamento social
- Playlist automática do setlist

---

## 📁 Estrutura de Pastas Atual

```
concertfyi2000/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/                    # Chamadas HTTP
│   │   ├── components/             # Componentes React
│   │   ├── pages/                  # Páginas (roteadas)
│   │   ├── hooks/                  # Hooks customizados ✅
│   │   ├── context/                # AppContext
│   │   ├── config/                 # routes.js, constantes
│   │   ├── icons/                  # Ícones customizados
│   │   ├── index.css               # Tailwind
│   │   └── main.jsx
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── index.js                    # Express app
│   ├── routes/                     # Rotas de API
│   └── package.json
├── docs/                           # Documentação (user stories, wireframes)
└── README.md
```

---

## 💡 Dicas para Desenvolvimento

1. **Adicionar nova página**: Criar em `pages/`, adicionar rota em `config/routes.js`
2. **Chamar API**: Usar funções em `api/` ou criar nova via `fetch` com try/catch
3. **Estado global**: Adicionar ao `AppContext` ou criar novo hook (padrão: `use` prefix)
4. **Estilo**: Usar Tailwind classes, evitar CSS custom (já temos Dark Mode suportar)
5. **Ícones**: Adicionar a `icons.js` para reutilização

---

## 📞 Contato e Suporte

- **Domínio**: https://concertfyi.com
- **Repo**: [GitHub](https://github.com/gilabarreto/concertfyi2000)
- **Email**: gilabarreto@gmail.com
