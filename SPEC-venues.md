# Spec: venues guardadas (módulos store + venues)

## Objetivo
Uma venue já visitada não chama de novo Wikidata, Wikipedia, OpenStreetMap nem a
busca do Google. Hoje esse cache vive na memória do Worker: some a cada isolate
novo e não é dividido entre eles, então na prática quase toda visita refaz tudo.

O que mais pesa é o Google: o teto diário (GetPlace 30, SearchText 150) já foi
atingido em 2026-11-10. Guardar o place ID para sempre (permitido pelos termos)
tira a busca (SearchText) de toda visita depois da primeira.

## O que é guardado, de onde e por quanto tempo
| Dado | Fonte | Licença | Prazo no banco |
|---|---|---|---|
| Descrição, link da Wikipedia | Wikipedia | CC BY-SA (crédito já exibido) | 30 dias |
| Coordenada, site oficial, endereço, ano de abertura, link do Wikidata | Wikidata | CC0 | 30 dias |
| Endereço, telefone, site, horário, acessibilidade, estacionamento, pagamento | OpenStreetMap | ODbL (crédito já exibido) | 30 dias |
| Place ID do Google | Google | termos permitem guardar indefinidamente | 365 dias |
| Detalhes, nota, reviews, fotos do Google | Google | não pode guardar | nunca — ao vivo, 1 GetPlace por visita |
| "Não achado" em Wikidata/OSM/Google | — | — | 7 dias (evita repetir buscas inúteis) |

O prazo não apaga nada: ele só marca quando vale checar de novo (Wikidata e OSM
são editados — venue muda de site, fecha, troca de nome). A checagem acontece na
primeira visita depois de vencer, nunca em rotina própria. Se a fonte responder
inteira, o valor é trocado; se falhar ou vier parcial, o valor antigo continua
servido e guardado, e a próxima visita tenta de novo. Sem valor antigo, resultado
parcial não é guardado, como já é hoje. (Decidido pelo dono em 2026-11-10.)

## Desenho
- Banco D1 `concertfyi`, uma tabela:
  ```sql
  CREATE TABLE store (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL);
  ```
- `server/store.js`: `cached(key, ttlSeconds, load, { keep })` — lê do D1; se não
  houver ou venceu, chama `load()` e guarda o resultado se `keep(resultado)`
  (padrão: sempre). Se `load()` lançar ou `keep` recusar e houver valor vencido,
  devolve o vencido sem apagá-lo. Sem binding (Node: dev e testes) cai
  num Map em memória, que é o comportamento de hoje. Falha do D1 nunca derruba a
  rota: vira chamada direta à fonte.
- `worker.mjs` entrega o binding em `app.locals.db`, como já faz com o KV.
- `venueInfo.js` e `venueServices.js` trocam os Maps em memória (`cache`,
  `osmCache`, `placeIds`) por `cached(...)`. A chave continua sendo nome +
  coordenada (+ cidade), igual a hoje.
- Nenhuma dependência nova: D1 é binding do Workers.

## Comandos
```
node --test                                   # todos os testes
npm run check:full                            # portão completo
cd server && npx wrangler d1 create concertfyi
cd server && npx wrangler d1 execute concertfyi --remote --file schema.sql
cd server && npx wrangler dev --port 8799     # D1 local para testar
```

## Testes
- `server/store.test.js`: guarda, devolve antes do prazo, recarrega depois,
  mantém o vencido quando `load` lança ou volta parcial, D1 com erro cai para a
  fonte.
- `venueServices.test.js` / `venueInfo.test.js`: com um D1 de mentira, a segunda
  visita à mesma venue faz 0 chamadas a Wikidata/Wikipedia/Overpass/SearchText
  e exatamente 1 GetPlace; o que fica guardado sob a chave do Google é só o ID.
- Ponta a ponta no `wrangler dev` com D1 local: duas visitas, contar chamadas.

## Limites
- Sempre: crédito de cada fonte continua exibido; prazo por fonte como na tabela.
- Perguntar antes: qualquer tabela além de `store`; guardar dado de setlist.fm
  ou Ticketmaster (é o módulo api-cache, spec própria).
- Nunca: guardar conteúdo do Google além do place ID.

## Critérios de sucesso
1. Segunda visita a uma venue (qualquer isolate): 0 SearchText, 0 Wikidata,
   0 Wikipedia, 0 Overpass, 1 GetPlace. Medido em teste e no `wrangler dev`.
2. Página de venue igual à de hoje para quem visita.
3. Node (`npm run dev`) e testes funcionam sem D1.
4. Plano grátis do D1 (5 mi leituras, 100 mil escritas/dia) folgado: ~4 escritas
   por venue nova.

## Decisão em aberto (ponytail × agent-skills — escolha do dono)
- **Recomendado (ponytail): tabela chave-valor única (`store`).** Uma tabela,
  um helper, serve venues, artistas e cache de API sem mudar esquema.
  Limite: não dá para consultar "todas as venues de Calgary" direto no banco.
- **Alternativa: tabela `venues` com colunas** (nome, cidade, endereço…).
  Permite busca e as páginas por caminho no futuro, mas é esquema e migração
  agora para uma necessidade que ainda não existe. Dá para criar depois, lendo
  do `store`.
