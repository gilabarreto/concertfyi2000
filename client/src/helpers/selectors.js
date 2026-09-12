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