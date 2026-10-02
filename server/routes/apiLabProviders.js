const catalog = require('../../client/src/data/apiCatalog.json');
const legacyIds = new Set(['setlistfm', 'musicbrainz', 'eventart', 'coverart', 'ticketmaster', 'audiodb', 'lastfm', 'listenbrainz', 'youtube', 'acoustid', 'apple', 'spotify', 'songkick', 'myshowposter', 'concertcollect', 'commons', 'wikidata', 'wikipedia', 'archive', 'github']);
const providers = catalog.filter(({ id }) => !legacyIds.has(id));

// Only public event fields are returned from authenticated organizer catalogs.
function publicEvents(data, provider) {
  const events = Array.isArray(data) ? data : data.events || data.data || [];
  return { provider, events: events.filter((event) => event.private_event !== true && event.private_event !== 1 && event.private_event !== '1' && event.listed !== false).slice(0, 5).map((event) => ({
    id: event.id, name: event.name?.text || event.name || event.title,
    start: event.start?.local || event.start_date, end: event.end?.local || event.end_date,
    url: event.url || event.link, image: event.logo?.url || event.image,
    venue: event.venue ? { name: event.venue.name, address: event.venue.address } : event.address,
  })) };
}

async function probeProvider(info, { fetchJson, env }) {
  const { id, name } = info;
  const result = { id, name, endpoint: info.docsUrl, status: 'unavailable', note: info.suggestion };
  const requireKeys = (...keys) => keys.every((key) => env[key]) || (result.note = `Configuração necessária no servidor: ${keys.join(', ')}. Nenhuma chamada feita.`, false);
  let call;
  if (id === 'jambase' && requireKeys('JAMBASE_API_KEY')) {
    result.endpoint = 'GET /v3/events · Sepultura · BR';
    call = () => fetchJson('https://api.data.jambase.com/v3/events', { headers: { Authorization: `Bearer ${env.JAMBASE_API_KEY}` }, params: { artistName: 'Sepultura', geoCountryIso2: 'BR', perPage: 5 } });
  } else if (id === 'ticketmaster-events' && requireKeys('TICKETMASTER_API_KEY')) {
    result.endpoint = 'GET /discovery/v2/events.json · Foo Fighters · BR';
    call = () => fetchJson('https://app.ticketmaster.com/discovery/v2/events.json', { params: { apikey: env.TICKETMASTER_API_KEY, keyword: 'Foo Fighters', countryCode: 'BR', classificationName: 'music', size: 5, sort: 'date,asc', startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') } });
  } else if (id === 'bandsintown' && requireKeys('BANDSINTOWN_APP_ID', 'BANDSINTOWN_ARTIST')) {
    result.endpoint = 'GET /artists/{authorized-artist}/events';
    call = () => fetchJson(`https://rest.bandsintown.com/artists/${encodeURIComponent(env.BANDSINTOWN_ARTIST)}/events/`, { params: { app_id: env.BANDSINTOWN_APP_ID, date: 'upcoming' } });
  } else if (id === 'predicthq' && requireKeys('PREDICTHQ_API_TOKEN')) {
    result.endpoint = 'GET /v1/events/ · Sepultura · BR';
    call = () => fetchJson('https://api.predicthq.com/v1/events/', { headers: { Authorization: `Bearer ${env.PREDICTHQ_API_TOKEN}` }, params: { category: 'concerts', q: 'Sepultura', country: 'BR', limit: 5, 'start.gte': new Date().toISOString().slice(0, 10) } });
  } else if (id === 'seatgeek' && requireKeys('SEATGEEK_CLIENT_ID')) {
    result.endpoint = 'GET /2/events · Sepultura';
    call = () => fetchJson('https://api.seatgeek.com/2/events', { params: { client_id: env.SEATGEEK_CLIENT_ID, q: 'Sepultura', 'taxonomies.name': 'concert', per_page: 5 } });
  } else if (id === 'sympla' && requireKeys('SYMPLA_API_TOKEN')) {
    result.endpoint = 'GET /public/v1.6.0/events · produtor autenticado';
    call = async () => publicEvents(await fetchJson('https://api.sympla.com.br/public/v1.6.0/events', { headers: { s_token: env.SYMPLA_API_TOKEN }, params: { published: 'published', timezone: 'America/Sao_Paulo', sort: 'asc', page_size: 5, fields: 'id,name,start_date,end_date,image,url,address,private_event' } }), 'sympla');
  } else if (id === 'eventbrite' && requireKeys('EVENTBRITE_API_TOKEN', 'EVENTBRITE_ORGANIZATION_ID')) {
    result.endpoint = 'GET /v3/organizations/{organization}/events/';
    call = async () => publicEvents(await fetchJson(`https://www.eventbriteapi.com/v3/organizations/${encodeURIComponent(env.EVENTBRITE_ORGANIZATION_ID)}/events/`, { headers: { Authorization: `Bearer ${env.EVENTBRITE_API_TOKEN}` }, params: { status: 'live', expand: 'venue' } }), 'eventbrite');
  } else if (id === 'lrclib') {
    result.endpoint = 'GET /api/get · Foo Fighters · Everlong';
    call = () => fetchJson('https://lrclib.net/api/get', { params: { artist_name: 'Foo Fighters', track_name: 'Everlong' } });
  } else if (id === 'photon') {
    result.endpoint = 'GET /api/ · São Paulo';
    call = () => fetchJson('https://photon.komoot.io/api/', { params: { q: 'São Paulo', limit: 3 } });
  }
  if (!call) return result;
  try {
    const data = await call();
    // Some providers return errors inside a successful HTTP response.
    if (data?.error || data?.errors) return { ...result, status: 'error', note: 'O provedor retornou um erro. Confira credenciais, permissões e cobertura contratada.' };
    return { ...result, status: 'ok', note: info.suggestion, data };
  } catch (error) {
    return { ...result, status: 'error', note: `Falha na consulta${error.status ? ` (HTTP ${error.status})` : ''}; confira acesso, quota e disponibilidade.` };
  }
}

function redactResults(value, env) {
  const secrets = Object.entries(env).filter(([key, val]) => /API_KEY|API_TOKEN|SECRET|DEVELOPER_TOKEN|APP_ID/.test(key) && typeof val === 'string' && val.length > 3).map(([, val]) => val);
  function walk(item) {
    if (typeof item === 'string') {
      let safe = item.replace(/([?&](?:apikey|api_key|key|app_id|client_secret|access_token|s_token)=)[^&#\s]*/gi, '$1[redacted]');
      for (const secret of secrets) safe = safe.split(secret).join('[redacted]').split(encodeURIComponent(secret)).join('[redacted]');
      return safe;
    }
    if (Array.isArray(item)) return item.map(walk);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, val]) => [key, /^(access_token|refresh_token|client_secret|authorization|s_token|apikey|api_key)$/i.test(key) ? '[redacted]' : walk(val)]));
    return item;
  }
  return walk(value);
}
module.exports = { providers, probeProvider, publicEvents, redactResults };
