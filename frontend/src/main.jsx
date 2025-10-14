import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import { initSentry } from './utils/sentry.js'
import { initGoogleAnalytics } from './utils/analytics.js'

// Initialize error tracking and analytics
initSentry();
initGoogleAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
