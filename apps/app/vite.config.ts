import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@stubramp/ui/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    tailwindcss(),
    // Generates routeTree.gen.ts from src/routes and enables route code-splitting.
    // Must run before the React plugin.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
})

export default config
