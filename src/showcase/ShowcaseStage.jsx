import { useEffect, useMemo, useState } from 'react'
import { Box, ChevronRight, Globe2, Pause, Play, Radio, Sparkles, Volume2, VolumeX, X } from 'lucide-react'

import { LANGUAGE_OPTIONS } from '../config/appConfig.js'
import { getAvailableOrganelleIds, getCell, getGeneratedModelUrl, getModelCellId, getOrganelleDetail } from '../domain/cellCatalog.js'
import { getUiText } from '../lib/i18n.js'
import { inferMotionProfile } from '../lib/motionProfiles.js'
import { getProviderLabel } from '../services/modelApi.js'
import { CellThumb } from '../components/CellThumb.jsx'
import { CellFallback, CellScene, ViewerErrorBoundary } from '../viewer/CellViewer.jsx'
import { buildShowcaseNarration, speakShowcase, stopShowcaseSpeech } from './showcaseNarration.js'
import { getShowcaseTheme } from './showcaseThemes.js'

const SHOWCASE_TEXT = {
  en: {
    language: 'Language',
    storyCamera: 'Story Camera',
    webgl3d: 'WebGL 3D',
    pauseTour: 'Pause Tour',
    playTour: 'Play Tour',
    stopVoice: 'Stop Voice',
    nextModel: 'Next Model',
    exitShowcase: 'Exit Showcase',
    guidedNotes: 'Guided Notes',
    status: { glbReady: 'GLB ready', queued: 'queued', procedural: 'procedural' },
    notifications: {
      narrationStopped: 'Narration stopped',
      narrationStarted: 'Showcase narration started',
      fallback: 'Showcase preview fell back to saved image',
      webglEnabled: 'WebGL controls enabled: drag to rotate and scroll to zoom',
      storyRestored: 'Story camera restored',
      storyEnabled: 'Story camera enabled',
      viewReset: 'Showcase view reset',
    },
    readyDescription: (name, provider, status) => `${name} is ready as a ${provider} asset. Status: ${status}.`,
    motionDescription: (motion, focus) => `${motion}: ${focus}.`,
    zoomHint: (label, level) => `${label}: model scale set to ${level}`,
    cameraPass: (label) => `${label} camera pass enabled`,
    selected: (label) => `${label} selected`,
    layerSelected: (label) => `${label} layer selected`,
  },
  zh: {
    language: '语言',
    storyCamera: '故事镜头',
    webgl3d: 'WebGL 3D',
    pauseTour: '暂停导览',
    playTour: '继续导览',
    stopVoice: '停止讲解',
    nextModel: '下一个模型',
    exitShowcase: '退出展示',
    guidedNotes: '导览笔记',
    status: { glbReady: 'GLB已就绪', queued: '排队中', procedural: '程序生成' },
    notifications: {
      narrationStopped: '讲解已停止',
      narrationStarted: '展示讲解已开始',
      fallback: '展示预览已切换到保存图片',
      webglEnabled: 'WebGL 控制已开启：拖拽旋转，滚轮缩放',
      storyRestored: '已恢复故事镜头',
      storyEnabled: '故事镜头已开启',
      viewReset: '展示视图已重置',
    },
    readyDescription: (name, provider, status) => `${name} 已作为 ${provider} 模型就绪。状态：${status}。`,
    motionDescription: (motion, focus) => `${motion}：重点观察 ${focus}。`,
    zoomHint: (label, level) => `${label}：模型缩放到 ${level}`,
    cameraPass: (label) => `${label}镜头已开启`,
    selected: (label) => `已选择${label}`,
    layerSelected: (label) => `已选择${label}图层`,
  },
  ja: {
    language: '言語',
    storyCamera: 'ストーリーカメラ',
    webgl3d: 'WebGL 3D',
    pauseTour: 'ツアー停止',
    playTour: 'ツアー再生',
    stopVoice: '音声停止',
    nextModel: '次のモデル',
    exitShowcase: '終了',
    guidedNotes: 'ガイドノート',
    status: { glbReady: 'GLB準備完了', queued: '待機中', procedural: 'プロシージャル' },
    notifications: {
      narrationStopped: 'ナレーションを停止しました',
      narrationStarted: 'ショーケースのナレーションを開始しました',
      fallback: 'ショーケース表示を保存画像に切り替えました',
      webglEnabled: 'WebGL操作を有効化：ドラッグで回転、スクロールでズーム',
      storyRestored: 'ストーリーカメラに戻しました',
      storyEnabled: 'ストーリーカメラを有効化しました',
      viewReset: '表示をリセットしました',
    },
    readyDescription: (name, provider, status) => `${name} は ${provider} アセットとして準備完了です。状態：${status}。`,
    motionDescription: (motion, focus) => `${motion}：注目点は ${focus}。`,
    zoomHint: (label, level) => `${label}：モデル倍率 ${level}`,
    cameraPass: (label) => `${label}カメラを有効化しました`,
    selected: (label) => `${label}を選択しました`,
    layerSelected: (label) => `${label}レイヤーを選択しました`,
  },
  es: {
    language: 'Idioma',
    storyCamera: 'Camara narrativa',
    webgl3d: 'WebGL 3D',
    pauseTour: 'Pausar tour',
    playTour: 'Reproducir tour',
    stopVoice: 'Detener voz',
    nextModel: 'Siguiente modelo',
    exitShowcase: 'Salir',
    guidedNotes: 'Notas guiadas',
    status: { glbReady: 'GLB listo', queued: 'en cola', procedural: 'procedural' },
    notifications: {
      narrationStopped: 'Narracion detenida',
      narrationStarted: 'Narracion iniciada',
      fallback: 'La vista previa cambio a la imagen guardada',
      webglEnabled: 'Controles WebGL activos: arrastra para rotar y desplaza para zoom',
      storyRestored: 'Camara narrativa restaurada',
      storyEnabled: 'Camara narrativa activada',
      viewReset: 'Vista restablecida',
    },
    readyDescription: (name, provider, status) => `${name} esta listo como asset ${provider}. Estado: ${status}.`,
    motionDescription: (motion, focus) => `${motion}: foco en ${focus}.`,
    zoomHint: (label, level) => `${label}: escala del modelo ${level}`,
    cameraPass: (label) => `${label} activado`,
    selected: (label) => `${label} seleccionado`,
    layerSelected: (label) => `Capa ${label} seleccionada`,
  },
}

const SHOWCASE_THEME_TEXT = {
  zh: {
    dinosaur: { title: '恐龙图鉴', eyebrow: '互动化石课堂', stageLabel: '3D图鉴展台', primaryAction: '讲解课程', statLabels: ['年代', '食性', '发现', '比例'], stats: ['中生代', '适应性', '野外遗址', '标本'], navLabels: ['课程简报', '恐龙图鉴', '化石实验室'], layerLabels: ['骨骼', '肌肉', '皮肤', 'AR'], toolLabels: ['旋转', '缩放', '移动', '重置'], moduleLabel: '当前标本' },
    road: { title: '车辆展厅', eyebrow: '运动优先的产品展示', stageLabel: '低机位掠过', primaryAction: '讲解展示', statLabels: ['形态', '漆面', '运动', '角度'], stats: ['空气动力', '高光读取', '推近', '低前视角'] },
    vessel: { title: '舰艇指挥台', eyebrow: '海军尺度展示', stageLabel: '指挥甲板', primaryAction: '讲解简报', statLabels: ['级别', '体量', '视角', '提示'], stats: ['海军资产', '重型尺度', '侧向巡航', '尾流线'] },
    aircraft: { title: '航空图鉴', eyebrow: '航空航天飞行实验室', stageLabel: '3D飞行机库', primaryAction: '讲解飞行', statLabels: ['角色', '轮廓', '运动', '焦点'], stats: ['机体', '隐身', '飞掠', '座舱'], navLabels: ['任务简报', '航空图鉴', '飞行实验室'], layerLabels: ['机体', '引擎', '材质', 'AR'], toolLabels: ['环绕', '缩放', '倾斜', '重置'], moduleLabel: '当前飞行器' },
    artifact: { title: '文物博物馆', eyebrow: '策展式物体检查', stageLabel: '博物馆转台', primaryAction: '讲解展品', statLabels: ['材质', '表面', '价值', '灯光'], stats: ['旧化物体', '浮雕', '文化', '聚光'] },
    specimen: { title: '生物实验室', eyebrow: '微观检查课程', stageLabel: '标本环绕', primaryAction: '讲解生物', statLabels: ['体积', '表面', '细节', '模式'], stats: ['有机', '半透明', '簇状', '扫描'], navLabels: ['概览', '生物实验室', '模型实验室'], layerLabels: ['模型', '材质', '运动', 'AR'], toolLabels: ['环绕', '缩放', '检查', '重置'], moduleLabel: '当前模块' },
    product: { title: '产品工作室', eyebrow: '干净的物体展示', stageLabel: '工作室展示', primaryAction: '讲解物体', statLabels: ['物体', '材质', '细节', '镜头'], stats: ['单体资产', '混合', '特征', '转台'] },
  },
  ja: {
    aircraft: { title: '航空アトラス', eyebrow: '航空宇宙フライトラボ', stageLabel: '3Dフライト格納庫', primaryAction: 'フライト解説', navLabels: ['ミッション', '航空アトラス', '飛行ラボ'], layerLabels: ['機体', 'エンジン', '素材', 'AR'], toolLabels: ['オービット', 'ズーム', 'バンク', 'リセット'], moduleLabel: '現在の航空機' },
    specimen: { title: 'バイオラボ', eyebrow: '微視的インスペクション', stageLabel: '標本オービット', primaryAction: '生物解説', navLabels: ['概要', 'バイオラボ', 'アセットラボ'], layerLabels: ['モデル', '素材', 'モーション', 'AR'], toolLabels: ['オービット', 'ズーム', '検査', 'リセット'], moduleLabel: 'ライブモジュール' },
    product: { title: 'プロダクトスタジオ', eyebrow: 'クリーンなオブジェクト表示', stageLabel: 'スタジオ表示', primaryAction: 'オブジェクト解説' },
    dinosaur: { title: '恐竜アトラス', eyebrow: 'インタラクティブ化石教室', stageLabel: '3Dアトラス展示', primaryAction: 'レッスン解説' },
    artifact: { title: 'アーティファクト博物館', eyebrow: 'キュレーション検査', stageLabel: '博物館ターンテーブル', primaryAction: '展示解説' },
    road: { title: '車両ショールーム', eyebrow: 'モーション重視の商品表示', stageLabel: 'ローアングルパス', primaryAction: 'リビール解説' },
    vessel: { title: '艦艇コマンド', eyebrow: '海軍スケール表示', stageLabel: 'コマンドデッキ', primaryAction: 'ブリーフィング解説' },
  },
  es: {
    aircraft: { title: 'Atlas de Aviacion', eyebrow: 'Laboratorio aeroespacial', stageLabel: 'Hangar 3D de vuelo', primaryAction: 'Narrar vuelo', navLabels: ['Mision', 'Atlas de Aviacion', 'Laboratorio'], layerLabels: ['Fuselaje', 'Motor', 'Material', 'AR'], toolLabels: ['Orbitar', 'Zoom', 'Inclinar', 'Reset'], moduleLabel: 'Aeronave actual' },
    specimen: { title: 'Bio Lab', eyebrow: 'Inspeccion microscopica', stageLabel: 'Orbita de muestra', primaryAction: 'Narrar biologia', navLabels: ['Resumen', 'Bio Lab', 'Asset Lab'], layerLabels: ['Modelo', 'Material', 'Movimiento', 'AR'], toolLabels: ['Orbitar', 'Zoom', 'Inspeccionar', 'Reset'], moduleLabel: 'Modulo activo' },
    product: { title: 'Estudio de Producto', eyebrow: 'Presentacion limpia', stageLabel: 'Reveal de estudio', primaryAction: 'Narrar objeto' },
    dinosaur: { title: 'Atlas de Dinosaurios', eyebrow: 'Aula fosil interactiva', stageLabel: 'Exhibicion 3D', primaryAction: 'Narrar leccion' },
    artifact: { title: 'Museo de Artefactos', eyebrow: 'Inspeccion curada', stageLabel: 'Tornamesa de museo', primaryAction: 'Narrar exhibicion' },
    road: { title: 'Showroom Vehicular', eyebrow: 'Presentacion con movimiento', stageLabel: 'Pasada baja', primaryAction: 'Narrar reveal' },
    vessel: { title: 'Comando Naval', eyebrow: 'Presentacion de escala naval', stageLabel: 'Cubierta de mando', primaryAction: 'Narrar briefing' },
  },
}

const SHOWCASE_SCENE_TEXT = {
  zh: {
    aircraft: { summary: '明亮天空体积、尾迹线和倾斜飞越运动。', environment: '空中飞掠' },
    specimen: { summary: '柔和实验室体积、显微深度线和近距离环绕。', environment: '实验室环绕' },
    dinosaur: { summary: '蓝色展陈空间、化石聚光和课堂式讲解。', environment: '图鉴展台' },
    road: { summary: '低位道路、移动车道线和前向推近镜头。', environment: '道路展示' },
    vessel: { summary: '水面、宽尾流和缓慢侧向跟踪镜头。', environment: '水线巡航' },
    artifact: { summary: '黑色展厅、暖色聚光和材质近检。', environment: '博物馆展台' },
    product: { summary: '干净反光棚、柔光箱和受控产品展示。', environment: '工作室布景' },
  },
  ja: {
    aircraft: { summary: '明るい空間、コントレイル、バンクしたフライバイ。', environment: 'スカイパス' },
    specimen: { summary: '柔らかなラボ空間、顕微鏡風の深度線、近接オービット。', environment: 'ラボオービット' },
  },
  es: {
    aircraft: { summary: 'Volumen de cielo, estelas y movimiento de pasada inclinada.', environment: 'pasada aerea' },
    specimen: { summary: 'Volumen de laboratorio, lineas de profundidad y orbita cercana.', environment: 'orbita de laboratorio' },
  },
}

const SHOWCASE_ZOOM_LEVELS = [
  { id: 'fit', scale: 1 },
  { id: 'close', scale: 1.24 },
  { id: 'detail', scale: 1.52 },
  { id: 'wide', scale: 0.82 },
]

function getShowcaseText(language) {
  return SHOWCASE_TEXT[language] || SHOWCASE_TEXT.en
}

function localizeShowcaseTheme(theme, language) {
  const themeText = SHOWCASE_THEME_TEXT[language]?.[theme.id]
  const sceneText = SHOWCASE_SCENE_TEXT[language]?.[theme.scene.id]

  return {
    ...theme,
    ...(themeText || {}),
    scene: {
      ...theme.scene,
      ...(sceneText || {}),
    },
  }
}

export function ShowcaseStage({
  selectedCell,
  selectedOrganelle,
  setSelectedOrganelle,
  customCells,
  allCells,
  renderQuality,
  language = 'en',
  onLanguageChange,
  onSelectCell,
  onExit,
  onNotify,
}) {
  const [tourPlaying, setTourPlaying] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [viewerError, setViewerError] = useState(null)
  const [activeSection, setActiveSection] = useState(1)
  const [activeMode, setActiveMode] = useState('story')
  const [activeLayer, setActiveLayer] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(0)
  const cell = getCell(selectedCell, customCells)
  const modelCellId = cell.custom ? cell.template : getModelCellId(selectedCell, customCells)
  const generatedModelUrl = getGeneratedModelUrl(cell)
  const referenceImageUrl = cell.custom ? cell.imageUrl || cell.thumbnailUrl || '' : ''
  const detail = getOrganelleDetail(selectedCell, selectedOrganelle, customCells)
  const text = getShowcaseText(language)
  const studioTitle = getUiText(language).header.title
  const baseTheme = useMemo(() => getShowcaseTheme(cell), [cell])
  const theme = useMemo(() => localizeShowcaseTheme(baseTheme, language), [baseTheme, language])
  const narration = useMemo(() => buildShowcaseNarration(cell, { language, theme }), [cell, language, theme])
  const motionProfile = useMemo(() => inferMotionProfile(cell), [cell])
  const featuredCells = useMemo(
    () => allCells.filter((item) => item.id !== selectedCell).slice(0, 5),
    [allCells, selectedCell],
  )
  const providerLabel = cell.custom ? getProviderLabel(cell.generation?.provider || cell.generation?.requestedProvider) : 'Starter'
  const status = generatedModelUrl ? text.status.glbReady : cell.custom ? cell.generation?.status || text.status.queued : text.status.procedural
  const viewerResetKey = `${selectedCell}-${generatedModelUrl || ''}`
  const activeViewerError = viewerError?.key === viewerResetKey ? viewerError.message : null
  const navLabels = theme.navLabels || ['Overview', theme.title, 'Asset Lab']
  const layerLabels = theme.layerLabels || ['Model', 'Material', 'Motion', 'AR']
  const toolLabels = theme.toolLabels || ['Orbit', 'Zoom', 'Inspect', 'Reset']
  const layerOrganelleIds = useMemo(() => {
    const available = getAvailableOrganelleIds(selectedCell, customCells)
    const preferred = ['membrane', 'mitochondria', 'lysosome', 'granules', 'nucleus']
    return [...preferred.filter((id) => available.includes(id)), ...available.filter((id) => !preferred.includes(id))]
  }, [customCells, selectedCell])
  const activeViewMode = activeLayer === 2 ? 'layers' : activeLayer === 1 ? 'focus' : 'solid'
  const activeProofMode = activeLayer === 3
  const presentationMode = activeMode !== 'webgl'
  const zoomLevel = SHOWCASE_ZOOM_LEVELS[zoomIndex] || SHOWCASE_ZOOM_LEVELS[0]
  const sectionDescriptions = useMemo(() => [
    text.readyDescription(cell.fullName || cell.name, providerLabel, status),
    theme.scene.summary,
    text.motionDescription(motionProfile.label, theme.category.inspectionFocus),
  ], [cell.fullName, cell.name, motionProfile.label, providerLabel, status, text, theme.category.inspectionFocus, theme.scene.summary])
  const activeSectionDescription = sectionDescriptions[activeSection] || theme.scene.summary
  const modeOptions = [
    { id: 'story', label: text.storyCamera, icon: Radio },
    { id: 'webgl', label: text.webgl3d, icon: Box },
  ]

  useEffect(() => () => stopShowcaseSpeech(), [])

  function handleNarration() {
    if (speaking) {
      stopShowcaseSpeech()
      setSpeaking(false)
      onNotify?.(text.notifications.narrationStopped)
      return
    }

    setSpeaking(true)
    speakShowcase(narration.script, {
      language,
      onEnd: () => setSpeaking(false),
    })
    onNotify?.(text.notifications.narrationStarted)
  }

  function handleViewerError(error) {
    const message = error instanceof Error ? error.message : 'Showcase preview could not be loaded.'
    setViewerError({ key: viewerResetKey, message })
    onNotify?.(text.notifications.fallback)
  }

  function handleSelectCell(cellId) {
    stopShowcaseSpeech()
    setSpeaking(false)
    setActiveLayer(0)
    setActiveMode('story')
    setZoomIndex(0)
    onSelectCell(cellId)
  }

  function handleNextModel() {
    const next = featuredCells[0]
    if (!next) return
    handleSelectCell(next.id)
  }

  function handleSectionSelect(index) {
    setActiveSection(index)
    onNotify?.(text.selected(navLabels[index]))
  }

  function handleModeSelect(modeId) {
    if (modeId === 'webgl' && activeMode === 'webgl') {
      setActiveMode('story')
      setTourPlaying(true)
      onNotify?.(text.notifications.storyRestored)
      return
    }

    setActiveMode(modeId)

    if (modeId === 'webgl') {
      setTourPlaying(false)
      onNotify?.(text.notifications.webglEnabled)
      return
    }

    if (modeId === 'story') {
      setTourPlaying(true)
      onNotify?.(text.notifications.storyEnabled)
      return
    }
  }

  function handleLayerSelect(index) {
    setActiveLayer(index)
    const nextOrganelle = layerOrganelleIds[index % layerOrganelleIds.length]
    if (nextOrganelle) setSelectedOrganelle(nextOrganelle)
    onNotify?.(text.layerSelected(layerLabels[index]))
  }

  function handleToolSelect(index) {
    const label = toolLabels[index]

    if (index === 0) {
      handleModeSelect('webgl')
      return
    }

    if (index === 1) {
      const nextIndex = (zoomIndex + 1) % SHOWCASE_ZOOM_LEVELS.length
      const nextZoom = SHOWCASE_ZOOM_LEVELS[nextIndex]
      setZoomIndex(nextIndex)
      setActiveMode('webgl')
      setTourPlaying(false)
      onNotify?.(text.zoomHint(label, `${Math.round(nextZoom.scale * 100)}%`))
      return
    }

    if (index === 2) {
      setActiveMode('story')
      setTourPlaying(true)
      onNotify?.(text.cameraPass(label))
      return
    }

    setActiveMode('story')
    setActiveLayer(0)
    setZoomIndex(0)
    setTourPlaying(true)
    stopShowcaseSpeech()
    setSpeaking(false)
    onNotify?.(text.notifications.viewReset)
  }

  function handleTourToggle() {
    const next = !tourPlaying
    setTourPlaying(next)
    if (next && activeMode === 'webgl') setActiveMode('story')
  }

  return (
    <section className={`showcase-stage theme-${theme.id} mode-${activeMode} layer-${activeLayer} ${tourPlaying ? 'tour-playing' : 'tour-paused'}`}>
      <div className="showcase-backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <aside className="showcase-library">
        <div className="showcase-brand">
          <Box size={34} />
          <div>
            <strong>{studioTitle}</strong>
            <span>{theme.title}</span>
          </div>
        </div>
        <nav className="showcase-nav" aria-label="Showcase sections">
          {navLabels.map((label, index) => (
            <button key={label} type="button" className={activeSection === index ? 'active' : ''} onClick={() => handleSectionSelect(index)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="showcase-current">
          <small>{theme.moduleLabel || 'Live module'}</small>
          <strong>{cell.fullName || cell.name}</strong>
          <span>{providerLabel} · {status}</span>
        </div>
        <div className="showcase-list">
          {featuredCells.map((item) => (
            <button key={item.id} type="button" onClick={() => handleSelectCell(item.id)}>
              <CellThumb cell={item} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.type}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="showcase-main">
        <div className="showcase-title">
          <span>{theme.eyebrow}</span>
          <h1>{theme.stageLabel}</h1>
          <p>{activeSectionDescription}</p>
        </div>

        <div className="showcase-stage-frame">
          <div className="showcase-mode-tabs" aria-label="Showcase mode">
            {modeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button key={option.id} type="button" className={activeMode === option.id ? 'active' : ''} onClick={() => handleModeSelect(option.id)}>
                  <Icon size={16} /> {option.label}
                </button>
              )
            })}
          </div>

          <div className="showcase-layer-tabs" aria-label="Model presentation layers">
            {layerLabels.map((label, index) => (
              <button key={label} type="button" className={activeLayer === index ? 'active' : ''} onClick={() => handleLayerSelect(index)}>
                {label}
              </button>
            ))}
          </div>

          <div className="showcase-tool-rail" aria-label="Showcase tools">
            {toolLabels.map((label, index) => (
              <button key={label} type="button" className={index === 1 && zoomIndex !== 0 ? 'active' : ''} onClick={() => handleToolSelect(index)}>
                {label}
              </button>
            ))}
          </div>

          <div className="showcase-viewer-shell">
            <div className="showcase-platform" aria-hidden="true" />
            <div className="showcase-viewer">
              <ViewerErrorBoundary resetKey={viewerResetKey} onError={handleViewerError} fallback={
                <CellFallback selectedCell={selectedCell} modelCellId={modelCellId} referenceImageUrl={referenceImageUrl} selectedOrganelle={selectedOrganelle} onSelectOrganelle={setSelectedOrganelle} />
              }>
                {!activeViewerError && (
                  <CellScene
                    selectedCell={selectedCell}
                    modelCellId={modelCellId}
                    referenceImageUrl={referenceImageUrl}
                    generatedModelUrl={generatedModelUrl}
                    selectedOrganelle={selectedOrganelle}
                    crossSection={false}
                    autoRotate={tourPlaying}
                    hideOthers={false}
                    proofMode={activeProofMode}
                    viewMode={activeViewMode}
                    renderQuality={renderQuality}
                    presentationMode={presentationMode}
                    presentationPlaying={tourPlaying}
                    presentationScale={zoomLevel.scale}
                    transparentBackground
                    canvasFallback={null}
                    motionProfile={theme.category.motionProfile || motionProfile.id}
                    onSelectOrganelle={setSelectedOrganelle}
                    onExporterReady={() => {}}
                  />
                )}
              </ViewerErrorBoundary>
            </div>
          </div>

          <div className="showcase-guide-bubble">
            <Sparkles size={15} />
            <span>{theme.scene.environment} · {motionProfile.label}</span>
          </div>
        </div>

        <div className="showcase-toolbar">
          <button type="button" onClick={handleTourToggle}>
            {tourPlaying ? <Pause size={16} /> : <Play size={16} />}
            {tourPlaying ? text.pauseTour : text.playTour}
          </button>
          <button type="button" onClick={handleNarration}>
            {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {speaking ? text.stopVoice : theme.primaryAction}
          </button>
          <button type="button" onClick={handleNextModel} disabled={featuredCells.length === 0}>
            <ChevronRight size={16} />
            {text.nextModel}
          </button>
        </div>
      </main>

      <aside className="showcase-detail">
        <div className="showcase-actions">
          <label className="showcase-language">
            <Globe2 size={14} />
            <select aria-label={text.language || 'Language'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.shortLabel || option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="showcase-close" onClick={onExit}>
            <X size={17} />
            {text.exitShowcase}
          </button>
        </div>
        <div className="showcase-reference">
          {referenceImageUrl ? (
            <img src={referenceImageUrl} alt={`${cell.name} reference`} />
          ) : (
            <div className="showcase-reference-placeholder">
              <CellThumb cell={cell} />
              <span>{theme.stageLabel}</span>
            </div>
          )}
        </div>
        <div className="showcase-card-title">
          <span>{theme.title}</span>
          <strong>{cell.fullName || cell.name}</strong>
          <small>{narration.subtitle}</small>
        </div>
        <div className="showcase-tags">
          {theme.tags.map((tag) => <em key={tag}>{tag}</em>)}
        </div>
        <div className="showcase-stats">
          {theme.statLabels.map((label, index) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{theme.stats[index]}</strong>
            </div>
          ))}
        </div>
        <div className="showcase-notes">
          <strong>{text.guidedNotes}</strong>
          {narration.bullets.slice(0, 3).map((item) => <p key={item}>{item}</p>)}
        </div>
        <div className="showcase-focus">
          <span>{detail.title}</span>
          <p>{detail.note}</p>
        </div>
      </aside>
    </section>
  )
}
