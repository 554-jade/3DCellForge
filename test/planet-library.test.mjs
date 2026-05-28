import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('left sidebar is wired as a planet library', async () => {
  const source = await readFile(new URL('../src/components/LeftSidebar.jsx', import.meta.url), 'utf8')

  assert.match(source, /planetData\.js/)
  assert.match(source, /PLANETS/)
  assert.match(source, /selectedPlanet/)
  assert.match(source, /setSelectedPlanet/)
})

test('app owns selectedPlanet state with Earth as default', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(source, /selectedPlanet,\s*setSelectedPlanet/)
  assert.match(source, /archiveMode,\s*setArchiveMode/)
  assert.match(source, /presentationMode,\s*setPresentationMode/)
  assert.match(source, /useState\('earth'\)/)
  assert.doesNotMatch(source, /modelApi/)
  assert.doesNotMatch(source, /\/api\//)
})

test('detail panel renders static planet archive data', async () => {
  const source = await readFile(new URL('../src/components/DetailPanel.jsx', import.meta.url), 'utf8')

  assert.match(source, /BASIC DATA/)
  assert.match(source, /NAMING ORIGIN/)
  assert.match(source, /ARCHIVE NOTE/)
  assert.match(source, /OBSERVATION RECORD/)
  assert.doesNotMatch(source, /getAssetMetadata/)
  assert.doesNotMatch(source, /Provider/)
})

test('planet data includes expanded archive texture metadata', async () => {
  const source = await readFile(new URL('../src/domain/planetData.js', import.meta.url), 'utf8')

  for (const body of [
    "id: 'mercury'",
    "id: 'venus'",
    "id: 'earth'",
    "id: 'moon'",
    "id: 'mars'",
    "id: 'jupiter'",
    "id: 'saturn'",
    "id: 'uranus'",
    "id: 'neptune'",
    "id: 'pluto'",
    "id: 'ceres'",
    "id: 'eris'",
    "id: 'europa'",
    "id: 'titan'",
    "id: 'ganymede'",
    "id: 'enceladus'",
    "id: 'kepler-186f'",
    "id: 'trappist-1e'",
    "id: 'proxima-centauri-b'",
  ]) {
    assert.match(source, new RegExp(body.replace(/[/-]/g, '\\$&')))
  }

  assert.match(source, /surfaceTag/)
  assert.match(source, /missionHighlights/)
  assert.match(source, /visualPalette/)
  assert.match(source, /callouts/)
  assert.match(source, /textureUrl/)
  assert.match(source, /\/textures\/earth\.png/)
  assert.match(source, /\/textures\/proxima-centauri-b\.png/)
  assert.doesNotMatch(source, /Unknown Planet/)
})
