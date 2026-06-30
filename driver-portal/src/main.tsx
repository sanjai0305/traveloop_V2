import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global broken image fallback listener (capture phase)
window.addEventListener(
  'error',
  (e) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      (target as HTMLImageElement).src = '/placeholder.jpg';
    }
  },
  true
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
