import { getProviderLabel } from '../services/modelApi.js'
import { apiUrl, readApiResponse } from '../services/modelApi.js'
import { getShowcaseTheme } from './showcaseThemes.js'

const SPEECH_LANGUAGE = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  es: 'es-ES',
}

const CATEGORY_NARRATION = {
  zh: {
    dinosaur: {
      label: '恐龙图鉴',
      material: '骨骼纹理、化石质感、牙齿、爪部和整体骨架轮廓',
      focus: '头骨、牙齿、肋骨、四肢和尾部平衡',
      description: '这是一个偏数字图鉴的恐龙或化石模型，重点不是普通旋转，而是像课程一样带着用户看结构。',
      value: '适合用展台灯光、标签切换和慢速讲解，把模型包装成可以录屏传播的教学演示。',
    },
    artifact: {
      label: '博物馆文物',
      material: '金属、铜锈、浮雕、边缘轮廓和旧化表面',
      focus: '整体剪影、铜锈层次、浮雕细节和边缘形态',
      description: '这是一个博物馆式物件，观看重点是材质历史感、符号细节和侧光下的表面起伏。',
      value: '适合用慢速转台、暖色聚光和细节停顿，做成策展式讲解。',
    },
    road: {
      label: '性能车辆',
      material: '车身漆面、玻璃、轮胎、轮毂和深色饰件',
      focus: '车身姿态、轮组、挡风玻璃和前脸比例',
      description: '这是一个车辆模型，可信度主要看姿态、轮子位置、前脸比例和漆面高光。',
      value: '适合低机位、向前推进和三分之四视角，让它看起来像在展示速度和重量。',
    },
    vessel: {
      label: '舰艇模型',
      material: '钢制舰体、甲板平面、舰岛、天线和水线体量',
      focus: '舰体长度、甲板、舰岛结构和水线比例',
      description: '这是一个大型舰艇模型，重点是长舰体、宽甲板和重型体量，而不是小玩具式旋转。',
      value: '适合侧向巡航、较远镜头、水面和尾流提示，让尺度感成立。',
    },
    aircraft: {
      label: '航空器',
      material: '机身涂装、座舱玻璃、翼面边缘、进气道和尾喷口',
      focus: '机身中线、机翼、尾翼、座舱和发动机区域',
      description: '这是一个航空器模型，观看重点是飞行方向、翼面结构和机身姿态是否连贯。',
      value: '适合飞掠镜头、倾斜运动和尾迹线，让方向感和升力感更明显。',
    },
    product: {
      label: '产品物件',
      material: '混合材质、边缘高光、纹理分区和可识别的功能区域',
      focus: '外形剪影、材质分区和主要功能布局',
      description: '这是一个产品模型，关键是轮廓、材质分区和核心特征是否一眼能读懂。',
      value: '适合干净转台、柔和反光和短暂停顿，突出产品卖点。',
    },
    specimen: {
      label: '生物标本',
      material: '柔和半透明表面、有机体积和颜色分层的内部结构',
      focus: '整体体积、半透明外层和内部簇状结构',
      description: '这是一个生物或有机标本模型，重点是整体体积、表面透感和内部结构分布。',
      value: '适合近距离环绕、边缘光和慢速缩放，做成教育检查视图。',
    },
  },
  ja: {
    default: {
      label: '3Dアセット',
      material: '形状、素材の分かれ方、表面ディテール',
      focus: 'シルエット、ボリューム、主要な特徴',
      description: 'これはプレゼン用の3Dモデルです。見るべき点は、全体の形と重要なディテールが読み取れるかどうかです。',
      value: '短い紹介動画向けに、ゆっくりしたカメラ、ラベル、説明音声で見せます。',
    },
  },
  es: {
    default: {
      label: 'asset 3D',
      material: 'forma, zonas de material y detalle de superficie',
      focus: 'silueta, volumen y rasgos principales',
      description: 'Este es un modelo 3D preparado para presentacion. Lo importante es que la forma y los detalles se lean con claridad.',
      value: 'Funciona mejor con una camara lenta, etiquetas y narracion breve para grabar una demo pulida.',
    },
  },
}

let activeAudio = null
let speechToken = 0

export function buildShowcaseNarration(cell = {}, { language = 'en', theme: localizedTheme } = {}) {
  const theme = localizedTheme || getShowcaseTheme(cell)
  const category = theme.category
  const objectName = cell.fullName || cell.name || 'this model'
  const provider = getProviderLabel(cell.generation?.provider || cell.generation?.requestedProvider)
  const categoryText = getCategoryNarration(category, language)
  const material = categoryText.material || category.material || 'recognizable shape, material zones, and surface detail'
  const focus = categoryText.focus || category.inspectionFocus || 'silhouette, volume, and important details'

  if (language === 'zh') {
    const source = cell.custom
      ? `这个模型来自 ${provider}，系统使用你上传的参考图生成可交互的三维资产。`
      : '这是内置的起始模型，用来演示交互式展示系统。'
    const script = [
      `${objectName} 当前放在「${theme.title}」展示模式中，这套布局针对${categoryText.label}做了镜头和信息层优化。`,
      source,
      `镜头会重点观察${focus}，画面会突出${material}。`,
      categoryText.value || category.value,
    ].filter(Boolean).join(' ')

    return {
      title: objectName,
      subtitle: categoryText.label,
      script,
      bullets: [
        categoryText.description,
        `观察重点：${focus}。`,
        categoryText.value || category.value,
      ].filter(Boolean),
    }
  }

  if (language === 'ja') {
    const source = cell.custom
      ? `このアセットは ${provider} から作成され、アップロードした参照画像をもとにしています。`
      : 'これはインタラクティブ表示を示すためのスターターモデルです。'
    return {
      title: objectName,
      subtitle: categoryText.label,
      script: [
        `${objectName} は「${theme.title}」で表示されています。`,
        source,
        `カメラは ${focus} に注目し、${material} を強調します。`,
        categoryText.value,
      ].filter(Boolean).join(' '),
      bullets: [categoryText.description, `注目点：${focus}。`, categoryText.value].filter(Boolean),
    }
  }

  if (language === 'es') {
    const source = cell.custom
      ? `Este asset viene de ${provider}, usando la imagen subida como referencia para el modelo interactivo.`
      : 'Este es un modelo inicial para demostrar el sistema interactivo.'
    return {
      title: objectName,
      subtitle: categoryText.label,
      script: [
        `${objectName} se presenta en ${theme.title}, con una escena preparada para ${categoryText.label}.`,
        source,
        `La camara se centra en ${focus} y resalta ${material}.`,
        categoryText.value,
      ].filter(Boolean).join(' '),
      bullets: [categoryText.description, `Foco de inspeccion: ${focus}.`, categoryText.value].filter(Boolean),
    }
  }

  const intro = `${objectName} is presented in ${theme.title}, a showcase layout tuned for ${category.label.toLowerCase()}.`
  const source = cell.custom
    ? `This asset comes from ${provider}, using the uploaded reference as the source for the interactive model.`
    : 'This is a starter model used to demonstrate the interactive presentation system.'
  const inspection = `The camera focuses on ${focus}. The scene emphasizes ${material}.`
  const close = category.value || 'Use this mode to create a short, polished recording without exposing the editing workspace.'

  return {
    title: objectName,
    subtitle: categoryText.label || category.label,
    script: [intro, source, inspection, close].join(' '),
    bullets: [
      categoryText.description || category.description,
      `Inspection focus: ${focus}.`,
      close,
    ].filter(Boolean),
  }
}

export async function speakShowcase(text, { language = 'en', onEnd, preferServer = true } = {}) {
  const token = ++speechToken
  stopCurrentAudio()
  cancelBrowserSpeech()

  if (preferServer) {
    try {
      const response = await fetch(apiUrl('/api/tts/showcase'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })
      const speech = await readApiResponse(response)
      if (token !== speechToken) return null
      return playServerAudio(speech, { token, onEnd })
    } catch {
      if (token !== speechToken) return null
    }
  }

  if (token !== speechToken) return null
  return speakBrowserShowcase(text, { language, onEnd })
}

export function stopShowcaseSpeech() {
  speechToken += 1
  stopCurrentAudio()
  cancelBrowserSpeech()
}

function playServerAudio(speech, { token, onEnd } = {}) {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || !speech?.audioBase64) return null

  const audio = new Audio(`data:${speech.mime || 'audio/mpeg'};base64,${speech.audioBase64}`)
  activeAudio = audio
  audio.onended = () => {
    if (token === speechToken) onEnd?.()
  }
  audio.onerror = () => {
    if (token === speechToken) onEnd?.()
  }
  audio.play().catch(() => {
    if (token === speechToken) onEnd?.()
  })
  return audio
}

function speakBrowserShowcase(text, { language = 'en', onEnd } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    onEnd?.()
    return null
  }

  cancelBrowserSpeech()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANGUAGE[language] || SPEECH_LANGUAGE.en
  utterance.voice = findPreferredVoice(utterance.lang)
  utterance.rate = 0.92
  utterance.pitch = 1
  utterance.volume = 0.92
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
  return utterance
}

function stopCurrentAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.removeAttribute('src')
    activeAudio.load()
    activeAudio = null
  }
}

function cancelBrowserSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

function getCategoryNarration(category = {}, language = 'en') {
  const catalog = CATEGORY_NARRATION[language]
  if (!catalog) return category
  return catalog[category.id] || catalog.default || category
}

function findPreferredVoice(language) {
  if (typeof window === 'undefined' || !window.speechSynthesis?.getVoices) return null
  const voices = window.speechSynthesis.getVoices()
  return voices.find((voice) => voice.lang === language) || voices.find((voice) => voice.lang?.startsWith(language.split('-')[0])) || null
}
