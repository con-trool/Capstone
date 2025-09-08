import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/Capstone', // Your XAMPP Apache server
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
