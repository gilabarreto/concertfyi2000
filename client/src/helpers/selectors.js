// A data do Setlist.fm é DD-MM-YYYY. Sempre monte a partir das partes: passar a
// string "2026-09-16" para o Date é meia-noite UTC pela especificação, e em fuso
// negativo isso é o dia anterior à noite — um show de amanhã cai na lista de
// passados nas últimas horas do dia. Era o que a SearchPage fazia sozinha.
export function parseSetlistDate(eventDate) {
  const [day, month, year] = eventDate.split("-");
  return new Date(year, month - 1, day);
}

export function getPastConcertsByArtist(setlist = [], artistId) {
  const now = new Date();

  return setlist
    .filter((item) => item.artist.mbid === artistId)
    .map((item) => ({ ...item, dateObj: parseSetlistDate(item.eventDate) }))
    .filter((item) => item.dateObj <= now)
    .sort((a, b) => b.dateObj - a.dateObj);
}

// A irmã da de cima, para o outro lado da linha do tempo. As duas APIs não
// compartilham id nenhum: Setlist.fm casa com Ticketmaster pelo nome do artista,
// e as datas vêm em formatos trocados — DD-MM-YYYY lá, YYYY-MM-DD aqui.
export function getUpcomingConcertsByArtist(events = [], artistName) {
  // A rota /suggest pagina eventos por attractionId sem filtro de data, então o
  // passado vem junto — e, em ordem crescente, vinha listado em primeiro lugar.
  // O show de hoje continua contando como próximo: o corte é a meia-noite de hoje.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((item) => item._embedded?.attractions?.some((a) => a.name === artistName))
    .map((item) => {
      const [year, month, day] = item.dates.start.localDate.split("-");
      return { ...item, dateObj: new Date(year, month - 1, day) };
    })
    .filter((item) => item.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);
}

// Os slides do carrossel da home, a partir da resposta de /ticketmaster/events.
//
// Estava dentro de um useEffect do Swiper, fora do alcance do node:test. É lógica que
// erra calada: evento sem attraction não tem nome de artista para mostrar, a mesma
// turnê volta em várias datas na mesma cidade, e a ordem precisa ser sorteada.
//
// O sorteio é Fisher-Yates. O `sort(() => Math.random() - 0.5)` de antes é enviesado,
// e comparador inconsistente não tem comportamento definido entre engines.
export function getCarouselSlides(localEventsData) {
  // Um evento por artista, o primeiro que aparecer. O Map guarda a ordem de inserção,
  // que é a da API — não que importe muito, já que logo abaixo ela é embaralhada.
  const firstByArtist = new Map();

  for (const ev of localEventsData?._embedded?.events || []) {
    const artist = ev._embedded?.attractions?.[0];
    if (artist?.name && !firstByArtist.has(artist.name)) firstByArtist.set(artist.name, ev);
  }

  const shuffled = [...firstByArtist.values()];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.map((ev) => ({
    eventId: ev.id,
    artistId: ev._embedded.attractions[0].id,
    artistName: ev._embedded.attractions[0].name,
    title: ev.name,
    date: ev.dates.start.localDate,
    images: ev.images || [],
  }));
}

// A Ticketmaster manda a mesma foto em várias larguras (100 a 2048) e, em parte do
// catálogo, um _SOURCE de vários MB. Esta função já se chamou "best" e queria dizer
// "maior": a home baixava 21,7 MB de imagem e marcava LCP de 115s no mobile.
// Agora "best" é a menor que ainda cobre o espaço onde a foto vai aparecer — subir
// de resolução é barato, descer é borrão, então sem candidata à altura fica a maior.
export function getBestImage(images = [], minWidth = 640) {
  if (!images.length) return null;

  const ratio169 = images.filter((img) => img.ratio === "16_9");
  const candidates = ratio169.length ? ratio169 : images;

  const wideEnough = candidates.filter((img) => img.width >= minWidth);

  const pick = wideEnough.length
    ? wideEnough.reduce((min, img) => (img.width < min.width ? img : min))
    : candidates.reduce((max, img) => (img.width > max.width ? img : max));

  return pick.url;
}

// O card "Background information" da ArtistInfo, a partir da resposta crua do
// MusicBrainz (ws/2/artist?inc=genres+artist-rels). Igual à infobox da Wikipedia,
// resumida a poucas linhas: gêneros mais citados primeiro, ano de início junto do
// lugar em vez de uma linha própria, só integrantes atuais (passados some — banda
// dissolvida vira lista longa e o card é pra ser curto). O que a Wikipedia mostra e
// o MusicBrainz não modela direito (discografia, spinoffs) fica de fora — puxar
// isso exigiria raspar a infobox em si, não uma API estruturada.
export function formatArtistBackground(data = {}) {
  const place = [data["begin-area"]?.name, data.area?.name].filter(Boolean).join(", ");
  const beginYear = data["life-span"]?.begin?.slice(0, 4);
  const origin = place && beginYear ? `${place} (${beginYear})` : place;

  const genres = [...(data.genres || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((g) => g.name);

  const currentMembers = (data.relations || [])
    .filter((r) => r.type === "member of band" && r.artist?.name && !r.ended)
    .map((r) => r.artist.name);

  return { origin, genres, currentMembers };
}
