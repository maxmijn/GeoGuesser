import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Use /GeoGuesser/ base for production builds (GitHub Pages), but / for local dev
  const base = command === 'build' ? '/GeoGuesser/' : '/';
  
  return {
    plugins: [react()],
    base,
    server: {
      port: 3000,
      open: true,
    },
  };
})
