import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const DEV_API_URL = 'http://localhost:3000';

// The API URL is injected as a compile-time constant rather than read from
// import.meta.env, so the same source parses under Jest's CommonJS transform.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = env.VITE_API_URL?.trim();

  // Falling back to localhost is fine while developing, but baking it into a
  // production bundle would point every user's browser at their own machine.
  if (mode === 'production' && !apiUrl) {
    throw new Error('VITE_API_URL must be set to build for production.');
  }

  return {
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(apiUrl || DEV_API_URL),
    },
  };
});
