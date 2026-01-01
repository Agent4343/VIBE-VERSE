import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyDirBeforeWrite: true,
        sourcemap: false,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://localhost:8080',
                ws: true
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/game')
        }
    }
});
