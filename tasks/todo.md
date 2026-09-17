# Tarefas — saldo em aberto do ConcertFYI

> **Todas fechadas em 2026-09-17.** Commits: `4c89e7d` (1), `19e6e40` (2), `2143d91` + `3015158`
> (3), `211dbf5` (4), `361426b` (5). O fechamento com números está no `SUGESTOES_ATUALIZADO.md`.
> Dois defeitos apareceram no caminho e não estavam no plano: `5cdf3b2` e `7f0d852`.

Fonte: `tasks/plan.md`. Item fechado aqui vira commit **e** linha no `SUGESTOES_ATUALIZADO.md`.

---

## Tarefa 1: `preconnect` para o host do Render

**Descrição:** O browser só abre a conexão com `concertfyi2000.onrender.com` quando o JS dispara a
primeira chamada de API — depois de baixar, parsear e executar o bundle. DNS + TCP + TLS para um
host de terceiro acontecem em série nesse ponto. Um `<link rel="preconnect">` no `index.html` põe
esse custo em paralelo com o download do bundle.

**Critérios de aceite:**
- [x] O tempo de DNS+TCP+TLS para o host do Render está medido, com número, antes da mudança
- [x] Se o número for irrelevante (< ~50 ms), a tarefa vira registro de "testado e descartado" em vez de commit

**Verificação:**
- [x] `curl -o /dev/null -s -w` contra o host, três vezes, cache de DNS limpo entre elas
- [x] `npm run check:full` limpo
- [x] O `<link>` aparece no `dist/index.html` e nas cópias por rota

**Dependências:** Nenhuma

**Arquivos:** `client/index.html`

**Tamanho:** XS

---

## Tarefa 2: `loading="lazy"` no iframe da Spotify

**Descrição:** O player da Spotify (`Player.jsx`) é um iframe de terceiro bem abaixo da dobra na
página de artista. Sem `loading="lazy"` ele concorre por rede com o que está na tela. Ao contrário
do mapa — que a rodada de webperf mediu **dentro** da primeira dobra e por isso não adiantou adiar —
este está fora dela.

**Critérios de aceite:**
- [x] O iframe tem `loading="lazy"`
- [x] Está confirmado que o player fica fora da primeira dobra no viewport móvel do Lighthouse (823 px), e não repetido de cabeça

**Verificação:**
- [x] `npm run check:full` limpo
- [x] O player ainda toca quando a pessoa rola até ele

**Dependências:** Nenhuma

**Arquivos:** `client/src/components/ArtistPage/Player.jsx`

**Tamanho:** XS

---

## Tarefa 3: workflow semanal — CVE e health check

**Descrição:** Duas automações que o backlog pede e que hoje não existem: o `osv-scanner` só roda
quando alguém lembra, e ninguém é avisado se o proxy do Render cair. Ambas vão para um workflow
**agendado** que abre issue, não para o `deploy.yml`: falha por advisory de madrugada não pode
travar o push de quem não mexeu em dependência.

**Critérios de aceite:**
- [x] `schedule` semanal + `workflow_dispatch` para rodar na mão
- [x] Varre os dois lockfiles (`client` e `server`) com `osv-scanner`
- [x] Bate numa rota do proxy e falha só quando ela não responde 200
- [x] Falha abre issue; não toca no deploy

**Verificação:**
- [x] Rodado por `workflow_dispatch` e verde uma vez
- [x] `deploy.yml` inalterado

**Dependências:** Nenhuma

**Arquivos:** `.github/workflows/weekly-checks.yml`

**Tamanho:** S

---

## Tarefa 4: README com setup e deploy

**Descrição:** O README atual é uma página de vitrine: descreve o produto e lista a stack. Quem
clona o repositório não descobre ali que são dois projetos npm independentes, quais variáveis de
ambiente cada lado precisa, qual é o portão de qualidade nem como o deploy acontece. Isso está tudo
no `CLAUDE.md`, que é documento para agente, não para pessoa.

**Critérios de aceite:**
- [x] Setup dos dois lados, com os comandos rodados antes de entrarem no arquivo
- [x] As variáveis de ambiente dos dois lados, por nome, sem valor
- [x] O portão (`npm run check`) e como o deploy dispara nos dois lados
- [x] A vitrine que já existe continua lá

**Verificação:**
- [x] Todo comando citado foi executado nesta sessão
- [x] `npm run format:check --prefix client` continua limpo

**Dependências:** Nenhuma

**Arquivos:** `README.md`

**Tamanho:** S

---

## Tarefa 5: a regra de fluxo sai da memória pessoal

**Descrição:** Item aberto desde 2026-09-15 no backlog. "Uma correção por vez, commit + push no
`main` a cada item" vive na memória pessoal do Claude: outra pessoa ou outra máquina abre o projeto
e não conhece a regra. Decidir se vale para o projeto e, se valer, escrevê-la no `CLAUDE.md`.

**Critérios de aceite:**
- [x] A regra está no `CLAUDE.md` ou o item está fechado com o motivo de não estar
- [x] O item correspondente no `SUGESTOES_ATUALIZADO.md` sai de `[ ]`

**Verificação:**
- [x] Nenhuma — é documentação

**Dependências:** Nenhuma

**Arquivos:** `CLAUDE.md`, `SUGESTOES_ATUALIZADO.md`

**Tamanho:** XS
