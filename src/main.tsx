import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Remove loading splash
setTimeout(() => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
}, 200);

