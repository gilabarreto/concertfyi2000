// node --test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createStore } = require("./store");

// D1 de mentira: só o prepare().bind().first()/run() que o store usa.
const fakeD1 = ({ broken = false } = {}) => {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (broken) throw new Error("d1 down");
              const row = rows.get(args[0]);
              return row ? { value: row.value, expires_at: row.expires_at } : null;
            },
            async run() {
              if (broken) throw new Error("d1 down");
              if (sql.startsWith("INSERT")) rows.set(args[0], { value: args[1], expires_at: args[2] });
            },
          };
        },
      };
    },
  };
};

const counter = (value) => {
  const load = async () => (load.calls++, typeof value === "function" ? value() : value);
  load.calls = 0;
  return load;
};

test("guarda e devolve do banco antes do prazo", async () => {
  const db = fakeD1();
  const { cached } = createStore({ db, now: () => 1000 });
  const load = counter({ a: 1 });

  assert.deepEqual(await cached("k", 60, load), { a: 1 });
  assert.deepEqual(await cached("k", 60, load), { a: 1 });
  assert.equal(load.calls, 1);
  assert.equal(db.rows.get("k").expires_at, 1060);
});

test("vencido: checa a fonte e troca quando ela responde", async () => {
  let t = 1000;
  const { cached } = createStore({ db: fakeD1(), now: () => t });
  await cached("k", 60, async () => "velho");
  t = 2000;
  assert.equal(await cached("k", 60, async () => "novo"), "novo");
  assert.equal(await cached("k", 60, async () => "outro"), "novo");
});

test("vencido e fonte falhou: devolve o antigo e não apaga", async () => {
  let t = 1000;
  const db = fakeD1();
  const { cached } = createStore({ db, now: () => t });
  await cached("k", 60, async () => "velho");
  t = 2000;
  assert.equal(await cached("k", 60, async () => { throw new Error("fonte fora"); }), "velho");
  assert.equal(db.rows.get("k").value, JSON.stringify("velho"));
});

test("vencido e resultado parcial: keep recusa, devolve o antigo", async () => {
  let t = 1000;
  const { cached } = createStore({ db: fakeD1(), now: () => t });
  const keep = (v) => !v.partial;
  await cached("k", 60, async () => ({ v: 1 }), { keep });
  t = 2000;
  assert.deepEqual(await cached("k", 60, async () => ({ v: 2, partial: true }), { keep }), { v: 1 });
});

test("sem antigo: parcial é devolvido mas não guardado; erro propaga", async () => {
  const db = fakeD1();
  const { cached } = createStore({ db, now: () => 1000 });
  assert.deepEqual(await cached("k", 60, async () => ({ partial: true }), { keep: (v) => !v.partial }), { partial: true });
  assert.equal(db.rows.size, 0);
  await assert.rejects(cached("x", 60, async () => { throw new Error("boom"); }), /boom/);
});

test("D1 com erro: cai direto para a fonte", async () => {
  const { cached } = createStore({ db: fakeD1({ broken: true }) });
  const load = counter("da fonte");
  assert.equal(await cached("k", 60, load), "da fonte");
  assert.equal(await cached("k", 60, load), "da fonte");
  assert.equal(load.calls, 2);
});

test("sem banco (Node): Map em memória com o mesmo contrato", async () => {
  let t = 1000;
  const { cached } = createStore({ now: () => t });
  const load = counter("x");
  await cached("k", 60, load);
  await cached("k", 60, load);
  assert.equal(load.calls, 1);
  t = 2000;
  assert.equal(await cached("k", 60, async () => { throw new Error("fora"); }), "x");
});

test("o prazo pode depender do resultado (achado 30 dias, não achado 7)", async () => {
  const db = fakeD1();
  const { cached } = createStore({ db, now: () => 0 });
  const ttl = (v) => (v ? 30 : 7);
  await cached("achado", ttl, async () => "x");
  await cached("nada", ttl, async () => null);
  assert.equal(db.rows.get("achado").expires_at, 30);
  assert.equal(db.rows.get("nada").expires_at, 7);
  assert.equal(await cached("nada", ttl, async () => "não deveria"), null);
});
