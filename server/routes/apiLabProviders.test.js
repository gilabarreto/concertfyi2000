const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApiLabHandler } = require('./apiLab');
const { redactResults, publicEvents } = require('./apiLabProviders');
function recorder() { return { statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test('JamBase probe is isolated and authenticates on the server with BR filters', async () => {
  const calls = [];
  const handler = createApiLabHandler({ env: { JAMBASE_API_KEY: 'private-jambase-key', YOUTUBE_API_KEY: 'another-key' }, fetchJson: async (url, options) => { calls.push({ url, options }); return { events: [] }; }, mbRequest: async () => { throw new Error('unrelated call'); } });
  const res = recorder();
  await handler({ query: { source: 'jambase' } }, res);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.data.jambase.com/v3/events');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer private-jambase-key');
  assert.equal(calls[0].options.params.geoCountryIso2, 'BR');
  assert.equal(calls[0].options.params.artistName, 'Sepultura');
  assert.equal(res.body.results[0].status, 'ok');
  assert.ok(!JSON.stringify(res.body).includes('private-jambase-key'));
});

test('credential-gated and documentary sources make no upstream requests', async () => {
  let calls = 0;
  const handler = createApiLabHandler({ env: {}, fetchJson: async () => { calls++; }, mbRequest: async () => { calls++; } });
  for (const source of ['jambase', 'bandsintown', 'predicthq', 'seatgeek', 'sympla', 'eventbrite', 'ingresse', 'eventim', 'ticketmaster-feed']) {
    const res = recorder(); await handler({ query: { source } }, res);
    assert.equal(res.body.results.length, 1);
    assert.equal(res.body.results[0].id, source);
    assert.equal(res.body.results[0].status, 'unavailable');
  }
  assert.equal(calls, 0);
});

test('Bandsintown requires the explicitly configured authorized artist', async () => {
  const calls = [];
  const handler = createApiLabHandler({ env: { BANDSINTOWN_APP_ID: 'private-app-id', BANDSINTOWN_ARTIST: 'Authorized Artist' }, fetchJson: async (url, options) => { calls.push({ url, options }); return []; } });
  const res = recorder(); await handler({ query: { source: 'bandsintown' } }, res);
  assert.equal(calls[0].url, 'https://rest.bandsintown.com/artists/Authorized%20Artist/events/');
  assert.equal(calls[0].options.params.date, 'upcoming');
});

test('organizer events exclude private events and unrelated private payloads', () => {
  const result = publicEvents({ events: [ { id: 'private', listed: false }, { id: 'private-sympla', private_event: '1' }, { id: 'public', name: { text: 'Concert' }, url: 'https://example.com', participants: ['private-person'], orders: ['private-order'], start: { local: '2026-11-01T20:00:00' } } ] }, 'eventbrite');
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].id, 'public');
  assert.equal(result.events[0].name, 'Concert');
  assert.ok(!JSON.stringify(result).includes('private-person'));
  assert.ok(!JSON.stringify(result).includes('private-order'));
});

test('cached inspection response redacts credentials including URLs and nested token fields', () => {
  const result = redactResults({ link: 'https://example.com?apikey=secret%2Bvalue&other=ok', nested: [{ access_token: 'temporary-token', message: 'Bearer secret+value' }] }, { TICKETMASTER_API_KEY: 'secret+value' });
  assert.ok(!JSON.stringify(result).includes('secret'));
  assert.ok(!JSON.stringify(result).includes('temporary-token'));
  assert.ok(result.link.includes('other=ok'));
});

test('provider HTTP and payload errors are errors rather than empty successful catalogs', async () => {
  for (const fetchJson of [async () => { throw Object.assign(new Error('private-key'), { status: 403 }); }, async () => ({ error: 'Access denied private-key' })]) {
    const handler = createApiLabHandler({ env: { JAMBASE_API_KEY: 'private-key' }, fetchJson });
    const res = recorder(); await handler({ query: { source: 'jambase' } }, res);
    assert.equal(res.body.results[0].status, 'error');
    assert.ok(!JSON.stringify(res.body).includes('private-key'));
  }
});


test('organizer payload errors and missing catalog are not successful empty event lists', async () => {
  for (const data of [{ error: 'Access denied' }, {}, null]) {
    const handler = createApiLabHandler({ env: { SYMPLA_API_TOKEN: 'private-token' }, fetchJson: async () => data });
    const res = recorder(); await handler({ query: { source: 'sympla' } }, res);
    assert.equal(res.body.results[0].status, 'error');
  }
});
