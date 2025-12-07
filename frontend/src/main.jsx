import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import ProtectedApp from './ProtectedApp'

import './styles.css'

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
