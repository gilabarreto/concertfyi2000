# Spec: Google só no clique (módulo google-on-click)

> **Revisado pelo dono em 2026-11-11:** nota, reviews e campos do Google voltaram a carregar
> ao abrir a página. Medido em 12 venues de Calgary: sem o Google, só 2 tinham About
> (Wikipedia) e metade não tinha telefone nem site no OpenStreetMap. Só as **fotos** ficam no
> clique. Custo por visita: 1 GetPlace (teto 30/dia); fotos 3/6 GetPhotoMedia por clique.

## Objetivo

Abrir uma página de venue não gasta nenhuma chamada do Google. Hoje toda visita gasta
1 GetPlace (teto 30/dia) e 3 ou 6 GetPhotoMedia (teto 30/dia — umas 5 visitas no desktop
esgotam o dia). Depois desta mudança só gasta quem pede: um clique num botão.

## O que muda para quem visita

Ao abrir a página: nome, descrição, endereço, site, telefone, horário e mapa vêm de
Ticketmaster, Wikidata, Wikipedia e OpenStreetMap — todos já guardados no D1
(SPEC-venues.md). Dois botões, um em cada lugar (decidido pelo dono em 2026-11-11:
quem só quer a nota não gasta a cota de fotos, que é a que acaba primeiro):

- No lugar dos cards Rating e Reviews: "Show Google rating and reviews". Ao clicar, nota,
  reviews e os campos do Google (que completam os do OSM, como hoje) aparecem como hoje.
- No card Photos: "Show Google photos". Ao clicar, a primeira página de fotos aparece como
  hoje; paginar continua gastando chamada por página.

Se o Google estiver fora ou o teto do dia acabou: no lugar do card clicado,
"Google information is unavailable right now."

## Custo por visita

| | Hoje | Depois |
|---|---|---|
| Abriu a página | 1 GetPlace + 3/6 GetPhotoMedia (+ SearchText na 1ª vez) | 0 Google |
| Clicou em nota/reviews | — | 1 GetPlace (+ SearchText se o place ID não estiver no D1) |
| Clicou em fotos | — | 1 GetPlace (só IDs das fotos) + 3/6 GetPhotoMedia |

Clicar nos dois gasta 2 GetPlace contra o teto, um a mais que hoje — o preço de não
gastar fotos de quem não pediu.

## Desenho

- `server/routes/venueServices.js`: `/venue-services` só chama o Google com `google=true`.
  Sem ele, devolve OSM sozinho (`providers.google: "skipped"`). A primeira página de fotos
  sai de `/venue-services` (o `limit` de `b91053e` é apagado); fotos voltam a vir só de
  `/venue-photos`, que já existe. O place ID continua no D1 por 365 dias.
- `client`: `VenuePage.jsx` faz duas queries de `useVenueServices` — a da carga (sem
  Google) e a do clique em nota/reviews (com Google, `enabled` só depois do clique).
  `VenuePhotos.jsx` só liga `useVenuePhotos` depois do seu clique. Os campos do Google,
  quando chegam, passam por cima dos do OSM como hoje. Nada do Google é guardado no
  navegador além do que já é (`gcTime: 0`).
- Os botões ficam dentro dos componentes que já existem; nada de componente novo se não
  encurtar o código.
- Textos novos em `locales/{pt,es,fr}.json`.

## Testes

- `venueServices.test.js`: sem `google=true`, 0 chamadas a `places.googleapis.com`;
  com ele, 1 GetPlace e 0 GetPhotoMedia.
- Manual no `npm run dev`: abrir uma venue → nenhuma chamada Google no log do servidor;
  clicar em cada botão → só a chamada daquele botão aparece no log.

## Limites

- Sempre: crédito do Google exibido junto do conteúdo do Google, como hoje.
- Perguntar antes: carregar fotos do Google sem clique.
- Nunca: guardar conteúdo do Google (nem no D1, nem no navegador além da exibição).

## Critérios de sucesso

1. Abrir uma página de venue: 0 chamadas ao Google (teste + log).
2. Clicar nos dois: a página fica igual à de hoje.
3. Sem botão clicado, mapa e endereço continuam aparecendo (Ticketmaster → Wikidata →
   OSM → centro da cidade).

## Decisões

1. Dois botões (nota+reviews; fotos) — escolha do dono em 2026-11-11.
2. Fotos por clique: 3 no celular, 6 no desktop, como hoje (recomendação; o dono não
   pediu outra coisa). 3 em todos dobraria os cliques que cabem no teto do desktop.
3. Quando o módulo commons-photos entrar, o card Photos volta a mostrar fotos sem clique,
   do Commons; o botão fica só para as do Google. Fica para aquela spec.
