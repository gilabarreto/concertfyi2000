export function getLastConcertsByArtist(setlist = [], artistId) {

  const sortedSetlist = setlist
    .filter(item => item.artist.mbid === artistId)
    .filter(item => {
      const [d, m, y] = item.eventDate.split("-");
      return new Date(y, m - 1, d) <= new Date();
    })
    .map(item => {
      const [d, m, y] = item.eventDate.split("-");
      return { ...item, dateObj: new Date(y, m - 1, d) };
    })
    .sort((a, b) => a.dateObj - b.dateObj).slice().reverse()

    return sortedSetlist;
}

export function getBestImage(images = []) {
  if (!images.length) return null;
  const ratio169 = images.filter(img => img.ratio === '16_9');
  if (ratio169.length) {
    return ratio169.reduce((max, img) => (img.width > max.width ? img : max)).url;
  }
  return images.reduce((max, img) =>
    img.width * img.height > max.width * max.height ? img : max
  ).url;
}

export function ticketFinder(ticketmasterData) {

  const lastConcerts = ticketmasterData?.events?.map((lastConcert) => {
    return lastConcert.dates.start.localDate
  }).sort()

  const tickets = ticketmasterData?.events?.map((lastConcert, index) => {

    if (lastConcert?.dates?.start?.localDate === lastConcerts[index]?.dates?.start?.localDate) {
      return null
    }
    return lastConcert?.url
  })

  return tickets
}

export function latitudeFinder(ticketmasterData) {

  const lastConcerts = ticketmasterData?.events?.map((lastConcert) => {
    return lastConcert.dates.start.localDate
  }).sort()

  const latitude = ticketmasterData?.events?.find((lastConcert) => {
    if (!lastConcerts[0]) {
      return null
    }
    return lastConcert.dates.start.localDate === lastConcerts[0]
  })

  const result = latitude?._embedded?.venues[0].location.latitude

  return result;
}

export function longitudeFinder(ticketmasterData) {

  const lastConcerts = ticketmasterData?.events?.map((lastConcert) => {
    return lastConcert.dates.start.localDate
  }).sort()

  const longitude = ticketmasterData?.events?.find((lastConcert) => {
    if (!lastConcerts[0]) {
      return null
    }
    return lastConcert.dates.start.localDate === lastConcerts[0]
  })

  const result = longitude?._embedded?.venues[0].location.longitude

  return result;
}