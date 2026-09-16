// node --test
import { test } from "node:test";
import assert from "node:assert";
import { findTrackUri } from "./spotifyPlaylist.js";

// A busca da Spotify, de mentira. Só o que findTrackUri lê.
const stubSearch = (items, { ok = true, status = 200 } = {}) => {
  global.fetch = async () => ({
    ok,
    status,
    json: async () => ({ tracks: { items } }),
  });
};

const track = (name, artistNames, uri) => ({
  name,
  uri,
  artists: artistNames.map((n) => ({ name: n })),
});

test("findTrackUri: artista certo e nome exato entram na playlist", async () => {
  stubSearch([track("Creep", ["Radiohead"], "spotify:track:creep")]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), "spotify:track:creep");
});

test("findTrackUri: o casamento de nome e artista ignora maiúscula", async () => {
  stubSearch([track("CREEP", ["RADIOHEAD"], "spotify:track:creep")]);
  assert.strictEqual(await findTrackUri("tok", "radiohead", "creep"), "spotify:track:creep");
});

test("findTrackUri: artista certo e nome contido também passa (50+25)", async () => {
  stubSearch([track("Creep - Live at Glastonbury", ["Radiohead"], "spotify:track:live")]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), "spotify:track:live");
});

test("findTrackUri: artista certo e nome sem relação não chega a 70 — devolve null", async () => {
  // 50 de artista e nada de nome. Entrar aqui seria pôr música errada na playlist
  // de alguém; o corte existe para preferir faltar a errar.
  stubSearch([track("Karma Police", ["Radiohead"], "spotify:track:karma")]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), null);
});

test("findTrackUri: nome exato mas de outro artista devolve null", async () => {
  // Cover de terceiro. Sem o artista, o placar é 0.
  stubSearch([track("Creep", ["Some Cover Band"], "spotify:track:cover")]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), null);
});

test("findTrackUri: entre vários candidatos fica com o de maior placar", async () => {
  stubSearch([
    track("Creep - Live", ["Radiohead"], "spotify:track:live"), // 75
    track("Creep", ["Radiohead"], "spotify:track:studio"), // 90
    track("Creep", ["Cover Band"], "spotify:track:cover"), // 0
  ]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), "spotify:track:studio");
});

test("findTrackUri: busca vazia devolve null em vez de estourar", async () => {
  stubSearch([]);
  assert.strictEqual(await findTrackUri("tok", "Radiohead", "Creep"), null);
});

test("findTrackUri: resposta de erro vira exceção com status", async () => {
  stubSearch([], { ok: false, status: 401 });
  await assert.rejects(findTrackUri("tok", "Radiohead", "Creep"), (err) => {
    // O 401 é o que faz queries.js limpar o token expirado.
    assert.strictEqual(err.status, 401);
    return true;
  });
});
