import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

  return {
    base: isGitHubPages ? "/Tracetech/" : "/",
    server: {
      host: "127.0.0.1",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4173,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-react";
              }
              if (id.includes("recharts") || id.includes("d3-")) {
                return "vendor-charts";
              }
              if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("class-variance-authority")) {
                return "vendor-ui";
              }
              if (id.includes("@supabase") || id.includes("@tanstack/react-query")) {
                return "vendor-data";
              }
            }
            return undefined;
          },
        },
      },
    },
  };
});
