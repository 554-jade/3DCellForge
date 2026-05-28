import { PLANET_CATEGORIES, PLANETS } from '../domain/planetData.js'

export function LeftSidebar({ selectedPlanet, setSelectedPlanet }) {
  const currentPlanet = PLANETS.find((planet) => planet.id === selectedPlanet) ?? PLANETS[0]
  const groupedPlanets = PLANET_CATEGORIES.map((category) => ({
    category,
    planets: PLANETS.filter((planet) => planet.category === category && planet.id !== currentPlanet.id),
  })).filter((group) => group.planets.length > 0)

  return (
    <aside className="planet-library" aria-label="Planet Library">
      <header className="panel-heading">
        <span>PLANET LIBRARY</span>
      </header>

      <section className="library-section">
        <p>SELECTED PLANET</p>
        <PlanetCard planet={currentPlanet} selected onSelect={setSelectedPlanet} />
      </section>

      {groupedPlanets.map((group) => (
        <section className="library-section category-section" key={group.category}>
          <p>{group.category}</p>
          <div className="planet-card-list">
            {group.planets.map((planet) => (
              <PlanetCard key={planet.id} planet={planet} onSelect={setSelectedPlanet} />
            ))}
          </div>
        </section>
      ))}
    </aside>
  )
}

function PlanetCard({ planet, selected = false, onSelect }) {
  return (
    <button
      type="button"
      className={selected ? 'planet-card selected' : 'planet-card'}
      data-planet-id={planet.id}
      onClick={() => onSelect(planet.id)}
      aria-pressed={selected}
    >
      <span className="planet-thumb" style={{ '--planet-color': planet.color }}>
        <span />
      </span>
      <span className="planet-card-copy">
        <strong>{planet.name}</strong>
        <small>{planet.subtitle}</small>
        <em>{planet.type}</em>
      </span>
    </button>
  )
}
