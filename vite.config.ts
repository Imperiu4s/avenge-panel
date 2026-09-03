import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A dev proxy azért kell, hogy a böngésző MINDIG same-origin (localhost:5173)
// kérést lásson - így a helyi fejlesztés/tesztelés nem függ attól, hogy az
// éles backend CORS listája tartalmazza-e a localhost origint (nem kell
// emiatt a _.js-t módosítani/újraindítani a Pterodactyl szerveren minden
// helyi teszthez - lásd server/PTERODACTYL_DEPLOY.md).
export default defineConfig(() => ({
  plugins: [react()],
  // Az avenge.hu egyedi domain a GitHub Pages projekt-repót a domain
  // GYÖKERÉN szolgálja ki (nem "https://<user>.github.io/<repo>/" alatt,
  // mint a projekt-repók alapértelmezett címe) - ezért a base is "/" kell
  // legyen, különben minden asset-út (JS/CSS bundle) egy nem létező
  // "/avenge-panel/assets/..." útvonalat próbálna betölteni és 404-et adna
  // (pontosan ez történt, amikor az egyedi domain bekötése után a base még
  // a régi "/avenge-panel/" értéken maradt - üres oldal, 404 a konzolon).
  base: '/',
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
}))
