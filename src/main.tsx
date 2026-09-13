import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { TooltipHost } from './components/HoverCard'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 全局只放一个 Tooltip Provider：延迟与跳过延迟的策略统一 */}
    <TooltipHost>
      <App />
    </TooltipHost>
  </React.StrictMode>,
)
