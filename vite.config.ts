import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A dev proxy azért kell, hogy a böngésző MINDIG same-origin (localhost:5173)
// kérést lásson - így a helyi fejlesztés/tesztelés nem függ attól, hogy az
// éles backend CORS listája tartalmazza-e a localhost origint (nem kell
// emiatt a _.js-t módosítani/újraindítani a Pterodactyl szerveren minden
// helyi teszthez - lásd server/PTERODACTYL_DEPLOY.md).
export default defineConfig(() => ({
  plugins: [react()],
  // GitHub Pages egy projekt-repót "https://<user>.github.io/<repo>/" alatt
  // szolgál ki, NEM a domain gyökerén - enélkül a build minden asset-utat
  // (JS/CSS bundle) rossz, gyökér-relatív útvonalon keresne, ami 404-hez
  // vezetne éles környezetben. SZÁNDÉKOSAN mindig ugyanez a base van
  // haszálva ("npm run dev"-nél és "npm run preview"-nál is, nem csak
  // buildnél) - egy `command === 'build'` alapú elágazás próba közben
  // kiderült, hogy "vite preview" a build-eredményt (ami már a
  // "/avenge-panel/" útvonalakat tartalmazza) a gyökéren próbálta
  // kiszolgálni, ami eltérést és 404-et okozott. Az egységes base-szel a
  // helyi "npm run dev"/"npm run preview" URL-je is "/avenge-panel/"-fal
  // kezdődik, de cserébe garantáltan ugyanúgy viselkedik, mint éles GitHub
  // Pages-en.
  base: '/avenge-panel/',
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
