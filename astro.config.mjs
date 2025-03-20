// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  base: "inky500",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    svelte(),
  ],
});
