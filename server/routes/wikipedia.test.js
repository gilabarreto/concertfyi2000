const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createWikipediaHandler } = require("./wikipedia");

async function call(fetchJson, artist) {
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    set() { return this; },
    json(body) { this.body = body; return this; },
  };
  await createWikipediaHandler({ fetchJson })({ query: { artist } }, res);
  return res;
}

test("Wikipedia summary exposes plain biography and canonical source link", async () => {
  const res = await call(async (url) => {
    assert.ok(url.endsWith("/Foo_Fighters"));
    return { title: "Foo Fighters", description: "American rock band", extract: "Biography.", extract_html: "<script>bad</script>" };
  }, "Foo Fighters");
  assert.deepEqual(res.body, { title: "Foo Fighters", description: "American rock band", extract: "Biography.", imageUrl: "", pageUrl: "https://en.wikipedia.org/wiki/Foo_Fighters" });
});

test("non-musical namesake is skipped in favor of band article", async () => {
  const urls = [];
  const res = await call(async (url) => {
    urls.push(url);
    return urls.length === 1
      ? { title: "Phoenix", description: "Mythical bird", extract: "Wrong subject" }
      : { title: "Phoenix (band)", description: "French indie pop band", extract: "Correct artist" };
  }, "Phoenix");
  assert.equal(urls.length, 2);
  assert.equal(res.body.extract, "Correct artist");
});

test("disambiguation and missing pages produce an explicit empty biography", async () => {
  let count = 0;
  const res = await call(async () => {
    if (++count === 1) return { type: "disambiguation", description: "band", extract: "Ambiguous" };
    throw { status: 404 };
  }, "Unknown");
  assert.equal(res.code, 200);
  assert.equal(res.body.extract, "");
});

test("upstream failure is not presented as absent biography", async () => {
  const res = await call(async () => { throw { status: 503 }; }, "Coldplay");
  assert.equal(res.code, 502);
});

test("invalid artist values never call Wikipedia", async () => {
  for (const artist of [undefined, " ", ["Coldplay"], "x".repeat(201)]) {
    const res = await call(async () => assert.fail("Unexpected request"), artist);
    assert.equal(res.code, 400);
  }
});
