import { Request, Response, sql } from "@elements/app";

interface ImageBytes {
  contentType: string;
  hash: string;
  data: Buffer;
}

// Types we are willing to render on our own origin. The upload checks the
// same list; this is the check that decides what the browser is told.
const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

const YEAR = 31536000;

export default function serveImage(req: Request, res: Response) {
  let img = sql<ImageBytes>(`
    select contentType, hash, data from images where id = ${req.params.id}::uuid
  `).first();

  // A stale hash names bytes that no longer exist, so it is a 404 rather than
  // the current bytes under an old cache key.
  if (!img || img.hash !== req.params.hash) {
    res.status(404);
    return res.end();
  }

  if (INLINE.has(img.contentType)) {
    res.setHeader("Content-Type", img.contentType);
  } else {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment");
  }

  res.setHeader("Cache-Control", `public, max-age=${YEAR}, immutable`);

  return img.data;
}
