import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
