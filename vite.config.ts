import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(),tailwindcss()],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    build: {
        outDir: 'public',
        emptyOutDir: false, // Don't delete existing public files
        cssCodeSplit: false, // Bundle all CSS into one file

        // Production optimizations
        minify: 'terser', // Use terser for better minification
        sourcemap: false, // Disable source maps for smaller bundle size

        // Chunk size warnings
        chunkSizeWarningLimit: 1000, // Increase limit for embed bundles

        // Rollup options for better caching
        rollupOptions: {
            external: ['react', 'react-dom'], // We load these from CDN in the liquid file
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
                // Fixed file names (no hash) for predictable embed URLs
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) return 'embed.css';
                    return assetInfo.name || 'asset';
                },
                // Compact output for smaller bundle
                compact: true,
            },
        },

        lib: {
            entry: path.resolve(__dirname, 'app/entry.embed.tsx'),
            name: 'ShopifyCompanyApp',
            fileName: () => 'embed.js',
            formats: ['iife'], // IIFE for direct browser inclusion
        },
    },
});

