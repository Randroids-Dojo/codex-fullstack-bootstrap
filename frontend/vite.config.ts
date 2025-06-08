import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      host: true,
      port: Number(process.env.FRONTEND_PORT) || 3000,
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
