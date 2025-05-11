import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { splitVendorChunkPlugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chứng chỉ HTTPS đã bị vô hiệu hóa để khắc phục lỗi

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      jsxRuntime: 'automatic',
      fastRefresh: true,
      babel: {
        plugins: [],
      }
    }), 
    tailwindcss(),
    splitVendorChunkPlugin()
  ],
  server: {
    port: 3000,
    host: true,
    https: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
      clientPort: 3000
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/auth/, "/auth"),
      },
      "/api-provinces": {
        target: "https://provinces.open-api.vn",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-provinces/, ""),
      },
    },
    headers: {
      "*.js": {
        "Content-Type": "application/javascript; charset=utf-8"
      },
      "*.jsx": {
        "Content-Type": "application/javascript; charset=utf-8"
      },
      "*.mjs": {
        "Content-Type": "application/javascript; charset=utf-8"
      },
      "*.css": {
        "Content-Type": "text/css; charset=utf-8"
      }
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      aos: 'aos',
      '@': resolve(__dirname, './src'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': resolve(__dirname, 'node_modules/react-router-dom')
    }
  },
  optimizeDeps: {
    include: [
      'aos',
      'react',
      'react-dom',
      'react-router-dom',
      'primereact',
      '@radix-ui/themes',
      'react-toastify'
    ],
    exclude: [],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      target: 'es2020'
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 2000,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log']
      }
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['primereact', '@radix-ui/themes'],
          'utils': ['axios']
        },
        interop: 'auto'
      }
    }
  }
});
