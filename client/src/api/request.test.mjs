// node --test client/src/api/request.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert";
import { request } from "./request.js";

const calls = [];
const realFetch = global.fetch;

beforeEach(() => {
  calls.length = 0;
  global.fetch = realFetch;
});

// Resposta falsa no formato mínimo que o `request` consome.
const respondWith = ({ ok = true, status = 200, body = {} } = {}) => {
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok, status, json: async () => body };
  };
};

test("monta a querystring e devolve o corpo em { data }, como o axios devolvia", async () => {
  respondWith({ body: { setlist: ["x"] } });

  const got = await request("https://api.test/setlist/search", {
    params: { artistName: "Sigur Rós" },
  });

  assert.deepStrictEqual(got, { data: { setlist: ["x"] } });
  // Encodado, não concatenado à mão: acento e espaço passam inteiros.
  assert.strictEqual(calls[0].url, "https://api.test/setlist/search?artistName=Sigur+R%C3%B3s");
});

test("parâmetro undefined ou null some da URL em vez de virar a string 'undefined'", async () => {
  respondWith();

  await request("https://api.test/events", { params: { lat: -23.5, long: undefined, q: null } });

  assert.strictEqual(calls[0].url, "https://api.test/events?lat=-23.5");
});

test("sem params não sobra '?' pendurado na URL", async () => {
  respondWith();

  await request("https://api.test/health");

  assert.strictEqual(calls[0].url, "https://api.test/health");
});

test("status fora do 2xx vira erro com status e corpo — o fetch sozinho não rejeitaria", async () => {
  respondWith({ ok: false, status: 401, body: { message: "Token expired" } });

  // É este `status` que o queries.js lê para limpar o token do Spotify.
  await assert.rejects(request("https://api.test/token"), (err) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.status, 401);
    assert.strictEqual(err.message, "Token expired");
    assert.deepStrictEqual(err.data, { message: "Token expired" });
    return true;
  });
});

test("lê o `error` do nosso servidor, não só o `message` de terceiro", async () => {
  // As dez rotas do server/ respondem `{ error }`. O axios só olhava `message`, então
  // todo erro do nosso próprio proxy chegava ao log como o genérico "Request failed".
  respondWith({ ok: false, status: 400, body: { error: "Missing artist or song parameter" } });

  await assert.rejects(request("https://api.test/lyrics"), (err) => {
    assert.strictEqual(err.message, "Missing artist or song parameter");
    return true;
  });
});

test("erro sem corpo JSON mantém o status e não estoura no parse", async () => {
  // Um 502 do proxy vem em HTML. O status é a informação útil; perdê-lo num
  // SyntaxError seria trocar "o servidor caiu" por "erro de sintaxe".
  global.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  });

  await assert.rejects(request("https://api.test/setlist"), (err) => {
    assert.strictEqual(err.status, 502);
    assert.strictEqual(err.message, "Request failed");
    assert.strictEqual(err.data, null);
    return true;
  });
});

test("falha de rede não tem status — é assim que quem trata erro distingue os dois casos", async () => {
  global.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(request("https://api.test/setlist"), (err) => {
    assert.strictEqual(err.status, undefined);
    assert.strictEqual(err.message, "Failed to fetch");
    return true;
  });
});

test("timeout é anunciado como timeout, não como 'No response received'", async () => {
  global.fetch = async () => {
    throw Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" });
  };

  await assert.rejects(request("https://api.test/setlist"), (err) => {
    assert.strictEqual(err.message, "Request timed out");
    return true;
  });
});

test("o timeout chega ao fetch como AbortSignal, não como opção ignorada em silêncio", async () => {
  respondWith();

  await request("https://api.test/setlist", { timeout: 10_000 });

  assert.ok(calls[0].options.signal instanceof AbortSignal);
});
