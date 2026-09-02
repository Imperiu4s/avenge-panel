import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A dev proxy azért kell, hogy a böngésző MINDIG same-origin (localhost:5173)
// kérést lásson - így a helyi fejlesztés/tesztelés nem függ attól, hogy az
// éles backend CORS listája tartalmazza-e a localhost origint (nem kell
// emiatt a _.js-t módosítani/újraindítani a Pterodactyl szerveren minden
// helyi teszthez - lásd server/PTERODACTYL_DEPLOY.md).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/avenge': {
        target: 'https://api.overclockgame.hu:8908',
        changeOrigin: true,
        secure: true,
        // A SignalR hub (/avenge/hub/scan) most Long Pollingot használ (lásd
        // realtime/scanHub.ts megjegyzését), nem WebSocketet.
        ws: true
      }
    }
  }
})
