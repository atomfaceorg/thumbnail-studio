import { BACKGROUND_REMOVAL_ENDPOINT } from "./constants";

export async function removeBackground(source: Blob): Promise<Blob> {
  const form = new FormData();
  form.append("file", source, "layer.png");

  const res = await fetch(BACKGROUND_REMOVAL_ENDPOINT, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(
      `Background removal failed (${res.status}). Is the backend running on :8787?`
    );
  }

  return await res.blob();
}

export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return await res.blob();
}
