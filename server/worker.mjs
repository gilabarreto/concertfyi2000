// Entrada do Cloudflare Workers: o mesmo Express do Render, servido pelo adaptador
// node:http do Workers. A porta é interna — só liga o listen ao handler.
import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import app from "./app.js";

// Bindings do wrangler.toml que as rotas usam; no Node isto não existe e elas seguem sem.
app.locals.songCache = env.SONG_CACHE;

app.listen(4000);
export default httpServerHandler({ port: 4000 });
