// node --test client/src/i18n.test.mjs
//
// Every t("…") in the client must have an entry in each dictionary, keep its {placeholders},
// and no dictionary may keep entries the code no longer asks for. Only literal keys count:
// t(variable) can't be checked, so the code doesn't do it.

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = new URL(".", import.meta.url).pathname;
const files = readdirSync(src, { recursive: true }).filter((file) => /\.jsx?$/.test(file));
const keys = new Set();
for (const file of files) {
  const code = readFileSync(join(src, file), "utf8");
  for (const [, key] of code.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g))
    keys.add(JSON.parse(`"${key}"`));
}
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();

test("the client asks for translations", () => {
  assert.ok(keys.size > 50, `only ${keys.size} t("…") calls found`);
});

for (const lang of ["pt", "es", "fr"]) {
  test(`${lang} translates every string, keeps placeholders, and has nothing stale`, () => {
    const dictionary = JSON.parse(readFileSync(join(src, "locales", `${lang}.json`), "utf8"));
    const missing = [...keys].filter((key) => !dictionary[key]);
    assert.deepStrictEqual(missing, [], `${lang}.json is missing translations`);
    const stale = Object.keys(dictionary).filter((key) => !keys.has(key));
    assert.deepStrictEqual(stale, [], `${lang}.json has entries no t("…") uses`);
    for (const key of keys)
      assert.deepStrictEqual(placeholders(dictionary[key]), placeholders(key), `${lang}: ${key}`);
  });
}
