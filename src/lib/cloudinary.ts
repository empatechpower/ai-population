const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD as string;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string;

export interface CloudinaryUploadResult {
  url: string; // http URL
  secure_url: string; // https URL  ← always use this
  public_id: string; // e.g. "bloom-community/abc123"
  width: number;
  height: number;
  format: string; // "jpg", "png", etc.
  bytes: number;
}

// ── Upload a File object ──────────────────────────────────────
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD || !PRESET) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD and " +
        "NEXT_PUBLIC_CLOUDINARY_PRESET to your .env.local file.",
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);
  form.append("folder", "bloom-community");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: "POST", body: form },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ?? `Cloudinary upload failed (${res.status})`,
    );
  }

  return res.json() as Promise<CloudinaryUploadResult>;
}

// ── Validate file before upload ───────────────────────────────
export function validateImageFile(file: File): string | null {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
  ];

  if (!ALLOWED.includes(file.type)) {
    return "Only JPEG, PNG, WebP and HEIC images are supported.";
  }
  if (file.size > MAX_SIZE) {
    return "Image must be under 10 MB.";
  }
  return null; // valid
}

// ── Build a resized URL from an existing Cloudinary public_id ─
// Useful if you store public_id instead of the full URL
export function buildImageUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {},
): string {
  const { width = 800, height, quality = 80 } = options;
  const transforms = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `q_${quality}`,
    "f_auto", // auto format (webp when supported)
    "c_fill", // crop to fill
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${transforms}/${publicId}`;
}
