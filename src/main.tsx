import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}
setVH()
window.addEventListener('resize', setVH)
window.addEventListener('orientationchange', () => setTimeout(setVH, 150))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
