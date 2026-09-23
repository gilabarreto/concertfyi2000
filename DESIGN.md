# DESIGN.md — Direção visual do ConcertFYI

Referência: Apple. O Swiper é o Cover Flow do iTunes. Aprovado pelo dono em 2026-09-23.

A marca é a moldura vermelha (`bg-red-600` em Navbar, Footer e fundo) com as chaves `{ }`
(logo, laterais, setas do Swiper). Ela fica: é a peça ousada. Por isso o palco do Cover
Flow é `zinc-100` e não preto — preto somaria um terceiro bloco forte ao vermelho e ao
branco. Ideia do dono em 2026-09-23.

## Cor

Só tokens padrão do Tailwind. Nada de hex novo.

| Papel             | Token      | Hex     | Equivalente Apple     |
| ----------------- | ---------- | ------- | --------------------- |
| Moldura (marca)   | `red-600`  | #DC2626 | —                     |
| Página            | `white`    | #FFFFFF | apple.com             |
| Palco / faixa     | `zinc-100` | #F4F4F5 | #F5F5F7               |
| Texto             | `zinc-900` | #18181B | #1D1D1F               |
| Texto secundário  | `zinc-500` | #71717A | #6E6E73               |
| Acento            | `red-600`  | #DC2626 | vermelho Apple Music  |

- Cinza é sempre `zinc-*`. `gray-*` não entra.
- O vermelho fica em `red-600` e não no #FA2D48 do Apple Music: aquele dá 3,6:1 sobre
  branco e derruba a acessibilidade 100.
- O vermelho continua em links, ações, setas de expandir e ícones das linhas; hover escurece
  para `red-800`. Tirar vermelho das setas e ícones foi testado e recusado pelo dono em
  2026-09-23.

## Tipografia

- DM Sans continua. SF Pro não pode ser hospedada, e `system-ui` viraria três apps
  diferentes (SF, Segoe, Roboto).
- Títulos `font-semibold` + `leading-tight`. Display na escala padrão: `text-5xl`,
  `text-7xl`, `text-9xl` (teto 128 px). Corpo `text-base`/`text-lg` em `zinc-900`.
- `tracking-tight` liberado só em display (`text-5xl` para cima) — exceção à
  baseline-ui, decidida em 2026-09-23 porque é o que dá o ar Apple ao título grande.
- Sem `text-shadow`. Sem tamanho arbitrário (`text-[270px]`).
- Exceção ao teto: a marca de página (`{fyi}` no About, envelope no Contact) usa
  `text-[10rem]`, a pedido do dono em 2026-09-23. A escala de fonte do Tailwind
  para no `text-9xl` (8rem); 10rem é o degrau `40` da escala de espaçamento, o primeiro
  valor padrão acima dos 20% pedidos (9,6rem). É logo, não
  texto; nada mais passa de `text-9xl`.
- Parágrafo com `text-pretty` e no máximo ~65 caracteres por linha.
- Número em lista, data e setlist com `tabular-nums`.

## Layout

Faixas de largura total alternando `white` e `zinc-100`, conteúdo numa coluna central de
até ~980 px. Seção se separa por fundo e espaço, não por `<hr>`, borda de card ou sombra.
Linha fina (1 px, `zinc-300`) entre colunas e entre itens de lista fica — é o que a Apple
faz, e a do `.artist-card-grid` foi ajustada pelo dono em `d4acfc0`.

```
HOME                                   ARTISTA
┌──────────────────────────────┐       ┌──────────────────────────────┐
│░░░░░░ palco zinc-100 ░░░░░░░░│       │  Nome do Artista  (7xl, ctr) │
│   ◢▣  ◢▣  [ ▣ ]  ▣◣  ▣◣      │       │  foto 16:9                   │
│        reflexo               │       ├──────── zinc-100 ────────────┤
│   Artista · data @ local     │       │ Setlist          │ Próximos  │
│   ━━━━━━━━ scrollbar ━━━━━━  │       │ (esq, tabular)   │ shows     │
├──────────── white ───────────┤       ├──────── white ───────────────┤
│  Upcoming (esq)  │  Near you │       │  Past concerts (esq)         │
└──────────────────────────────┘       └──────────────────────────────┘
```

Título de seção e palco centralizados; lista, setlist e data alinhados à esquerda.

## Princípios

1. A foto do artista é o produto; a interface recua.
2. A ousadia é a moldura vermelha com as chaves. Dentro dela, tudo claro e quieto.
3. Hierarquia por tamanho e peso, não por cor, borda ou sombra.
4. Movimento só em resposta ao usuário.

## Exceções à baseline-ui

- `tracking-tight` em display (ver Tipografia).
- Máscara em gradiente no reflexo do Swiper (`Swiper.css`): o reflexo é o Cover Flow.
  Gradiente continua vetado em qualquer outro lugar.
  Palco da página de artista tingido com as cores da foto (estilo Apple Music) foi
  testado e recusado pelo dono em 2026-09-23: fica `zinc-100`.

## Ordem de entrega (um commit por passo)

1. `gray-*` → `zinc-*`.
2. Palco `zinc-100` no Swiper (feito).
3. Escala tipográfica em About, Contact e SearchPage (feito).
4. Home em faixas — coberto pelo passo 2 (o `<hr>` saiu com o palco); a divisória entre
   colunas fica, ver Layout.
5. Página de artista no mesmo ritmo (feito: ArtistInfo no palco `zinc-100`).
6. ~~Passada no acento: um vermelho de ação por tela.~~ Recusado pelo dono em 2026-09-23.
