import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ProxyAgent } from 'undici'

loadLocalEnv()

export const API_PORT = Number(process.env.API_PORT || 8787)
export const API_HOST = process.env.API_HOST || '127.0.0.1'
export const BODY_LIMIT = 28 * 1024 * 1024
export const MODEL_UPLOAD_LIMIT = 180 * 1024 * 1024
export const TRIPO_API_KEY = process.env.TRIPO_API_KEY
export const TRIPO_API_BASE = process.env.TRIPO_API_BASE || 'https://api.tripo3d.ai/v2/openapi'
export const TRIPO_MODEL_VERSION = process.env.TRIPO_MODEL_VERSION || 'v3.0-20250812'
export const RODIN_API_KEY = process.env.RODIN_API_KEY
export const RODIN_API_BASE = process.env.RODIN_API_BASE || 'https://api.hyper3d.com/api/v2'
export const RODIN_DEFAULT_MODEL = process.env.RODIN_DEFAULT_MODEL || process.env.RODIN_MODEL_ID || 'gen2-hq'
export const RODIN_TIER = process.env.RODIN_TIER || 'Gen-2'
export const RODIN_QUALITY = process.env.RODIN_QUALITY || 'high'
export const RODIN_QUALITY_OVERRIDE = process.env.RODIN_QUALITY_OVERRIDE || ''
export const RODIN_MESH_MODE = process.env.RODIN_MESH_MODE || 'Quad'
export const RODIN_MATERIAL = process.env.RODIN_MATERIAL || 'PBR'
export const RODIN_ADDONS = process.env.RODIN_ADDONS || 'HighPack'
export const RODIN_HD_TEXTURE = process.env.RODIN_HD_TEXTURE || 'true'
export const RODIN_PREVIEW_RENDER = process.env.RODIN_PREVIEW_RENDER || 'true'
export const HUNYUAN_API_BASE = process.env.HUNYUAN_API_BASE || 'http://127.0.0.1:8081'
export const HUNYUAN_CREATE_PATH = process.env.HUNYUAN_CREATE_PATH || '/send'
export const HUNYUAN_STATUS_PATH = process.env.HUNYUAN_STATUS_PATH || '/status'
export const FAL_API_KEY = process.env.FAL_API_KEY || process.env.FAL_KEY
export const FAL_DEFAULT_MODEL = process.env.FAL_DEFAULT_MODEL || 'tripo3d/tripo/v2.5/image-to-3d'
export const VISION_PROVIDER = process.env.VISION_PROVIDER || 'openai'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
export const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini'
export const OPENAI_TTS_API_KEY = process.env.OPENAI_TTS_API_KEY || process.env.VOICE_TOOLS_OPENAI_KEY || process.env.OPENAI_API_KEY
export const TTS_PROVIDER = process.env.TTS_PROVIDER || 'auto'
export const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts'
export const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'marin'
export const OPENAI_TTS_FORMAT = process.env.OPENAI_TTS_FORMAT || 'mp3'
export const EDGE_TTS_COMMAND = process.env.EDGE_TTS_COMMAND || 'edge-tts'
export const EDGE_TTS_VOICE_EN = process.env.EDGE_TTS_VOICE_EN || 'en-US-EmmaMultilingualNeural'
export const EDGE_TTS_VOICE_ZH = process.env.EDGE_TTS_VOICE_ZH || 'zh-CN-XiaoxiaoNeural'
export const EDGE_TTS_VOICE_JA = process.env.EDGE_TTS_VOICE_JA || 'ja-JP-NanamiNeural'
export const EDGE_TTS_VOICE_ES = process.env.EDGE_TTS_VOICE_ES || 'es-ES-ElviraNeural'
export const EDGE_TTS_RATE = process.env.EDGE_TTS_RATE || '+0%'
export const EDGE_TTS_VOLUME = process.env.EDGE_TTS_VOLUME || '+0%'
export const EDGE_TTS_PITCH = process.env.EDGE_TTS_PITCH || '+0Hz'
export const EDGE_TTS_TIMEOUT_MS = Number(process.env.EDGE_TTS_TIMEOUT_MS || 60000)
export const EDGE_TTS_PROXY = process.env.EDGE_TTS_PROXY || ''
export const LOCAL_MODEL_DIR = path.resolve(process.env.LOCAL_MODEL_DIR || '.generated-models')
export const LOG_DIR = path.resolve(process.env.LOG_DIR || '.logs')
export const LOG_FILE = path.resolve(LOG_DIR, process.env.LOG_FILE || '3d-model-studio-api.log')
export const OUTBOUND_PROXY_AGENT = createProxyAgent()

export function hasOutboundProxy() {
  return Boolean(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy)
}

function loadLocalEnv() {
  if (!existsSync('.env.local')) return

  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const index = trimmed.indexOf('=')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    value = value.replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function createProxyAgent() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  if (!proxy) return null

  return new ProxyAgent(proxy)
}
