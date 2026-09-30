// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { deflateSync } = require("node:zlib");
const express = require("express");

// Mesmo formato que o client monta em helpers/share.js: JSON → deflate → base64url.
const token = (data) => deflateSync(Buffer.from(JSON.stringify(data))).toString("base64url");

test("/share/:token renders the preview and rejects bad tokens", async (t) => {
  const app = express().use("/share", require("./routes/share"));
  const server = app.listen(0);
  t.after(() => server.close());
  const get = async (path) => {
    const res = await fetch(`http://localhost:${server.address().port}/share/${path}`);
    return { status: res.status, body: await res.text() };
  };

  const ok = await get(
    token({
      target: "https://concertfyi.com/artists/a/b",
      title: "Coldplay setlist",
      description: "D",
      image: "https://s1.ticketm.net/x.jpg",
    }),
  );
  assert.equal(ok.status, 200);
  assert.match(ok.body, /og:image" content="https:\/\/s1\.ticketm\.net\/x\.jpg"/);
  assert.match(ok.body, /Coldplay setlist \| concertfyi/);

  // Imagem fora do CDN da Ticketmaster cai no og-image padrão.
  const foreign = await get(
    token({ target: "https://concertfyi.com/artists/a/b", image: "https://evil.com/x.png" }),
  );
  assert.match(foreign.body, /og:image" content="https:\/\/concertfyi\.com\/og-image\.png"/);

  assert.equal((await get(token({ target: "https://evil.com/artists/a" }))).status, 400);
  assert.equal((await get(token(null))).status, 400);
  assert.equal((await get("not*base64")).status, 400);
  // Bomba de deflate: JSON válido, mas 50 kB descomprimidos passam do maxOutputLength de 12 kB.
  const bomb = token({ target: "https://concertfyi.com/artists/a/b", title: "a".repeat(50000) });
  assert.equal((await get(bomb)).status, 400);
});
