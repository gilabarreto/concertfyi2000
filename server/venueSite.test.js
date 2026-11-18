const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createSiteAbout,
  descriptionFrom,
  looksLikeProse,
  robotsAllow,
  publicUrl,
} = require("./venueSite");

const LONG = "The Arrowhead is a live music bar in Calgary with shows every night of the week.";
const page = (head) => `<html><head>${head}</head><body>x</body></html>`;
const fakeFetch =
  (routes, calls = []) =>
  async (url, options) => {
    calls.push({ url, ua: options.headers["User-Agent"] });
    const [status, body, type = "text/html; charset=utf-8"] = routes[url] || [404, ""];
    return {
      status,
      ok: status < 400,
      headers: { get: () => type },
      text: async () => body,
    };
  };

test("reads og:description first, then meta description, then JSON-LD, decoding entities", () => {
  assert.equal(
    descriptionFrom(
      page(
        `<meta name="description" content="b"><meta property="og:description" content="Rock &amp; roll &#39;til late">`,
      ),
    ),
    "Rock & roll 'til late",
  );
  assert.equal(descriptionFrom(page(`<meta content='only meta' name='description'>`)), "only meta");
  assert.equal(
    descriptionFrom(
      page(
        `<script type="application/ld+json">{"@type":"MusicVenue","description":"From \\"JSON\\""}</script>`,
      ),
    ),
    'From "JSON"',
  );
  assert.equal(descriptionFrom(page("<title>x</title>")), "");
});

test("robots.txt: our group or *, longest rule wins", () => {
  assert.equal(robotsAllow("User-agent: *\nDisallow: /", "/"), false);
  assert.equal(robotsAllow("User-agent: Googlebot\nDisallow: /", "/"), true);
  assert.equal(robotsAllow("User-agent: ConcertFYI\nDisallow: /", "/"), false);
  assert.equal(robotsAllow("User-agent: *\nDisallow: /admin\n", "/"), true);
  assert.equal(robotsAllow("User-agent: *\nDisallow: /\nAllow: /$", "/"), true);
  assert.equal(robotsAllow("User-agent: *\nDisallow:\n", "/"), true);
});

test("only public http(s) names are fetched", () => {
  assert.ok(publicUrl("https://thearrowhead.ca/"));
  for (const bad of [
    "ftp://x.ca",
    "http://127.0.0.1",
    "http://localhost",
    "http://x.ca:8080",
    "http://[::1]/",
    "nonsense",
  ])
    assert.equal(publicUrl(bad), null, bad);
});

test("identified, one page, honours robots.txt", async () => {
  const calls = [];
  const about = createSiteAbout({
    fetchImpl: fakeFetch(
      {
        "https://a.example/robots.txt": [200, "User-agent: *\nDisallow: /private"],
        "https://a.example/": [200, page(`<meta name="description" content="${LONG}">`)],
      },
      calls,
    ),
  });
  assert.equal(await about("https://a.example/"), LONG);
  assert.deepEqual(
    calls.map((c) => c.url),
    ["https://a.example/robots.txt", "https://a.example/"],
  );
  assert.ok(calls.every((c) => c.ua.startsWith("ConcertFYI/1.0")));

  const blocked = [];
  const refused = createSiteAbout({
    fetchImpl: fakeFetch(
      { "https://b.example/robots.txt": [200, "User-agent: *\nDisallow: /"] },
      blocked,
    ),
  });
  assert.equal(await refused("https://b.example/"), "");
  assert.equal(blocked.length, 1, "the page itself is never requested");
});

test("too short, not HTML or missing is no About; a server error throws to retry later", async () => {
  const about = createSiteAbout({
    fetchImpl: fakeFetch({
      "https://short.example/": [200, page(`<meta name="description" content="Home">`)],
      "https://pdf.example/": [200, LONG, "application/pdf"],
      "https://down.example/": [503, ""],
    }),
  });
  assert.equal(await about("https://short.example/"), "");
  assert.equal(await about("https://pdf.example/"), "");
  assert.equal(await about("https://gone.example/"), "");
  await assert.rejects(about("https://down.example/"));
});

test("event listings and keyword lists are not an About (real Calgary sites)", () => {
  assert.equal(looksLikeProse(LONG), true);
  assert.equal(
    looksLikeProse(
      "JONAH KAGENMay 21, 2027CalgaryMacEwan HallBuy TicketOCEAN ALLEY – North America",
    ),
    false,
  );
  assert.equal(
    looksLikeProse("Victorian themed pub Ottawa,Canadian pub live music,gastropub menu Canada"),
    false,
  );
});
