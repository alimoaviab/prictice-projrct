/**
 * Image compression utility — takes any image File and squeezes it down
 * to at-or-under a target byte budget for storage in the settings DB.
 *
 * Strategy:
 *   1. SVG → kept verbatim (text-based, transparent, already tiny).
 *      If somehow larger than the budget we still pass it through —
 *      raster recompression of an SVG defeats its purpose.
 *   2. Anything else → rasterized via <img> + <canvas>, then we run a
 *      two-axis search:
 *         - dimension axis: 1024 → 768 → 512 → 384 → 256 → 192
 *         - quality axis (per dimension):  0.90 → 0.80 → 0.70 → 0.60 → 0.50 → 0.40
 *      We stop at the first combo whose encoded size is ≤ targetBytes
 *      and keep the largest dimension that fits. WebP is preferred when
 *      the browser supports it (smaller); JPEG is the fallback. PNG is
 *      avoided here because logos at this scale don't need lossless
 *      and PNG blows the budget.
 *
 * Returns a base64 data URL ready to stash in `branding.logoUrl`.
 */

const DEFAULT_TARGET_BYTES = 100 * 1024; // ≈100 KB
const DIMENSION_LADDER = [1024, 768, 512, 384, 256, 192];
const QUALITY_LADDER = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];

export interface CompressResult {
    dataUrl: string;
    sizeBytes: number;
    width: number;
    height: number;
    mime: string;
}

export interface CompressOptions {
    targetBytes?: number;
    /** Hard ceiling on the longer edge. Default 1024px. */
    maxDimension?: number;
}

let cachedWebpSupport: boolean | null = null;
function supportsWebp(): boolean {
    if (cachedWebpSupport !== null) return cachedWebpSupport;
    try {
        const canvas = document.createElement("canvas");
        cachedWebpSupport =
            canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch {
        cachedWebpSupport = false;
    }
    return cachedWebpSupport;
}

/**
 * Approx size of a base64 data URL in raw bytes (the encoded payload,
 * not the URL string itself). Each 4 chars of base64 ≈ 3 bytes.
 */
function dataUrlBytes(dataUrl: string): number {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return dataUrl.length;
    const payload = dataUrl.slice(comma + 1);
    return Math.floor((payload.length * 3) / 4);
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error || new Error("read failed"));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not decode image"));
        img.src = src;
    });
}

function encodeAt(
    img: HTMLImageElement,
    longEdge: number,
    quality: number,
    mime: string
): { dataUrl: string; width: number; height: number } {
    const scale = Math.min(1, longEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");

    // White background so transparent PNGs flattened into JPEG don't go
    // black. A logo on a white page header is the dominant case.
    if (mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);

    return {
        dataUrl: canvas.toDataURL(mime, quality),
        width: w,
        height: h,
    };
}

/**
 * Compress an image File down to roughly `targetBytes` (default 100 KB)
 * and return it as a base64 data URL. SVGs pass through untouched.
 */
export async function compressImageToBudget(
    file: File,
    options: CompressOptions = {}
): Promise<CompressResult> {
    const targetBytes = options.targetBytes ?? DEFAULT_TARGET_BYTES;

    // SVG fast-path. SVGs are text and already compact; rasterizing
    // them would lose vector fidelity.
    if (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
        const dataUrl = await readFileAsDataUrl(file);
        return {
            dataUrl,
            sizeBytes: dataUrlBytes(dataUrl),
            width: 0,
            height: 0,
            mime: "image/svg+xml",
        };
    }

    const original = await readFileAsDataUrl(file);
    const img = await loadImage(original);

    const mime = supportsWebp() ? "image/webp" : "image/jpeg";

    // Start with max long edge of 1200px (or options ceiling)
    const initialMaxDimension = Math.min(1200, options.maxDimension ?? 1200);

    let dimensionScale = 1.0;
    let best: CompressResult | null = null;

    // Progressive reduction logic:
    // If the image is larger than 100 KB:
    // 1. Reduce quality progressively (start at 85%, decrease by 5% increments down to 60%)
    // 2. If quality decreases alone don't reach target size, reduce dimensions by 10% increments
    while (dimensionScale > 0.05) {
        const longEdge = Math.round(initialMaxDimension * dimensionScale);

        // Quality ranges between 85% and 60% with 5% steps
        for (let q = 85; q >= 60; q -= 5) {
            const quality = q / 100;
            const { dataUrl, width, height } = encodeAt(
                img,
                longEdge,
                quality,
                mime
            );
            const size = dataUrlBytes(dataUrl);
            
            if (size <= targetBytes) {
                return { dataUrl, sizeBytes: size, width, height, mime };
            }

            // Keep track of the smallest encoded version
            if (!best || size < best.sizeBytes) {
                best = {
                    dataUrl,
                    sizeBytes: size,
                    width,
                    height,
                    mime,
                };
            }
        }

        // Scale down dimensions by 10%
        dimensionScale -= 0.10;
    }

    if (!best) throw new Error("Compression produced no output");
    return best;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
