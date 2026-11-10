// Entrada do Render. O Cloudflare entra por worker.mjs; os dois servem o mesmo app.
const app = require("./app");
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
