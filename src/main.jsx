import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Entry point only. The root component is intentionally not created yet:
// per the ticket's TDD workflow, tests are written (and failing) first.
createRoot(document.getElementById('root')).render(<StrictMode />)
