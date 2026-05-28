import { BookOpen, Database, Palette, Radio, Rocket, ScrollText } from 'lucide-react'

export function DetailPanel({ planet, archiveMode }) {
  const basicData = [
    ['Name', planet.name],
    ['Type', planet.type],
    ['Diameter', planet.diameter],
    ['Distance from Sun', planet.distanceFromSun],
    ['Gravity', planet.gravity],
    ['Surface / Atmosphere', planet.atmosphere],
    ['Temperature', planet.temperature],
    ['Orbital Period', planet.orbitalPeriod],
    ['Rotation Period', planet.rotationPeriod],
    ['Moon Count', formatMoonCount(planet.moonCount)],
    ['Magnetic Field', planet.magneticField],
    ['Exploration Difficulty', planet.explorationDifficulty],
  ]

  const observationData = [
    ['First Known Observation', planet.observationRecord.firstKnown],
    ['Telescopic Observation', planet.observationRecord.telescopicObservation],
    ['Space Missions', planet.observationRecord.spaceMissions],
  ]

  return (
    <aside className={archiveMode ? 'archive-panel archive-mode' : 'archive-panel'}>
      <header className="panel-heading">
        <span>ARCHIVE DATA</span>
      </header>

      <section className="archive-card basic-data-card">
        <h2>
          <Database size={16} />
          BASIC DATA
        </h2>
        <dl className="data-grid">
          {basicData.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="archive-card mission-card">
        <h2>
          <Rocket size={16} />
          MISSION HIGHLIGHTS
        </h2>
        <ul className="mission-list">
          {planet.missionHighlights.map((mission) => (
            <li key={mission}>{mission}</li>
          ))}
        </ul>
      </section>

      <section className="archive-card signature-card">
        <h2>
          <Palette size={16} />
          PLANETARY SIGNATURE
        </h2>
        <dl className="data-grid">
          <div>
            <dt>Surface Tag</dt>
            <dd>{planet.surfaceTag}</dd>
          </div>
          <div>
            <dt>Discovery Status</dt>
            <dd>{planet.discoveryStatus}</dd>
          </div>
        </dl>
        <div className="palette-row" aria-label={`${planet.name} visual palette`}>
          {planet.visualPalette.map((color) => (
            <span key={color} style={{ '--swatch': color }} />
          ))}
        </div>
      </section>

      <section className="archive-card narrative-card">
        <h2>
          <BookOpen size={16} />
          NAMING ORIGIN
        </h2>
        <p>{planet.namingOrigin}</p>
      </section>

      <section className="archive-card narrative-card">
        <h2>
          <ScrollText size={16} />
          ARCHIVE NOTE
        </h2>
        <p>{planet.archiveNote}</p>
      </section>

      <section className="archive-card">
        <h2>
          <Radio size={16} />
          OBSERVATION RECORD
        </h2>
        <dl className="data-grid observation-grid">
          {observationData.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  )
}

function formatMoonCount(moonCount) {
  if (!moonCount) return 'No major moons'
  if (moonCount === 1) return '1 moon'
  return `${moonCount} moons`
}
