# Mapa: banco de dados para economizar chamadas

Objetivo comum: guardar o que as licenças permitem, pôr em cache com prazo o que
só pode ser cache, e assim cortar chamadas às APIs — o Google primeiro.

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| store | Banco D1 + um helper `cached(chave, prazo, carregar)` usado pelas rotas | — |
| venues | Dados de venue (Wikidata, Wikipedia, OpenStreetMap) guardados; do Google só o place ID | store |
| google-on-click | Nota, reviews e fotos do Google só quando a pessoa clica | venues |
| commons-photos | Fotos do Wikimedia Commons (venues e artistas) guardadas com autor e licença | store |
| artists | Bio da Wikipedia e discos do MusicBrainz guardados | store |
| api-cache | setlist.fm e Ticketmaster em cache com prazo curto | store |

Ordem: store → venues → google-on-click → commons-photos → artists → api-cache.
`store` entra junto com `venues` (primeiro uso real); os outros ganham spec própria
quando chegar a vez deles.

Fora deste mapa (decidido em 2026-11-10): bio feita por IA (a da Wikipedia já pode
ser guardada). Conteúdo de visitantes (eu fui, notas, comentários) vem depois, junto
com a área do usuário.
