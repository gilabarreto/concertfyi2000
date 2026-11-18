const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createReverseGeocodeHandler } = require("./reverseGeocode");

const call = async (handler, query) => {
  const result = { status: 200 };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    set() {
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  await handler({ query }, res);
  return result;
};

test("sends Nominatim the rounded coordinate and caches by it", async () => {
  const sent = [];
  const handler = createReverseGeocodeHandler({
    fetchJson: async (url, options) => {
      sent.push(options.params);
      return { address: { town: "Banff", country: "Canada" } };
    },
  });
  const first = await call(handler, { lat: "51.178364", long: "-115.570769" });
  assert.deepEqual(first.body, { city: "Banff", country: "Canada" });
  await call(handler, { lat: "51.1791", long: "-115.5712" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].lat, "51.18");
  assert.equal(sent[0].lon, "-115.57");
});

test("rejects a bad coordinate without calling Nominatim", async () => {
  let called = false;
  const handler = createReverseGeocodeHandler({
    fetchJson: async () => {
      called = true;
    },
  });
  assert.equal((await call(handler, { lat: "91", long: "0" })).status, 400);
  assert.equal((await call(handler, { lat: "x", long: "0" })).status, 400);
  assert.equal(called, false);
});

test("answers 502 when Nominatim fails", async () => {
  const handler = createReverseGeocodeHandler({
    fetchJson: async () => {
      throw new Error("down");
    },
  });
  assert.equal((await call(handler, { lat: "10", long: "10" })).status, 502);
});
