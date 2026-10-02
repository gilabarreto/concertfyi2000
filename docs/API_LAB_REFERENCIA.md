# Referência do API Lab — APIs para estudar

Material de estudo gerado em 2026-10-02, quando o API Lab (`/api-lab`) saiu do app em `0f832eb`. Aqui está o que ele conhecia: o catálogo das 37 fontes avaliadas e a receita exata de cada chamada que ele fazia, para repetir com `curl` sem precisar do app.

- Mapeamento de campo da tela → fonte → fallback: [APIS_E_FONTES.md](APIS_E_FONTES.md).
- Pesquisa de pôsteres de turnê: [APIS_E_POSTERS.md](APIS_E_POSTERS.md).
- Código original: `git show 5445fdc:server/routes/apiLab.js` (chamadas), `git show 5445fdc:server/routes/apiLabProviders.js` (provedores de eventos), `git show 5445fdc:client/src/data/apiCatalog.json` (catálogo). Para pôr o Lab de volta: `git checkout 5445fdc -- client/src/pages/ApiLab.jsx client/src/api/apiLabQuery.js client/src/data server/routes/apiLab.js server/routes/apiLabProviders.js server/routes/eventArt.js` e religar a rota no `server/index.js`.

Situações: **Produção** = o app usa hoje · **Laboratório** = o Lab chamava de verdade · **Pesquisa** = sem API pública confirmada, só leitura.

O artista de teste era sempre Foo Fighters (MBID `67f66c07-6e61-4026-ade5-7e782fad3a5d`). `$CHAVE` indica a variável de ambiente da linha; nenhuma chave vai neste arquivo.

## Catálogo

### Produção

| Fonte | Acesso / custo | Cobertura | Observação |
| --- | --- | --- | --- |
| [setlist.fm](https://api.setlist.fm/docs/1.0/index.html) | Gratuito não comercial; revisar licença comercial | Histórico e músicas, inclusive Brasil | Sem segunda fonte de músicas tocadas. Songkick/JamBase podem complementar datas, não setlists. |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | Aberto; identificar app e limitar a 1 chamada/s | Identidade, discografia e eventos globais | Usar MBID para reconciliar identidades; não confundir MBID do artista com o do evento. |
| [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive/API) | Sem nova chave; direitos das capas permanecem | Capas por release group | Álbuns sem capa hoje desaparecem; considerar placeholder antes de outra API. |
| [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | Chave e cotas da conta | Eventos futuros, ingressos, imagens; Brasil a medir | Comparar eventos BR com JamBase. Feed pode oferecer URLs de afiliado se a conta for habilitada. |
| [TheAudioDB](https://www.theaudiodb.com/free_music_api) | Plano gratuito para desenvolvimento; revisar termos | Fotos e biografias por MBID | Biografia pode ser fallback do Wikipedia, após validação de identidade e termos. |
| [YouTube Data API](https://developers.google.com/youtube/v3) | Chave e quota | Vídeos globais | Distinguir videoclipe de gravação daquele show; link do canal oficial pode ser fallback. |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api) | OAuth e restrições de quota/modo | Player por link; playlists autorizadas | Buscar link oficial via MusicBrainz/Wikidata se Ticketmaster não o informar. |
| [Wikipedia REST API](https://www.mediawiki.org/wiki/Wikimedia_REST_API) | Atribuição/licença editorial | Biografia global | Já tenta sufixos musicais; fallback gratuito proposto via Wikidata ou TheAudioDB. |
| [LRCLIB](https://lrclib.net/docs) | Sem chave; disponibilidade e licença a revisar | Letras por artista/faixa | Pesquisar depois do lookup exato, validando artista, título e duração. |
| [Photon / OpenStreetMap](https://github.com/komoot/photon) | Demo sem SLA; opção de hospedar | Geocodificação global, incluindo São Paulo | Reverse como alternativa ao Nominatim; respeitar limites da infraestrutura. |

### Laboratório

| Fonte | Acesso / custo | Cobertura | Observação |
| --- | --- | --- | --- |
| [Event Art Archive](https://musicbrainz.org/doc/Event_Art_Archive/API) | Sem nova chave; licença por imagem | Pôsteres comunitários; cobertura variável | Aceitar apenas evento único e Poster aprovado; não substituir por foto genérica. |
| [Last.fm](https://www.last.fm/api) | Chave; uso comercial exige consulta aos termos | Tags e artistas semelhantes globais | Recomendações; não substitui histórico de shows. |
| [ListenBrainz](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html) | Aberto; algumas operações exigem token | Audições e popularidade musical | Recomendar gravações sem depender de Spotify; não medir público de shows. |
| [AcoustID](https://acoustid.org/webservice) | Chave e fingerprint; uso não comercial | Identificação de áudio | Somente útil se passarmos a identificar arquivos de áudio. |
| [Apple Music / MusicKit](https://developer.apple.com/documentation/applemusicapi) | Developer token e condições Apple | Metadados e artwork | Alternativa de catálogo, sem cobertura de shows. |
| [Songkick](https://app.songkick.com/developer) | Licença paga; sem aprovação hobby/estudantil | Passado e futuro globais; Brasil a medir | Preço deve ser cotado; não assumir US$500. Teste atual pesquisa identidade do artista. |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:API) | Licença e atribuição por arquivo | Fotos globais | Relacionar artista/local por identidade verificada; buscar nome não valida imagem. |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Dados estruturados abertos | Identificadores globais | Links oficiais Spotify/Wikipedia e relações por MBID. |
| [Internet Archive](https://archive.org/developers/) | Direitos variam por item | Acervos globais | Conferir artista/data/local e licença antes de exibir pôster. |
| [GitHub / datasets](https://docs.github.com/en/rest/search/search) | API com limites; licença por repositório | Datasets exploratórios | Não é uma base uniforme de shows; conferir qualidade, atualização e licença. |
| [Ticketmaster · eventos no Brasil](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | Chave existente; quota da conta | Próximos shows BR por artista | Comparar Foo Fighters e Sepultura; não assumir catálogo completo. |
| [JamBase](https://data.jambase.com/products) | Developer não comercial: 1.000/mês, depois US$0,05/chamada | Futuro até 6 meses no plano Developer; Brasil a medir | Preços e acesso ao histórico diferem entre páginas oficiais: confirmar contrato antes de integrar. |
| [Bandsintown](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api) | Acesso aprovado; chave normalmente vinculada a um artista | Próximos shows globais; Brasil a medir | Agregador requer autorização/parceria; configurar somente artista autorizado. |
| [PredictHQ](https://docs.predicthq.com/api/events/search-events) | Trial e planos comerciais; free tier permanente não confirmado | Concertos BR conforme cobertura da assinatura | Retorno vazio pode significar falta de cobertura contratada. |
| [SeatGeek API](https://seatgeek.github.io/) | Credenciais e contrato a confirmar | Concertos; cobertura BR não comprovada | Hoje o site usa link de busca SeatGeek, sem esta API. |
| [Sympla 🇧🇷](https://developers.sympla.com.br/) | Token do produtor; custo/contrato a confirmar | Eventos do produtor autenticado, não catálogo global | Parcerias com produtores locais; somente dados públicos dos eventos. |
| [Eventbrite](https://www.eventbrite.com/platform/new/api) | Token e organização autorizada | Eventos da organização; busca global encerrada em 2019 | Não usar /events/search como fallback de discovery. |

### Pesquisa

| Fonte | Acesso / custo | Cobertura | Observação |
| --- | --- | --- | --- |
| [My Show Poster](https://myshowposter.com/) | API pública não confirmada | Pôsteres | Referência visual; sem integração automática documentada. |
| [Concert Collect](https://concertcollect.com/) | API pública não confirmada | Pôsteres | Investigar autorização/feed; não tratar site como API. |
| [Ingresse 🇧🇷](https://developer.ingresse.com/docs/partner-reports/events) | Onboarding, host e credenciais de parceiro | Eventos da organização, com poster, datas e local | Priorizar parceria Brasil; sem endpoint global público confirmado. |
| [Ticketmaster Discovery Feed](https://developer.ticketmaster.com/products-and-docs/apis/discovery-feed/) | Chave; afiliados dependem de habilitação | Arquivos por país | Avaliar ingestão agendada e licença; Lab não baixa arquivos grandes. |
| [Eventim Brasil](https://www.eventim.com.br/) | Feed/API comercial não confirmados | Potencial parceiro Brasil | Consultar parceria e feed autorizado; não inventar endpoint. |
| [Tickets For Fun / T4F](https://www.ticketsforfun.com.br/) | Feed/API não confirmados | Potencial parceiro Brasil | Consultar catálogo e links autorizados. |
| [Uhuu](https://sobre.uhuu.com/produtor) | Parceria; API pública de discovery não confirmada | Potencial parceiro Brasil | Priorizar acesso oficial por produtor/feed. |
| [Bilheteria Digital](https://www.bilheteriadigital.com/) | Feed/API não confirmados | Potencial parceiro Brasil | Validar documentação oficial e licença de imagens. |
| [Shotgun](https://support-pro.shotgun.live/) | Integrações de produtor; catálogo global não confirmado | Eventos e potenciais parceiros Brasil | Investigar acesso autorizado, principalmente música eletrônica. |
| [Clube do Ingresso](https://www.clubedoingresso.com/) | Feed/API não confirmados | Potencial parceiro Brasil | Consultar parceria e condições de catálogo. |

## Receitas das chamadas

Todas são GET, a não ser quando indicado. Os limites de taxa citados são os documentados por cada provedor na época; confira antes de usar.

### Metadados do artista

| Fonte | Chamada | Chave / observação |
| --- | --- | --- |
| MusicBrainz | `https://musicbrainz.org/ws/2/artist/{MBID}?inc=genres+artist-rels&fmt=json` | Sem chave. Exige `User-Agent` identificando o app e no máximo 1 chamada/s. |
| TheAudioDB | `https://www.theaudiodb.com/api/v1/json/123/artist-mb.php?i={MBID}`; reserva por nome: `search.php?s=Foo Fighters`; por id: `artist.php?i={idArtist}` | `123` é a chave pública de teste. Termos do provedor ainda a revisar. |
| Last.fm | `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=Foo Fighters&api_key=$LASTFM_API_KEY&format=json` | Chave gratuita. |
| ListenBrainz | `https://api.listenbrainz.org/1/popularity/top-recordings-for-artist/{MBID}` | Sem chave. Músicas mais ouvidas por MBID. |
| Wikidata | `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Foo Fighters&language=en&format=json&type=item&limit=10`, depois `https://www.wikidata.org/wiki/Special:EntityData/{Qid}.json` | Sem chave. `User-Agent` obrigatório. Daí saem os links oficiais (Spotify, site, Wikipedia). |
| Wikipedia REST | `https://en.wikipedia.org/api/rest_v1/page/summary/Foo_Fighters` | Sem chave. Licença editorial com atribuição. |
| Spotify | POST `https://accounts.spotify.com/api/token` com `grant_type=client_credentials` e `Authorization: Basic base64(id:secret)`; depois `https://api.spotify.com/v1/search?type=artist&q=Foo Fighters&limit=1` com `Bearer` | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`. |
| Apple Music | `https://api.music.apple.com/v1/catalog/us/search?term=Foo Fighters&types=artists&limit=1` com `Authorization: Bearer $APPLE_MUSIC_DEVELOPER_TOKEN` | Token JWT da conta Apple Developer. |
| YouTube Data | `https://www.googleapis.com/youtube/v3/search?q=Foo Fighters Everlong official video&part=snippet&type=video&maxResults=3&key=$YOUTUBE_API_KEY` | Cada busca custa 100 unidades da cota diária. |
| AcoustID | `/v2/lookup` | Precisa de client key **e** fingerprint de um arquivo de áudio. Nome de artista não basta; o Lab nunca chamou. |

### Shows e setlists

| Fonte | Chamada | Chave / observação |
| --- | --- | --- |
| setlist.fm | `https://api.setlist.fm/rest/1.0/search/setlists?artistName=Foo Fighters&p=1` com `x-api-key: $SETLISTFM_API_KEY` e `Accept: application/json` | Mais endpoints e campos em [APIS_E_FONTES.md](APIS_E_FONTES.md) e na análise de 2026-10-01 no SUGESTOES. |
| Ticketmaster Discovery | `https://app.ticketmaster.com/discovery/v2/suggest?keyword=Foo Fighters&segmentId=KZFzniwnSyZfZ7v7nJ&apikey=$TICKETMASTER_API_KEY` | `segmentId` é o segmento Música. |
| Ticketmaster (eventos BR) | `.../discovery/v2/events.json?keyword=Foo Fighters&countryCode=BR&classificationName=music&size=5&sort=date,asc&startDateTime={agora ISO}` | Mesma chave. |
| Songkick | `https://api.songkick.com/api/3.0/search/artists.json?query=Foo Fighters&apikey=$SONGKICK_API_KEY` | Licença paga, sem aprovação para projeto hobby. |
| JamBase | `https://api.data.jambase.com/v3/events?artistName=Sepultura&geoCountryIso2=BR&perPage=5` com `Authorization: Bearer $JAMBASE_API_KEY` | 1.000 chamadas/mês grátis; depois US$ 0,05 por chamada. |
| Bandsintown | `https://rest.bandsintown.com/artists/{artista autorizado}/events/?app_id=$BANDSINTOWN_APP_ID&date=upcoming` | Só artistas que autorizaram o app (`BANDSINTOWN_ARTIST`). |
| PredictHQ | `https://api.predicthq.com/v1/events/?category=concerts&q=Sepultura&country=BR&limit=5&start.gte={hoje}` com `Bearer $PREDICTHQ_API_TOKEN` | Resposta vazia pode ser falta de cobertura contratada. |
| SeatGeek | `https://api.seatgeek.com/2/events?client_id=$SEATGEEK_CLIENT_ID&q=Sepultura&taxonomies.name=concert&per_page=5` | É a fonte de preço que falta para os ~80% de eventos sem `priceRanges` na Ticketmaster. |
| Sympla 🇧🇷 | `https://api.sympla.com.br/public/v1.6.0/events?published=published&timezone=America/Sao_Paulo&sort=asc&page_size=5` com header `s_token: $SYMPLA_API_TOKEN` | Só os eventos do produtor dono do token. Filtrar `private_event`. |
| Eventbrite | `https://www.eventbriteapi.com/v3/organizations/$EVENTBRITE_ORGANIZATION_ID/events/?status=live&expand=venue` com `Bearer $EVENTBRITE_API_TOKEN` | A busca global acabou em 2019; só eventos da organização. |

### Arte, pôsteres e imagens

| Fonte | Chamada | Chave / observação |
| --- | --- | --- |
| Cover Art Archive | MusicBrainz `release-group/?query=arid:{MBID} AND primarytype:album&limit=1`, depois `https://coverartarchive.org/release-group/{id}` | Sem chave. 404 significa "sem capa", não erro. |
| Event Art Archive | Evento do MusicBrainz casado por artista + data + local do setlist.fm, depois `https://eventartarchive.org/event/{event-mbid}/` | Usar só imagem `approved: true` com tipo `Poster`. Imagem: `https://eventartarchive.org/event/{id}/{imageId}-500.jpg`. |
| Wikimedia Commons | `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=Foo Fighters&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=500&format=json` | Licença e atribuição por arquivo. A busca por nome não valida que a foto é do artista. |
| Internet Archive | `https://archive.org/advancedsearch.php?q="Foo Fighters" AND poster&fl[]=identifier,title,mediatype&output=json&rows=5` | Sem chave. |
| GitHub (datasets) | `https://api.github.com/search/repositories?q="Foo Fighters" (setlist OR concert OR poster)&per_page=5&sort=stars` | Sem chave, com limite baixo por IP. Serve para achar datasets prontos. |

### Outras que o app já usa

| Fonte | Chamada | Observação |
| --- | --- | --- |
| LRCLIB | `https://lrclib.net/api/get?artist_name=Foo Fighters&track_name=Everlong` | Letras, sem chave. |
| Photon (OSM) | `https://photon.komoot.io/api/?q=São Paulo&limit=3` | Autocomplete de cidade, sem chave e sem SLA. |

## Como o Lab protegia as chaves

Para reaproveitar se ele voltar:

- **Redação dos resultados:** antes de devolver o JSON, apagava qualquer valor de variável de ambiente que parecesse segredo (`API_KEY`, `TOKEN`, `SECRET`, `APP_ID`), parâmetros de URL como `apikey=` ou `key=`, e campos como `access_token`.
- **Senha em produção:** a rota exigia o header `x-api-lab-token`, comparado em tempo constante (hash dos dois lados + `crypto.timingSafeEqual`, que exige o mesmo comprimento). No dev, ficava liberada com `API_LAB_ENABLED=true`.
- **Provedores de eventos com conta** (Sympla, Eventbrite): só voltavam campos públicos (nome, datas, URL, imagem, local) e descartavam eventos privados.
