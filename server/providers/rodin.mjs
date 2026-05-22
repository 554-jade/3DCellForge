import { Blob } from 'node:buffer'
import { fetch as undiciFetch, FormData } from 'undici'

import {
  OUTBOUND_PROXY_AGENT,
  RODIN_ADDONS,
  RODIN_API_BASE,
  RODIN_API_KEY,
  RODIN_DEFAULT_MODEL,
  RODIN_HD_TEXTURE,
  RODIN_MATERIAL,
  RODIN_MESH_MODE,
  RODIN_PREVIEW_RENDER,
  RODIN_QUALITY,
  RODIN_QUALITY_OVERRIDE,
  RODIN_TIER,
  hasOutboundProxy,
} from '../config.mjs'
import { parseDataUrl, sanitizeFileName } from '../http-utils.mjs'
import { cacheRemoteModelAs, hasLocalModel, localModelUrl } from '../model-store.mjs'
import { findFirstValue } from '../object-utils.mjs'

export const RODIN_MODEL_DEFINITIONS = [
  {
    id: 'gen2-hq',
    label: 'Rodin Gen-2 HQ',
    tier: 'Gen-2',
    quality: 'high',
    qualityOverride: 150000,
    meshMode: 'Quad',
    material: 'PBR',
    addons: ['HighPack'],
    hdTexture: true,
    previewRender: true,
  },
  {
    id: 'gen25-hq',
    label: 'Rodin Gen-2.5 HQ',
    tier: 'Gen-2.5',
    quality: 'high',
    qualityOverride: 200000,
    meshMode: 'Quad',
    material: 'PBR',
    addons: ['HighPack'],
    hdTexture: true,
    previewRender: true,
  },
]

const RODIN_MODEL_IDS = new Set(RODIN_MODEL_DEFINITIONS.map((model) => model.id))
const FALLBACK_RODIN_MODEL = RODIN_MODEL_DEFINITIONS[0].id

export function getRodinHealth() {
  const defaults = buildRodinOptions({})

  return {
    configured: Boolean(RODIN_API_KEY),
    baseUrl: RODIN_API_BASE,
    defaultModel: defaults.modelId,
    models: RODIN_MODEL_DEFINITIONS.map(({ id, label, tier }) => ({ id, label, tier })),
    tier: defaults.tier,
    quality: defaults.quality,
    qualityOverride: defaults.qualityOverride,
    meshMode: defaults.meshMode,
    material: defaults.material,
    addons: defaults.addons,
    hdTexture: defaults.hdTexture,
    previewRender: defaults.previewRender,
  }
}

export async function createRodinTask(payload) {
  requireRodinKey()

  const image = parseDataUrl(payload.imageDataUrl)
  const fileName = sanitizeFileName(payload.fileName || `cell-reference.${image.ext}`)
  const rodinOptions = buildRodinOptions(payload)
  const form = new FormData()
  form.append('images', new Blob([image.buffer], { type: image.mime }), fileName)
  form.append('geometry_file_format', 'glb')
  appendRodinOptions(form, rodinOptions)

  if (payload.prompt) form.append('prompt', payload.prompt)
  if (payload.seed !== undefined) form.append('seed', String(payload.seed))

  const raw = await rodinRequest('/rodin', {
    method: 'POST',
    body: form,
  })
  const taskUuid = findFirstValue(raw, ['uuid', 'task_uuid', 'taskUuid', 'taskId', 'id'])
  const subscriptionKey = findFirstValue(raw.jobs || raw, ['subscription_key', 'subscriptionKey'])

  if (!taskUuid) {
    const error = new Error('Rodin task response did not include a task uuid.')
    error.detail = sanitizeRodinRaw(raw)
    throw error
  }

  if (!subscriptionKey) {
    const error = new Error('Rodin task response did not include a subscription key.')
    error.detail = sanitizeRodinRaw(raw)
    throw error
  }

  return {
    provider: 'rodin',
    modelId: rodinOptions.modelId,
    modelLabel: rodinOptions.modelLabel,
    tier: rodinOptions.tier,
    taskId: encodeRodinTaskId({ taskUuid, subscriptionKey }),
    status: 'queued',
    raw: sanitizeRodinRaw(raw),
  }
}

export async function getRodinTask(taskId) {
  requireRodinKey()

  if (!taskId) {
    throw Object.assign(new Error('taskId is required.'), { status: 400 })
  }

  const rodinTask = decodeRodinTaskId(taskId)
  if (await hasLocalModel(rodinTask.taskUuid, 'glb')) {
    return {
      provider: 'rodin',
      taskId,
      status: 'success',
      progress: 100,
      modelUrl: localModelUrl(rodinTask.taskUuid, 'glb'),
      rawModelUrl: '',
      error: '',
      raw: { cached: true },
    }
  }

  const raw = await rodinRequest('/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_key: rodinTask.subscriptionKey }),
  })
  const jobs = Array.isArray(raw.jobs) ? raw.jobs : []
  const status = normalizeRodinStatus(jobs.map((job) => job.status).filter(Boolean))
  let modelUrl = ''
  let rawModelUrl = ''
  let cacheError = ''

  if (status === 'success') {
    try {
      const download = await getRodinDownload(rodinTask.taskUuid)
      rawModelUrl = download.url
      modelUrl = await cacheRemoteModelAs(rodinTask.taskUuid, rawModelUrl, download.ext)
    } catch (error) {
      cacheError = error.message || 'Rodin model download failed.'
    }
  }

  return {
    provider: 'rodin',
    taskId,
    status,
    progress: getRodinProgress(status, jobs),
    modelUrl,
    rawModelUrl,
    error: raw.error || cacheError || '',
    raw: sanitizeRodinRaw(raw),
  }
}

export function encodeRodinTaskId(task) {
  return `rodin-${Buffer.from(JSON.stringify(task)).toString('base64url')}`
}

export function decodeRodinTaskId(taskId) {
  const raw = String(taskId || '')
  if (!raw.startsWith('rodin-')) {
    return { taskUuid: raw, subscriptionKey: raw }
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw.slice(6), 'base64url').toString('utf8'))
    return {
      taskUuid: parsed.taskUuid || parsed.uuid || raw,
      subscriptionKey: parsed.subscriptionKey || parsed.subscription_key || parsed.taskUuid || raw,
    }
  } catch {
    return { taskUuid: raw, subscriptionKey: raw }
  }
}

export function normalizeRodinStatus(statuses) {
  const values = (Array.isArray(statuses) ? statuses : [statuses]).map((status) => String(status || '').trim().toLowerCase())
  if (!values.length) return 'running'
  if (values.some((status) => ['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(status))) return 'failed'
  if (values.every((status) => ['done', 'success', 'succeeded', 'completed', 'complete', 'finish', 'finished'].includes(status))) return 'success'
  if (values.some((status) => ['waiting', 'queued', 'pending'].includes(status))) return 'queued'
  return 'running'
}

export function normalizeRodinModelId(value) {
  const raw = String(value || '').trim()
  if (RODIN_MODEL_IDS.has(raw)) return raw
  return RODIN_MODEL_IDS.has(RODIN_DEFAULT_MODEL) ? RODIN_DEFAULT_MODEL : FALLBACK_RODIN_MODEL
}

export function buildRodinOptions(payload = {}) {
  const explicitModelId = payload.rodinModelId || payload.modelId
  const modelId = normalizeRodinModelId(explicitModelId || RODIN_DEFAULT_MODEL)
  const preset = RODIN_MODEL_DEFINITIONS.find((model) => model.id === modelId) || RODIN_MODEL_DEFINITIONS[0]
  const useEnvDefaults = !explicitModelId
  const envQualityOverride = useEnvDefaults && RODIN_QUALITY_OVERRIDE !== '' ? RODIN_QUALITY_OVERRIDE : undefined
  const qualityOverride = normalizeOptionalNumber(payload.qualityOverride ?? envQualityOverride ?? preset.qualityOverride)

  return {
    modelId,
    modelLabel: preset.label,
    tier: normalizeString(payload.tier ?? (useEnvDefaults ? RODIN_TIER : undefined) ?? preset.tier, preset.tier),
    quality: normalizeString(payload.quality ?? (useEnvDefaults ? RODIN_QUALITY : undefined) ?? preset.quality, preset.quality),
    qualityOverride,
    meshMode: normalizeString(payload.meshMode ?? payload.mesh_mode ?? (useEnvDefaults ? RODIN_MESH_MODE : undefined) ?? preset.meshMode, preset.meshMode),
    material: normalizeString(payload.material ?? (useEnvDefaults ? RODIN_MATERIAL : undefined) ?? preset.material, preset.material),
    addons: normalizeAddons(payload.addons ?? (useEnvDefaults ? RODIN_ADDONS : undefined) ?? preset.addons),
    hdTexture: normalizeBoolean(payload.hdTexture ?? payload.hd_texture ?? (useEnvDefaults ? RODIN_HD_TEXTURE : undefined), preset.hdTexture),
    previewRender: normalizeBoolean(payload.previewRender ?? payload.preview_render ?? (useEnvDefaults ? RODIN_PREVIEW_RENDER : undefined), preset.previewRender),
  }
}

export function findRodinDownloadItem(raw) {
  const items = Array.isArray(raw?.list) ? raw.list : []
  return items.find((entry) => /\.glb(?:[?#]|$)/i.test(entry.name || entry.url || ''))
    || items.find((entry) => /\.gltf(?:[?#]|$)/i.test(entry.name || entry.url || ''))
    || items.find((entry) => /^https?:\/\//i.test(entry.url || ''))
    || null
}

function appendRodinOptions(form, options) {
  form.append('material', options.material)
  form.append('tier', options.tier)
  form.append('mesh_mode', options.meshMode)
  form.append('hd_texture', String(options.hdTexture))
  form.append('preview_render', String(options.previewRender))

  if (options.qualityOverride !== undefined) {
    form.append('quality_override', String(options.qualityOverride))
  } else {
    form.append('quality', options.quality)
  }

  for (const addon of options.addons) {
    form.append('addons', addon)
  }
}

function requireRodinKey() {
  if (!RODIN_API_KEY) {
    const error = new Error('RODIN_API_KEY is not configured on the backend.')
    error.status = 500
    throw error
  }
}

function normalizeString(value, fallback) {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return Boolean(fallback)
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return Boolean(fallback)
}

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function normalizeAddons(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',')
  return list.map((item) => String(item).trim()).filter(Boolean)
}

async function getRodinDownload(taskUuid) {
  const raw = await rodinRequest('/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_uuid: taskUuid }),
  })
  const item = findRodinDownloadItem(raw)

  if (!item?.url) {
    const error = new Error('Rodin download response did not include a model URL.')
    error.detail = sanitizeRodinRaw(raw)
    throw error
  }

  const ext = /\.gltf(?:[?#]|$)/i.test(item.name || item.url) ? 'gltf' : 'glb'
  return { url: item.url, ext, raw }
}

function getRodinProgress(status, jobs) {
  if (status === 'success') return 100
  if (status === 'queued') return 0
  if (!Array.isArray(jobs) || !jobs.length) return null

  const done = jobs.filter((job) => normalizeRodinStatus(job.status) === 'success').length
  if (!done) return null
  return Math.round((done / jobs.length) * 100)
}

async function rodinRequest(requestPath, options = {}) {
  let response
  try {
    response = await undiciFetch(`${RODIN_API_BASE.replace(/\/$/, '')}${requestPath.startsWith('/') ? requestPath : `/${requestPath}`}`, {
      ...options,
      ...(OUTBOUND_PROXY_AGENT ? { dispatcher: OUTBOUND_PROXY_AGENT } : {}),
      headers: {
        Authorization: `Bearer ${RODIN_API_KEY}`,
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    const wrapped = new Error(`Rodin network request failed: ${error.message}`)
    wrapped.detail = {
      path: requestPath,
      cause: error.cause?.message || error.cause?.code || '',
      proxy: hasOutboundProxy(),
    }
    throw wrapped
  }

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text || 'Non-JSON response from Rodin.' }
  }

  if (!response.ok || data.error) {
    const error = new Error(data.message || data.error || `Rodin request failed with ${response.status}.`)
    error.status = response.status || 502
    error.detail = sanitizeRodinRaw(data)
    throw error
  }

  return data
}

function sanitizeRodinRaw(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return JSON.parse(JSON.stringify(raw, (key, value) => {
    if (['subscription_key', 'subscriptionKey'].includes(key)) return '[secret omitted]'
    return value
  }))
}
