import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import VitePWAOptions from "./VitePWAOptions";

export default defineConfig({
    plugins: [
        VitePWA(VitePWAOptions)
    ]
})