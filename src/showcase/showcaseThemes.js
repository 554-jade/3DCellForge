import { ASSET_CATEGORIES, getSceneProfile, inferAssetCategory } from '../lib/assetIntelligence.js'

export const SHOWCASE_THEMES = {
  dinosaur: {
    id: 'dinosaur',
    title: 'Dinosaur Atlas',
    eyebrow: 'Interactive fossil classroom',
    palette: 'electric fossil blue',
    icon: 'fossil',
    stageLabel: '3D Atlas Exhibit',
    primaryAction: 'Narrate lesson',
    statLabels: ['Era', 'Diet', 'Discovery', 'Scale'],
    stats: ['Mesozoic', 'Adaptive', 'Field site', 'Specimen'],
    tags: ['atlas', 'fossil', 'guided lesson'],
    navLabels: ['Course Brief', 'Dinosaur Atlas', 'Fossil Lab'],
    layerLabels: ['Skeleton', 'Muscle', 'Skin', 'AR'],
    toolLabels: ['Rotate', 'Zoom', 'Move', 'Reset'],
    moduleLabel: 'Current specimen',
  },
  road: {
    id: 'road',
    title: 'Vehicle Showroom',
    eyebrow: 'Motion-first product reveal',
    palette: 'clean track light',
    icon: 'vehicle',
    stageLabel: 'Low Camera Pass',
    primaryAction: 'Narrate reveal',
    statLabels: ['Form', 'Finish', 'Motion', 'Angle'],
    stats: ['Aero body', 'Gloss read', 'Push-in', 'Low front'],
    tags: ['road', 'speed', 'showroom'],
  },
  vessel: {
    id: 'vessel',
    title: 'Vessel Command',
    eyebrow: 'Naval scale presentation',
    palette: 'radar waterline',
    icon: 'vessel',
    stageLabel: 'Command Deck',
    primaryAction: 'Narrate briefing',
    statLabels: ['Class', 'Mass', 'View', 'Cue'],
    stats: ['Naval asset', 'Heavy scale', 'Side cruise', 'Wake line'],
    tags: ['naval', 'radar', 'waterline'],
  },
  aircraft: {
    id: 'aircraft',
    title: 'Aviation Atlas',
    eyebrow: 'Aerospace flight lab',
    palette: 'hangar blue telemetry',
    icon: 'aircraft',
    stageLabel: '3D Flight Hangar',
    primaryAction: 'Narrate flight',
    statLabels: ['Role', 'Profile', 'Motion', 'Focus'],
    stats: ['Airframe', 'Stealth', 'Fly-by', 'Canopy'],
    tags: ['flight', 'hangar', 'canopy', 'wingline'],
    navLabels: ['Mission Brief', 'Aviation Atlas', 'Flight Lab'],
    layerLabels: ['Airframe', 'Engine', 'Material', 'AR'],
    toolLabels: ['Orbit', 'Zoom', 'Bank', 'Reset'],
    moduleLabel: 'Current aircraft',
  },
  artifact: {
    id: 'artifact',
    title: 'Artifact Museum',
    eyebrow: 'Curated object inspection',
    palette: 'warm gallery black',
    icon: 'artifact',
    stageLabel: 'Museum Turntable',
    primaryAction: 'Narrate exhibit',
    statLabels: ['Material', 'Surface', 'Value', 'Light'],
    stats: ['Aged object', 'Relief', 'Cultural', 'Spotlight'],
    tags: ['museum', 'patina', 'heritage'],
  },
  specimen: {
    id: 'specimen',
    title: 'Bio Lab',
    eyebrow: 'Microscopic inspection lesson',
    palette: 'soft lab volume',
    icon: 'specimen',
    stageLabel: 'Specimen Orbit',
    primaryAction: 'Narrate biology',
    statLabels: ['Volume', 'Surface', 'Detail', 'Mode'],
    stats: ['Organic', 'Translucent', 'Clusters', 'Scan'],
    tags: ['biology', 'inspection', 'lab'],
    navLabels: ['Overview', 'Bio Lab', 'Asset Lab'],
    layerLabels: ['Model', 'Material', 'Motion', 'AR'],
    toolLabels: ['Orbit', 'Zoom', 'Inspect', 'Reset'],
    moduleLabel: 'Live module',
  },
  product: {
    id: 'product',
    title: 'Product Studio',
    eyebrow: 'Clean object reveal',
    palette: 'white studio sweep',
    icon: 'product',
    stageLabel: 'Studio Reveal',
    primaryAction: 'Narrate object',
    statLabels: ['Object', 'Material', 'Detail', 'Shot'],
    stats: ['Single asset', 'Mixed', 'Feature', 'Turntable'],
    tags: ['product', 'studio', 'detail'],
  },
}

export function getShowcaseTheme(cell = {}) {
  const category = inferAssetCategory(cell)
  const theme = SHOWCASE_THEMES[category.id] || SHOWCASE_THEMES[category.sceneProfile] || SHOWCASE_THEMES.product
  const scene = getSceneProfile(category.sceneProfile || category.motionProfile || theme.id)

  return {
    ...theme,
    category,
    scene,
    tags: [...new Set([...(theme.tags || []), ...(category.tags || [])])].slice(0, 5),
  }
}

export function getCategoryLabel(categoryId) {
  return ASSET_CATEGORIES.find((category) => category.id === categoryId)?.label || SHOWCASE_THEMES.product.title
}
