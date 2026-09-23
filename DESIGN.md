# DESIGN.md — Direção visual do ConcertFYI

Referência: Apple. O Swiper é o Cover Flow do iTunes, e é a única peça ousada do app;
todo o resto fica quieto em volta dele. Aprovado pelo dono em 2026-09-23.

## Cor

Só tokens padrão do Tailwind. Nada de hex novo.

| Papel             | Token      | Hex     | Equivalente Apple     |
| ----------------- | ---------- | ------- | --------------------- |
| Palco             | `black`    | #000000 | fundo do Cover Flow   |
| Página            | `white`    | #FFFFFF | apple.com             |
| Faixa alternada   | `zinc-100` | #F4F4F5 | #F5F5F7               |
| Texto             | `zinc-900` | #18181B | #1D1D1F               |
| Texto secundário  | `zinc-500` | #71717A | #6E6E73               |
| Acento            | `red-600`  | #DC2626 | vermelho Apple Music  |

- Cinza é sempre `zinc-*`. `gray-*` não entra.
- O vermelho fica em `red-600` e não no #FA2D48 do Apple Music: aquele dá 3,6:1 sobre
  branco e derruba a acessibilidade 100.
- Um vermelho de ação por tela. Hover e link vão para `zinc-900`, não para vermelho.

## Tipografia

- DM Sans continua. SF Pro não pode ser hospedada, e `system-ui` viraria três apps
  diferentes (SF, Segoe, Roboto).
- Títulos `font-semibold` + `leading-tight`. Display na escala padrão: `text-5xl`,
  `text-7xl`, `text-9xl` (teto 128 px). Corpo `text-base`/`text-lg` em `zinc-900`.
- `tracking-tight` liberado só em display (`text-5xl` para cima) — exceção à
  baseline-ui, decidida em 2026-09-23 porque é o que dá o ar Apple ao título grande.
- Sem `text-shadow`. Sem tamanho arbitrário (`text-[270px]`).
- Parágrafo com `text-pretty` e no máximo ~65 caracteres por linha.
- Número em lista, data e setlist com `tabular-nums`.

## Layout

Faixas de largura total alternando `white` e `zinc-100`, conteúdo numa coluna central de
até ~980 px. Seção se separa por fundo e espaço, não por `<hr>`, borda ou divisória.

```
HOME                                   ARTISTA
┌──────────────────────────────┐       ┌──────────────────────────────┐
│██████ palco preto ███████████│       │  Nome do Artista  (7xl, ctr) │
│   ◢▣  ◢▣  [ ▣ ]  ▣◣  ▣◣      │       │  foto 16:9                   │
│        reflexo               │       ├──────── zinc-100 ────────────┤
│   Artista · cidade  (branco) │       │ Setlist          │ Próximos  │
│   ━━━━━━━━ scrollbar ━━━━━━  │       │ (esq, tabular)   │ shows     │
├──────────── white ───────────┤       ├──────── white ───────────────┤
│  Upcoming (esq)  │  Near you │       │  Past concerts (esq)         │
└──────────────────────────────┘       └──────────────────────────────┘
```

Título de seção e palco centralizados; lista, setlist e data alinhados à esquerda.

## Princípios

1. A foto do artista é o produto; a interface recua.
2. Um palco escuro só — o do Cover Flow. O resto do app é claro.
3. Hierarquia por tamanho e peso, não por cor, borda ou sombra.
4. Movimento só em resposta ao usuário.

## Exceções à baseline-ui

- `tracking-tight` em display (ver Tipografia).
- Máscara em gradiente no reflexo do Swiper (`Swiper.css`): o reflexo é o Cover Flow.
  Gradiente continua vetado em qualquer outro lugar.

## Ordem de entrega (um commit por passo)

1. `gray-*` → `zinc-*`.
2. Palco preto no Swiper.
3. Escala tipográfica em About, Contact e SearchPage.
4. Home em faixas no lugar do `<hr>` e da divisória.
5. Página de artista no mesmo ritmo.
6. Passada no acento: um vermelho de ação por tela.
