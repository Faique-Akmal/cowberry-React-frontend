import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],

  server: {
    // Proxy configuration to fix CORS issues
    proxy: {
      "/api": {
        target: "https://cowberry.frappe.cloud",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("Proxying request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("Received response from target:", proxyRes.statusCode);
          });
        },
      },
    },
    headers: {
      // Increase header size limit
      Connection: "keep-alive",
    },
    host: "0.0.0.0", // makes it accessible on your LAN
    port: 5173, // you can change this to 3000, 8080, etc.
  },
});
