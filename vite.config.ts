import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [tsconfigPaths()],
    base: "/rdf-visual-transform",
});
