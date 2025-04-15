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
    react(), 
    tailwindcss(),
    splitVendorChunkPlugin()
  ],
  server: {
    port: 3000,
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
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      aos: 'aos',
      '@': resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['aos'],
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
          // Tách các thư viện node_modules thành chunk riêng
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              if (id.includes('react-dom/client')) {
                return 'vendor-react-dom';
              }
              return 'vendor-react';
            }
            if (id.includes('primereact')) {
              if (id.includes('primereact/api')) {
                return 'vendor-primereact-core';
              }
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
            if (id.includes('@radix-ui/react-icons')) {
              return 'vendor-radix-icons';
            }
            if (id.includes('@radix-ui/react-dialog') || 
                id.includes('@radix-ui/react-dropdown-menu') ||
                id.includes('@radix-ui/react-slot')) {
              return 'vendor-radix-ui';
            }
            return 'vendor-other';
          }
          // Tách các component thành chunk riêng
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
          // Tách các page thành chunk riêng
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
