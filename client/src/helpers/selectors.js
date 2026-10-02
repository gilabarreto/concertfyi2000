// Haversine, in km. null when a coordinate is missing or out of range, so callers can't
// mistake bad data (Number("") is 0) for a place on the equator.
export function distanceKm(lat, long, otherLat, otherLong) {
  const values = [lat, long, otherLat, otherLong];
  if (values.some((value) => value == null || value === "")) return null;
  const [a, b, c, d] = values.map(Number);
  const inRange =
    Math.abs(a) <= 90 && Math.abs(c) <= 90 && Math.abs(b) <= 180 && Math.abs(d) <= 180;
  if (![a, b, c, d].every(Number.isFinite) || !inRange) return null;
  const radians = (value) => (value * Math.PI) / 180;
  const h =
    Math.sin(radians(c - a) / 2) ** 2 +
    Math.cos(radians(a)) * Math.cos(radians(c)) * Math.sin(radians(d - b) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(h, 1)));
}

// A data do Setlist.fm é DD-MM-YYYY. Sempre monte a partir das partes: passar a
// string "2026-09-16" para o Date é meia-noite UTC pela especificação, e em fuso
// negativo isso é o dia anterior à noite — um show de amanhã cai na lista de
// passados nas últimas horas do dia. Era o que a SearchPage fazia sozinha.
export function parseSetlistDate(eventDate) {
  const [day, month, year] = eventDate.split("-");
  return new Date(year, month - 1, day);
}

// The Ticketmaster side: YYYY-MM-DD in dates.start.localDate, built from parts for the same reason.
export function withTicketmasterDate(event) {
  const [year, month, day] = event.dates.start.localDate.split("-");
  return { ...event, dateObj: new Date(year, month - 1, day) };
}

// en-GB is the locale that shortens September to "Sept" (en-US stops at "Sep"); the
// other eleven months are identical, and the month-day-year order stays ours. Shared by
// every card that shows a concert date, so past/upcoming/last concert all read the same.
export function dateLabel(date) {
  return `${date.toLocaleDateString("en-GB", { month: "short" })} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getPastConcertsByArtist(setlist = [], artistId) {
  const now = new Date();

  return setlist
    .filter((item) => item.artist.mbid === artistId)
    .map((item) => ({ ...item, dateObj: parseSetlistDate(item.eventDate) }))
    .filter((item) => item.dateObj <= now)
    .sort((a, b) => b.dateObj - a.dateObj);
}

// Local/TicketWeb shows often carry no attraction at all, just the event's own name
// (e.g. "Gedfest Yeg"). That's still a real name, so it beats "Unknown artist".
export const artistOf = (event) =>
  event._embedded?.attractions?.[0]?.name || event.name || "Unknown artist";

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
    .map(withTicketmasterDate)
    .filter((item) => item.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);
}

// A mesma forma, para a home: filtra por cidade da venue em vez de nome do artista.
// sameCity=false pega o resto do raio de 50km, pra "Concerts Near X" não repetir
// as linhas de "Upcoming Concerts" de X.
export function getUpcomingConcertsByCity(events = [], cityName, sameCity = true, center) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((item) => {
      const start = item.dates?.start;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(start?.localDate || "") ||
        start.dateTBD ||
        start.dateTBA ||
        item.dates?.status?.code === "cancelled"
      )
        return false;
      const venueCity = item._embedded?.venues?.[0]?.city?.name;
      if (!venueCity || !cityName) return false;
      if (!sameCity && center) {
        const location = item._embedded?.venues?.[0]?.location;
        const km = distanceKm(location?.latitude, location?.longitude, center.lat, center.long);
        if (km === null || km > 50) return false;
      }
      const normalize = (value) =>
        value
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();
      return sameCity
        ? normalize(venueCity) === normalize(cityName)
        : normalize(venueCity) !== normalize(cityName);
    })
    .map(withTicketmasterDate)
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
    venue: ev._embedded?.venues?.[0]?.name || "",
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

// A atração do artista, casada pelo nome: o /suggest às vezes devolve um tributo ou banda de
// abertura primeiro. Sem par, nada — foto, gênero, sociais e Spotify de outro artista são
// piores que um card vazio.
export function getArtistAttraction(ticketmaster, artist) {
  return ticketmaster?.attractions?.find((a) => a.name === artist);
}

// Única fonte do Genres: gênero e subgênero da classificação primária da Ticketmaster, que já
// vem na prop, sem requisição. O MusicBrainz (top 4 por tag) saiu em ae0abbf — mais rico, mas
// lento, e o dono preferiu assim. "Undefined" é o "sem essa informação" da Ticketmaster.
export function getTicketmasterGenres(attraction) {
  const classification = attraction?.classifications?.find((c) => c.primary);

  return [...new Set([classification?.genre?.name, classification?.subGenre?.name])].filter(
    (name) => name && name !== "Undefined",
  );
}

// A future show can be listed before anybody adds songs to its setlist.
export function getRecentUpcomingSetlists(shows = [], city, countryCode, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const normalize = (value) =>
    (value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  return shows
    .filter((show) => /^\d{2}-\d{2}-\d{4}$/.test(show.eventDate || ""))
    .map((show) => ({ ...show, dateObj: parseSetlistDate(show.eventDate) }))
    .filter(
      (show) =>
        show.dateObj >= today &&
        normalize(show.venue?.city?.name) === normalize(city) &&
        (!countryCode || normalize(show.venue?.city?.country?.code) === normalize(countryCode)),
    )
    .sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));
}
