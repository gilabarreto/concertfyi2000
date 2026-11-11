// Uma tabela chave-valor no D1 (SPEC-venues.md). O prazo nunca apaga nada: ele só diz
// quando vale checar a fonte de novo. Se a checagem falha ou volta parcial, o valor
// antigo continua servido e guardado, e a próxima chamada tenta outra vez.
//
// Sem `db` (Node: dev e testes) o mesmo contrato roda num Map em memória, que é o
// comportamento de antes do banco. Erro do D1 nunca derruba a rota: vira chamada à fonte.
// ponytail: sem lock entre isolates — duas visitas simultâneas à mesma venue nova
// carregam duas vezes. Aceitável no tráfego de hoje.

const createStore = ({ db, now = () => Math.floor(Date.now() / 1000) } = {}) => {
  const memory = new Map();

  const read = async (key) => {
    if (!db) return memory.get(key) || null;
    const row = await db.prepare("SELECT value, expires_at FROM store WHERE key = ?").bind(key).first();
    return row ? { value: JSON.parse(row.value), expiresAt: row.expires_at } : null;
  };

  const write = async (key, value, expiresAt) => {
    if (!db) return void memory.set(key, { value, expiresAt });
    await db
      .prepare("INSERT INTO store (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at")
      .bind(key, JSON.stringify(value), expiresAt)
      .run();
  };

  // `ttlSeconds` pode ser função do resultado: "não achado" volta a ser checado antes.
  const cached = async (key, ttlSeconds, load, { keep = () => true } = {}) => {
    let stored = null;
    try {
      stored = await read(key);
    } catch (error) {
      console.error("store read:", error.message);
      return load();
    }
    if (stored && stored.expiresAt > now()) return stored.value;

    let fresh;
    try {
      fresh = await load();
    } catch (error) {
      if (stored) return stored.value;
      throw error;
    }
    if (!keep(fresh)) return stored ? stored.value : fresh;

    try {
      await write(key, fresh, now() + (typeof ttlSeconds === "function" ? ttlSeconds(fresh) : ttlSeconds));
    } catch (error) {
      console.error("store write:", error.message);
    }
    return fresh;
  };

  return { cached };
};

module.exports = { createStore };
