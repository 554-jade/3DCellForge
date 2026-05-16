import { expect, test } from '@playwright/test'

async function prepareWorkbench(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.waitForSelector('.studio-window')
  await page.locator('.status-toast').evaluate((node) => {
    node.style.display = 'none'
  }).catch(() => {})
  await page.waitForTimeout(450)
}

async function expectSeparated(page, leftSelector, centerSelector, rightSelector) {
  const left = await page.locator(leftSelector).boundingBox()
  const center = await page.locator(centerSelector).boundingBox()
  const right = await page.locator(rightSelector).boundingBox()

  expect(left).toBeTruthy()
  expect(center).toBeTruthy()
  expect(right).toBeTruthy()
  expect(left.x + left.width).toBeLessThanOrEqual(center.x)
  expect(center.x + center.width).toBeLessThanOrEqual(right.x)
}

async function expectClippedScreenshot(page, selector, name, options = {}) {
  const box = await page.locator(selector).boundingBox()
  expect(box).toBeTruthy()

  const image = await page.screenshot({
    animations: 'disabled',
    clip: {
      x: Math.floor(box.x),
      y: Math.floor(box.y),
      width: Math.ceil(box.width),
      height: Math.ceil(box.height),
    },
    mask: options.mask || [],
  })

  expect(image).toMatchSnapshot(name, {
    maxDiffPixelRatio: 0.025,
    threshold: 0.18,
  })
}

test('workbench layout keeps library, stage, and source rail separated', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await expectSeparated(page, '.selection-shelf', '.stage-zone', '.command-zone')
  await expectClippedScreenshot(page, '.studio-window', 'workbench-layout.png', {
    mask: [page.locator('.cell-viewer canvas')],
  })
})

test('model library drawer renders productized asset cards', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Library' }).click()
  await expect(page.locator('.drawer-library')).toBeVisible()
  await expect(page.locator('.asset-library-card').first()).toBeVisible()
  await expect(page.locator('.drawer-library')).toContainText('Generated & Imported Assets')
  await expect(page.locator('.drawer-library')).not.toContainText('Organelle')

  await expectClippedScreenshot(page, '.drawer-library', 'asset-library-drawer.png', {
    mask: [page.locator('.asset-preview-frame img')],
  })
})

test('demo mode uses a clean presentation surface', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Showcase' }).click()
  await expect(page.locator('.workbench-v2.demo-mode')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause Tour' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Narrate/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next Model' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exit Showcase' })).toBeVisible()
  await expect(page.locator('.showcase-viewer .cell-fallback')).toHaveCount(0)
  await expect(page.locator('.selection-shelf')).toBeHidden()
  await expect(page.locator('.command-zone')).toBeHidden()
  await page.addStyleTag({
    content: '.workbench-v2.demo-mode canvas { opacity: 0 !important; }',
  })

  await expectClippedScreenshot(page, '.studio-window', 'demo-mode.png')
})

test('showcase tour controls stay visible and pause without navigation', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Showcase' }).click()
  await expect(page.locator('.showcase-stage')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause Tour' })).toBeInViewport()
  await expect(page.getByRole('button', { name: /Narrate/ })).toBeInViewport()

  await page.getByRole('button', { name: 'Pause Tour' }).click()
  await expect(page.locator('.showcase-stage.tour-paused')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play Tour' })).toBeVisible()
  await expect(page.locator('.showcase-viewer')).toBeVisible()
  await expect(page).toHaveURL('http://127.0.0.1:4173/')
})

test('showcase does not auto-advance models during a tour', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Showcase' }).click()
  await expect(page.locator('.showcase-stage')).toBeVisible()
  const currentModel = page.locator('.showcase-current strong')
  const initialModel = await currentModel.innerText()

  await page.waitForTimeout(9800)
  await expect(currentModel).toHaveText(initialModel)

  await page.getByRole('button', { name: 'Next Model' }).click()
  await expect(currentModel).not.toHaveText(initialModel)
})

test('showcase tabs and rail controls are interactive', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Showcase' }).click()
  const stage = page.locator('.showcase-stage')
  const modeTabs = page.locator('.showcase-mode-tabs')
  const layerTabs = page.locator('.showcase-layer-tabs')
  const toolRail = page.locator('.showcase-tool-rail')
  await expect(stage).toBeVisible()
  await expect(page.getByRole('button', { name: 'Specimen Orbit' })).toHaveCount(0)
  await expect(modeTabs.getByRole('button', { name: 'Story Camera' })).toHaveClass(/active/)

  await modeTabs.getByRole('button', { name: 'WebGL 3D' }).click()
  await expect(stage).toHaveClass(/mode-webgl/)
  await expect(modeTabs.getByRole('button', { name: 'WebGL 3D' })).toHaveClass(/active/)

  await modeTabs.getByRole('button', { name: 'WebGL 3D' }).click()
  await expect(stage).toHaveClass(/mode-story/)
  await expect(modeTabs.getByRole('button', { name: 'Story Camera' })).toHaveClass(/active/)

  await modeTabs.getByRole('button', { name: 'WebGL 3D' }).click()
  await expect(stage).toHaveClass(/mode-webgl/)

  await layerTabs.getByRole('button', { name: 'Material' }).click()
  await expect(stage).toHaveClass(/layer-1/)
  await expect(layerTabs.getByRole('button', { name: 'Material' })).toHaveClass(/active/)

  await toolRail.getByRole('button', { name: 'Zoom' }).click()
  await expect(stage).toHaveClass(/mode-webgl/)
  await expect(toolRail.getByRole('button', { name: 'Zoom' })).toHaveClass(/active/)

  await toolRail.getByRole('button', { name: 'Reset' }).click()
  await expect(stage).toHaveClass(/mode-story/)
  await expect(stage).toHaveClass(/layer-0/)
  await expect(toolRail.getByRole('button', { name: 'Zoom' })).not.toHaveClass(/active/)
  await expect(layerTabs.getByRole('button', { name: 'Model' })).toHaveClass(/active/)
})

test('language switch updates workbench and showcase labels', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.locator('.language-switcher select').selectOption('zh')
  await expect(page.locator('.studio-brand')).toContainText('3D模型工作室')
  await expect(page.getByRole('button', { name: '模型库' })).toBeVisible()

  await page.getByRole('button', { name: '展示' }).click()
  await expect(page.locator('.showcase-stage')).toBeVisible()
  await expect(page.getByRole('button', { name: '故事镜头' })).toBeVisible()
  await expect(page.getByRole('button', { name: '退出展示' })).toBeVisible()

  await page.locator('.showcase-language select').selectOption('ja')
  await expect(page.getByRole('button', { name: 'ストーリーカメラ' })).toBeVisible()
  await expect(page.getByRole('button', { name: '終了' })).toBeVisible()
})

test('view mode controls change the live viewer state', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  const solidButton = page.getByRole('button', { name: 'Solid view' })
  const xrayButton = page.getByRole('button', { name: 'X-Ray layer view' })
  const inspectButton = page.getByRole('button', { name: 'Inspect focus view' })

  await expect(solidButton).toBeVisible()
  await expect(xrayButton).toBeVisible()
  await expect(inspectButton).toBeVisible()

  await solidButton.click()
  await expect(page.locator('.cell-viewer.solid')).toBeVisible()
  await expect(page.locator('.stage-status')).toContainText('Solid')

  await xrayButton.click()
  await expect(page.locator('.cell-viewer.layers')).toBeVisible()
  await expect(page.locator('.stage-status')).toContainText('X-Ray')

  await inspectButton.click()
  await expect(page.locator('.cell-viewer.focus')).toBeVisible()
  await expect(page.locator('.stage-status')).toContainText('Inspect')
})

test('inspector explains the selected object instead of generic biology parts', async ({ page }) => {
  await page.goto('/')
  await prepareWorkbench(page)

  await page.getByRole('button', { name: 'Info' }).click()
  await expect(page.locator('.inspector-zone.open')).toBeVisible()
  await expect(page.locator('.inspector-zone.open')).toContainText('Asset Details')
  await expect(page.locator('.inspector-zone.open')).toContainText('Object Description')
  await expect(page.locator('.inspector-zone.open')).toContainText('Category')
  await expect(page.locator('.inspector-zone.open')).not.toContainText('Organelle')
  await expect(page.locator('.inspector-zone.open')).not.toContainText('Plasma Membrane')

  await expectClippedScreenshot(page, '.inspector-zone.open', 'asset-inspector.png')
})
