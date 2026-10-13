import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router"],
  },
  ssr: {
    noExternal: ["react-datepicker", "clsx"],
  },
  server: {
    watch: {
      ignored: [
        "**/build/**",
        "**/dist/**",
        "**/.react-router/**",
        /\.(zip|tar\.gz|rar|7z)$/i,
        "*.zip",
        "**/*.zip",
        "**/*.tar.gz",
        "**/*.rar",
      ],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

