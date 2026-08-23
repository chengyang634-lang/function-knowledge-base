import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import './theme.css'
import './mobile.css'
import { initializeTheme } from './theme'
import App from './App.tsx'

initializeTheme()

document.documentElement.dataset.platform =
  Capacitor.getPlatform()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
