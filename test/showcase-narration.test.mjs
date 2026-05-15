import assert from 'node:assert/strict'
import test from 'node:test'

import { buildShowcaseNarration, speakShowcase } from '../src/showcase/showcaseNarration.js'
import { getShowcaseTheme } from '../src/showcase/showcaseThemes.js'

test('builds localized Chinese showcase narration', () => {
  const cell = {
    name: 'advanced fighter jet render',
    custom: true,
    generation: { provider: 'tripo' },
  }
  const theme = { ...getShowcaseTheme(cell), title: '航空图鉴' }
  const narration = buildShowcaseNarration(cell, { language: 'zh', theme })

  assert.match(narration.script, /航空图鉴/)
  assert.match(narration.script, /航空器/)
  assert.match(narration.script, /飞掠镜头/)
  assert.doesNotMatch(narration.script, /showcase layout tuned/)
})

test('sets browser speech language for localized narration', async () => {
  const originalWindow = globalThis.window
  let spokenUtterance = null

  globalThis.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text) {
      this.text = text
    }
  }
  globalThis.window = {
    speechSynthesis: {
      cancel() {},
      getVoices() {
        return [{ lang: 'zh-CN', name: 'Chinese voice' }]
      },
      speak(utterance) {
        spokenUtterance = utterance
      },
    },
  }

  try {
    await speakShowcase('中文讲解测试', { language: 'zh', preferServer: false })
    assert.equal(spokenUtterance.lang, 'zh-CN')
    assert.equal(spokenUtterance.voice.lang, 'zh-CN')
  } finally {
    globalThis.window = originalWindow
    delete globalThis.SpeechSynthesisUtterance
  }
})
