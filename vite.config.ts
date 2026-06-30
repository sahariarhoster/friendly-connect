// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
    // cPanel's Node environment breaks Nitro's file tracer when it sees `tslib`.
    // Do not fully bundle every package (that breaks Radix SSR); only force `tslib`
    // into the server bundle and exclude it from Nitro's traced dependency list.
    noExternals: ["tslib"],
    traceDeps: ["!tslib"],
  } as { preset: string; noExternals: string[]; traceDeps: string[] },
});
