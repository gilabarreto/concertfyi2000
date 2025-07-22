const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "https://gilabarreto.github.io" }));

// Rotas internas
app.use("/api/dashboard", require("./routes/dashboard"));

// Rotas proxy para APIs externas
app.use("/api/ticketmaster", require("./routes/ticketmaster"));
app.use("/api/setlist", require("./routes/setlist"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
