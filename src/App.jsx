import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { BottomDeck } from './components/BottomDeck.jsx'
import { CenterStage } from './components/CenterStage.jsx'
import { DetailPanel } from './components/DetailPanel.jsx'
import { LeftSidebar } from './components/LeftSidebar.jsx'
import { StudioHeader } from './components/StudioHeader.jsx'
import { getPlanet } from './domain/planetData.js'
import './App.css'

function App() {
  const [selectedPlanet, setSelectedPlanet] = useState('earth')
  const [archiveMode, setArchiveMode] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [resetNonce, setResetNonce] = useState(0)
  const canvasRef = useRef(null)
  const planet = useMemo(() => getPlanet(selectedPlanet), [selectedPlanet])

  function handleSelectPlanet(planetId) {
    setSelectedPlanet(planetId)
  }

  function handleResetView() {
    setResetNonce((value) => value + 1)
  }

  function handleScreenshot() {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${planet.id}-celestial-archive.png`
    link.click()
  }

  function togglePresentationMode() {
    setPresentationMode((current) => !current)
  }

  return (
    <main className={presentationMode ? 'celestial-shell presentation-mode' : 'celestial-shell'}>
      <motion.div
        className="celestial-window"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <StudioHeader
          archiveMode={archiveMode}
          presentationMode={presentationMode}
          onToggleArchiveMode={() => setArchiveMode((current) => !current)}
          onTogglePresentationMode={togglePresentationMode}
        />

        <div className="celestial-layout">
          {!presentationMode && (
            <LeftSidebar selectedPlanet={selectedPlanet} setSelectedPlanet={handleSelectPlanet} />
          )}

          <div className="viewer-column">
            <CenterStage
              planet={planet}
              archiveMode={archiveMode}
              presentationMode={presentationMode}
              resetNonce={resetNonce}
              onCanvasReady={(canvas) => {
                canvasRef.current = canvas
              }}
            />
            <BottomDeck
              presentationMode={presentationMode}
              onResetView={handleResetView}
              onScreenshot={handleScreenshot}
              onTogglePresentationMode={togglePresentationMode}
            />
          </div>

          {!presentationMode && <DetailPanel planet={planet} archiveMode={archiveMode} />}
        </div>

        {presentationMode && (
          <button type="button" className="exit-presentation" onClick={togglePresentationMode}>
            Exit Presentation
          </button>
        )}
      </motion.div>
    </main>
  )
}

export default App
