> O API Lab (`/api-lab`) saiu do app em 2026-10-02: cumpriu o papel de comparar fontes. O código continua no git — `git show 5445fdc` mostra a última versão, e `git checkout 5445fdc -- client/src/pages/ApiLab.jsx server/routes/apiLab.js` traz de volta. Catálogo e receitas de cada chamada em [docs/API_LAB_REFERENCIA.md](API_LAB_REFERENCIA.md). As menções a `/api-lab` abaixo são históricas.

> Documento histórico de experimentos em setembro/2026. Para origem atual, fallbacks, custos e novas fontes, consulte [APIS_E_FONTES.md](APIS_E_FONTES.md). As descrições de layout abaixo podem estar superadas.

# APIs e pôsteres para o ConcertFYI

Revisão em 25/09/2026 do PDF `APIs De Posters Recentes.pdf`, com consulta às fontes oficiais. Acesso gratuito a uma API não significa licença irrestrita para reutilizar as imagens.

## Resumo das indicações

| Fonte | O que oferece | Uso no ConcertFYI / condição relevante |
| --- | --- | --- |
| [setlist.fm](https://api.setlist.fm/docs/1.0/index.html) | Shows passados, músicas tocadas, artistas, locais e datas. | Já é a base dos setlists. API gratuita para projetos não comerciais; não fornece um catálogo de pôsteres. |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | Identidade de artistas, integrantes, gêneros, discografia, eventos e relacionamentos. | O MBID do artista já existe no projeto. O evento tem **outro** MBID. A API pública exige identificação e limita consultas a aproximadamente uma por segundo. |
| [Event Art Archive](https://musicbrainz.org/doc/Event_Art_Archive/API) | Pôsteres, ingressos e outras artes de eventos; miniaturas de 250, 500 e 1200 px. | Melhor opção documentada do PDF para um **pôster real do show**. Depende de o evento e sua imagem terem sido cadastrados pela comunidade. Não requer nova chave. |
| [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive/API) | Capas de álbuns/singles por release ou release group. | Útil para associar músicas a álbuns. Uma capa de álbum não deve ser apresentada como pôster da tour. |
| [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | Eventos, atrações, locais, ingressos e imagens promocionais. | Já integrado. `/events/{id}/images` oferece imagens adicionais; o payload atual também tem imagens. Cota padrão documentada: 5.000 chamadas/dia. As imagens não são necessariamente cartazes. |
| [TheAudioDB](https://www.theaudiodb.com/free_music_api) | Fotos, fanart, logos, biografias, discografia e capas. | Integrado localmente no ArtistInfo como carrossel de fotos via MusicBrainz MBID. API gratuita: 30 chamadas/minuto e lookup de artista por minuto; os [termos](https://www.theaudiodb.com/docs_terms_of_use.php) limitam o uso gratuito documentado a projetos de desenvolvimento. Não garante pôsteres por show/tour. |
| [Last.fm](https://www.last.fm/api) | Artistas semelhantes, tags, músicas/álbuns populares e histórico de audição. | Melhor para descoberta e recomendações. Os [termos](https://www.last.fm/api/tos) pedem contato prévio para uso comercial ou acadêmico. |
| [ListenBrainz](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html) | Histórico de audição, estatísticas, popularidade, playlists e recomendações. | Alternativa aberta para descoberta musical; algumas operações requerem token do usuário. Não é um arquivo de cartazes. |
| [YouTube Data API](https://developers.google.com/youtube/v3/getting-started) | Vídeos, performances, entrevistas e canais. | Já usado para vídeos. Tem cotas; a documentação atual diferencia limites de busca, uploads e outras operações. Não oferece um catálogo de pôsteres. |
| [AcoustID](https://acoustid.org/webservice) | Identificação de gravações por impressão digital de áudio. | Útil se o produto passar a identificar áudio. Gratuito para uso não comercial; baixa prioridade para a interface atual. |
| [Apple Music / MusicKit](https://developer.apple.com/musickit/) | Catálogo, artistas, álbuns, capas, playlists e reprodução conforme autorização. | Requer configuração/token de desenvolvedor. Não é uma fonte pública anônima de pôsteres de shows. |
| [Spotify Web API](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) | Catálogo e operações autorizadas de usuário, como playlists. | Já integrado. As restrições de Development Mode continuam relevantes. O PDF não deve ser usado como fotografia definitiva: a [atualização de julho/2026](https://developer.spotify.com/blog/2026-07-23-web-api-quota-updates) alterou limites e passou a compartilhar a cota por conta de desenvolvedor. |
| [Songkick](https://app.songkick.com/developer) | Shows passados/futuros, locais e histórico de apresentações. | A página atual exige licença paga e não aprova pedidos para projetos de hobby/estudantes. Não atende ao objetivo de nova integração gratuita. |
| [My Show Poster](https://myshowposter.com/) | Catálogo visual de pôsteres musicais. | Tem pôsteres, mas não encontrei uma API pública documentada nas páginas consultadas. Referência para pesquisa, não integração automática nesta implementação. |
| [Concert Collect](https://concertcollect.com/) | Arquivo de pôsteres relacionado a shows, artistas, locais e ilustradores; importação de histórico setlist.fm. | Também não encontrei API pública documentada nas páginas consultadas. Não implementar raspagem como se fosse API. |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:API) / [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) | Fotos, dados estruturados e relações entre entidades. | Boa pesquisa futura para fotos de bandas e locais. Cada arquivo tem seus créditos/licença; não garante cartazes de uma tour específica. |
| Internet Archive, repositórios GitHub e datasets | Acervos e coleções de terceiros, com formatos e cobertura variáveis. | O PDF apenas sugere uma segunda rodada de pesquisa; não identifica um dataset adicional pronto para integrar. O Event Art Archive já usa a infraestrutura do Internet Archive. |

## Escolha e comportamento implementado

Para comparação manual, `/api-lab` abre uma página com chamadas reais de Foo Fighters para as fontes da tabela. Local, com client e server em modo dev, a rota agregadora é montada por `API_LAB_ENABLED=true` (script `npm run dev` do servidor) e não pede senha. No site no ar, a rota só existe se `API_LAB_TOKEN` estiver definida no Render, e toda chamada precisa mandar esse valor no header `x-api-lab-token` (campo Password da página); sem ele, 401 antes de qualquer chamada a terceiro. Chaves ficam no backend. O botão chama APIs com cotas, inclusive YouTube, então não é executado automaticamente ao abrir a página. Fontes sem chave local, sem entrada pública ou que precisam de áudio aparecem como indisponíveis com o motivo.

1. Buscar eventos do MusicBrainz pelo **MBID do artista + data do setlist**.
2. Conferir artista como performer, dia e local. Não aceitar evento cancelado, festival com vários dias ou duas apresentações indistinguíveis no mesmo dia/local.
3. Para uma correspondência única, consultar o Event Art Archive e selecionar uma imagem aprovada do tipo `Poster`.
4. Sem pôster, tentar uma imagem do evento já retornado pela Ticketmaster, somente com artista, data, local e cidade correspondentes.
5. Sem imagem daquele evento, mostrar estado vazio. Não reutilizar a foto genérica da atração na Ticketmaster: ela é a mesma foto do ArtistInfo e não representa o show. Falhas temporárias da API permitem tentar novamente; imagem quebrada passa à próxima alternativa.

O carrossel do ArtistInfo consulta o endpoint gratuito do TheAudioDB por MBID no backend, valida se o MBID retornado corresponde ao artista e filtra imagens para o host oficial. Mostra retrato, fanart e wide thumb; a foto Ticketmaster segue como alternativa se faltar arte no TheAudioDB. Os botões de navegação são manuais, com cache de 24 h no cliente e no processo do servidor.

O bloco fica ao lado do setlist no desktop e depois dele no mobile; o player Spotify permanece abaixo da arte. As imagens usam `object-contain`, sem recortar os textos de cartazes, e têm link para a fonte. Não há download para impressão, geração artificial de cartaz ou substituição do setlist.

**Tour:** a API documentada do Event Art Archive é indexada por evento, não por nome de tour. Não foi encontrada uma busca pública documentada que garanta o pôster oficial de qualquer tour. Esta versão resolve o pôster do show ou a alternativa genérica; não reclassifica o pôster de outra data como se pertencesse ao show atual. Uma futura associação a tour precisa de fonte explícita/verificada.

**Cobertura real verificada:** Oasis, Principality Stadium, Cardiff, 04/07/2025 tem evento no MusicBrainz (`b675b104-8a95-414f-9b83-fd11f502d82f`), mas retornou 404 no arquivo de arte. Já `#Hi'25`, Xanadu Roller Arts, Brooklyn, 09/01/2025, retornou pôster aprovado (`abed3d8a-1aeb-48d8-bace-f6bd704155c4`). Esses casos são evidências de verificação, não exceções fixadas no código.

**Outras imagens testadas:** o TheAudioDB fornece foto/fanart genérico distinto para Oasis, mas não arte por show ou turnê; os termos do nível gratuito limitam o uso documentado a projetos de desenvolvimento, então não foi adicionado como fonte pública do site. A busca por Oasis + Principality Stadium + 04/07/2025 no Wikimedia Commons encontrou [uma foto do show](https://commons.wikimedia.org/wiki/File:OasisLive2025.jpg), licenciada CC0, mas não um pôster. É uma alternativa potencial para uma integração futura de fotos de apresentações; não foi automatizada porque a busca textual ainda não prova correspondência exata em outros shows. A Ticketmaster também foi verificada: seus resultados atuais para Oasis não incluíam eventos passados, e a imagem genérica da atração era a mesma exibida no ArtistInfo.

## Integração e limites

- Sem rota pública: o handler de `server/routes/eventArt.js` só é chamado pelo API Lab (dev). O client que o consumia (`useEventArt`, `concertArtwork.js`) foi removido por não ter uso.
- Reutiliza os dados já presentes no setlist e Ticketmaster; não exige nova chave ou pacote npm.
- O backend compartilha a fila MusicBrainz entre as consultas de eventos e o API Lab, espaça chamadas em pelo menos 1,1 s, deduplica consultas simultâneas e mantém caches limitados em memória. O cache desaparece ao reiniciar o processo. Mais de uma instância precisaria de orçamento compartilhado.
- Pôster encontrado: cache de 24 h no processo; ausência: 1 h. Erro temporário não vira ausência no cache. Respostas públicas têm cache de 1 h.
- CSP permite imagens do Event Art Archive e dos hosts `archive.org` necessários aos redirecionamentos observados. Não libera scripts ou conexões genéricas para esses domínios.
- Os [termos do Event Art Archive](https://musicbrainz.org/doc/Event_Art_Archive) deixam claro que acesso ao acervo não transfere os direitos das imagens. Crédito/link não equivalem a autorização para merchandise.
- As alterações desta etapa estão locais para validação. Publicar o TheAudioDB requer avaliar os termos atuais do uso gratuito para o site público; eles descrevem o uso como projeto de desenvolvimento e vedam publicação de app em app store sem plano pago.

Próximas prioridades: avaliar Commons com correspondência/licença verificadas para fotos de apresentações; Cover Art Archive para álbuns do setlist; ListenBrainz/Last.fm para descoberta. A associação verificada de pôsteres a tours fica registrada em `SUGESTOES_ATUALIZADO.md`.

## ArtistInfo — Wikipedia (26/09/2026, local)

A biografia agora vem de `GET /api/wikipedia?artist=...`, usando o resumo em inglês da Wikipedia REST API. Substitui origem e integrantes do MusicBrainz por texto biográfico; os gêneros vêm da Ticketmaster. O carrossel de imagens continua separado. O crédito aponta para o artigo e a licença CC BY-SA 4.0, e Learn More abre o artigo.

A busca tenta o nome do artista e os sufixos band/musician/singer/rapper, descartando desambiguação e descrições não musicais. É uma correspondência por nome, não por MBID: homônimos musicais ainda podem exigir resolução de identidade futura. Ausência de artigo mostra estado vazio; falha de rede mostra opção de tentar novamente. O MusicBrainz permanece nas consultas de eventos/pôsteres e no laboratório.

### Ajuste visual local — foto e Gallery

ArtistInfo usa a imagem do resumo da Wikipedia e biografia abreviada com fade e View More/Show Less. O ícone Wikipedia aparece centralizado junto dos links sociais. As fotos anteriores do TheAudioDB/Ticketmaster ficam em Gallery, ao lado do setlist no desktop e abaixo dele no mobile, com miniaturas quadradas e dialog nativo no padrão do mapa (fechar por X/Esc).

### Revisão visual local — seleção de fotos (26/09/2026)

Concert Artwork e a seção Gallery foram retirados da ArtistPage após validação do usuário; o Spotify volta a ocupar a coluna ao lado do setlist. ArtistInfo inicia com a foto Ticketmaster. As fotos do TheAudioDB ficam em miniaturas abaixo dela e trocam a foto principal ao clicar, sem popup. A biografia e o ícone da Wikipedia permanecem. Os endpoints de arte continuam disponíveis para os testes do API Lab.
