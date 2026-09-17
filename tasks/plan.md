# Plano de implementação — saldo em aberto do ConcertFYI

Gerado pelo `/agent-skills:plan` em 2026-09-17. A entrada não é um `SPEC.md` (não existe): é o
`SUGESTOES_ATUALIZADO.md`, que já é o backlog escrito do projeto, com 10 rodadas de skill fechadas
dentro dele.

## O corte que este plano faz

Dos ~30 itens `[ ]` do backlog, a maioria **não é tarefa** — é decisão de dono (sair do GitHub
Pages, trocar o mapa por imagem estática, abrir conta no Sentry, rotacionar a chave da setlist.fm,
conferir o log de acesso do Render) ou risco aceito e registrado (token da Spotify no
`localStorage`, corte de foto fora de 16:9, cardinalidade do log). Esses ficam onde estão: no
`SUGESTOES_ATUALIZADO.md`, com o motivo escrito.

Entram aqui só os itens que **não dependem de ninguém responder nada**: cabem numa sessão, têm
critério de aceite verificável e não mudam o que a pessoa vê na tela.

## Decisões de arquitetura

- **O `preconnect` do Render se verifica por tempo de handshake, não por nota do Lighthouse.** A
  nota da home tem ruído de ±7 pontos entre rodadas do mesmo commit; o que o `preconnect` compra é
  DNS + TCP + TLS para um host de terceiro, e isso o `curl -w` mede direto. Medir a coisa certa é
  mais barato *e* mais honesto que medir a nota e torcer para o ganho sair do ruído.
- **A varredura de CVE e o health check moram num workflow agendado, não no `deploy.yml`.** O banco
  de CVE muda sem o código mudar: advisory publicada de madrugada travaria o push de quem não mexeu
  em dependência. Falha agendada abre issue; falha no deploy bloqueia o site.
- **Nenhuma tarefa nova de teste.** O piso do `CONSTRAINTS.md` é 56 testes passando e nenhum item
  deste plano cria lógica nova com ramo — os que criam (o workflow) rodam no CI, que é o próprio
  teste deles.

## Grafo de dependências

Não há. As cinco tarefas tocam arquivos disjuntos (`index.html`, `Player.jsx`,
`.github/workflows/`, `README.md`, `CLAUDE.md`) e qualquer ordem deixa o sistema funcionando.
A ordem abaixo é por risco decrescente: o que pode dar errado vem primeiro.

## Lista de tarefas

### Fase 1: o que pode não valer a pena (mede antes de afirmar)
- [x] Tarefa 1: `preconnect` para o host do Render
- [x] Tarefa 2: `loading="lazy"` no iframe da Spotify

### Checkpoint: Fase 1
- [x] `npm run check:full` limpo
- [x] O teto de bundle não se mexeu (nenhuma das duas é JS)

### Fase 2: automação que hoje só roda na mão
- [x] Tarefa 3: workflow semanal — `osv-scanner` + health check do proxy, abrindo issue

### Checkpoint: Fase 2
- [x] O workflow roda por `workflow_dispatch` e passa uma vez de verdade
- [x] O `deploy.yml` continua sem depender dele

### Fase 3: o que não está escrito em lugar nenhum
- [x] Tarefa 4: README com setup e deploy
- [x] Tarefa 5: a regra de fluxo sai da memória pessoal e entra no `CLAUDE.md`

### Checkpoint: Completo
- [x] Todo item fechado tem commit citado no `SUGESTOES_ATUALIZADO.md`
- [x] `npm run check:full` limpo

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| O `preconnect` não compra nada mensurável | Baixo | Mede o handshake com `curl -w` antes; se der perto de zero, não sobe e fica registrado como testado-e-descartado |
| O health check bate num Render hibernado (plano grátis) e abre issue toda semana | Médio | Aceitar 200 **e** o tempo de acordar: uma tentativa, timeout largo, e falha só quando não responde |
| O `osv-scanner` semanal vira ruído que se aprende a ignorar | Médio | Abre issue (que fica), não falha o deploy; mesmo raciocínio do gitleaks `--staged` |
| README documentar comando que não existe | Baixo | Todo comando citado é rodado antes de entrar no arquivo |

## Perguntas em aberto

Nenhuma bloqueante. As que existem já estão no `SUGESTOES_ATUALIZADO.md` endereçadas ao dono e
este plano deliberadamente não as toca.
