// node --test
const { test } = require("node:test");
const assert = require("node:assert");
const { request } = require("./http");

const stub = (status, body) => {
  global.fetch = async (url, init) => {
    stub.calledWith = { url, init };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
};

test("returns parsed json on success", async () => {
  stub(200, { hello: "world" });
  assert.deepStrictEqual(await request("https://x.test"), { hello: "world" });
});

test("drops empty params so they are not sent as 'undefined'", async () => {
  stub(200, {});
  await request("https://x.test", { params: { keep: "1", a: undefined, b: null, c: "" } });
  assert.strictEqual(stub.calledWith.url, "https://x.test?keep=1");
});

test("throws with status and body on a failed response", async () => {
  stub(429, { message: "slow down" });
  await assert.rejects(request("https://x.test"), (err) => {
    assert.strictEqual(err.status, 429);
    assert.deepStrictEqual(err.data, { message: "slow down" });
    return true;
  });
});

test("survives an error response with a non-json body", async () => {
  global.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError("not json");
    },
  });
  await assert.rejects(request("https://x.test"), (err) => {
    assert.strictEqual(err.status, 502);
    assert.strictEqual(err.data, null);
    return true;
  });
});
