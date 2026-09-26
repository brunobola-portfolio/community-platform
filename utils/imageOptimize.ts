/**
 * Images are optimised in the browser before they reach storage.
 *
 * A poster photographed with a phone is 4-8 MB at 4000 px: every visitor on
 * mobile data would download that, and link-preview crawlers give up on images
 * that heavy, so a shared event shows no picture. Resizing to a long edge that
 * still reads well full screen, and re-encoding, takes it to a few hundred KB.
 */

/** Long edge after resizing: a poster's small print stays legible full screen. */
export const MAX_EDGE = 2000;
/** Below this, a file within MAX_EDGE is already light enough to keep as is. */
export const KEEP_BELOW_BYTES = 450 * 1024;
const JPEG_QUALITY = 0.85;

/** Formats a canvas would ruin: vectors and animations go up untouched. */
const PASSTHROUGH = new Set(['image/svg+xml', 'image/gif']);

/** Target size preserving aspect ratio; never enlarges. */
export function fitWithin(width: number, height: number, maxEdge: number = MAX_EDGE): { width: number; height: number } {
    const longest = Math.max(width, height);
    if (longest <= maxEdge || longest === 0) return { width, height };
    const scale = maxEdge / longest;
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** File name with the extension of the format it was re-encoded to. */
export function renamed(name: string, mime: string): string {
    const extension = mime === 'image/png' ? 'png' : 'jpg';
    const base = name.replace(/\.[^.]+$/, '') || 'imagem';
    return `${base}.${extension}`;
}

/** A PNG with any transparent pixel is a logo, and stays a PNG. */
function hasTransparency(context: CanvasRenderingContext2D, width: number, height: number): boolean {
    const { data } = context.getImageData(0, 0, width, height);
    for (let i = 3; i < data.length; i += 4 * 16) {
        if (data[i] < 255) return true;
    }
    return false;
}

export async function optimizeImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || PASSTHROUGH.has(file.type)) return file;

    let bitmap: ImageBitmap;
    try {
        // from-image applies the EXIF rotation, so a phone photo is not uploaded sideways
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        return file; // A format this browser cannot decode (HEIC on desktop) goes up as is
    }

    const target = fitWithin(bitmap.width, bitmap.height);
    const alreadyFits = target.width === bitmap.width && target.height === bitmap.height;
    if (alreadyFits && file.size <= KEEP_BELOW_BYTES) {
        bitmap.close();
        return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) { bitmap.close(); return file; }
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, target.width, target.height);
    bitmap.close();

    const keepPng = file.type === 'image/png' && hasTransparency(context, target.width, target.height);
    const mime = keepPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, JPEG_QUALITY));

    // Re-encoding can lose to an already well-compressed original
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], renamed(file.name, mime), { type: mime, lastModified: Date.now() });
}
