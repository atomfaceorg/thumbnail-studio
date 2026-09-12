import io

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove, new_session

app = FastAPI(title="thumbnail-studio background removal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# isnet-general-use is a good quality/speed tradeoff for thumbnail subjects
# (people, products); swap for "u2net" if results look off on a given image.
_session = new_session("isnet-general-use")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    input_bytes = await file.read()
    output_bytes = remove(input_bytes, session=_session)
    return Response(content=output_bytes, media_type="image/png")
