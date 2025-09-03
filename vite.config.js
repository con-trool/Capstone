import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:80/Capstone', // Your XAMPP Apache server, change this when we will not be using localhost
        changeOrigin: true,
        // Don't rewrite the path - keep /api prefix since our files are in /api directory
      },
    },
  },
  build: {
    outDir: 'dist', // Output directory for production build
    rollupOptions: {
      input: {
        main: 'index.html', // Entry point for the build
      },
    },
  },
});
