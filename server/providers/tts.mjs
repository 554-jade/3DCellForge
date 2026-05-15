import { fetch as undiciFetch } from 'undici'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  EDGE_TTS_COMMAND,
  EDGE_TTS_PITCH,
  EDGE_TTS_PROXY,
  EDGE_TTS_RATE,
  EDGE_TTS_TIMEOUT_MS,
  EDGE_TTS_VOICE_EN,
  EDGE_TTS_VOICE_ES,
  EDGE_TTS_VOICE_JA,
  EDGE_TTS_VOICE_ZH,
  EDGE_TTS_VOLUME,
  OPENAI_API_BASE,
  OPENAI_TTS_API_KEY,
  OPENAI_TTS_FORMAT,
  OPENAI_TTS_MODEL,
  OPENAI_TTS_VOICE,
  OUTBOUND_PROXY_AGENT,
  TTS_PROVIDER,
  hasOutboundProxy,
} from '../config.mjs'

const LANGUAGE_NAMES = {
  en: 'English',
  zh: 'Mandarin Chinese',
  ja: 'Japanese',
  es: 'Spanish',
}
const SUPPORTED_FORMATS = new Set(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'])
const MIME_BY_FORMAT = {
  mp3: 'audio/mpeg',
  opus: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  wav: 'audio/wav',
  pcm: 'audio/L16',
}
const EDGE_VOICE_BY_LANGUAGE = {
  en: EDGE_TTS_VOICE_EN,
  zh: EDGE_TTS_VOICE_ZH,
  ja: EDGE_TTS_VOICE_JA,
  es: EDGE_TTS_VOICE_ES,
}

export function getTtsHealth() {
  const provider = selectTtsProvider()
  return {
    provider,
    requestedProvider: TTS_PROVIDER,
    configured: provider === 'openai' ? Boolean(OPENAI_TTS_API_KEY) : Boolean(EDGE_TTS_COMMAND),
    model: provider === 'openai' ? OPENAI_TTS_MODEL : 'edge-tts-cli',
    voice: provider === 'openai' ? OPENAI_TTS_VOICE : EDGE_TTS_VOICE_ZH,
    format: normalizeFormat(OPENAI_TTS_FORMAT),
    baseUrl: provider === 'openai' ? OPENAI_API_BASE : '',
    edgeCommand: provider === 'edge' ? EDGE_TTS_COMMAND : '',
    openaiConfigured: Boolean(OPENAI_TTS_API_KEY),
    edgeConfigured: Boolean(EDGE_TTS_COMMAND),
  }
}

export async function createShowcaseSpeech(payload = {}) {
  const provider = selectTtsProvider()
  if (provider === 'edge') return createEdgeSpeech(payload)
  if (provider !== 'openai') {
    throw Object.assign(new Error(`TTS_PROVIDER=${TTS_PROVIDER} is not supported yet.`), { status: 501 })
  }

  if (!OPENAI_TTS_API_KEY) {
    throw Object.assign(new Error('OPENAI_TTS_API_KEY or OPENAI_API_KEY is not configured on the backend.'), { status: 503 })
  }

  const input = normalizeInput(payload.text)
  const language = normalizeLanguage(payload.language)
  const format = normalizeFormat(payload.format || OPENAI_TTS_FORMAT)
  const voice = normalizeVoice(payload.voice || OPENAI_TTS_VOICE)
  const instructions = normalizeInstructions(payload.instructions || buildSpeechInstructions(language))
  const audio = await openAiSpeechRequest({ input, language, voice, format, instructions })
  const mime = MIME_BY_FORMAT[format] || 'audio/mpeg'

  return {
    provider: 'openai',
    model: OPENAI_TTS_MODEL,
    voice,
    language,
    mime,
    audioBase64: Buffer.from(audio).toString('base64'),
  }
}

async function createEdgeSpeech(payload = {}) {
  if (!EDGE_TTS_COMMAND) {
    throw Object.assign(new Error('EDGE_TTS_COMMAND is not configured.'), { status: 503 })
  }

  const input = normalizeInput(payload.text)
  const language = normalizeLanguage(payload.language)
  const voice = normalizeEdgeVoice(payload.voice || EDGE_VOICE_BY_LANGUAGE[language])
  const audio = await edgeSpeechRequest({
    input,
    voice,
    rate: normalizeEdgePercent(payload.rate || EDGE_TTS_RATE),
    volume: normalizeEdgePercent(payload.volume || EDGE_TTS_VOLUME),
    pitch: normalizeEdgePitch(payload.pitch || EDGE_TTS_PITCH),
  })

  return {
    provider: 'edge',
    model: 'edge-tts-cli',
    voice,
    language,
    mime: 'audio/mpeg',
    audioBase64: audio.toString('base64'),
  }
}

async function openAiSpeechRequest({ input, voice, format, instructions }) {
  const body = {
    model: OPENAI_TTS_MODEL,
    voice,
    input,
    response_format: format,
  }

  if (instructions && !OPENAI_TTS_MODEL.startsWith('tts-')) {
    body.instructions = instructions
  }

  let response
  try {
    response = await undiciFetch(`${OPENAI_API_BASE.replace(/\/$/, '')}/audio/speech`, {
      method: 'POST',
      ...(OUTBOUND_PROXY_AGENT ? { dispatcher: OUTBOUND_PROXY_AGENT } : {}),
      headers: {
        Authorization: `Bearer ${OPENAI_TTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    const wrapped = new Error(`OpenAI TTS network request failed: ${error.message}`)
    wrapped.detail = {
      cause: error.cause?.message || error.cause?.code || '',
      proxy: hasOutboundProxy(),
    }
    throw wrapped
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (!response.ok) {
    const detail = parseErrorDetail(buffer)
    const error = new Error(detail.error?.message || detail.message || `OpenAI TTS request failed with ${response.status}.`)
    error.status = response.status || 502
    error.detail = detail
    throw error
  }

  return buffer
}

async function edgeSpeechRequest({ input, voice, rate, volume, pitch }) {
  const dir = await mkdtemp(path.join(tmpdir(), '3d-model-studio-tts-'))
  const textFile = path.join(dir, 'input.txt')
  const mediaFile = path.join(dir, 'speech.mp3')

  try {
    await writeFile(textFile, input, 'utf8')
    const args = [
      '--file', textFile,
      '--voice', voice,
      '--rate', rate,
      '--volume', volume,
      '--pitch', pitch,
      '--write-media', mediaFile,
    ]
    if (EDGE_TTS_PROXY) args.push('--proxy', EDGE_TTS_PROXY)

    await runEdgeCommand(args)
    return await readFile(mediaFile)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function runEdgeCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(EDGE_TTS_COMMAND, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      shell: false,
    })
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(Object.assign(new Error(`Edge TTS command timed out after ${EDGE_TTS_TIMEOUT_MS}ms.`), { status: 504 }))
    }, EDGE_TTS_TIMEOUT_MS)

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      reject(Object.assign(new Error(`Edge TTS command unavailable: ${error.message}`), { status: 503 }))
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
        return
      }
      reject(Object.assign(new Error(`Edge TTS command failed with exit code ${code}.`), {
        status: 502,
        detail: stderr.trim().slice(0, 700),
      }))
    })
  })
}

function normalizeInput(text) {
  const input = String(text || '').replace(/\s+/g, ' ').trim()
  if (!input) throw Object.assign(new Error('TTS text is required.'), { status: 400 })
  if (input.length > 3600) throw Object.assign(new Error('TTS text is too long for one showcase narration.'), { status: 413 })
  return input
}

function normalizeLanguage(language) {
  const normalized = String(language || 'en').trim().toLowerCase()
  return LANGUAGE_NAMES[normalized] ? normalized : 'en'
}

function normalizeVoice(voice) {
  return String(voice || 'marin').trim().toLowerCase().replace(/[^\w-]/g, '') || 'marin'
}

function normalizeEdgeVoice(voice) {
  return String(voice || EDGE_TTS_VOICE_EN).trim().replace(/[^\w.-]/g, '') || EDGE_TTS_VOICE_EN
}

function normalizeFormat(format) {
  const normalized = String(format || 'mp3').trim().toLowerCase()
  return SUPPORTED_FORMATS.has(normalized) ? normalized : 'mp3'
}

function normalizeEdgePercent(value) {
  const normalized = String(value || '+0%').trim()
  return /^[+-]?\d{1,3}%$/.test(normalized) ? normalized : '+0%'
}

function normalizeEdgePitch(value) {
  const normalized = String(value || '+0Hz').trim()
  return /^[+-]?\d{1,4}Hz$/.test(normalized) ? normalized : '+0Hz'
}

function normalizeInstructions(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > 520 ? text.slice(0, 520).trim() : text
}

function buildSpeechInstructions(language) {
  const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en
  if (language === 'zh') {
    return 'Speak in natural Mandarin Chinese. Use a confident museum guide tone, clear pacing, and cinematic product-demo energy. Avoid sounding robotic.'
  }
  if (language === 'ja') {
    return 'Speak in natural Japanese with a calm museum guide tone, clear pacing, and polished demo energy.'
  }
  if (language === 'es') {
    return 'Speak in natural Spanish with a confident museum guide tone, clear pacing, and polished demo energy.'
  }
  return `Speak in natural ${languageName}. Use a confident museum guide tone, clear pacing, and cinematic product-demo energy.`
}

function selectTtsProvider() {
  const requested = String(TTS_PROVIDER || 'auto').trim().toLowerCase()
  if (requested === 'openai') return 'openai'
  if (requested === 'edge') return 'edge'
  if (requested === 'auto') return OPENAI_TTS_API_KEY ? 'openai' : 'edge'
  return requested
}

function parseErrorDetail(buffer) {
  const text = buffer.toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || 'Non-JSON response from OpenAI TTS.' }
  }
}
