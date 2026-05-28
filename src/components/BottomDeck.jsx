import { Camera, Orbit, RotateCcw } from 'lucide-react'

export function BottomDeck({ presentationMode, onResetView, onScreenshot, onTogglePresentationMode }) {
  return (
    <div className="bottom-controls" aria-label="Planet viewer controls">
      <button type="button" onClick={onResetView}>
        <RotateCcw size={16} />
        Reset View
      </button>
      <button type="button" onClick={onScreenshot}>
        <Camera size={16} />
        Screenshot
      </button>
      <button type="button" className={presentationMode ? 'active' : ''} onClick={onTogglePresentationMode}>
        <Orbit size={16} />
        Presentation Mode
      </button>
    </div>
  )
}
