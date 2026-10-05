> O API Lab (`/api-lab`) saiu do app em 2026-10-02: cumpriu o papel de comparar fontes. O código continua no git — `git show 5445fdc` mostra a última versão, e `git checkout 5445fdc -- client/src/pages/ApiLab.jsx server/routes/apiLab.js` traz de volta. Catálogo e receitas de cada chamada em [docs/API_LAB_REFERENCIA.md](API_LAB_REFERENCIA.md). As menções a `/api-lab` abaixo são históricas.

# APIs, origem dos dados e oportunidades do ConcertFYI

Revisão: **01/10/2026**. Documento de trabalho para comparar fontes, revisar decisões e propor integrações. A conversa com outra IA e o PDF de pôsteres são referências de pesquisa, não confirmação de acesso, preço ou cobertura. O código atual define a origem dos dados; documentação oficial define as condições externas, que devem ser conferidas novamente antes de contratar/publicar uma integração.

## Como usar este inventário

O API Lab e este documento usam os mesmos catálogos: `client/src/data/apiCatalog.json` e `client/src/data/apiProvenance.json`. Atualize ambos ao mudar uma integração; a árvore detalhada está no Lab em “Origem das informações”. **Produção** significa usado pelo código público, não aprovação de todos os termos comerciais. **Laboratório** significa consulta experimental isolada. **Pesquisa** significa candidato sem chamada automática/endpoint público confirmado.

Dois terminais:

```bash
# Terminal 1
cd server
npm run dev
# Terminal 2
cd client
npm run dev
```

Abra `/api-lab` na URL **Local** impressa pelo Vite (configurada inicialmente em `http://localhost:3000/api-lab`; se a porta estiver ocupada, use a porta realmente impressa). Express atende `http://localhost:4000/api/api-lab?source=jambase`, somente com `API_LAB_ENABLED=true`; `/api-lab` não é uma página do Express. Vite deve manter proxy `/api/`. O Lab usa a base configurada em `VITE_API_BASE`; sem ela, usa o proxy local. No site publicado, a página `/api-lab` também está disponível, mas as consultas exigem `API_LAB_TOKEN` no servidor e a senha correspondente no campo Password, enviada pelo header `x-api-lab-token`.

Nenhuma consulta de música/eventos é disparada ao abrir o Lab. Test API consulta somente a fonte selecionada, salvo dependência identificada (Event Art precisa do setlist para achar o evento; Cover Art precisa do release group). Test all pode consumir cotas e gerar cobrança nos planos contratados. Inspect response abre o JSON já recebido em outra aba, sem nova consulta. O Lab também está disponível na rota `/api-lab` do site. No servidor publicado, `API_LAB_TOKEN` habilita a API e exige a senha enviada no header `x-api-lab-token`, nunca na URL. O campo de senha usa sessionStorage; a página marca noindex. Credenciais de provedores continuam exclusivamente no servidor. Sem token no ambiente local, não há exigência de senha. Resultados ficam apenas na sessão da página. Chaves de servidor não são retornadas no JSON e URLs com credenciais são mascaradas.

Os testes legados usam Foo Fighters/MBID `67f66c07-6e61-4026-ade5-7e782fad3a5d`. Novos testes: JamBase/PredictHQ/SeatGeek pesquisam Sepultura; Ticketmaster Events pesquisa Foo Fighters no Brasil; Photon pesquisa São Paulo; LRCLIB pesquisa Everlong. Bandsintown pesquisa **somente BANDSINTOWN_ARTIST autorizado**, sem presumir permissão global. Sympla e Eventbrite testam catálogo da organização autenticada, sem filtrar artificialmente por artista. Esses cenários iniciais não são um benchmark equivalente nem comprovação de cobertura brasileira; a próxima rodada deve comparar os mesmos artistas/cidades/períodos quando houver credenciais.

## Árvore atual

```text
ConcertFYI
├── Home e busca
│   ├── Ticketmaster → atrações, shows futuros, ingressos e imagens
│   ├── setlist.fm → identidade do artista, shows passados e músicas
│   └── Localização → seleção manual / navegador → Nominatim; busca → Photon
├── ArtistPage
│   ├── ArtistInfo → Ticketmaster + TheAudioDB (fotos); Wikipedia (bio)
│   ├── Last / Past / Setlists → setlist.fm
│   ├── Next / Upcoming / Nearby → Ticketmaster
│   ├── Mapas → Google Maps; coordenadas da fonte do concerto
│   ├── SongDetails → LRCLIB (letra) + YouTube (vídeo)
│   ├── Top Tracks → link Ticketmaster → Spotify embed
│   ├── Create Playlist → OAuth e Web API Spotify
│   └── Keep Listening → MusicBrainz → Cover Art Archive; link Amazon gerado
├── Share / SEO → dados derivados do concerto; preview com imagem de fallback
├── Contact → Formspree (envio, não catálogo musical)
└── API Lab → fontes anteriores + candidatos; Event Art fora da ArtistPage
```

Favoritos, avaliações, comentários locais e presença não são dados de APIs de shows. Links para hotéis, calendários e busca SeatGeek não são consultas de disponibilidade/preço. Não há banco de concertos nem agregação automática entre novos provedores.

## Mapa detalhado: campo → fonte → fallback → proposta

### Home → carrossel

- **Fonte:** Ticketmaster.
- **Informações:** Artista, imagem promocional, data, local e link de evento próximos da localização selecionada.
- **Fallback atual:** Localização manual → geolocalização → Vancouver no hook. Imagem escolhida entre imagens TM; sem segundo provedor de shows.
- **Opção a avaliar (não implementada):** JamBase e parceiros brasileiros; medir cobertura antes de agregar.
- **Código:** `client/src/components/Swiper.jsx`, `client/src/hooks/useGeolocation.js`, `client/src/api/api.js`.

### Home → listas de concertos

- **Fonte:** Ticketmaster.
- **Informações:** Eventos, data, cidade e local; Home configura Calgary fixo, diferente do carrossel.
- **Fallback atual:** Sem segundo provedor. Estado vazio/erro.
- **Opção a avaliar (não implementada):** Unificar localização efetiva; comparar fontes BR.
- **Código:** `client/src/pages/Home.jsx`, `client/src/components/ArtistPage/UpcomingConcerts.jsx`.

### Busca e identidade do artista

- **Fonte:** setlist.fm + Ticketmaster.
- **Informações:** Nome, MBID, concertos passados e atrações TM; correspondência por nome.
- **Fallback atual:** Falha de uma fonte pode deixar a outra disponível; ausência de setlist não reconstrói histórico.
- **Opção a avaliar (não implementada):** Identidade por MusicBrainz MBID + tabela de IDs por provedor.
- **Código:** `client/src/api/queries.js`, `server/routes/setlist.js`, `server/routes/ticketmaster.js`.

### ArtistInfo → fotos

- **Fonte:** Ticketmaster + TheAudioDB.
- **Informações:** Foto inicial TM e fotos TheAudioDB com validação por MBID.
- **Fallback atual:** Alternativas das imagens disponíveis; imagens quebradas são descartadas; sem fotos mostra aviso.
- **Opção a avaliar (não implementada):** Commons via entidade verificada e licença por arquivo.
- **Código:** `client/src/components/ArtistPage/ArtistPhotos.jsx`, `server/routes/audiodb.js`.

### ArtistInfo → biografia

- **Fonte:** Wikipedia.
- **Informações:** Resumo, título e link canônico.
- **Fallback atual:** Tentativas com sufixos band/musician/singer/rapper; rejeita páginas não musicais/desambiguação; sem segundo provedor.
- **Opção a avaliar (não implementada):** TheAudioDB por MBID (já retorna biografia no Lab), ou Wikipedia em outro idioma via Wikidata.
- **Código:** `client/src/components/ArtistPage/ArtistInfo.jsx`, `server/routes/wikipedia.js`.

### ArtistInfo → gêneros e redes sociais

- **Fonte:** Ticketmaster.
- **Informações:** Genre/subGenre e externalLinks; Wikipedia vem do resumo editorial.
- **Fallback atual:** Filtra Undefined; links ausentes não aparecem. Sem fallback externo.
- **Opção a avaliar (não implementada):** MusicBrainz/Wikidata para IDs e links oficiais; gêneros de outra fonte precisam de aprovação.
- **Código:** `client/src/components/ArtistPage/ArtistInfo.jsx`.

### Last Concert / Past Concerts

- **Fonte:** setlist.fm.
- **Informações:** Data, tour, venue, cidade, país e coordenadas da cidade.
- **Fallback atual:** Sem segunda fonte de histórico. Review e I was there são localStorage, não API.
- **Opção a avaliar (não implementada):** Songkick/JamBase para datas conforme licença; não substituem músicas tocadas.
- **Código:** `client/src/components/ArtistPage/LastConcert.jsx`, `client/src/components/ArtistPage/PastConcerts.jsx`.

### Next Concert / Upcoming Concerts

- **Fonte:** Ticketmaster.
- **Informações:** Data/hora publicada, venue, cidade/país, coordenadas do venue, preço e URL.
- **Fallback atual:** Sem segunda API. Tour pode vir do último setlist e não comprova tour futura; preço ausente vira Check price.
- **Opção a avaliar (não implementada):** JamBase primeiro; Sympla/Ingresse com parcerias locais. Não inventar horários/doors.
- **Código:** `client/src/components/ArtistPage/NextConcert.jsx`, `client/src/components/ArtistPage/UpcomingConcerts.jsx`.

### Setlists → músicas e Concert date

- **Fonte:** setlist.fm.
- **Informações:** Músicas, ordem, encore, data do setlist e detalhes de execução.
- **Fallback atual:** Sem segunda fonte das músicas daquela apresentação; aviso vazio.
- **Opção a avaliar (não implementada):** Preservar ausência. Bases de ingressos não permitem deduzir setlist.
- **Código:** `client/src/components/ArtistPage/Setlist.jsx`.

### SongDetails → letras

- **Fonte:** LRCLIB.
- **Informações:** plainLyrics por artista e faixa.
- **Fallback atual:** Lookup exato; não usa busca alternativa automaticamente.
- **Opção a avaliar (não implementada):** /api/search com artista/título/duração validados; diferenciar letra sincronizada.
- **Código:** `client/src/components/SongDetails.jsx`, `server/routes/lyrics.js`.

### SongDetails → vídeos

- **Fonte:** YouTube Data API.
- **Informações:** Busca de artista/faixa official video.
- **Fallback atual:** Sem segundo provedor; vazio/erro. Não garante gravação daquele concerto.
- **Opção a avaliar (não implementada):** Link do canal oficial TM; pesquisa live somente com rótulo e correspondência explícitos.
- **Código:** `server/routes/youtube.js`, `client/src/components/SongDetails.jsx`.

### Spotify player

- **Fonte:** Link Spotify da Ticketmaster → embed Spotify.
- **Informações:** Player incorporado pelo externalLink da atração; não há lookup Spotify automático para isso.
- **Fallback atual:** Aviso quando não existe link.
- **Opção a avaliar (não implementada):** MusicBrainz URL relations/Wikidata Spotify ID, com identidade verificada e sem nova chave.
- **Código:** `client/src/pages/ArtistPage.jsx`, `client/src/components/ArtistPage/Player.jsx`.

### Create Spotify Playlist

- **Fonte:** OAuth Spotify + Web API.
- **Informações:** Busca faixas, cria playlist do usuário e adiciona músicas reconhecidas.
- **Fallback atual:** Faixas sem correspondência são puladas; sem outra plataforma.
- **Opção a avaliar (não implementada):** Exibir contagem das faixas não encontradas; acompanhar quota/modo do app.
- **Código:** `client/src/helpers/spotifyPlaylist.js`, `server/routes/spotify.js`.

### Keep Listening → álbuns e capas

- **Fonte:** MusicBrainz → Cover Art Archive.
- **Informações:** Release groups de álbuns de estúdio, título/ano e capa; até 6 álbuns recentes.
- **Fallback atual:** Sem outro catálogo; álbum com capa quebrada é ocultado. Amazon é link de busca gerado, não API de preço.
- **Opção a avaliar (não implementada):** Placeholder de capa; catálogo Apple/Spotify se acesso/licença justificarem.
- **Código:** `server/routes/albums.js`, `client/src/components/ArtistPage/Albums.jsx`.

### Localização → busca e cidade

- **Fonte:** Photon + geolocalização do navegador + Nominatim.
- **Informações:** Photon busca cidades; Nominatim resolve coordenadas em cidade/país; seleção/cache locais.
- **Fallback atual:** Geolocalização/lookup indisponível → Vancouver no hook.
- **Opção a avaliar (não implementada):** Photon reverse como alternativa existente; não usar Nominatim para autocomplete.
- **Código:** `client/src/components/LocationSelector.jsx`, `client/src/hooks/useGeolocation.js`.

### Mapas → Last/Next Concert

- **Fonte:** Google Maps + coordenadas setlist.fm/Ticketmaster.
- **Informações:** Mapa Google; Last pode localizar cidade, Next usa venue.
- **Fallback atual:** Sem mapa alternativo automático; coordenadas ausentes impedem mapa.
- **Opção a avaliar (não implementada):** Link OpenStreetMap sem SDK/chave; Leaflet + tiles apenas com atribuição e política de uso.
- **Código:** `client/src/components/ArtistPage/LastConcert.jsx`, `client/src/components/ArtistPage/NextConcert.jsx`.

### Ingressos, hotéis, calendários e logos

- **Fonte:** Links gerados + Google favicon.
- **Informações:** Ticketmaster fornece URL/preço quando disponível. SeatGeek, Booking/Expedia/Vrbo e calendários são URLs geradas.
- **Fallback atual:** Não há API de disponibilidade de hotéis nem preços SeatGeek. Logos podem depender do favicon Google.
- **Opção a avaliar (não implementada):** Feeds afiliados autorizados; não apresentar preço/estoque sem fonte.
- **Código:** `client/src/components/ArtistPage/VendorTiles.jsx`, `client/src/components/ArtistPage/NextConcert.jsx`.

### Share / SEO / favoritos / avaliações

- **Fonte:** Dados derivados de setlist.fm e Ticketmaster + armazenamento local.
- **Informações:** Metadados do show e imagem de compartilhamento; favoritos/reviews/going são locais.
- **Fallback atual:** Imagem de artista disponível como fallback do preview; não é pôster oficial.
- **Opção a avaliar (não implementada):** Separar provenance do show e imagem; persistência de usuário é projeto próprio, não fallback de API.
- **Código:** `server/routes/share.js`, `client/src/helpers/concertReviews.js`.

### Contact

- **Fonte:** Formspree.
- **Informações:** Envio de formulário; não fornece informações musicais.
- **Fallback atual:** Feedback de sucesso/erro do envio; sem segunda API.
- **Opção a avaliar (não implementada):** Manter fora da agregação de shows.
- **Código:** `client/src/pages/Contact.jsx`.

### API Lab → arte e pesquisa

- **Fonte:** MusicBrainz Event → Event Art Archive; Commons/Wikidata/Archive/GitHub.
- **Informações:** Arte de evento, imagens, IDs e datasets exploratórios; fora da ArtistPage.
- **Fallback atual:** Evento precisa corresponder por artista/data/local; sem poster aprovado retorna vazio.
- **Opção a avaliar (não implementada):** Só considerar imagem TM do evento com correspondência exata; nunca capa de álbum ou foto genérica como pôster.
- **Código:** `server/routes/apiLab.js`, `server/routes/eventArt.js`.

## Catálogo de fontes

As páginas oficiais estão linkadas por fonte. “Brasil a medir” significa ausência de benchmark, não ausência de suporte. Não atribuímos notas de cobertura sem dados.

| Fonte | Situação no código | Acesso/custo | Cobertura e oportunidade |
| --- | --- | --- | --- |
| [setlist.fm](https://api.setlist.fm/docs/1.0/index.html) | Produção | Gratuito não comercial; revisar licença comercial | Histórico e músicas, inclusive Brasil. Sem segunda fonte de músicas tocadas. Songkick/JamBase podem complementar datas, não setlists. |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | Produção | Aberto; identificar app e limitar a 1 chamada/s | Identidade, discografia e eventos globais. Usar MBID para reconciliar identidades; não confundir MBID do artista com o do evento. |
| [Event Art Archive](https://musicbrainz.org/doc/Event_Art_Archive/API) | Laboratório | Sem nova chave; licença por imagem | Pôsteres comunitários; cobertura variável. Aceitar apenas evento único e Poster aprovado; não substituir por foto genérica. |
| [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive/API) | Produção | Sem nova chave; direitos das capas permanecem | Capas por release group. Álbuns sem capa hoje desaparecem; considerar placeholder antes de outra API. |
| [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | Produção | Chave e cotas da conta | Eventos futuros, ingressos, imagens; Brasil a medir. Comparar eventos BR com JamBase. Feed pode oferecer URLs de afiliado se a conta for habilitada. |
| [TheAudioDB](https://www.theaudiodb.com/free_music_api) | Produção | Plano gratuito para desenvolvimento; revisar termos | Fotos e biografias por MBID. Biografia pode ser fallback do Wikipedia, após validação de identidade e termos. |
| [Last.fm](https://www.last.fm/api) | Laboratório | Chave; uso comercial exige consulta aos termos | Tags e artistas semelhantes globais. Recomendações; não substitui histórico de shows. |
| [ListenBrainz](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html) | Laboratório | Aberto; algumas operações exigem token | Audições e popularidade musical. Recomendar gravações sem depender de Spotify; não medir público de shows. |
| [YouTube Data API](https://developers.google.com/youtube/v3) | Produção | Chave e quota | Vídeos globais. Distinguir videoclipe de gravação daquele show; link do canal oficial pode ser fallback. |
| [AcoustID](https://acoustid.org/webservice) | Laboratório | Chave e fingerprint; uso não comercial | Identificação de áudio. Somente útil se passarmos a identificar arquivos de áudio. |
| [Apple Music / MusicKit](https://developer.apple.com/documentation/applemusicapi) | Laboratório | Developer token e condições Apple | Metadados e artwork. Alternativa de catálogo, sem cobertura de shows. |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api) | Produção | OAuth e restrições de quota/modo | Player por link; playlists autorizadas. Buscar link oficial via MusicBrainz/Wikidata se Ticketmaster não o informar. |
| [Songkick](https://app.songkick.com/developer) | Laboratório | Licença paga; sem aprovação hobby/estudantil | Passado e futuro globais; Brasil a medir. Preço deve ser cotado; não assumir US$500. Teste atual pesquisa identidade do artista. |
| [My Show Poster](https://myshowposter.com/) | Pesquisa | API pública não confirmada | Pôsteres. Referência visual; sem integração automática documentada. |
| [Concert Collect](https://concertcollect.com/) | Pesquisa | API pública não confirmada | Pôsteres. Investigar autorização/feed; não tratar site como API. |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:API) | Laboratório | Licença e atribuição por arquivo | Fotos globais. Relacionar artista/local por identidade verificada; buscar nome não valida imagem. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Laboratório | Dados estruturados abertos | Identificadores globais. Links oficiais Spotify/Wikipedia e relações por MBID. |
| [Wikipedia REST API](https://www.mediawiki.org/wiki/Wikimedia_REST_API) | Produção | Atribuição/licença editorial | Biografia global. Já tenta sufixos musicais; fallback gratuito proposto via Wikidata ou TheAudioDB. |
| [Internet Archive](https://archive.org/developers/) | Laboratório | Direitos variam por item | Acervos globais. Conferir artista/data/local e licença antes de exibir pôster. |
| [GitHub / datasets](https://docs.github.com/en/rest/search/search) | Laboratório | API com limites; licença por repositório | Datasets exploratórios. Não é uma base uniforme de shows; conferir qualidade, atualização e licença. |
| [Ticketmaster · eventos no Brasil](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | Laboratório | Chave existente; quota da conta | Próximos shows BR por artista. Comparar Foo Fighters e Sepultura; não assumir catálogo completo. |
| [JamBase](https://data.jambase.com/products) | Laboratório | Developer não comercial: 1.000/mês, depois US$0,05/chamada | Futuro até 6 meses no plano Developer; Brasil a medir. Preços e acesso ao histórico diferem entre páginas oficiais: confirmar contrato antes de integrar. |
| [Bandsintown](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) | Laboratório | Acesso aprovado; chave normalmente vinculada a um artista | Próximos shows globais; Brasil a medir. Agregador requer autorização/parceria; configurar somente artista autorizado. |
| [PredictHQ](https://docs.predicthq.com/api/events/search-events) | Laboratório | Trial e planos comerciais; free tier permanente não confirmado | Concertos BR conforme cobertura da assinatura. Retorno vazio pode significar falta de cobertura contratada. |
| [SeatGeek API](https://seatgeek.github.io/) | Laboratório | Credenciais e contrato a confirmar | Concertos; cobertura BR não comprovada. Hoje o site usa link de busca SeatGeek, sem esta API. |
| [Sympla 🇧🇷](https://developers.sympla.com.br/) | Laboratório | Token do produtor; custo/contrato a confirmar | Eventos do produtor autenticado, não catálogo global. Parcerias com produtores locais; somente dados públicos dos eventos. |
| [Eventbrite](https://www.eventbrite.com/platform/new/api) | Laboratório | Token e organização autorizada | Eventos da organização; busca global encerrada em 2019. Não usar /events/search como fallback de discovery. |
| [Ingresse 🇧🇷](https://developer.ingresse.com/docs/partner-reports/events) | Pesquisa | Onboarding, host e credenciais de parceiro | Eventos da organização, com poster, datas e local. Priorizar parceria Brasil; sem endpoint global público confirmado. |
| [Ticketmaster Discovery Feed](https://developer.ticketmaster.com/products-and-docs/apis/discovery-feed/) | Pesquisa | Chave; afiliados dependem de habilitação | Arquivos por país. Avaliar ingestão agendada e licença; Lab não baixa arquivos grandes. |
| [Eventim Brasil](https://www.eventim.com.br/) | Pesquisa | Feed/API comercial não confirmados | Potencial parceiro Brasil. Consultar parceria e feed autorizado; não inventar endpoint. |
| [Tickets For Fun / T4F](https://www.ticketsforfun.com.br/) | Pesquisa | Feed/API não confirmados | Potencial parceiro Brasil. Consultar catálogo e links autorizados. |
| [Uhuu](https://sobre.uhuu.com/produtor) | Pesquisa | Parceria; API pública de discovery não confirmada | Potencial parceiro Brasil. Priorizar acesso oficial por produtor/feed. |
| [Bilheteria Digital](https://www.bilheteriadigital.com/) | Pesquisa | Feed/API não confirmados | Potencial parceiro Brasil. Validar documentação oficial e licença de imagens. |
| [Shotgun](https://support-pro.shotgun.live/) | Pesquisa | Integrações de produtor; catálogo global não confirmado | Eventos e potenciais parceiros Brasil. Investigar acesso autorizado, principalmente música eletrônica. |
| [Clube do Ingresso](https://www.clubedoingresso.com/) | Pesquisa | Feed/API não confirmados | Potencial parceiro Brasil. Consultar parceria e condições de catálogo. |
| [LRCLIB](https://lrclib.net/docs) | Produção | Sem chave; disponibilidade e licença a revisar | Letras por artista/faixa. Pesquisar depois do lookup exato, validando artista, título e duração. |
| [Photon / OpenStreetMap](https://github.com/komoot/photon) | Produção | Demo sem SLA; opção de hospedar | Geocodificação global, incluindo São Paulo. Reverse como alternativa ao Nominatim; respeitar limites da infraestrutura. |

## Correções e ressalvas da pesquisa recebida

- **JamBase:** [pricing oficial](https://data.jambase.com/products) lista Developer não comercial com 1.000 chamadas/mês e US$0,05 por excedente; janela futura de seis meses. Startup mostra US$600 no mensal ou equivalente a US$500/mês no anual. Histórico está ligado a planos superiores nessa tabela. Há divergência com páginas de MCP sobre histórico/plano gratuito; confirmar acesso REST real e contrato. Não considerar gratuito sem limite nem prometer todo histórico no Developer. [Autenticação](https://data.jambase.com/api/docs/authentication) usa Bearer; [busca](https://data.jambase.com/api/docs/search) usa v3 e filtros próprios.
- **Songkick:** [portal oficial](https://app.songkick.com/developer) exige licença e não aprova projetos hobby/estudantis/educacionais. A pesquisa não confirmou preço mínimo público: cotar, em vez de repetir US$500 como garantia. A consulta legada do Lab só pesquisa artistas; calendário/gigography são passos posteriores.
- **Bandsintown:** [regras de acesso](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) vinculam normalmente a chave a um artista; outras utilizações exigem aprovação. ConcertFYI é agregador: uma chave de artista não autoriza todos. [Documentação dos eventos](https://help.artists.bandsintown.com/en/articles/9186477-api-documentation).
- **Sympla:** [API pública v1.6.0](https://developers.sympla.com.br/api-docs/v1.6.0) administra eventos do produtor autenticado por s_token; não confirma busca pública de todos os shows do Brasil. O teste retorna somente eventos públicos e campos de catálogo; não consulta pedidos/participantes.
- **Ingresse:** [eventos da organização](https://developer.ingresse.com/docs/partner-reports/events) incluem poster, datas e venue. A [referência oficial](https://developer.ingresse.com/docs/reference) vincula acesso e hosts ao onboarding. Não inventar host/chave nem chamar relatório de produtor como catálogo global. Lab mantém pesquisa documental até acesso definido.
- **Eventbrite:** [documentação oficial](https://www.eventbrite.com/platform/new/api) informa encerramento de `/events/search/` em dezembro/2019. O teste consulta eventos da organização autorizada, não discovery global.
- **PredictHQ:** [busca oficial](https://docs.predicthq.com/api/events/search-events) limita os resultados à assinatura. Busca vazia fora da área/período contratado não prova ausência de shows. [Pricing](https://www.predicthq.com/pricing) exige confirmação do plano; trial não equivale a free tier permanente.
- **SeatGeek:** [documentação oficial publicada](https://seatgeek.github.io/) fornece endpoints e client_id; validar acesso/termos atuais e cobertura BR. O link de busca já existente na UI não usa esta API.
- **Ticketmaster:** [Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) é a integração atual; validar limites na conta e não assumir cobertura BR completa. [Discovery Feed](https://developer.ticketmaster.com/products-and-docs/apis/discovery-feed/) pode incluir tracking quando a conta de afiliados estiver habilitada. O Lab não baixa feeds grandes automaticamente.
- **Brasil:** Eventim, T4F, Uhuu, Bilheteria Digital, Shotgun e Clube do Ingresso permanecem potenciais parceiros. Os links do catálogo são oficiais, mas **API/feed público, preço, licença e acesso não foram confirmados**. A próxima ação é obter documentação ou acordo oficial, sem endpoint inventado nem raspagem presumida.

## Fallbacks viáveis, preferindo fontes já disponíveis

| Prioridade | Lacuna atual | Opção inicial | Validação necessária |
| --- | --- | --- | --- |
| 1 | Link Spotify ausente | MusicBrainz URL relations / Wikidata Spotify ID | Mesmo MBID; evitar homônimos; aceitar só link oficial |
| 1 | Biografia ausente | TheAudioDB por MBID; Wikipedia em outro idioma via Wikidata | Licença comercial, atribuição, identidade e idioma; não usar disambiguation como bio |
| 1 | Álbum sem capa | Placeholder mantendo título/ano | Não ocultar discografia apenas por imagem indisponível |
| 1 | Letras sem lookup exato | Busca LRCLIB existente | Artista, título e duração; evitar versões diferentes |
| 1 | Google Maps indisponível | Link OpenStreetMap por coordenadas | Distinguir cidade de venue; não inventar precisão |
| 2 | Nominatim indisponível | Photon reverse | Cache e limites; demo sem SLA |
| 2 | Futuro vazio na Ticketmaster | JamBase e parceiros brasileiros | Acesso, custos, mesmo artista/data/cidade; não prometer histórico gratuito |
| 2 | Vídeo ausente / quota | Canal oficial já linkado pela Ticketmaster | Rótulo explícito; canal não é vídeo daquele concerto |
| 3 | Fotos ausentes | Commons via identidade verificada | Créditos e licença individual, relevância para o artista |
| — | Setlist vazio | Manter aviso | Nenhuma fonte de ingressos pesquisada substitui músicas realmente tocadas |

[Photon](https://github.com/komoot/photon) oferece busca e reverse; seu servidor demo permite uso razoável, pode bloquear carga excessiva e não dá garantia de disponibilidade. [Nominatim](https://operations.osmfoundation.org/policies/nominatim/) exige identificação, atribuição e no máximo 1 chamada/s **no conjunto do aplicativo**; proíbe autocomplete. O código atual faz reverse no browser, não autocomplete Nominatim; controle agregado de tráfego/proxy continua item a revisar. Para mapas completos, [tiles OSM](https://operations.osmfoundation.org/policies/tiles/) também têm política de cache, atribuição e uso; gratuitos não significa ilimitados. Um link de mapa é o primeiro fallback mais simples.

## Credenciais locais dos novos testes

Configure somente em `server/.env` (não versionar):

| Teste | Variáveis |
| --- | --- |
| Ticketmaster Events | `TICKETMASTER_API_KEY` já utilizada |
| JamBase | `JAMBASE_API_KEY` |
| Bandsintown | `BANDSINTOWN_APP_ID`, `BANDSINTOWN_ARTIST` autorizado |
| PredictHQ | `PREDICTHQ_API_TOKEN` |
| SeatGeek | `SEATGEEK_CLIENT_ID` |
| Sympla | `SYMPLA_API_TOKEN` do produtor autorizado |
| Eventbrite | `EVENTBRITE_API_TOKEN`, `EVENTBRITE_ORGANIZATION_ID` |
| LRCLIB / Photon | Sem nova chave |

Sem configuração, o Lab mostra “Not called” e o requisito, sem executar a consulta. Hosts são fixos no servidor; credenciais não são entradas do navegador. Probes não alteram cards públicos nem salvam novos concertos.

## Ideias de arquitetura para a próxima fase

A sugestão de agregador é útil, mas ainda é proposta. Começar por comparar resultados no Lab, depois criar adaptadores apenas para provedores cujo acesso/licença já esteja resolvido. Um objeto ConcertFYI independente pode manter artista/IDs, data local + timezone + precisão, status cancelado/adiado, venue/cidade/país/coords com precisão, sources com provider/eventId/url, ticketLinks e preço/moeda quando conhecidos, imagem com origem/licença/tipo.

Deduplicar pelo identificador confirmado do artista + data local + cidade + venue normalizado. Variações de apóstrofos e nomes exigem normalização. Similaridade sozinha não autoriza fusão: manter confiança e conflitos, especialmente festivais/múltiplos shows no mesmo dia, cidades homônimas e shows adiados. Não substituir informação exata por inferência de outra fonte. Cachear conforme termos; não disparar todas as APIs em todo carregamento de página.

Plano de análise Brasil: mesmos artistas (Sepultura, Capital Inicial e um internacional), São Paulo/Rio/Belo Horizonte e mesma janela de datas; medir IDs válidos, eventos exclusivos, falsos positivos, cancelamentos, latência, gasto, direitos de imagens e links de compra. Resultado vazio por quota/permissão deve ser separado de ausência no catálogo.

## Pesquisa de pôsteres preservada

O conteúdo útil de `APIs De Posters Recentes.pdf` foi extraído e consolidado aqui e no histórico [APIS_E_POSTERS.md](APIS_E_POSTERS.md). O PDF e seu `:Zone.Identifier` podem ser removidos da árvore local; isso não reescreve eventual histórico Git. O histórico registra experimentos visuais anteriores, não o layout atual.

Event Art Archive usa **MBID do evento**, distinto do artista. Exigir correspondência única de artista/performer + dia + local/cidade; rejeitar cancelados/ambíguos e escolher imagem aprovada do tipo Poster. Capa de álbum (Cover Art), foto do artista (TheAudioDB/TM) e arte promocional do evento (TM) são categorias diferentes. Só considerar fallback de imagem de evento TM com correspondência exata e rótulo adequado. Commons/Archive/GitHub são pesquisa, não uma fonte validada de cartazes. Impressão/venda de memorabilia depende de autorização dos direitos; acesso gratuito à API não concede essa licença.

## Pendências de validação

Amostras reais dos novos provedores com chave dependem das credenciais e permissões acima; não há afirmação de teste live bem-sucedido sem elas. Os testes automatizados usam respostas injetadas para verificar isolamento por fonte, tratamento de falta de acesso e remoção de credenciais/dados privados. Confirmar nomes de campos e entitlements nos payloads reais antes de promover um provedor para produção.

## Perfil das venues (implementado em 2026-10-01)

`VenuePage` combina a venue do setlist.fm com o objeto completo da Ticketmaster e `/api/venue-info`. Nome e coordenadas precisam corresponder de forma única; a primeira venue de uma busca não é aceita automaticamente. Campos ausentes aparecem como `N/A` para revisão da organização do perfil. A API do setlist.fm não expõe os totais de presenças/usuários mostrados no site.

- **setlist.fm:** nome, cidade/estado/país, URL e histórico. Se o histórico não fornecer a venue, `/api/setlist/venue-details/:id` consulta seu cadastro diretamente.
- **Ticketmaster:** endereço/CEP, coordenadas do venue, bilheteria, estacionamento e acessibilidade, quando preenchidos. A falha da busca de eventos não descarta o cadastro do local.
- **Wikipedia:** descrição em texto, link de atribuição e localização. Rejeita desambiguação, nome diferente e coordenadas incompatíveis.
- **Wikidata:** fallback de endereço, site oficial, coordenadas, link da Wikipedia e abertura (`P1619`). `Since:` mostra a abertura; `P571` não é utilizado como inauguração: pode representar o início da construção. Wembley atual retorna 2007; a descrição distingue o estádio original de 1923.

O enriquecimento verifica coordenadas até 30 km do centro da cidade, usa somente correspondência única e mantém resultados parciais se uma fonte falhar. Cache de 24 h para resultados completos, limitado a 200 venues; requisições concorrentes iguais são agrupadas. Falhas parciais não são cacheadas e têm opção de tentar novamente. O mapa prioriza coordenadas do local; a aproximação pela cidade é identificada na interface. Descrição da Wikipedia conserva o link e a licença CC BY-SA. Não há novas chaves de API.

O perfil usa o mesmo `CardTitle`, fontes, cores zinc e linhas `border-b border-zinc-300/50 py-2` do ArtistInfo. `About:` fica imediatamente abaixo do título, seguido dos campos e links no formato `Rótulo: informação`; todos os campos ficam visíveis, incluindo `N/A`. O mapa fica à direita no desktop e abaixo no mobile.

Depois de `Since:`, serviços e regras são botões no padrão de I’M GOING; cada um abre um dialog nativo com `Rótulo: informação` ou `N/A`, fechamento por X/Escape e retorno do foco ao botão. Links visíveis se limitam aos ícones de site oficial e Wikipedia, abaixo de Since e no padrão do ArtistInfo; setlist.fm, Ticketmaster e Wikidata permanecem como fontes de dados, sem links no perfil.

### Complemento de serviços e avaliações das venues (local)

`/api/venue-services` complementa os campos vazios com **Google Places API (New)** e depois **OpenStreetMap/Overpass**, por campo. Dados existentes da Ticketmaster/Wikidata permanecem prioritários. Nome e coordenadas precisam corresponder de forma única; estações e paradas com o nome do estádio são descartadas. Coordenadas exatas usam raio de 1,5 km; centro da cidade usa 30 km. Falhas não removem os dados existentes.

- **OpenStreetMap:** endereço, site, telefone, `opening_hours`, acessibilidade, estacionamento e pagamentos quando cadastrados na própria venue. Não herda informações de estacionamentos vizinhos. `opening_hours` conserva a notação publicada no OSM. Fonte e licença ODbL aparecem junto às informações utilizadas. Cache apenas do OSM por 1 h, no máximo 200 consultas; falhas e respostas incompletas não são cacheadas. `OVERPASS_API_URL` pode configurar outro servidor Overpass; padrão `https://overpass-api.de/api/interpreter`.
- **Google Places:** endereço, site, telefone, horários, acessibilidade, estacionamento e pagamentos. Flags negativas ficam `No`; atributo ausente fica `N/A`. `Cash only: No` não significa que dinheiro é recusado. Não altera `Since:`: `openingDate` do Places é voltado a aberturas futuras, não comprova inauguração histórica.
- **Avaliações:** vêm na mesma resposta de `/api/venue-services`: a chamada de detalhes já é cobrada como Enterprise + Atmosphere (1.000 grátis/mês) por causa de `editorialSummary`, estacionamento e pagamentos, então `reviews` entra sem custo extra. Google fornece nota, total de avaliações e até cinco comentários, com autor, avatar/link quando disponível, fonte e política de avaliações. OpenStreetMap não fornece avaliações. Sem chave/sem correspondência, exibe `N/A`; falha temporária permite tentar novamente.
- **Interface:** Phone e Opening hours são separados de Box office/Box office hours. Fonte aparece centralizada no popup do campo enriquecido e no About; ícones de site e Wikipedia ficam abaixo de Since, enquanto os botões de serviços ficam abaixo do mapa em desktop e mobile. X/Escape encerram o popup e devolvem foco ao botão.

Para ativar Google: habilitar **Places API (New)** e faturamento no Google Cloud; configurar `GOOGLE_PLACES_API_KEY` no `server/.env` local e nas variáveis de ambiente do Render, e reiniciar o servidor. Preferir uma chave de servidor restrita à Places API (New); a chave pública `VITE_GOOGLE_MAPS_KEY`, restrita por referrer, continua destinada ao mapa no navegador. Não colocar a chave de servidor no client nem em arquivos versionados. Os testes não exigem credenciais nem consomem quotas.

As respostas com dados Google têm `Cache-Control: no-store`; o servidor conserva somente place IDs e o client descarta conteúdo ao sair da página/fechar Reviews. Não mistura Google no cache de 24 h da Wikipedia/Wikidata. Field masks explícitas excluem reviews da chamada de serviços; avaliações são cobradas apenas quando abertas. Os campos de estacionamento/pagamentos e reviews podem usar a categoria Enterprise + Atmosphere; configurar quotas/orçamento conforme o uso. A atribuição Google Maps e terceiros é preservada; observar as condições de uso/privacidade antes de publicar com a integração ativa.

Referências oficiais: [Places fields](https://developers.google.com/maps/documentation/places/web-service/data-fields), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL), [OSM copyright](https://www.openstreetmap.org/copyright). Yelp permanece fora desta etapa.

Correção de correspondência/`About:` (Dickens, Calgary): diferenças de descritor como `Dicken's Pub` no setlist.fm e `Dickens` no Google são aceitas somente quando o nome-base coincide, a categoria confirma o descritor (`pub`) e as coordenadas e a unicidade passam. Não usa correspondência por substring nem alias cadastrado à mão. `About:` prioriza Wikipedia e usa `editorialSummary` do Google como fallback; o texto editorial é exibido integralmente, com atribuição Google Maps, sem cortes ou alteração. `description:en`/`description` do OSM complementa quando disponível. Campos que a fonte não informa continuam `N/A`: no Dickens, Google confirmou descrição, endereço, telefone, estacionamento, acessibilidade e pagamentos, mas não retornou horário geral na validação.

Ajuste de apresentação: Phone aparece na lista de informações imediatamente abaixo de Address, sem botão próprio. Rating aparece com as mesmas estrelas de Last Concert em modo somente leitura (sem `onRate`), usando `rating` e `userRatingCount` do Google; a fonte fica ao lado das estrelas e a nota/total abaixo. A chamada de serviços inclui somente a nota agregada; os comentários continuam sendo consultados ao abrir Reviews. Os popups usam o rótulo apenas no título, sem repetir `Parking:`/outro rótulo antes do conteúdo.

Atualização do perfil de venue: Phone fica sem Source individual; Website é um link de texto com o endereço, e Since foi retirado da interface (o dado continua disponível na API). Rating mantém estrelas somente leitura e nota/quantidade ao lado; a fonte ocupa a linha abaixo. Reviews passa a carregar na página, abaixo de Rating, com navegação entre até cinco comentários, autor/link e expansão do texto; os dados são descartados ao sair da página.

Fotos usam `/api/venue-photos`: a lista pede só `photos,attributions` (IDs Only, não cobrada); cada imagem baixada conta no Place Details Photos (1.000 grátis/mês). Na home, a foto do Google só é pedida quando a Ticketmaster não tem imagem. Correspondência única da mesma venue, referências obtidas novamente do Google a cada página, nenhuma referência/imagem cacheada no servidor e chave apenas no header do servidor. O carrossel aparece acima de Past/Upcoming Concerts no estilo das capas de Keep Listening, com três fotos no mobile e seis no desktop, até dez fotos disponíveis, navegação por chaves e atribuição dos autores. Só resolve URLs de mídia da página solicitada; uma falha individual preserva as outras fotos. Resposta `no-store` e React Query `gcTime: 0`.

Past Concerts da venue usa o mesmo dropdown da ArtistPage, com seta e botão View concert (olho), levando ao show do artista e `last-concert`. Datas da lista compartilhada de concertos usam `whitespace-nowrap shrink-0`; o nome do artista/local pode truncar, a data não quebra linha.

Último ajuste visual: ícone Wikipedia removido; Phone e Website usam ícones de telefone/globo antes do rótulo, e o endereço do Website usa `text-red-600 hover:text-red-800`. Fonte do Rating e créditos dos reviews (autor, nota, data relativa e Google Maps) ficam centralizados. Reviews usa o mesmo fade da biografia, Read more centralizado expande na própria linha e Show less recolhe; trocar o comentário volta ao trecho resumido. Não abre mais popup de leitura.
