import { File } from "@elements/app";

let urls = new WeakMap<object, string>();

/** An object url for a picked file, made once per file and reused on repaint. */
export function previewUrl(f: File | undefined): string {
  if (!f || !f.data || typeof URL.createObjectURL !== "function") {
    return "";
  }

  let url = urls.get(f);
  if (!url) {
    url = URL.createObjectURL(new Blob([f.data as BlobPart], { type: f.contentType }));
    urls.set(f, url);
  }

  return url;
}
