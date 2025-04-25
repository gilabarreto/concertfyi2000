// This function takes in a Ticketmaster data object and returns an array of ticket URLs
export function ticketFinder(ticketmasterData) {

  // Extract an array of upcoming concert dates
  const upcomingConcerts = ticketmasterData?.events?.map((upcomingConcert) => {
    return upcomingConcert.dates.start.localDate
  }).sort()

  // Map over the events and return an array of ticket URLs
  const tickets = ticketmasterData?.events?.map((upcomingConcert, index) => {

    // Check if the current event has the same date as the first upcoming concert
    if (upcomingConcert?.dates?.start?.localDate === upcomingConcerts[index]?.dates?.start?.localDate) {
      return null // If yes, return null
    }
    return upcomingConcert?.url // If not, return the ticket URL
  })

  return tickets // Return the array of ticket URLs
}

// This function takes in a Ticketmaster data object and returns the latitude of the venue for the first upcoming concert
export function latitudeFinder(ticketmasterData) {

  // Extract an array of upcoming concert dates
  const upcomingConcerts = ticketmasterData?.events?.map((upcomingConcert) => {
    return upcomingConcert.dates.start.localDate
  }).sort()

  // Find the event with the same date as the first upcoming concert and return its latitude
  const latitude = ticketmasterData?.events?.find((upcomingConcert) => {
    if (!upcomingConcerts[0]) { // Check if there is at least one upcoming concert
      return null
    }
    return upcomingConcert.dates.start.localDate === upcomingConcerts[0]
  })

  const result = latitude?._embedded?.venues[0].location.latitude

  return result; // Return the latitude
}

// This function takes in a Ticketmaster data object and returns the longitude of the venue for the first upcoming concert
export function longitudeFinder(ticketmasterData) {

  // Extract an array of upcoming concert dates
  const upcomingConcerts = ticketmasterData?.events?.map((upcomingConcert) => {
    return upcomingConcert.dates.start.localDate
  }).sort()

  // Find the event with the same date as the first upcoming concert and return its longitude
  const longitude = ticketmasterData?.events?.find((upcomingConcert) => {
    if (!upcomingConcerts[0]) { // Check if there is at least one upcoming concert
      return null
    }
    return upcomingConcert.dates.start.localDate === upcomingConcerts[0]
  })

  const result = longitude?._embedded?.venues[0].location.longitude

  return result; // Return the longitude
}


// /**
//  * Ordena um array de eventos Ticketmaster pela data de início.
//  * @param {Array} events 
//  * @returns {Array} novos objetos { originalEvent, date, url, venues }
//  */
// function sortEventsByDate(events = []) {
//   return [...events]
//     .map(event => ({
//       originalEvent: event,
//       date: new Date(event.dates.start.localDate),
//       url: event.url,
//       venues: event._embedded?.venues || []
//     }))
//     .sort((a, b) => a.date - b.date);
// }

// /**
//  * Filtra apenas os eventos cujo artista aparece na lista de atrações,
//  * e já os ordena.
//  * @param {Object} ticketmasterData 
//  * @param {string} artistName 
//  * @returns {Array}
//  */
// export function getArtistEvents(ticketmasterData = {}, artistName) {
//   const all = ticketmasterData.events || [];
//   const filtered = all.filter(event =>
//     event._embedded?.attractions?.some(a => a.name === artistName)
//   );
//   return sortEventsByDate(filtered);
// }

// /**
//  * Retorna os próximos eventos (datas > hoje).
//  */
// export function getUpcomingEvents(ticketmasterData, artistName) {
//   const now = Date.now();
//   return getArtistEvents(ticketmasterData, artistName)
//     .filter(item => item.date.getTime() > now);
// }

// /**
//  * Retorna os shows já passados (datas < hoje), mais recentes primeiro.
//  */
// export function getPreviousEvents(ticketmasterData, artistName) {
//   const now = Date.now();
//   return getArtistEvents(ticketmasterData, artistName)
//     .filter(item => item.date.getTime() < now)
//     .sort((a, b) => b.date - a.date);
// }

// /**
//  * Retorna o array de URLs de ingressos dos próximos shows.
//  */
// export function ticketFinder(ticketmasterData, artistName) {
//   return getUpcomingEvents(ticketmasterData, artistName)
//     .map(item => item.url);
// }

// /**
//  * Retorna latitude do primeiro próximo show.
//  */
// export function latitudeFinder(ticketmasterData, artistName) {
//   const next = getUpcomingEvents(ticketmasterData, artistName)[0];
//   return next?.venues[0]?.location?.latitude ?? null;
// }

// /**
//  * Retorna longitude do primeiro próximo show.
//  */
// export function longitudeFinder(ticketmasterData, artistName) {
//   const next = getUpcomingEvents(ticketmasterData, artistName)[0];
//   return next?.venues[0]?.location?.longitude ?? null;
// }

