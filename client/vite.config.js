import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Cada origem daqui foi vista sendo contatada pelo app rodando, não deduzida do código.
// O GitHub Pages não deixa mandar cabeçalho de resposta, então a política vai por <meta>,
// e isso custa três coisas que <meta> ignora: frame-ancestors, report-uri e sandbox.
// Sem frame-ancestors não há defesa de clickjacking — está registrado no CONSTRAINTS.md.
const csp = [
  "default-src 'self'",
  // o loader do Google Maps injeta o próprio <script>
  "script-src 'self' https://maps.googleapis.com",
  // 'unsafe-inline' é obrigatório: React escreve style="" nos elementos (o carrossel move
  // cada slide por transform inline) e o Maps também. Nonce não alcança atributo style.
  // fonts.googleapis.com não é nosso — é a folha do Roboto que o Maps puxa sozinho.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 'self' é a DM Sans daqui; gstatic é o Roboto que a folha do Maps pede.
  "font-src 'self' https://fonts.gstatic.com",
  // data:/blob: são os tiles e ícones que o Maps desenha em memória. www.google.com é o
  // serviço de favicon que o VendorTiles usa pros logos de vendor (Ticketmaster, SeatGeek,
  // Booking.com...) — mas ele só redireciona (301) pra t0-t3.gstatic.com, quem manda a
  // imagem de fato, girando entre os quatro a cada chamada (curl -D - nos cinco vendors:
  // t0, t1, t2, t3, sem padrão fixo). CSP confere cada URL da cadeia de redirect, não só a
  // primeira — daí o wildcard, e daí *.gstatic.com engloba o maps.gstatic.com que já
  // estava aqui, então a entrada específica saiu.
  // Event Art Archive redirects to archive.org and then an archive.org storage host.
  // TheAudioDB and Wikimedia Commons are image-only sources for ArtistInfo and the local API lab.
  "img-src 'self' data: blob: https://s1.ticketm.net https://r2.theaudiodb.com https://upload.wikimedia.org https://maps.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.googleusercontent.com https://www.google.com https://eventartarchive.org https://coverartarchive.org https://archive.org https://*.archive.org",
  "connect-src 'self' https://api.concertfyi.com https://maps.googleapis.com https://api.spotify.com https://formspree.io https://photon.komoot.io",
  "frame-src https://open.spotify.com https://www.youtube.com https://www.google.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// The same policy as a real response header, for the Cloudflare Workers static assets
// (client/wrangler.toml), which read dist/_headers. Build only: in dev Vite injects inline
// script and opens an HMR WebSocket that this policy blocks.
const headersFile = {
  name: "headers-file",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "_headers",
      source: [
        "/*",
        `  Content-Security-Policy: ${csp}; frame-ancestors 'none'`,
        "  X-Content-Type-Options: nosniff",
        "  Referrer-Policy: strict-origin-when-cross-origin",
        // Vite fingerprints everything under /assets, so a changed file is a new name.
        "/assets/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "",
      ].join("\n"),
    });
  },
};

export default defineConfig({
  plugins: [react(), headersFile],
  build: {
    // Teto de bundle do CONSTRAINTS.md. Avisa, não quebra o build.
    // Este número tem de andar junto com a tabela de lá: os dois ratchets de 2026-09-15
    // (430 → 380 → 270) mexeram só no documento, e por dois dias o CONSTRAINTS.md afirmou
    // um teto que ninguém aplicava — sobravam 172 kB de folga silenciosa sobre a entrada.
    chunkSizeWarningLimit: 270,
  },
  server: {
    port: 3000,
    proxy: {
      "/api/": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
