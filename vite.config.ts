
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('Vite build mode:', mode);
  
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: false, // Allow fallback to another port if 8080 is in use
      hmr: {
        // Improve HMR error handling
        clientPort: 8080,
        overlay: true,
      },
      watch: {
        // Improve file watching
        usePolling: true,
        interval: 1000,
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Add better logging for build issues
    build: {
      sourcemap: true,
      rollupOptions: {
        onwarn(warning, warn) {
          // Log build warnings more clearly
          console.warn('Build warning:', warning.message);
          warn(warning);
        },
      },
    },
    // Pass the NODE_ENV to the client
    define: {
      'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }
  };
});
