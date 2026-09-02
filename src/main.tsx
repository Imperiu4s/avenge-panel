import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* import.meta.env.BASE_URL a vite.config.ts "base" beállításából jön -
        automatikusan "/avenge-panel/" éles buildben (GitHub Pages aloldal),
        "/" helyi fejlesztésnél - lásd ott a részletes indoklást. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
