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
| Testes | 12 passam, 0 falham | **0 falhas** | São poucos e cobrem só `server/http.js` e `helpers/calendar.js`. Justamente por serem poucos, nenhum pode ser sacrificado. |
| Teste deletado ou pulado para o código passar | — | **proibido** | Com 12 testes, apagar um é apagar 8% da cobertura que existe. |
| Segredo no que vai ser commitado | 0 | **0** | O servidor existe *só* para manter chave fora do browser. Uma chave commitada anula a única razão de ele existir. Já aconteceu: ver Exceções. |

Comandos exatos:

```bash
gitleaks git --staged --redact --no-banner   # segredos no que está staged
npm run lint --prefix client                 # eslint .
node --test                                  # da raiz, acha os dois arquivos
```

O gitleaks roda **só no staged**, de propósito. Varrer o histórico inteiro devolve 88 achados,
87 deles bundles da `gh-pages` com a chave pública do Google Maps — ruído que ensina a ignorar
o scanner. O staged pega o que importa: o segredo prestes a entrar.

---

## Teto de bundle — avisa

| O quê | Hoje | Limite | Por quê |
|---|---|---|---|
| Maior chunk de JS (entrada) | 356,10 kB | **380 kB** | Hoje + ~7%. Uma feature normal cabe sem alarme falso; um `import` de biblioteca pesada acende a luz no mesmo build. Era 516,53 kB num chunk só até o code splitting por rota entrar em 2026-09-15. |

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
| Cobertura de testes | **não medida** |
| Lighthouse / acessibilidade | **não medido** |

Cobertura ficou fora de propósito: com 2 arquivos de teste, qualquer meta percentual vira teatro.
A regra útil hoje é a do piso — não deletar teste para passar. Quando houver teste de componente,
vale voltar aqui e medir antes de exigir.

---

## Exceções

| O quê | Por quê | Dono | Vence |
|---|---|---|---|
| `SETLISTFM_API_KEY` vazada e **não rotacionada** | Foi publicada num bundle da `gh-pages` em julho de 2025, junto com a do Ticketmaster. Não foi encontrada opção de rotação no portal do setlist.fm. A do Ticketmaster foi rotacionada em 2026-09-15. | Victor | **2026-10-15** — abrir chamado no setlist.fm pedindo chave nova se até lá não houver self-service |
| 87 achados de gitleaks no histórico da `gh-pages` | São bundles buildados contendo `VITE_GOOGLE_MAPS_KEY`. Chave de browser é pública por design; o controle dela é restrição de referrer no Google Cloud, não segredo. | Victor | sem vencimento — aceito |
| `VITE_GOOGLE_MAPS_KEY` sem restrição de referrer confirmada | Nunca foi verificado no console do Google Cloud. Enquanto não for, a chave pública é abusável por qualquer um. | Victor | **2026-10-15** |
| `server/` sem lint | O ESLint foi instalado só no client, onde estão os hooks e o valor real. São 5 arquivos de Express sem JSX. | Victor | reavaliar quando o servidor passar de ~500 linhas |
| CI não varre segredos | O `deploy.yml` roda lint e teste antes do build, mas não o gitleaks — ele precisaria do binário na runner, e o modo `--staged` não faz sentido lá. A varredura de segredo depende de rodar `npm run check` antes de commitar. | Victor | reavaliar se algum segredo escapar |
| Regras do React Compiler desligadas | O preset do `eslint-plugin-react-hooks` v7 traz 15 regras de adoção do React Compiler. O projeto está em React 18 e não tem lentidão medida. Ver comentário no `client/eslint.config.mjs`. | Victor | reavaliar ao migrar para React 19 |

---

## O que muda esta régua

Subir um limite, remover uma checagem ou adicionar exceção: commit separado, motivo escrito,
e a data de medição desta página atualizada. A régua serve para ser inconveniente na hora certa.
