// Image normalization for Perfect Corp uploads. Supabase Image Transform
// is Pro-only (free plan silently returns the original), so we bake EXIF
// orientation and downscale in-function with imagescript.

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

// PC spec: short side >= 480 px, long side <= 2560 px,
// face >= 60% of image width. For selfies framed at face-level, the face
// already fills 60%+ of the frame, so we just downscale to fit the long-side
// cap — no crop needed.
const PC_MAX_LONG_SIDE = 2560;

// Minimal EXIF orientation reader for JPEG. Returns 1 if absent/unparseable.
// PC ignores EXIF, so we must bake orientation into pixels before upload.
function readExifOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && offset + 10 < bytes.length) {
      const exifSig =
        bytes[offset + 4] === 0x45 &&
        bytes[offset + 5] === 0x78 &&
        bytes[offset + 6] === 0x69 &&
        bytes[offset + 7] === 0x66;
      if (exifSig) {
        const tiff = offset + 10;
        const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
        const get16 = (o: number) =>
          little
            ? bytes[o] | (bytes[o + 1] << 8)
            : (bytes[o] << 8) | bytes[o + 1];
        const get32 = (o: number) =>
          little
            ? bytes[o] |
              (bytes[o + 1] << 8) |
              (bytes[o + 2] << 16) |
              (bytes[o + 3] << 24)
            : (bytes[o] << 24) |
              (bytes[o + 1] << 16) |
              (bytes[o + 2] << 8) |
              bytes[o + 3];
        const ifd = tiff + get32(tiff + 4);
        const n = get16(ifd);
        for (let i = 0; i < n; i++) {
          const entry = ifd + 2 + i * 12;
          if (get16(entry) === 0x0112) return get16(entry + 8);
        }
      }
    }
    offset += 2 + size;
  }
  return 1;
}

export async function normalizeForPC(
  bytes: Uint8Array,
  maxLongSide: number = PC_MAX_LONG_SIDE,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const orientation = readExifOrientation(bytes);
  const img = await Image.decode(bytes);

  // Bake EXIF orientation into pixels. Skipping flip-only modes (2,4,5,7) —
  // selfie cameras virtually always produce 1/3/6/8. NOTE: imagescript's
  // rotate(angle) goes counter-clockwise, so we invert from EXIF's CW convention.
  if (orientation === 3) img.rotate(180);
  else if (orientation === 6) img.rotate(270); // EXIF 6 = 90° CW = 270° CCW
  else if (orientation === 8) img.rotate(90); // EXIF 8 = 270° CW = 90° CCW

  // Downscale to fit PC's 2560 long-side cap, preserving aspect.
  const longSide = Math.max(img.width, img.height);
  if (longSide > maxLongSide) {
    const scale = maxLongSide / longSide;
    img.resize(Math.floor(img.width * scale), Math.floor(img.height * scale));
  }
  const out = await img.encodeJPEG(85);
  console.log(
    `normalizeForPC: orientation=${orientation}, final ${img.width}x${img.height}`,
  );
  return { bytes: out, contentType: "image/jpeg" };
}
