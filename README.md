# Thumbnail Studio

A minimal, purpose-built editor for making YouTube thumbnails: fixed 1280×720
canvas, layers (images + text), drag/resize/rotate, local background removal,
and PNG/JPG export. No accounts, no cloud storage — everything lives in your
browser (IndexedDB) plus a small local background-removal service.

## Stack

- **Frontend**: Vite + React + TypeScript + [Fabric.js](http://fabricjs.com/) for the canvas/layers engine.
- **Backend**: FastAPI + [rembg](https://github.com/danielgatis/rembg) (U²-Net) running locally — no per-image API costs, no images leave your machine.

## Setup

### Backend (background removal service)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8787
```

First run downloads the U²-Net model (~170MB), cached afterward.

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
- Layers panel: add/reorder/delete/toggle-visibility for image and text layers.
- Text tool with a couple of YouTube-style presets (bold + outline, drop shadow).
- Image upload, drag/resize/rotate on canvas.
- One-click background removal per image layer (calls the local backend).
- Export to PNG.
- Projects autosave to the browser's IndexedDB (via localStorage keying) — no backend needed for that.

## What's intentionally NOT here

No multi-page projects, no vector shapes beyond simple rectangles, no filters/adjustment
layers, no cloud sync, no accounts. This is scoped to "make one 1280×720 thumbnail, fast."
Add features only as you actually hit friction.
