import { Compass, Database, Orbit } from 'lucide-react'

export function StudioHeader({ archiveMode, presentationMode, onToggleArchiveMode, onTogglePresentationMode }) {
  return (
    <header className="celestial-header">
      <div className="celestial-brand">
        <div className="celestial-mark">
          <Orbit size={28} />
        </div>
        <div>
          <strong>CELESTIAL ARCHIVE</strong>
          <span>A 3D archive of planets, names, myths, and cosmic data.</span>
        </div>
      </div>

      <nav className="celestial-nav" aria-label="Celestial Archive navigation">
        <button type="button" className={!archiveMode && !presentationMode ? 'active' : ''}>
          <Compass size={16} />
          Explore
        </button>
        <button type="button" className={archiveMode ? 'active' : ''} onClick={onToggleArchiveMode}>
          <Database size={16} />
          Archive Mode
        </button>
        <button type="button" className={presentationMode ? 'active' : ''} onClick={onTogglePresentationMode}>
          <Orbit size={16} />
          Presentation Mode
        </button>
      </nav>
    </header>
  )
}
