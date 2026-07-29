import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TemaProvider } from './context/TemaContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AvisoProvider } from './context/AvisoContext.jsx'
import { ConfirmacaoProvider } from './context/ConfirmacaoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <AvisoProvider>
        <ConfirmacaoProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ConfirmacaoProvider>
      </AvisoProvider>
    </TemaProvider>
  </StrictMode>,
)

// Service worker: permite instalar na tela inicial e abrir em tela cheia
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem service worker o app continua funcionando normalmente
    })
  })
}
