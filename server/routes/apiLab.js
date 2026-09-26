const { request } = require("../http");
const { musicbrainzRequest } = require("../musicbrainzClient");
const { artistImagesFrom } = require("./audiodb");
const eventArtHandler = require("./eventArt");

const ARTIST = "Foo Fighters";
const MBID = "67f66c07-6e61-4026-ade5-7e782fad3a5d";
const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

async function captureResult(id, name, endpoint, call, note = "") {
  try {
    return { id, name, endpoint, status: "ok", note, data: await call() };
  } catch (error) {
    return {
      id,
      name,
      endpoint,
      status: "error",
      note: error.data?.error || error.data?.message || error.message || "Request failed",
    };
  }
}

function unavailable(id, name, endpoint, note) {
  return { id, name, endpoint, status: "unavailable", note };
}

function mediaWikiImages(data) {
  return Object.values(data?.query?.pages || {}).map((page) => {
    const info = page.imageinfo?.[0] || {};
    const meta = info.extmetadata || {};
    return {
      title: page.title,
      imageUrl: info.thumburl || info.url,
      pageUrl: info.descriptionurl,
      license: meta.LicenseShortName?.value?.replace(/<[^>]*>/g, "") || "License not listed",
      artist: meta.Artist?.value?.replace(/<[^>]*>/g, "") || "",
      width: info.width,
      height: info.height,
    };
  });
}

function wikidataFields(data, entityId) {
  const entity = data?.entities?.[entityId];
  if (!entity) return null;
  const value = (property) => entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return {
    id: entity.id,
    label: entity.labels?.en?.value || "",
    description: entity.descriptions?.en?.value || "",
    inception: value("P571")?.time || "",
    countryOfOrigin: value("P495")?.id || "",
    genres: (entity.claims?.P136 || []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean),
    wikidataUrl: `https://www.wikidata.org/wiki/${entity.id}`,
  };
}

function mockResponse() {
  const result = { statusCode: 200, headers: {}, body: undefined };
  return {
    result,
    status(code) { result.statusCode = code; return this; },
    set(name, value) { result.headers[name] = value; return this; },
    json(body) { result.body = body; return this; },
  };
}

function createApiLabHandler({ fetchJson = request, mbRequest = musicbrainzRequest, env = process.env } = {}) {
  const fetchWithTimeout = (url, options = {}) => fetchJson(url, {
    ...options,
    signal: options.signal || AbortSignal.timeout(12000),
  });
  return async (req, res) => {
    const source = req.query?.source;
    const sources = ["setlistfm", "musicbrainz", "eventart", "coverart", "ticketmaster", "audiodb", "lastfm", "listenbrainz", "youtube", "acoustid", "apple", "spotify", "songkick", "myshowposter", "concertcollect", "commons", "wikidata", "wikipedia", "archive", "github"];
    if (source !== undefined && !sources.includes(source)) {
      return res.status(400).json({ error: "Unknown API source" });
    }
    const selected = (id) => !source || source === id;
    // Event artwork needs a concert from setlist.fm to identify the event.
    const capture = (id, ...args) =>
      selected(id) || (source === "eventart" && id === "setlistfm")
        ? captureResult(id, ...args)
        : Promise.resolve(null);
    const base = [
      capture("musicbrainz", "MusicBrainz", `artist/${MBID}?inc=genres+artist-rels`, () =>
        mbRequest(`artist/${MBID}`, { inc: "genres+artist-rels" })),
      env.SETLISTFM_API_KEY
        ? capture("setlistfm", "setlist.fm", `search/setlists?artistName=${encodeURIComponent(ARTIST)}`, async () => {
            const data = await fetchWithTimeout("https://api.setlist.fm/rest/1.0/search/setlists", {
              headers: {
                Accept: "application/json",
                "x-api-key": env.SETLISTFM_API_KEY,
                "User-Agent": "concertfyi2000/1.0.0 (gilabarreto@gmail.com)",
              },
              params: { artistName: ARTIST, p: 1 },
            });
            return { total: data.total, setlist: data.setlist?.slice(0, 3) || [] };
          })
        : Promise.resolve(unavailable("setlistfm", "setlist.fm", "search/setlists", "SETLISTFM_API_KEY ausente no ambiente local.")),
      env.TICKETMASTER_API_KEY
        ? capture("ticketmaster", "Ticketmaster Discovery", "suggest?keyword=Foo+Fighters", () =>
            fetchWithTimeout(`${TM_BASE}/suggest`, {
              params: { apikey: env.TICKETMASTER_API_KEY, keyword: ARTIST, segmentId: "KZFzniwnSyZfZ7v7nJ" },
            }))
        : Promise.resolve(unavailable("ticketmaster", "Ticketmaster Discovery", "suggest?keyword=Foo+Fighters", "TICKETMASTER_API_KEY ausente no ambiente local.")),
      capture("audiodb", "TheAudioDB", `artist-mb.php?i=${MBID}`, async () => {
        const [mbidData, nameData] = await Promise.all([
          fetchWithTimeout("https://www.theaudiodb.com/api/v1/json/123/artist-mb.php", { params: { i: MBID } }),
          fetchWithTimeout("https://www.theaudiodb.com/api/v1/json/123/search.php", { params: { s: ARTIST } }),
        ]);
        const mbidLookup = artistImagesFrom(mbidData, MBID);
        const nameMatch = nameData.artists?.find((artist) => artist.strMusicBrainzID?.toLowerCase() === MBID);
        const nameLookup = artistImagesFrom({ artists: nameMatch ? [nameMatch] : [] }, MBID);
        const idLookup = mbidLookup.artistId
          ? artistImagesFrom(await fetchWithTimeout("https://www.theaudiodb.com/api/v1/json/123/artist.php", {
              params: { i: mbidLookup.artistId },
            }), MBID)
          : { profile: {}, images: [] };
        const profile = [mbidLookup.profile, nameLookup.profile, idLookup.profile]
          .find((item) => item?.biography) || mbidLookup.profile;
        return {
          ...mbidLookup,
          profile,
          images: mbidLookup.images.length ? mbidLookup.images : nameLookup.images.length ? nameLookup.images : idLookup.images,
          testedEndpoints: {
            byMbid: `artist-mb.php?i=${MBID}`,
            byName: `search.php?s=${encodeURIComponent(ARTIST)}`,
            byAudioDbId: mbidLookup.artistId ? `artist.php?i=${mbidLookup.artistId}` : "not available",
            nameSearchMatchedMbid: !!nameMatch,
          },
        };
      }),
      capture("listenbrainz", "ListenBrainz", `/1/popularity/top-recordings-for-artist/${MBID}`, async () => {
        const data = await fetchWithTimeout(`https://api.listenbrainz.org/1/popularity/top-recordings-for-artist/${MBID}`);
        return Array.isArray(data) ? data.slice(0, 10) : data;
      }, "Populária musical por MBID; não é biografia nem popularidade geral de público."),
      capture("commons", "Wikimedia Commons", "w/api.php?action=query&generator=search&gsrsearch=Foo+Fighters&gsrnamespace=6", async () => {
        const data = await fetchWithTimeout("https://commons.wikimedia.org/w/api.php", {
          params: {
            action: "query", generator: "search", gsrsearch: ARTIST, gsrnamespace: 6, gsrlimit: 5,
            prop: "imageinfo", iiprop: "url|extmetadata|size", iiurlwidth: 500, format: "json", origin: "*",
          },
          headers: { "Api-User-Agent": "ConcertFYI/1.0 (https://concertfyi.com)" },
        });
        return mediaWikiImages(data);
      }, "Resultados devem ser conferidos arquivo a arquivo: a licença pode variar."),
      capture("wikidata", "Wikidata", "w/api.php?action=wbsearchentities&search=Foo+Fighters", async () => {
        const search = await fetchWithTimeout("https://www.wikidata.org/w/api.php", {
          params: { action: "wbsearchentities", search: ARTIST, language: "en", format: "json", type: "item", limit: 10 },
          headers: { "Api-User-Agent": "ConcertFYI/1.0 (https://concertfyi.com)" },
        });
        const match = search.search?.find((item) => item.label?.toLowerCase() === ARTIST.toLowerCase()
          && /band|musical group/i.test(item.description || ""));
        if (!match) return { match: null, fields: null };
        const data = await fetchWithTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`);
        return { match: { id: match.id, label: match.label, description: match.description }, fields: wikidataFields(data, match.id) };
      }),
      capture("wikipedia", "Wikipedia REST API", "/api/rest_v1/page/summary/Foo_Fighters", async () => {
        const data = await fetchWithTimeout("https://en.wikipedia.org/api/rest_v1/page/summary/Foo_Fighters");
        return {
          title: data.title,
          description: data.description,
          extract: data.extract,
          imageUrl: data.thumbnail?.source || "",
          pageUrl: data.content_urls?.desktop?.page || "",
        };
      }, "Resumo editorial mais extenso; verificar atribuição/licença antes de usar em produção."),
      capture("archive", "Internet Archive", "advancedsearch.php?q=Foo+Fighters+AND+poster", async () => {
        const data = await fetchWithTimeout("https://archive.org/advancedsearch.php", {
          params: {
            q: '"Foo Fighters" AND poster',
            "fl[]": "identifier,title,mediatype", output: "json", rows: 5,
          },
        });
        return data.response?.docs || [];
      }, "Busca exploratória; o resultado pode não ser um pôster de show."),
      capture("github", "GitHub / datasets", "search/repositories?q=foo+fighters+setlist+poster", async () => {
        const data = await fetchWithTimeout("https://api.github.com/search/repositories", {
          params: { q: '"Foo Fighters" (setlist OR concert OR poster)', per_page: 5, sort: "stars" },
          headers: { Accept: "application/vnd.github+json", "User-Agent": "ConcertFYI-API-Lab" },
        });
        return { total: data.total_count, repositories: (data.items || []).map(({ full_name, html_url, description, stargazers_count }) => ({ full_name, html_url, description, stargazers_count })) };
      }, "Pesquisa de repositórios, não um serviço de dados musicais uniforme."),
    ];

    const [musicBrainz, setlist, ticketmaster, audioDb, listenBrainz, commons, wikidata, wikipedia, archive, github] = await Promise.all(base);
    const results = [
      setlist,
      musicBrainz,
      null,
      null,
      ticketmaster,
      audioDb,
      env.LASTFM_API_KEY
        ? await capture("lastfm", "Last.fm", "2.0/?method=artist.getinfo&artist=Foo+Fighters", () =>
            fetchWithTimeout("https://ws.audioscrobbler.com/2.0/", {
              params: { method: "artist.getinfo", artist: ARTIST, api_key: env.LASTFM_API_KEY, format: "json" },
            }))
        : unavailable("lastfm", "Last.fm", "2.0/?method=artist.getinfo&artist=Foo+Fighters", "LASTFM_API_KEY ausente; não fiz a chamada."),
      listenBrainz,
      env.YOUTUBE_API_KEY
        ? await capture("youtube", "YouTube Data API", "youtube/v3/search?q=Foo+Fighters+Everlong+official+video", async () => {
            const data = await fetchWithTimeout("https://www.googleapis.com/youtube/v3/search", {
              params: { q: "Foo Fighters Everlong official video", part: "snippet", type: "video", maxResults: 3, key: env.YOUTUBE_API_KEY },
            });
            return (data.items || []).map(({ id, snippet }) => ({ videoId: id?.videoId, title: snippet?.title, channel: snippet?.channelTitle, publishedAt: snippet?.publishedAt }));
          }, "Uma busca custa cota do YouTube; esta página só a executa ao clicar em Testar." )
        : unavailable("youtube", "YouTube Data API", "youtube/v3/search", "YOUTUBE_API_KEY ausente no ambiente local."),
      unavailable("acoustid", "AcoustID", "/v2/lookup", "Requer client key e fingerprint de um arquivo de áudio; nome de artista não é suficiente."),
      env.APPLE_MUSIC_DEVELOPER_TOKEN
        ? await capture("apple", "Apple Music / MusicKit", "/v1/catalog/us/search?term=Foo+Fighters", async () => {
            const data = await fetchWithTimeout("https://api.music.apple.com/v1/catalog/us/search", {
              params: { term: ARTIST, types: "artists", limit: 1 },
              headers: { Authorization: `Bearer ${env.APPLE_MUSIC_DEVELOPER_TOKEN}` },
            });
            return data.results?.artists?.data?.[0] || null;
          })
        : unavailable("apple", "Apple Music / MusicKit", "/v1/catalog/us/search?term=Foo+Fighters", "Requer developer token da Apple; APPLE_MUSIC_DEVELOPER_TOKEN não está configurado no ambiente local."),
      env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
        ? await capture("spotify", "Spotify Web API", "/v1/search?type=artist&q=Foo+Fighters", async () => {
            const token = await fetchWithTimeout("https://accounts.spotify.com/api/token", {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ grant_type: "client_credentials" }),
            });
            const data = await fetchWithTimeout("https://api.spotify.com/v1/search", {
              params: { q: ARTIST, type: "artist", limit: 1 },
              headers: { Authorization: `Bearer ${token.access_token}` },
            });
            return data.artists?.items?.[0] || null;
          })
        : unavailable("spotify", "Spotify Web API", "/v1/search?type=artist&q=Foo+Fighters", "Credenciais SPOTIFY_CLIENT_ID/SECRET não configuradas no servidor local; o fluxo OAuth de usuário não é uma chave de servidor."),
      env.SONGKICK_API_KEY
        ? await capture("songkick", "Songkick", "/api/3.0/search/artists.json?query=Foo+Fighters", () =>
            fetchWithTimeout("https://api.songkick.com/api/3.0/search/artists.json", {
              params: { apikey: env.SONGKICK_API_KEY, query: ARTIST },
            }))
        : unavailable("songkick", "Songkick", "/api/3.0/search/artists.json?query=Foo+Fighters", "Sem SONGKICK_API_KEY/licença; a documentação atual exige acesso aprovado."),
      unavailable("myshowposter", "My Show Poster", "API pública não documentada", "Não há endpoint público documentado para fazer uma chamada."),
      unavailable("concertcollect", "Concert Collect", "API pública não documentada", "Não há endpoint público documentado para fazer uma chamada."),
      commons,
      wikidata,
      wikipedia,
      { ...archive, name: "Internet Archive" },
      { ...github, name: "GitHub / datasets" },
    ];

    const albumSearch = selected("coverart")
      ? await capture("coverart", "Cover Art Archive", "release-group/{release-group-mbid}", async () => {
          const found = await mbRequest("release-group/", { query: `arid:${MBID} AND primarytype:album`, limit: 1 });
          const releaseGroup = found["release-groups"]?.[0];
          if (!releaseGroup?.id) return { releaseGroup: null, artwork: null };
          try {
            const cover = await fetchWithTimeout(`https://coverartarchive.org/release-group/${releaseGroup.id}`);
            return { releaseGroup: { id: releaseGroup.id, title: releaseGroup.title }, artwork: cover.images?.slice(0, 3) || [] };
          } catch (error) {
            if (error.status === 404) return { releaseGroup: { id: releaseGroup.id, title: releaseGroup.title }, artwork: [] };
            throw error;
          }
        }, "Capa de álbum, não pôster de show.")
      : unavailable("coverart", "Cover Art Archive", "release-group/{release-group-mbid}", "A busca do MusicBrainz falhou; sem MBID de release group não posso montar a consulta." );
    results[3] = albumSearch;

    let eventPoster = unavailable("eventart", "Event Art Archive", "/event/{event-mbid}/", "Nenhum show compatível do setlist.fm disponível para cruzar artista, data e local.");
    if (selected("eventart") && setlist?.status === "ok") {
      const concert = setlist.data.setlist?.find((item) => item.artist?.mbid && item.eventDate && item.venue?.name);
      if (concert) {
        const [day, month, year] = concert.eventDate.split("-");
        const eventQuery = {
          mbid: concert.artist.mbid,
          date: `${year}-${month}-${day}`,
          venue: concert.venue.name,
          city: concert.venue.city?.name || "",
        };
        const proxyRes = mockResponse();
        await eventArtHandler({ query: eventQuery }, proxyRes);
        eventPoster = proxyRes.result.statusCode === 200
          ? { id: "eventart", name: "Event Art Archive", endpoint: "/event/{event-mbid}/", status: "ok", note: `Show usado: ${concert.eventDate} · ${concert.venue.name}`, data: proxyRes.result.body }
          : { id: "eventart", name: "Event Art Archive", endpoint: "/event/{event-mbid}/", status: "error", note: proxyRes.result.body?.error || "Event lookup failed" };
      }
    }
    results[2] = eventPoster;

    const selectedResults = results.filter((item) => item && selected(item.id));
    selectedResults.forEach((item) => {
      if (item.id === "commons") item.name = "Wikimedia Commons";
      if (item.id === "wikidata") item.name = "Wikidata";
    });
    res.set("Cache-Control", "no-store");
    return res.json({ artist: ARTIST, mbid: MBID, results: selectedResults });
  };
}

module.exports = createApiLabHandler();
module.exports.createApiLabHandler = createApiLabHandler;
module.exports.mediaWikiImages = mediaWikiImages;
module.exports.wikidataFields = wikidataFields;
