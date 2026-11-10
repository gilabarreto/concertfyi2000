// Entrada do Cloudflare Workers: o mesmo Express do Render, servido pelo adaptador
// node:http do Workers. A porta é interna — só liga o listen ao handler.
import { httpServerHandler } from "cloudflare:node";
import app from "./app.js";

app.listen(4000);
export default httpServerHandler({ port: 4000 });
