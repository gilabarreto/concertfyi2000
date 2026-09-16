// O GitHub Pages devolve 404 para qualquer caminho que não tenha arquivo — inclusive os que o
// nosso próprio sitemap anuncia. O `404.html` faz o app abrir mesmo assim, então olhando a tela
// ninguém percebe; o que chega ao Googlebot é o status, e 404 não se indexa. Medido em
// 2026-09-15: `/about` e `/contact` estavam nesta situação.
//
// A correção é uma cópia do `index.html` por rota. A lista vem do próprio sitemap de propósito:
// rota anunciada e arquivo emitido não podem divergir se são a mesma lista.
//
// `/artists/:id/concerts/:id` continua fora — é infinita e não dá para enumerar. Essas URLs
// seguem servidas pelo `404.html` com status 404, o que é o motivo de elas não estarem no
// sitemap. Resolver isso é pre-render ou SSR, decisão de outro tamanho.
import { readFileSync, writeFileSync } from "node:fs";

export const routesFromSitemap = (xml) =>
  [...xml.matchAll(/<loc>\s*(\S+?)\s*<\/loc>/g)]
    .map(([, loc]) => new URL(loc).pathname.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

if (import.meta.filename === process.argv[1]) {
  const html = readFileSync("dist/index.html");
  const routes = routesFromSitemap(readFileSync("public/sitemap.xml", "utf8"));

  for (const route of routes) writeFileSync(`dist/${route}.html`, html);
  console.log(`static routes: ${routes.map((r) => `/${r}`).join(", ") || "none"}`);
}
