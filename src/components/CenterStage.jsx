import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'

import { PlanetCallouts } from './PlanetCallouts.jsx'

export function CenterStage({ planet, archiveMode, presentationMode, resetNonce, onCanvasReady }) {
  return (
    <section className="planet-viewer-panel">
      <div className="viewer-background-glow" />
      <div className="viewer-title">
        <span>{archiveMode ? 'ARCHIVE MODE' : 'EXPLORE MODE'}</span>
        <h1>{planet.name}</h1>
        <p>{planet.subtitle}</p>
        <PlanetBadges planet={planet} />
      </div>

      {archiveMode && <div className="center-archive-label">ARCHIVE MODE</div>}
      <PlanetCallouts callouts={planet.callouts} archiveMode={archiveMode} />
      <MoonLabelOverlay moons={planet.moons} />

      <div className="planet-canvas-shell">
        <Canvas
          key={`${planet.id}-${resetNonce}`}
          camera={{ position: [0, 0.35, 6.6], fov: 40 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
          onCreated={({ gl }) => onCanvasReady?.(gl.domElement)}
        >
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={1.08} />
          <hemisphereLight args={['#e0f2fe', '#020617', 0.72]} />
          <directionalLight position={[5, 3, 5]} intensity={2.25} color="#ffffff" />
          <pointLight position={[-4, -2, -3]} intensity={0.62} color="#7dd3fc" />
          <pointLight position={[0, 3, -4]} intensity={0.48} color="#a78bfa" />
          <Stars radius={90} depth={45} count={1900} factor={4} saturation={0.2} fade speed={0.32} />
          <TextureBoundary key={planet.id} fallback={<PlanetScene planet={planet} presentationMode={presentationMode} />}>
            <Suspense fallback={<PlanetScene planet={planet} presentationMode={presentationMode} />}>
              {planet.textureUrl ? (
                <TexturedPlanetScene planet={planet} presentationMode={presentationMode} />
              ) : (
                <PlanetScene planet={planet} presentationMode={presentationMode} />
              )}
            </Suspense>
          </TextureBoundary>
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            minDistance={4.2}
            maxDistance={9}
          />
        </Canvas>
      </div>

      {presentationMode && (
        <div className="presentation-overlay">
          <span>CELESTIAL ARCHIVE</span>
          <strong>{planet.name}</strong>
          <small>{planet.subtitle}</small>
          <div className="presentation-badges">
            <em>{planet.surfaceTag}</em>
            <em>{planet.explorationDifficulty}</em>
            <em>{formatMoonCount(planet.moonCount)}</em>
          </div>
          <p>{planet.archiveNote}</p>
        </div>
      )}
    </section>
  )
}

class TextureBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn('Celestial Archive: texture failed to load; using fallback material.', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function TexturedPlanetScene({ planet, presentationMode }) {
  const loadedTexture = useTexture(planet.textureUrl)
  const texture = usePreparedTexture(loadedTexture, planet.textureUrl)

  if (planet.id === 'saturn') {
    return <TexturedSaturnScene planet={planet} presentationMode={presentationMode} texture={texture} />
  }

  return <PlanetScene planet={planet} presentationMode={presentationMode} texture={texture} />
}

function TexturedSaturnScene({ planet, presentationMode, texture }) {
  const loadedRingTexture = useTexture('/textures/saturn-ring.png')
  const ringTexture = usePreparedTexture(loadedRingTexture, '/textures/saturn-ring.png')

  return <PlanetScene planet={planet} presentationMode={presentationMode} texture={texture} ringTexture={ringTexture} />
}

function MoonLabelOverlay({ moons = [] }) {
  if (!moons.length) return null

  return (
    <div className="moon-label-overlay" aria-label="Moon orbit labels">
      {moons.slice(0, 4).map((moon, index) => (
        <div className={`moon-label moon-label-${index + 1}`} key={moon.name}>
          <strong>{moon.name}</strong>
          <span>Orbit: {moon.period}</span>
        </div>
      ))}
    </div>
  )
}

function PlanetBadges({ planet }) {
  return (
    <div className="planet-badges">
      <span>{planet.surfaceTag}</span>
      <span>{planet.temperature}</span>
      <span>{formatMoonCount(planet.moonCount)}</span>
    </div>
  )
}

function PlanetScene({ planet, presentationMode, texture = null, ringTexture = null }) {
  const planetRef = useRef(null)
  const moonSystemRef = useRef(null)
  const radius = getDisplayRadius(planet)

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * (presentationMode ? 0.16 : 0.24)
    if (moonSystemRef.current) moonSystemRef.current.rotation.y += delta * 0.05
  })

  return (
    <group>
      {planet.hasRings || planet.id === 'saturn' || planet.id === 'uranus' ? (
        <NaturalRings planet={planet} radius={radius} ringTexture={ringTexture} />
      ) : null}

      <group ref={planetRef}>
        <PlanetBody planet={planet} radius={radius} texture={texture} />
      </group>

      <MoonSystem refObject={moonSystemRef} moons={planet.moons} planetRadius={radius} />

      <mesh scale={[radius * 1.05, radius * 1.05, radius * 1.05]}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function PlanetBody({ planet, radius, texture = null }) {
  const isExoplanet = planet.category === 'EXOPLANET ARCHIVE'
  const isJupiter = planet.id === 'jupiter'

  return (
    <>
      <mesh renderOrder={1}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={texture || null}
          color={texture ? '#ffffff' : planet.color}
          roughness={isExoplanet ? 0.72 : 0.88}
          metalness={0}
          emissive={texture ? '#000000' : planet.color}
          emissiveIntensity={texture ? 0 : isExoplanet ? 0.13 : 0.045}
        />
      </mesh>
      {!texture && <SurfaceVariation planet={planet} radius={radius} />}
      {!texture && isJupiter && <JupiterBands radius={radius} />}
    </>
  )
}

function SurfaceVariation({ planet, radius }) {
  const palette = planet.visualPalette ?? [planet.color]

  return (
    <group rotation={[0.2, -0.45, 0.08]}>
      <mesh scale={[1.006, 1.006, 1.006]}>
        <sphereGeometry args={[radius, 96, 96, 0.35, Math.PI * 1.05, 0.2, Math.PI * 0.72]} />
        <meshBasicMaterial color={palette[1] ?? planet.color} transparent opacity={0.16} />
      </mesh>
      <mesh scale={[1.008, 1.008, 1.008]} rotation={[0.15, 0.9, 0.12]}>
        <sphereGeometry args={[radius, 96, 96, 2.8, Math.PI * 0.82, 1.25, Math.PI * 0.42]} />
        <meshBasicMaterial color={palette[2] ?? planet.color} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

function JupiterBands({ radius }) {
  const bands = [
    { y: -0.48, color: '#92400e', opacity: 0.3 },
    { y: -0.22, color: '#fef3c7', opacity: 0.2 },
    { y: 0.05, color: '#b45309', opacity: 0.24 },
    { y: 0.32, color: '#fde68a', opacity: 0.18 },
  ]

  return (
    <group>
      {bands.map((band) => {
        const bandRadius = Math.sqrt(Math.max(radius * radius - band.y * band.y, 0.1))
        return (
          <mesh key={`${band.y}-${band.color}`} position={[0, band.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[bandRadius, 0.018, 8, 192]} />
            <meshBasicMaterial color={band.color} transparent opacity={band.opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

function NaturalRings({ planet, radius, ringTexture = null }) {
  if (planet.id === 'saturn') {
    return (
      <group rotation={[THREE.MathUtils.degToRad(68), 0, THREE.MathUtils.degToRad(-18)]}>
        {ringTexture ? (
          <RingBand inner={radius * 1.18} outer={radius * 2.02} color="#ffffff" opacity={0.84} texture={ringTexture} />
        ) : (
          <>
            <RingBand inner={radius * 1.25} outer={radius * 1.52} color="#fde68a" opacity={0.28} />
            <RingBand inner={radius * 1.58} outer={radius * 1.78} color="#d6b16a" opacity={0.22} />
            <RingBand inner={radius * 1.86} outer={radius * 2.08} color="#f8e1a0" opacity={0.18} />
          </>
        )}
      </group>
    )
  }

  if (planet.id === 'uranus') {
    return (
      <group rotation={[THREE.MathUtils.degToRad(82), 0.1, THREE.MathUtils.degToRad(10)]}>
        <RingBand inner={radius * 1.42} outer={radius * 1.55} color="#a5f3fc" opacity={0.18} />
        <RingBand inner={radius * 1.72} outer={radius * 1.82} color="#67e8f9" opacity={0.12} />
      </group>
    )
  }

  return null
}

function RingBand({ inner, outer, color, opacity, texture = null }) {
  return (
    <mesh renderOrder={0}>
      <ringGeometry args={[inner, outer, 192, 1, Math.PI, Math.PI]} />
      <meshBasicMaterial
        map={texture || null}
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

function MoonSystem({ refObject, moons = [], planetRadius }) {
  if (!moons.length) return null

  return (
    <group ref={refObject} rotation={[0.48, 0.12, -0.18]}>
      {moons.map((moon, index) => (
        <MoonMarker key={moon.name} moon={moon} index={index} planetRadius={planetRadius} />
      ))}
    </group>
  )
}

function MoonMarker({ moon, index, planetRadius }) {
  const angle = index * 1.55 + 0.45
  const orbitRadius = moon.orbitRadius * planetRadius
  const x = Math.cos(angle) * orbitRadius
  const z = Math.sin(angle) * orbitRadius

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[orbitRadius, 0.004, 8, 192]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.2} />
      </mesh>
      <mesh position={[x, 0, z]}>
        <sphereGeometry args={[Math.max(moon.size * planetRadius, 0.035), 32, 32]} />
        <meshStandardMaterial color={moon.color} roughness={0.86} metalness={0} />
      </mesh>
    </group>
  )
}

function getDisplayRadius(planet) {
  if (planet.id === 'saturn' || planet.id === 'uranus') return 0.9
  if (planet.category === 'GIANT PLANETS') return 1.18
  if (planet.category === 'MAJOR MOONS') return 0.84
  if (planet.category === 'DWARF / SMALL BODIES') return 0.82
  if (planet.category === 'EXOPLANET ARCHIVE') return 0.92
  return 1.02
}

function formatMoonCount(moonCount) {
  if (!moonCount) return 'No major moons'
  if (moonCount === 1) return '1 moon'
  return `${moonCount} moons`
}

function usePreparedTexture(texture, textureUrl) {
  const preparedTexture = useMemo(() => {
    if (!texture || !textureUrl) return null

    const clonedTexture = texture.clone()
    clonedTexture.colorSpace = THREE.SRGBColorSpace
    clonedTexture.anisotropy = 8
    clonedTexture.needsUpdate = true

    return clonedTexture
  }, [texture, textureUrl])

  useEffect(() => {
    return () => preparedTexture?.dispose()
  }, [preparedTexture])

  return preparedTexture
}
