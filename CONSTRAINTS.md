# CONSTRAINTS.md

A régua de qualidade do ConcertFYI. Medida em 2026-09-15, não chutada.

Quem mexe no código — pessoa ou agente — lê isto antes e faz a mudança **passar** na régua.
Baixar um número para o código passar não é passar. Se um limite estiver errado, mude o limite
num commit próprio, com o motivo, e não junto da mudança que ele estava atrapalhando.

```bash
npm run check        # ~2,5s — o portão de todo dia
npm run check:full   # ~5s   — check + build, antes de push
```

O `check` precisa do `gitleaks` no PATH (`~/.local/bin/gitleaks`, binário único).

No CI, o `deploy.yml` roda **lint e teste antes do build**: falhou, o deploy não acontece. O que
vai ao ar em `concertfyi.com` passou pelo piso.

---

## Piso — bloqueia

Falhou, o trabalho não sai daqui.

| O quê | Hoje | Regra | Por quê este número |
|---|---|---|---|
| Lint do client | 0 achados | **0** | Foi instalado com 4 achados e os 4 foram corrigidos. Zero é o estado real, não uma meta; qualquer achado novo é regressão do mesmo dia. |
| Formatação do client | tudo formatado | **`prettier --check` limpo** | Todo o `client/` foi formatado de uma vez em 2026-09-15. Formatar só o arquivo tocado deixaria cada diff futuro misturando mudança real com reformatação. |
| Testes | 43 passam, 0 falham | **0 falhas** | Cobrem `server/http.js`, `server/rateLimit.js`, `api/request.js` (o wrapper de fetch do client), `helpers/calendar.js`, `helpers/selectors.js` (a costura entre as duas APIs) e `helpers/spotifyPlaylist.js` (o placar que decide o que entra na playlist). São poucos; justamente por isso nenhum pode ser sacrificado. |
| Teste deletado ou pulado para o código passar | — | **proibido** | Com 43 testes, apagar um é apagar 2% da cobertura que existe. |
| Segredo no que vai ser commitado | 0 | **0** | O servidor existe *só* para manter chave fora do browser. Uma chave commitada anula a única razão de ele existir. Já aconteceu: ver Exceções. |
| CVE conhecida em dependência de runtime | 0 | **0** | Dependência de build quebrada atrapalha quem desenvolve; dependência de runtime quebrada chega no usuário. As de `(dev)` entram na conta só quando houver folga. |

Comandos exatos:

```bash
gitleaks git --staged --redact --no-banner   # segredos no que está staged
npm run format:check --prefix client         # prettier --check .
npm run lint --prefix client                 # eslint .
node --test                                  # da raiz, acha os seis arquivos

# CVEs — fora do check de todo dia, depende de rede e o banco muda sem o código mudar
osv-scanner scan source --lockfile client/package-lock.json --lockfile server/package-lock.json
```

O gitleaks roda **só no staged**, de propósito. Varrer o histórico inteiro devolve 88 achados,
87 deles bundles da `gh-pages` com a chave pública do Google Maps — ruído que ensina a ignorar
o scanner. O staged pega o que importa: o segredo prestes a entrar.

---

## Teto de bundle — avisa

| O quê | Hoje | Limite | Por quê |
|---|---|---|---|
| Maior chunk de JS (entrada) | 258,28 kB | **270 kB** | Hoje + ~5%. Uma feature normal cabe sem alarme falso; um `import` de biblioteca pesada acende a luz no mesmo build. |

Histórico deste número, porque ele já mudou duas vezes em um dia:

| Data | Entrada | Teto | O que aconteceu |
|---|---|---|---|
| 2026-09-15 | 516,53 kB | 550 kB | chunk único, sem code splitting |
| 2026-09-15 | 356,10 kB | 380 kB | `React.lazy` por rota tirou 161 kB da entrada |
| 2026-09-15 | 407,72 kB | 430 kB | `react-router` 6.4.3 → 6.30.6 devolveu 51 kB |
| 2026-09-15 | 356,76 kB | 380 kB | trocar o `axios` pelo `fetch` tirou os mesmos 51 kB de volta |
| 2026-09-15 | 258,28 kB | 270 kB | sair o runtime do FontAwesome (94,6 kB para desenhar dez `<svg>`) |

O de 430 foi um teto **subindo**, que é o movimento suspeito. A justificativa: 26 versões menores
de atraso no router é pior dívida que 51 kB, e o `npm update` que trouxe isso limpou 38 CVEs. O
aviso disparou no build e a decisão está aqui em vez de ter sido silenciada — que é o único uso
honesto de um limite que sobe.

Os de 380 e 270 são o movimento contrário. O `axios` custava 50,5 kB do chunk de entrada para dois
GETs e um timeout que a plataforma já tem; o runtime do FontAwesome custava 94,6 kB para converter
dados de ícone em `<svg>`, coisa de cinco linhas. Os dois saíram. Teto que fica largo depois de uma
redução real deixa de avisar — a folga de 122 kB absorveria as próximas duas bibliotecas pesadas em
silêncio.

O que o usuário baixa ao abrir o site é o chunk de entrada. As rotas viraram chunks próprios e só
descem quando alguém navega para elas — `ArtistPage` sozinha são 155 kB (arrasta o Google Maps) que
a maioria das visitas nunca pede.

Aplicado por `build.chunkSizeWarningLimit` no `client/vite.config.js` — recurso nativo do Vite,
zero dependência nova. Avisa e não quebra: subir 10 kB numa feature legítima não pode travar
ninguém.

---

## Medido, sem portão

Números que registramos para ver a direção, sem regra amarrada. Não invente meta para eles.

| Métrica | 2026-09-15 |
|---|---|
| JS gzipado na entrada | 84,64 kB (era 154,77 kB antes do code splitting) |
| CSS | 24,00 kB (5,23 kB gzip) |
| Linhas de JS/JSX no fonte | 3.840 |
| Rate limit do proxy | 60 req/min por IP em `/api/*` (`server/rateLimit.js`) |
| Cobertura de testes | **não medida** |
| Lighthouse mobile (`concertfyi.com`) | performance **71–78** (4 medições), acessibilidade **100**, best practices **96**, SEO **100** |
| LCP mobile | **4,8–6,5 s** (FCP 2,6 s, CLS 0,001, TBT 90 ms) |
| Peso de imagem na home | **~0,5 MB em 7 requisições** (era 21,7 MB em 38) |
| JS não usado no chunk de entrada | 37 kB (era 44 kB antes de tirar o axios) — a medir de novo depois do deploy de `d335254` |

Cobertura ficou fora de propósito: com 5 arquivos de teste, qualquer meta percentual vira teatro.
A regra útil hoje é a do piso — não deletar teste para passar. Quando houver teste de componente,
vale voltar aqui e medir antes de exigir.

O Lighthouse é medido contra o site no ar, com o Chrome for Testing
(`npx @puppeteer/browsers install chrome@stable`, sem sudo) — não entra no `check` porque depende de
rede e de um deploy concluído. Rodar depois de mexer em imagem, rota ou dependência pesada:

```bash
cd "$(mktemp -d)" && CHROME_PATH=<chrome-for-testing> npx lighthouse https://concertfyi.com \
  --output=json --output-path=<caminho absoluto> \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

O `cd` não é enfeite. Dentro do WSL o `chrome-launcher` assume que vai abrir o Chrome **do
Windows** e monta o perfil descartável em `C:\Users\<voce>\AppData\Local\lighthouse.<numero>`;
a conversão do caminho falha e o `mkdir` acaba criando uma pasta só, com barras invertidas no
nome, **no diretório de onde o comando foi chamado** — ~10 MB por rodada no meio do repositório.
Rodar de um diretório descartável deixa o lixo lá. O `.gitignore` cobre o caso de esquecer.

Sem portão de propósito, e agora com medição para provar: quatro rodadas seguidas do mesmo commit
deram **71, 72, 73 e 78**. A home sorteia os artistas do carrossel, então cada rodada baixa fotos
diferentes e o LCP anda junto (4,8 s a 6,5 s). Uma faixa de 7 pontos como portão reprovaria commit
inocente e aprovaria regressão pequena.

Comparar antes/depois exige, então, ou uma métrica determinística (tamanho do chunk, bytes de
imagem, JS não usado — essas vieram do build, não do Lighthouse) ou a mediana de várias rodadas.
Uma medição sozinha não sustenta afirmação nenhuma sobre performance nesta página.

Os valores acima são de 2026-09-15, depois de `797e895`, `5c892ec` e `57f3b88` — o LCP saiu de
115,6 s, e o chunk de entrada de 408,49 kB.

---

## Exceções

| O quê | Por quê | Dono | Vence |
|---|---|---|---|
| `SETLISTFM_API_KEY` vazada e **não rotacionada** | Foi publicada num bundle da `gh-pages` em julho de 2025, junto com a do Ticketmaster. Não foi encontrada opção de rotação no portal do setlist.fm. A do Ticketmaster foi rotacionada em 2026-09-15. | Victor | **2026-10-15** — abrir chamado no setlist.fm pedindo chave nova se até lá não houver self-service |
| 87 achados de gitleaks no histórico da `gh-pages` | São bundles buildados contendo `VITE_GOOGLE_MAPS_KEY`. Chave de browser é pública por design; o controle dela é restrição de referrer no Google Cloud, não segredo. | Victor | sem vencimento — aceito |
| `VITE_GOOGLE_MAPS_KEY` sem restrição de referrer confirmada | Nunca foi verificado no console do Google Cloud. Enquanto não for, a chave pública é abusável por qualquer um. | Victor | **2026-10-15** |
| 2 CVEs abertas no `react-router` 6.30.6 | `GHSA-337j-9hxr-rhxg` só afeta hidratação de SSR, e este app não tem SSR. `GHSA-wrjc-x8rr-h8h6` é open redirect via caminho não confiável chegando ao `navigate()`; as seis chamadas do app prefixam um segmento literal (`/artists/...`), então não viram protocolo relativo. As duas só fecham no react-router 7, que é major. | Victor | reavaliar se o app passar a aceitar caminho vindo do usuário |
| `osv-scanner` fora do `npm run check` | Depende de rede e o banco de dados muda sem o código mudar — rodar a cada commit dá falso alarme em dia que ninguém mexeu em dependência. Rodar na mão, ou ao mexer em `package.json`. | Victor | quando houver CI com cache, mover para lá |
| `server/` sem lint nem prettier | As duas ferramentas foram instaladas só no client, onde estão os hooks e o valor real. São 5 arquivos de Express sem JSX. | Victor | reavaliar quando o servidor passar de ~500 linhas |
| CI não varre segredos | O `deploy.yml` roda lint e teste antes do build, mas não o gitleaks — ele precisaria do binário na runner, e o modo `--staged` não faz sentido lá. A varredura de segredo depende de rodar `npm run check` antes de commitar. | Victor | reavaliar se algum segredo escapar |
| Regras do React Compiler desligadas | O preset do `eslint-plugin-react-hooks` v7 traz 15 regras de adoção do React Compiler. O projeto está em React 18 e não tem lentidão medida. Ver comentário no `client/eslint.config.mjs`. | Victor | reavaliar ao migrar para React 19 |
| Geolocalização pedida no carregamento da home | Achado `geolocation-on-start` do Lighthouse. É deliberado: o carrossel da home é "shows perto de você", e sem coordenada não há o que mostrar. Existe fallback (São Paulo) e o `LocationSelector` deixa trocar de cidade sem conceder a permissão. Trocar por um botão "usar minha localização" é decisão de produto, não de qualidade. | Victor | reavaliar se a taxa de negação da permissão virar um problema medido |
| Componentes e hooks sem teste | O `node:test` só enxerga arquivo que o node resolve sozinho — JSX e `import.meta.env` estão fora do alcance sem Vitest + jsdom + testing-library. **Victor vetou as 3 dependências em 2026-09-15.** A lógica que erra calado (costura das duas APIs, parse das duas datas, placar da playlist) está coberta; o resto é marcação. | Victor | ao primeiro bug que só um teste de hook pegaria — `useGeolocation` é o candidato |

---

## O que muda esta régua

Subir um limite, remover uma checagem ou adicionar exceção: commit separado, motivo escrito,
e a data de medição desta página atualizada. A régua serve para ser inconveniente na hora certa.
