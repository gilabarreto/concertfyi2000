# Estatísticas de tour para retomar depois

O card Tour Statistics foi retirado da ArtistPage por decisão do dono. A proposta atual mantém o mapa da tour acessível pelo nome da tour e mostra abaixo a legenda Past/Upcoming com contagens e datas disponíveis.

## Informações adiadas

- Countries e Cities: locais distintos dos shows passados.
- Songs per show: média de músicas executadas por show com setlist preenchido.
- Most played: música mais recorrente e frequência.
- Usual opener e Usual closer: abertura e encerramento mais frequentes.
- Played only once: músicas executadas uma única vez na amostra.

A implementação anterior (o card `TourStats.jsx` e `getTourStats` com o teste) foi apagada em 2026-10-02 e está no histórico do git: `git show ceab820` traz a versão original. A rota `/api/setlist/tour` e o `useTourSetlists` continuam, porque o mapa da tour usa os dois.

## Limites para uma futura retomada

A rota `/api/setlist/tour` consulta até cinco páginas (100 shows); números e datas representam a amostra recebida, não necessariamente a tour completa. Música marcada como tape não conta como execução. Não atribuir automaticamente todos os eventos futuros do artista na Ticketmaster à tour selecionada: o vínculo precisa estar confirmado. Contagens devem incluir shows sem coordenadas; o mapa só pode marcar coordenadas válidas. Não inventar data, local ou pertencimento à tour quando a fonte não fornecer.

No Next Concert, o nome de tour existente vem do último show passado do artista (a Ticketmaster não fornece esse vínculo). O link mostra o mapa dessa tour conhecida, sem adicionar automaticamente o próximo evento à contagem.

Os mapas da tour usam a mesma proporção dos mapas de localização, com legenda fora da área do mapa. As marcações passadas abrem o show selecionado em Last Concert. Marcações futuras abrem Next Concert com correspondência única na Ticketmaster: artista e data, priorizando cidade/venue exatos e aceitando cidade ou venue iguais, ou coordenadas até 25 km; países conhecidos diferentes são rejeitados. Diferenças de maiúsculas no nome da tour não separam uma mesma tour; sem correspondência, Next Concert usa data, local e tour do setlist.fm, sem oferecer ingressos de uma fonte que não listou esse show. A URL preserva o show para recarregar e compartilhar. A legenda reúne Dates, Past e Upcoming na mesma linha.
