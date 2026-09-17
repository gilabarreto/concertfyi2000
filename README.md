# 🎯 ConcertFYI - [https://concertfyi.com](https://concertfyi.com)


## 📝 Short Description
A web platform for music lovers to explore live concerts and setlists by artist, view past and upcoming shows, access ticket links, and save favorite artists. The app integrates data from Setlist.fm and Ticketmaster to deliver a seamless music event discovery experience.

## 💡 Problem It Solves
- Difficulty finding upcoming concerts for favorite artists.

- Lack of centralized access to historical setlists.

- Poor connection between concert discovery and ticket purchase.

## 🌟 Unique Value Propositions
- Combined real-time ticketing and historical concert data.

- Artist-centered experience with customized curation.

- Light, modern, and immersive UI/UX focused on music fans.

## ⚙️ Tech Stack
- Frontend: React, React Router, TailwindCSS

- Backend: Node.js, Express.js

- APIs: Setlist.fm, Ticketmaster, Google Maps, Nominatim

- Hosting: Github Pages + Render

---

## 🛠️ Como rodar

São **dois projetos npm independentes**. Não há workspace na raiz: `client/` e `server/` têm
`node_modules` próprios e cada um precisa do seu `npm install`.

```bash
git clone git@github.com:gilabarreto/concertfyi2000.git && cd concertfyi2000
npm install --prefix client
npm install --prefix server
```

Depois, dois terminais:

```bash
cd server && npm run dev   # Express na :4000 (nodemon)
cd client && npm run dev   # Vite na :3000
```

O client precisa do servidor no ar: o Vite encaminha `/api` para `localhost:4000`. Abrir só o
client dá uma home que carrega e uma busca que não devolve nada.

Testado com Node 22. O CI usa Node 24 — não há `engines` fixando versão em nenhum dos dois lados.

### Variáveis de ambiente

O servidor existe por causa desta lista: é ele que fala com as APIs de terceiro, para que nenhuma
chave chegue ao browser. `server/.env`:

```
TICKETMASTER_API_KEY=   SETLISTFM_API_KEY=   YOUTUBE_API_KEY=
SPOTIFY_CLIENT_ID=      SPOTIFY_CLIENT_SECRET=   PORT=
```

`client/.env` — tudo aqui vai para dentro do bundle e é público por definição, então nada de
segredo:

```
VITE_API_BASE=   VITE_GOOGLE_MAPS_KEY=   VITE_FORMSPREE_ID=   VITE_SPOTIFY_CLIENT_ID=
```

As do client também existem como secrets no GitHub, porque o build do deploy precisa delas.

## ✅ Portão de qualidade

```bash
npm run check        # ~2,5s — segredo (staged) + formatação + lint + testes
npm run check:full   # ~5s   — o de cima + build do client
```

Rode antes do push. O `check` precisa do `gitleaks` no PATH. O `CONSTRAINTS.md` explica cada
número e por que ele é aquele — inclusive por que baixar um limite para o código passar não conta
como passar.

O `deploy.yml` roda a mesma coisa no CI **antes** do build: reprovou, o site não sobe. Uma vez por
semana, o `weekly-checks.yml` varre CVE nos dois lockfiles e bate no proxy, abrindo issue se algo
estiver errado.

## 🚀 Deploy

Automático dos dois lados, a partir de um push no `main`:

| Parte | Onde | Como dispara |
|---|---|---|
| Client | GitHub Pages (`concertfyi.com`) | `deploy.yml` builda e publica `client/dist` na branch `gh-pages` |
| Server | Render | O próprio Render observa o `main` e redeploya sozinho — não há workflow neste repositório fazendo isso |

Ou seja: um push no `main` publica os dois. Não existe ambiente de staging.
