const express = require("express");
const cors = require("cors");
const { rateLimit } = require("./rateLimit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// O Render serve atrás de um proxy. Sem isto req.ip é o IP do proxy para todo
// mundo, e o rate limit abaixo passa a contar o site inteiro como um visitante só.
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://gilabarreto.github.io",
  "https://concertfyi.com",
  "http://localhost:3000",
];

// Não anuncia o framework para quem só quer saber o que é vulnerável aqui dentro.
app.disable("x-powered-by");

app.use(express.json());

// Toda resposta daqui é JSON. O nosniff impede que o navegador resolva tratar uma
// delas como HTML e execute o que veio de terceiro dentro do nosso domínio.
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// CORS decide o que o navegador deixa o JS ler; curl ignora e a rota roda igual.
// Uma busca no YouTube custa 100 de uma cota diária de 10.000, então 100 chamadas
// num laço apagam letra e vídeo para os usuários reais até a virada do dia.
// 60/min é folgado para uso de verdade (uma sessão ativa faz ~15) e fecha o laço.
app.use("/api", rateLimit({ windowMs: 60_000, max: 60 }));

app.use("/api/ticketmaster", require("./routes/ticketmaster"));
app.use("/api/setlist", require("./routes/setlist"));
app.use("/api/spotify", require("./routes/spotify"));
app.get("/api/lyrics", require("./routes/lyrics"));
app.get("/api/youtube", require("./routes/youtube"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});