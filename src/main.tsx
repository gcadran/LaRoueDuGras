import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Roulette from './Components/Roulette'
import AccountButton from './Components/AccountButton'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="header">
      <h1>La roue du gras</h1>
      <AccountButton />
    </div>
    <Roulette />
  </StrictMode>,
)
