# 3D Model Studio

[English](README.md) | [中文](README.zh-CN.md)

AI-powered interactive 3D model generation, inspection, and presentation studio.

3D Model Studio is a React + Three.js prototype for turning uploaded reference images or GLB files into a polished interactive 3D workspace. It has two intentionally different surfaces: a production Workbench for generating, managing, inspecting, and exporting assets, and a productized Showcase for presenting a finished model with cinematic camera controls, narration, and a briefing panel.

## Demo

[![3D Model Studio demo](docs/demo/3DCellForge-demo-cover.jpg)](docs/demo/3DCellForge-demo-2026-05-10.mp4)

Open the demo video: [Demo MP4](docs/demo/3DCellForge-demo-2026-05-10.mp4)

## Features

- Interactive model viewer built with React Three Fiber.
- Three-column workbench: Model Library on the left, WebGL stage in the center, asset/generation tools on the right.
- Drag to rotate, scroll to zoom, isolate structure parts, inspect model details, and export the current scene.
- Object-aware inspector with inferred category, source, provider state, material focus, demo value, and tags for vehicles, aircraft, vessels, products, artifacts, and organic specimens.
- Model quality score for generated GLBs, including file size, triangle count, texture count, and demo readiness.
- Showcase Mode for screenshots and screen recordings: replaces the workbench with a product-style presentation surface, object-aware cinematic camera paths, voice narration, a right-side briefing panel, and a bottom model playlist.
- Showcase controls include Story Camera, WebGL 3D, presentation layers, manual zoom levels, pause/play tour, localized narration, and manual model switching.
- Productized Model Library drawer with source thumbnails, provider/status, task id, GLB URL actions, comparison, and delete controls.
- Saved Assets stays collapsed by default, while the active generated/imported asset stays pinned and clickable.
- Generated/imported models are restored after refresh through IndexedDB, with localStorage as a compact fallback.
- Generic part detail drawer, asset references, comparison panel, notes, gallery actions, logs, saved projects, and a compact generation queue.
- Hyper3D, Tripo, Fal.ai, Hunyuan3D, JS Depth, and Local GLB generation/import modes. Fal defaults to Tripo3D v2.5 HD, with Hunyuan3D v2 kept as a textured backup.
- Cached demo GLB models for offline-friendly screenshots and demos.
- Auxiliary Khronos glTF reference models for GLB loader and PBR material checks.
- API key stays server-side in `.env.local`; it is never exposed to the frontend bundle.

## Tech Stack

- React
- Vite
- Three.js
- React Three Fiber
- Drei
- Framer Motion
- Tripo API optional backend
- Fal.ai optional backend
- Hunyuan3D local API optional backend

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Workbench Workflow

The default screen is intentionally quiet:

- Pick the active generated/imported asset from the left `Model Library` rail.
- Earlier generated/imported models are tucked under `Saved Assets` until expanded.
- Use the right `Asset Source` rail to choose the generation provider or import a local `.glb` / `.gltf`.
- Watch upload/generation/import state in the left `Generation Queue` panel.
- Click `Info` or `Inspect` only when you need the part detail drawer.
- Open top-nav `Library` for the full asset catalog with previews, provider state, task ids, GLB URL copy, provider comparison, and deletion.
- Click `Showcase` in the top navigation to enter a clean presentation mode for screenshots and recordings.
- Check the quality card on the stage before recording; low scores usually mean the source image or provider result is not demo-ready.
- Showcase animation adapts to the model name and metadata: cars use a road push-in, aircraft use a flight pass, ships/carriers use a naval cruise, and organic/specimen assets use a studio orbit.

## Showcase Workflow

Showcase is not a second editor. It is the presentation layer for a finished asset:

- The main stage becomes a full cinematic viewer instead of the workbench canvas.
- The right rail becomes a briefing panel with object identity, tags, stats, guided notes, and the active inspection focus.
- The bottom playlist switches between saved/generated models without exposing generation controls.
- `Story Camera` runs the object-aware camera pass; `WebGL 3D` enables manual orbit controls.
- `Zoom` cycles model scale through 100%, 124%, 152%, and 82%; `Reset` restores the default story camera and model scale.
- Narration uses the selected language and never auto-advances the model during playback.

Useful validation commands:

```bash
npm run lint
npm run build
npm run test
npm run test:visual
```

`npm run test:visual` runs Playwright layout and screenshot regression checks for the workbench, the Model Library drawer, and Showcase Mode. Use `npm run test:visual:update` only when an intentional UI change needs new screenshot baselines.

## Optional Image-to-3D Backend

To enable image-to-3D generation, create `.env.local`:

```bash
cp .env.example .env.local
```

Then set:

```bash
TRIPO_API_KEY=your_tripo_key
FAL_API_KEY=your_fal_key
RODIN_API_KEY=your_rodin_api_key
RODIN_DEFAULT_MODEL=gen2-hq
# Optional, only if your Hyper3D account/API access accepts it:
# RODIN_DEFAULT_MODEL=gen25-hq
OPENAI_API_KEY=your_openai_key
TTS_PROVIDER=auto
OPENAI_TTS_API_KEY=your_openai_key
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
EDGE_TTS_COMMAND=edge-tts
API_HOST=127.0.0.1
```

`OPENAI_API_KEY` enables optional image understanding through `/api/3d/analyze`. Showcase narration is handled by `/api/tts/showcase` with `TTS_PROVIDER=auto`: it uses OpenAI TTS when `OPENAI_TTS_API_KEY`, `VOICE_TOOLS_OPENAI_KEY`, or `OPENAI_API_KEY` is available; otherwise it calls an externally installed Edge TTS command. If both server TTS paths fail, the browser speech fallback is still used.

Edge TTS is intentionally **not bundled as a project dependency**. To use the free Edge path, install the CLI in your own environment:

```bash
pipx install edge-tts
# or: pip install edge-tts
```

For Hunyuan3D local backup mode, start your local Hunyuan3D API server and set:

```bash
HUNYUAN_API_BASE=http://127.0.0.1:8081
HUNYUAN_CREATE_PATH=/send
HUNYUAN_STATUS_PATH=/status
```

The 3D generation backend supports these provider paths:

```text
Hyper3D  Hyper3D Rodin cloud generation only (default)
Tripo    Tripo cloud generation only
Fal      Fal.ai queue generation; model is selected in Settings
Auto     Hyper3D first, then Tripo, Fal, Hunyuan, and JS Depth backup
Hunyuan  Local Hunyuan3D generation only
```

The upload panel exposes the full generation mode choice before picking a file:

```text
Hyper3D     Hyper3D Rodin GLB generation
Tripo       Tripo cloud GLB generation
Fal         Fal.ai queue GLB generation
Hunyuan     Local Hunyuan3D GLB generation
JS Depth    Browser-side image relief with layered PNG fallback
Auto        Hyper3D, Tripo, Fal, Hunyuan, then JS Depth fallback
Local GLB   Import an existing .glb or self-contained .gltf
```

Tripo uploads use the current STS object-storage flow (`/upload/sts/token`) before creating an `image_to_model` task.
Fal uploads use the official `@fal-ai/client` storage and queue APIs. Supported Fal models are Tripo3D v2.5 HD, Hunyuan3D v2 Textured Backup, TRELLIS, TripoSR, and Hyper3D Rodin. Pick the active Fal model in `Settings`; the default is Tripo3D v2.5 HD because it usually gives stronger textured demo assets than Hunyuan3D on this workflow.
Rodin uploads use Hyper3D's official multipart `/api/v2/rodin` task API, then poll `/status` and cache the GLB returned by `/download`. The `Settings` drawer exposes direct Rodin presets:

```text
Rodin Gen-2 HQ    Official public Gen-2 path with PBR, HD texture, HighPack, and quality_override.
Rodin Gen-2.5 HQ  Direct official Rodin tier=Gen-2.5 path. This requires Hyper3D API access that accepts Gen-2.5.
```

The public Hyper3D API documentation currently documents Gen-2 and its high-quality parameters (`hd_texture`, `addons=HighPack`, `quality_override`). Gen-2.5 is wired as a direct official Rodin tier, not through Fal, so an unsupported account or unavailable tier will fail with the official Rodin API error instead of silently falling back.
Generated GLBs are cached by the Node backend under `.generated-models/`, so later views use the local copy instead of temporary provider URLs.
The frontend model library is saved in IndexedDB, so successful generated/imported model records survive page refreshes.

You can also import a local `.glb` or self-contained `.gltf` from the `New Upload` button. Imported models become custom workspace models and are served from the same local cache.

Expected Hunyuan3D local API shape:

```text
POST /send
GET  /status/:uid
```

The status response can return either a remote model URL or a base64 GLB field such as `model_base64` / `glb_base64`. Base64 GLBs are cached under `.generated-models/` and served by the Node backend.

Start the backend:

```bash
npm run dev:api
```

Then start the frontend:

```bash
npm run dev
```

The frontend talks to the local Node backend at `http://127.0.0.1:8787` by default.

## Demo Models

The repository includes cached generated GLB files under:

```text
public/generated-models/
```

These make the demo usable without spending API credits on every run.

## Reference Models

The Library panel includes remote Khronos glTF Sample Models as auxiliary references for material and loader checks:

- Transmission Test, CC0, Adobe via Khronos.
- Transmission Roughness Test, CC-BY 4.0, Ed Mackey / Analytical Graphics via Khronos.
- Mosquito In Amber, CC-BY 4.0, Loic Norgeot / Geoffrey Marchal / Sketchfab via Khronos.

These are loaded from the archived Khronos sample repository and are not bundled into this repo.

## Security

Do not put real API keys in frontend code. Keep secrets in `.env.local`, which is ignored by git.

## License

MIT
