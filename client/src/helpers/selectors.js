export function getLastConcertsByArtist(setlist = [], artistId) {
  const now = new Date();

  return setlist
    .filter((item) => item.artist.mbid === artistId)
    .map((item) => {
      const [d, m, y] = item.eventDate.split("-");
      return { ...item, dateObj: new Date(y, m - 1, d) };
    })
    .filter((item) => item.dateObj <= now)
    .sort((a, b) => b.dateObj - a.dateObj);
}

// A irmã da de cima, para o outro lado da linha do tempo. As duas APIs não
// compartilham id nenhum: Setlist.fm casa com Ticketmaster pelo nome do artista,
// e as datas vêm em formatos trocados — DD-MM-YYYY lá, YYYY-MM-DD aqui.
export function getNextConcertsByArtist(events = [], artistName) {
  return events
    .filter((item) => item._embedded?.attractions?.some((a) => a.name === artistName))
    .map((item) => {
      const [year, month, day] = item.dates.start.localDate.split("-");
      return { ...item, dateObj: new Date(year, month - 1, day) };
    })
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
