import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import './styles.css'

function Root() {
  return <App />
}

const root = createRoot(document.getElementById('root'))
root.render(
  <Root />
)
