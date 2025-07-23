const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  "https://gilabarreto.github.io",
  "https://concertfyi.com",
  "http://localhost:3000",
];

app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


app.use("/api/ticketmaster", require("./routes/ticketmaster"));
app.use("/api/setlist", require("./routes/setlist"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

console.log("SETLISTFM_API_KEY:", process.env.SETLISTFM_API_KEY);
console.log("TICKETMASTER_API_KEY:", process.env.TICKETMASTER_API_KEY);