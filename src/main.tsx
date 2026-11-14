import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/chakra-petch/500.css'
import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import '@fontsource-variable/manrope/index.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './index.css'
import './store.css'
import './seasonal.css'
import App from './App.tsx'
import { installProtection, shouldProtect } from './protect'
import { initSiteTheme } from './theme'

if (shouldProtect()) installProtection()
initSiteTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
