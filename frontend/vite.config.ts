import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The API URL is injected as a compile-time constant rather than read from
// import.meta.env, so the same source parses under Jest's CommonJS transform.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? 'http://localhost:3000'),
    },
  };
});
