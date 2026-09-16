// A data do Setlist.fm é DD-MM-YYYY. Sempre monte a partir das partes: passar a
// string "2026-09-16" para o Date é meia-noite UTC pela especificação, e em fuso
// negativo isso é o dia anterior à noite — um show de amanhã cai na lista de
// passados nas últimas horas do dia. Era o que a SearchPage fazia sozinha.
export function parseSetlistDate(eventDate) {
  const [day, month, year] = eventDate.split("-");
  return new Date(year, month - 1, day);
}

export function getLastConcertsByArtist(setlist = [], artistId) {
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
export function getNextConcertsByArtist(events = [], artistName) {
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

export function getBestImage(images = []) {
  if (!images.length) return null;
  const ratio169 = images.filter((img) => img.ratio === "16_9");
  if (ratio169.length) {
    return ratio169.reduce((max, img) => (img.width > max.width ? img : max)).url;
  }
  return images.reduce((max, img) => (img.width * img.height > max.width * max.height ? img : max))
    .url;
}
