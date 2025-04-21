import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { splitVendorChunkPlugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    exclude: ['framer-motion'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('primereact')) {
              return 'vendor-primereact';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-icons';
            }
            if (id.includes('axios') || id.includes('react-router-dom')) {
              return 'vendor-core';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('tailwindcss') || id.includes('postcss')) {
              return 'vendor-styles';
            }
            return 'vendor-other';
          }
          if (id.includes('src/User/component') || id.includes('src/Admin/component')) {
            if (id.includes('Chatbot') || id.includes('ChatBot')) {
              return 'components-chat';
            }
            if (id.includes('Product') || id.includes('product')) {
              return 'components-product';
            }
            if (id.includes('Cart') || id.includes('cart')) {
              return 'components-cart';
            }
            return 'components-other';
          }
          if (id.includes('src/User/Pages') || id.includes('src/Admin/Pages')) {
            if (id.includes('Product') || id.includes('product')) {
              return 'pages-product';
            }
            if (id.includes('Admin') || id.includes('admin')) {
              return 'pages-admin';
            }
            if (id.includes('Cart') || id.includes('cart')) {
              return 'pages-cart';
            }
            return 'pages-other';
          }
        }
      }
    }
  }
});
