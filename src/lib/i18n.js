export const UI_TEXT = {
  en: {
    language: 'Language',
    opened: 'opened',
    closed: 'closed',
    header: {
      title: '3D Model Studio',
      subtitle: 'Generate, inspect, and present 3D assets',
      Gallery: 'Gallery',
      Library: 'Library',
      Notebooks: 'Notebooks',
      Logs: 'Logs',
      Settings: 'Settings',
      Demo: 'Showcase',
      Profile: 'Profile',
    },
  },
  zh: {
    language: '语言',
    opened: '已打开',
    closed: '已收起',
    header: {
      title: '3D模型工作室',
      subtitle: '生成、检查和演示3D模型',
      Gallery: '作品集',
      Library: '模型库',
      Notebooks: '笔记',
      Logs: '日志',
      Settings: '设置',
      Demo: '展示',
      Profile: '工作区',
    },
  },
  ja: {
    language: '言語',
    opened: 'を開きました',
    closed: 'を閉じました',
    header: {
      title: '3Dモデルスタジオ',
      subtitle: '3Dアセットを生成、検査、プレゼン',
      Gallery: 'ギャラリー',
      Library: 'ライブラリ',
      Notebooks: 'ノート',
      Logs: 'ログ',
      Settings: '設定',
      Demo: 'ショーケース',
      Profile: 'ワークスペース',
    },
  },
  es: {
    language: 'Idioma',
    opened: 'abierto',
    closed: 'cerrado',
    header: {
      title: 'Estudio de Modelos 3D',
      subtitle: 'Genera, inspecciona y presenta assets 3D',
      Gallery: 'Galeria',
      Library: 'Biblioteca',
      Notebooks: 'Notas',
      Logs: 'Registros',
      Settings: 'Ajustes',
      Demo: 'Showcase',
      Profile: 'Espacio',
    },
  },
}

export function getUiText(language = 'en') {
  return UI_TEXT[language] || UI_TEXT.en
}
