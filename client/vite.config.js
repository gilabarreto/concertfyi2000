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
  // data:/blob: são os tiles e ícones que o Maps desenha em memória.
  "img-src 'self' data: blob: https://s1.ticketm.net https://maps.googleapis.com https://maps.gstatic.com https://*.ggpht.com https://*.googleusercontent.com",
  "connect-src 'self' https://concertfyi2000.onrender.com https://maps.googleapis.com https://api.spotify.com https://formspree.io https://photon.komoot.io https://nominatim.openstreetmap.org",
  "frame-src https://open.spotify.com https://www.youtube.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Só no build: em desenvolvimento o Vite injeta script inline e abre um WebSocket de HMR,
// que esta política barra. O <meta> entra antes de o build copiar o index.html para o
// 404.html e para as cópias por rota, então as quatro saem com a política.
const cspMeta = {
  name: "csp-meta",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace(
      "<head>",
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
    ),
};

export default defineConfig({
  plugins: [react(), cspMeta],
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
      // the server mounts its routes under /api too, so the path passes through as-is
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
