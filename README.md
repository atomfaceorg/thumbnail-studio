# Thumbnail Studio

> 🤖 **This is a vibe-coded project.** Every line of code, every commit, and
> this README were written by [Claude Code](https://claude.com/claude-code)
> (Anthropic's CLI coding agent) running **Claude Sonnet 5**, working from
> plain-English prompts with no hand-written code. See
> [Built with AI](#built-with-ai) below for the full rundown.

A minimal, purpose-built editor for making YouTube thumbnails: fixed 1280×720
canvas, layers (images + text), drag/resize/rotate, local background removal,
and PNG export. No accounts, no cloud storage — everything lives in your
browser (localStorage) plus a small local background-removal service.

## Stack

- **Frontend**: Vite + React + TypeScript + [Fabric.js](http://fabricjs.com/) for the canvas/layers engine.
- **Backend**: FastAPI + [rembg](https://github.com/danielgatis/rembg) (U²-Net/ISNet) running locally — no per-image API costs, no images leave your machine.

## Setup

### Backend (background removal service)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8787
```

First run downloads the segmentation model (~170MB), cached afterward.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. The editor works without the backend running;
"Remove Background" just won't be available until it's up.

## What's here

- 1280×720 canvas (the standard YouTube thumbnail size) with a safe-zone guide overlay.
- Layers panel: add/drag-to-reorder/delete/toggle-visibility, multi-select (shift/cmd-click).
- Text tool with presets (bold outline, drop shadow, plain), plus live color, font, and size controls.
- Stroke controls (color + width) for both text and image layers.
- Image upload, drag/resize/rotate on canvas.
- One-click background removal per image layer (calls the local backend).
- Undo/redo (buttons and Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z), with multi-step actions coalesced into one step.
- Light/dark mode, defaulting to light (your explicit choice is remembered and always wins).
- Export to PNG.
- Projects autosave to the browser's localStorage — no backend needed for that.

## What's intentionally NOT here

No multi-page projects, no vector shapes, no filters/adjustment layers, no
cloud sync, no accounts. This is scoped to "make one 1280×720 thumbnail,
fast." Add features only as you actually hit friction.

## Built with AI

This project was built end-to-end through conversational prompting ("vibe
coding") rather than hand-written code:

- **Agent**: [Claude Code](https://claude.com/claude-code), Anthropic's CLI coding agent
- **Model**: Claude Sonnet 5 (`claude-sonnet-5`)
- **Maker**: [Anthropic](https://www.anthropic.com/)
- **Process**: every feature — the initial scaffold, layers/multi-select,
  undo/redo, drag-to-reorder, light/dark mode, and stroke controls — was
  specified in plain English and implemented, type-checked, and
  browser-verified by the agent in the same session, including a couple of
  real bugs it found and fixed along the way (a Fabric.js background-color
  quirk and a `requestAnimationFrame` timing issue).

No part of the source was manually written or edited outside of this
workflow. Read the commit history for the blow-by-blow.
