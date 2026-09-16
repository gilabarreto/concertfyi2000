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
| Testes | 30 passam, 0 falham | **0 falhas** | Cobrem `server/http.js`, `server/rateLimit.js`, `helpers/calendar.js`, `helpers/selectors.js` (a costura entre as duas APIs) e `helpers/spotifyPlaylist.js` (o placar que decide o que entra na playlist). São poucos; justamente por isso nenhum pode ser sacrificado. |
| Teste deletado ou pulado para o código passar | — | **proibido** | Com 30 testes, apagar um é apagar 3% da cobertura que existe. |
| Segredo no que vai ser commitado | 0 | **0** | O servidor existe *só* para manter chave fora do browser. Uma chave commitada anula a única razão de ele existir. Já aconteceu: ver Exceções. |
| CVE conhecida em dependência de runtime | 0 | **0** | Dependência de build quebrada atrapalha quem desenvolve; dependência de runtime quebrada chega no usuário. As de `(dev)` entram na conta só quando houver folga. |

Comandos exatos:

```bash
gitleaks git --staged --redact --no-banner   # segredos no que está staged
npm run format:check --prefix client         # prettier --check .
npm run lint --prefix client                 # eslint .
node --test                                  # da raiz, acha os cinco arquivos

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
| Maior chunk de JS (entrada) | 408,41 kB | **430 kB** | Hoje + ~5%. Uma feature normal cabe sem alarme falso; um `import` de biblioteca pesada acende a luz no mesmo build. |

Histórico deste número, porque ele já mudou duas vezes em um dia:

| Data | Entrada | Teto | O que aconteceu |
|---|---|---|---|
| 2026-09-15 | 516,53 kB | 550 kB | chunk único, sem code splitting |
| 2026-09-15 | 356,10 kB | 380 kB | `React.lazy` por rota tirou 161 kB da entrada |
| 2026-09-15 | 407,72 kB | 430 kB | `react-router` 6.4.3 → 6.30.6 devolveu 51 kB |

O último foi um teto **subindo**, que é o movimento suspeito. A justificativa: 26 versões menores
de atraso no router é pior dívida que 51 kB, e o `npm update` que trouxe isso limpou 38 CVEs. O
aviso disparou no build e a decisão está aqui em vez de ter sido silenciada — que é o único uso
honesto de um limite que sobe.

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
| JS gzipado na entrada | 116,45 kB (era 154,77 kB antes do code splitting) |
| CSS | 23,95 kB (5,16 kB gzip) |
| Linhas de JS/JSX no fonte | 3.310 |
| Rate limit do proxy | 60 req/min por IP em `/api/*` (`server/rateLimit.js`) |
| Cobertura de testes | **não medida** |
| Lighthouse / acessibilidade | **não medido** |

Cobertura ficou fora de propósito: com 5 arquivos de teste, qualquer meta percentual vira teatro.
A regra útil hoje é a do piso — não deletar teste para passar. Quando houver teste de componente,
vale voltar aqui e medir antes de exigir.

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
| Componentes e hooks sem teste | O `node:test` só enxerga arquivo que o node resolve sozinho — JSX e `import.meta.env` estão fora do alcance sem Vitest + jsdom + testing-library. **Victor vetou as 3 dependências em 2026-09-15.** A lógica que erra calado (costura das duas APIs, parse das duas datas, placar da playlist) está coberta; o resto é marcação. | Victor | ao primeiro bug que só um teste de hook pegaria — `useGeolocation` é o candidato |

---

## O que muda esta régua

Subir um limite, remover uma checagem ou adicionar exceção: commit separado, motivo escrito,
e a data de medição desta página atualizada. A régua serve para ser inconveniente na hora certa.
