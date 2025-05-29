// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "inky500",
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
