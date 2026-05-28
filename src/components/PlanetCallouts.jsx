const POSITION_CLASS = {
  'top-left': 'callout-top-left',
  'top-right': 'callout-top-right',
  right: 'callout-right',
  'bottom-right': 'callout-bottom-right',
  'bottom-left': 'callout-bottom-left',
  left: 'callout-left',
}

export function PlanetCallouts({ callouts = [], archiveMode = false }) {
  return (
    <div className={archiveMode ? 'planet-callouts archive-callouts' : 'planet-callouts'} aria-label="Planet feature callouts">
      {callouts.slice(0, 3).map((callout) => (
        <article
          className={`planet-callout ${POSITION_CLASS[callout.position] ?? 'callout-right'}`}
          key={`${callout.label}-${callout.position}`}
        >
          <span />
          <div>
            <strong>{callout.label}</strong>
            <p>{callout.description}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
