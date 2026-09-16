import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routesFromSitemap } from "./static-routes.mjs";

test("pega o caminho de cada <loc> e ignora a raiz, que já é o index.html", () => {
  const xml = `<urlset>
    <url><loc>https://concertfyi.com/</loc></url>
    <url><loc>https://concertfyi.com/about</loc></url>
    <url><loc>https://concertfyi.com/contact</loc></url>
  </urlset>`;

  assert.deepEqual(routesFromSitemap(xml), ["about", "contact"]);
});

test("barra no fim e espaço em volta da URL dão o mesmo arquivo", () => {
  const xml = "<url><loc>\n  https://concertfyi.com/about/\n</loc></url>";

  assert.deepEqual(routesFromSitemap(xml), ["about"]);
});

// O sitemap de verdade. Não fixo a lista aqui — ela pode crescer —, fixo a forma que o script
// sabe escrever: um segmento só, porque a saída é `dist/<rota>.html`. Rota aninhada precisaria
// de `mkdir` e hoje estouraria no build. Estourar no CI antes do deploy é aceitável; passar e
// virar 404 em produção, que é o que aconteceu, não.
test("as rotas anunciadas no sitemap do projeto têm a forma que o script escreve", () => {
  const routes = routesFromSitemap(
    readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  );

  assert.ok(routes.length > 0, "sitemap sem rota nenhuma além da raiz");
  for (const route of routes) assert.doesNotMatch(route, /\//, `rota aninhada: ${route}`);
});
