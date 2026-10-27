import { useCallback, useEffect, useState } from 'react'
import BootTerminal from './components/BootTerminal'
import PortfolioWindow from './components/PortfolioWindow'

// The boot sequence doubles as the loading screen: the window only opens once
// the script has played *and* the document (fonts) is actually ready.
export default function App() {
  const [bootComplete, setBootComplete] = useState(false)
  const [siteReady, setSiteReady] = useState(false)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setSiteReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!bootComplete || !siteReady) return
    const id = window.setTimeout(() => setLive(true), 160)
    return () => window.clearTimeout(id)
  }, [bootComplete, siteReady])

  const handleBootComplete = useCallback(() => setBootComplete(true), [])

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center p-[clamp(0.75rem,3vw,2rem)]">
      <PortfolioWindow open={live} />
      <BootTerminal hidden={live} onComplete={handleBootComplete} />
    </main>
  )
}
