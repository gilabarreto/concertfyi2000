# Tarefas — saldo em aberto do ConcertFYI

Fonte: `tasks/plan.md`. Item fechado aqui vira commit **e** linha no `SUGESTOES_ATUALIZADO.md`.

---

## Tarefa 1: `preconnect` para o host do Render

**Descrição:** O browser só abre a conexão com `concertfyi2000.onrender.com` quando o JS dispara a
primeira chamada de API — depois de baixar, parsear e executar o bundle. DNS + TCP + TLS para um
host de terceiro acontecem em série nesse ponto. Um `<link rel="preconnect">` no `index.html` põe
esse custo em paralelo com o download do bundle.

**Critérios de aceite:**
- [ ] O tempo de DNS+TCP+TLS para o host do Render está medido, com número, antes da mudança
- [ ] Se o número for irrelevante (< ~50 ms), a tarefa vira registro de "testado e descartado" em vez de commit

**Verificação:**
- [ ] `curl -o /dev/null -s -w` contra o host, três vezes, cache de DNS limpo entre elas
- [ ] `npm run check:full` limpo
- [ ] O `<link>` aparece no `dist/index.html` e nas cópias por rota

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
- [ ] O iframe tem `loading="lazy"`
- [ ] Está confirmado que o player fica fora da primeira dobra no viewport móvel do Lighthouse (823 px), e não repetido de cabeça

**Verificação:**
- [ ] `npm run check:full` limpo
- [ ] O player ainda toca quando a pessoa rola até ele

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
- [ ] `schedule` semanal + `workflow_dispatch` para rodar na mão
- [ ] Varre os dois lockfiles (`client` e `server`) com `osv-scanner`
- [ ] Bate numa rota do proxy e falha só quando ela não responde 200
- [ ] Falha abre issue; não toca no deploy

**Verificação:**
- [ ] Rodado por `workflow_dispatch` e verde uma vez
- [ ] `deploy.yml` inalterado

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
- [ ] Setup dos dois lados, com os comandos rodados antes de entrarem no arquivo
- [ ] As variáveis de ambiente dos dois lados, por nome, sem valor
- [ ] O portão (`npm run check`) e como o deploy dispara nos dois lados
- [ ] A vitrine que já existe continua lá

**Verificação:**
- [ ] Todo comando citado foi executado nesta sessão
- [ ] `npm run format:check --prefix client` continua limpo

**Dependências:** Nenhuma

**Arquivos:** `README.md`

**Tamanho:** S

---

## Tarefa 5: a regra de fluxo sai da memória pessoal

**Descrição:** Item aberto desde 2026-09-15 no backlog. "Uma correção por vez, commit + push no
`main` a cada item" vive na memória pessoal do Claude: outra pessoa ou outra máquina abre o projeto
e não conhece a regra. Decidir se vale para o projeto e, se valer, escrevê-la no `CLAUDE.md`.

**Critérios de aceite:**
- [ ] A regra está no `CLAUDE.md` ou o item está fechado com o motivo de não estar
- [ ] O item correspondente no `SUGESTOES_ATUALIZADO.md` sai de `[ ]`

**Verificação:**
- [ ] Nenhuma — é documentação

**Dependências:** Nenhuma

**Arquivos:** `CLAUDE.md`, `SUGESTOES_ATUALIZADO.md`

**Tamanho:** XS
