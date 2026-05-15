import { BookOpen, Box, ChevronDown, Globe2, Grid3X3, Library, MonitorPlay, ScrollText, Settings } from 'lucide-react'

import { LANGUAGE_OPTIONS } from '../config/appConfig.js'
import { getUiText } from '../lib/i18n.js'

export function StudioHeader({ activePanel, setActivePanel, demoMode, language = 'en', onLanguageChange, onToggleDemoMode, onNotify }) {
  const text = getUiText(language)
  const headerText = text.header

  function openPanel(panel) {
    const next = activePanel === panel ? null : panel
    setActivePanel(next)
    const label = headerText[panel] || panel
    onNotify?.(language === 'ja' ? `${label}${next ? text.opened : text.closed}` : `${label} ${next ? text.opened : text.closed}`)
  }

  return (
    <header className="studio-header">
      <div className="studio-brand">
        <div className="brand-mark">
          <Box size={30} />
        </div>
        <div>
          <strong>{headerText.title}</strong>
          <span>{headerText.subtitle}</span>
        </div>
      </div>
      <nav className="studio-nav">
        <button type="button" className={activePanel === 'Gallery' ? 'active' : ''} onClick={() => openPanel('Gallery')}>
          <Grid3X3 size={15} />
          {headerText.Gallery}
        </button>
        <button type="button" className={activePanel === 'Library' ? 'active' : ''} onClick={() => openPanel('Library')}>
          <Library size={15} />
          {headerText.Library}
        </button>
        <button type="button" className={activePanel === 'Notebooks' ? 'active' : ''} onClick={() => openPanel('Notebooks')}>
          <BookOpen size={15} />
          {headerText.Notebooks}
        </button>
        <button type="button" className={activePanel === 'Logs' ? 'active' : ''} onClick={() => openPanel('Logs')}>
          <ScrollText size={15} />
          {headerText.Logs}
        </button>
        <button type="button" className={activePanel === 'Settings' ? 'active' : ''} onClick={() => openPanel('Settings')}>
          <Settings size={15} />
          {headerText.Settings}
        </button>
        <button type="button" className={demoMode ? 'active' : ''} onClick={onToggleDemoMode}>
          <MonitorPlay size={15} />
          {headerText.Demo}
        </button>
      </nav>
      <label className="language-switcher">
        <Globe2 size={14} />
        <select aria-label={text.language} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}>
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.shortLabel || option.label}</option>
          ))}
        </select>
      </label>
      <button type="button" className={activePanel === 'Profile' ? 'profile-button active' : 'profile-button'} onClick={() => openPanel('Profile')} aria-label={headerText.Profile}>
        <Box size={18} />
        <ChevronDown size={13} />
      </button>
    </header>
  )
}
