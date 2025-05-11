import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { splitVendorChunkPlugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create basic self-signed certificate config for HTTPS
const httpsOptions = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFhGSXi0E11Hob
9L7OUUxMDtTNHpHQPtgTf3YLrz4OHaXG45iOiBfcqpYs/JqYKe2A5WTXdHUKRDHT
w0Vm8J9R9jrJy1Xz7i/ckZkK4N67/NqsNJl2q/xIvwATgNztZgR1iKvG615nBJhW
0BNiY+K/t09N5RKGcI+QwuQXXP1nUBUmwnKgxp4r6H6xAgB3JKZOvJGCa6L8NJCJ
CdDLGZ/aYfQGSUDYgQTvUkCW2zCQh3SFv2UvYXGLfZo7pNECWZFZp8q2+bIOhGST
HGFI9Zypd0YoXXBev0/+l4CgGxJDKzUCWrS78y+jkup7UtDq7vvdCbpEm9O7ABTS
Q0lniFNdAgMBAAECggEBALB3b9D51fcpUTY8X0xwGSQFwpnYdPGc1W8E+9n+7O+y
UQP7aunn0RNYV1vXgQG3jLyXmICH1YJnY7YpTU2Tm4wfBMEh4YQQ8MwkT3GbQEWJ
XAn4tI9aTZXZADQILgLcIR51M5N0vaW4nxYbAQLJXXp40HyMZLzFp9I/dbjd1U/r
kxW2zI0iRH+NU6Vk8/CA3B7s4z2hMBuQlEYENgLDL35MLMEwo/JtU8C2jSNbu0fy
RYgS+lX6Qn70LVR6D8qp5HSM7qFD/xdKYxoRbLTLKbKQwO/Qir0zDGEBxlWczkNm
Vt9+hH4WfX5bOXvYJNnVRbJ3QTGR1qldCJWi9JYC4AECgYEA5IjuYP+fP8zVu3Jq
3yrNEz/BcNj+YFCjoXAM0hTgFcA2ZJLZj6IrrHZvGLwWoJbkWFRXqGWZ25Tg2Ntq
6zQDXzs4YL+d95QdZNMdUjtbQqMyhFf4J3rOCF1hAf0YZ0VezBlbd3QIpT7JgZkI
6cz0yvpvLzIkBSr9hhSp4pWrMg0CgYEA3UFwXuZSI/a/D9YH4CNdHEKlWEtQtzF9
xXGWRbJhtGtU0IMYbJDxeKbJlx39eefGytFMRCkHnIYVrxwABGR8CSRcDJpbMKbK
jDrzY1v1zLPJpU0AJfQDWUEiqQn3xXDZZiYfQz8bO2//UXd4RtKNvEt5TEcRw9dD
YcfIZSyHYwECgYACDtacY/a1j+5LJIGTmq4GXvDNXKljcFCwiVYqQN9qgCdKIdZz
JKr1ysIQSHMHQkUNUJ96iUFmjV16zl9cIV6sVpkQZtZ5FmSW6UuQfq7nRzjHjH75
2WdJ79oRsG5D3DE/GDbcvYNbJlT+PhXZxJVXkLXiTGgpuHO4CUWwzVaPoQKBgQCv
WQwBfLJR1YsC4gNYpN3AxG0Iw8VxXzF7Jblu/TpFrwfQDWwwahB8KXv6TwLVqXcH
XhAcJo9uOWC/R0HVM5aZzOJ/AkJ/OFwXRX+XnCYaALwJgJZ7K8Xo3EbwUwfU32Cw
nUCvTMQeJTJ7R4EIkQZx0Sujj33j/cuRg4X8pPDCAQKBgCrP90nKjUwlZtOUhyoW
z1HYGHJkJGGpXiH8IcW2kG00LmDwl2d2It7+MrjZgv8SDzZLh2nJFjl3/bRyJQOQ
GdxWIKhMGJXZIQwWDI7msh7hTFIgQCPuG++KWLYfQI9o6+UqnE7PqjRu9aAKTcz1
C3QyLnI+M27HBYdxZE8e/9hJ
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUVNgRrBX112FBgTxZvMzchWQjzYQwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCVk4xEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDA1MTEwNzEyMTNaFw0yNTA1
MTEwNzEyMTNaMEUxCzAJBgNVBAYTAlZOMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDFhGSXi0E11Hob9L7OUUxMDtTNHpHQPtgTf3YLrz4O
HaXG45iOiBfcqpYs/JqYKe2A5WTXdHUKRDHTw0Vm8J9R9jrJy1Xz7i/ckZkK4N67
/NqsNJl2q/xIvwATgNztZgR1iKvG615nBJhW0BNiY+K/t09N5RKGcI+QwuQXXP1n
UBUmwnKgxp4r6H6xAgB3JKZOvJGCa6L8NJCJCdDLGZ/aYfQGSUDYgQTvUkCW2zCQ
h3SFv2UvYXGLfZo7pNECWZFZp8q2+bIOhGSTHGFI9Zypd0YoXXBev0/+l4CgGxJD
KzUCWrS78y+jkup7UtDq7vvdCbpEm9O7ABTSS0lniFNdAgMBAAGjUzBRMB0GA1Ud
DgQWBBTH2YtM5xBnLmYWYazRGHVe8/UwHjAfBgNVHSMEGDAWgBTH2YtM5xBnLmYW
YazRGHVe8/UwHjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQC1
5dGLJ8XyLo/mzLLUjGKBGYgyzkYa1ZUn9WcWuddrgPP9wHvDrU4KchvtBNEXbW9q
JywxqXE2TN9w8ytusv3CxiGHahkQfxwNH1lVMEpr8x/7UST1cC5nHtVS6SHXlQlN
uZ/vD3+aX8h8aA0vWxSmC7xEQaxh9G/+e/mWlRhHJ3k/dyLvwL7RwrgDPXtNDhNE
b1R3+bLMxlUtFdBuEOGS5O/tyiMZUKn2i0xjn+sBzlAMqbX8wBC18a+LZ3lMSXy1
N6rMRyxB9OZPKF/nFr9jH69OJpQD8HJ7tVl5B+jy8tKFHCQNQ6GsZ3pveDzRSYGX
v8NsJRqUi9ys2DDv1Qan
-----END CERTIFICATE-----`
};

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
    https: httpsOptions,
    hmr: {
      protocol: 'wss',
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
