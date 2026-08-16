const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD as string;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET as string;

export interface CloudinaryUploadResult {
  url: string; // http URL
  secure_url: string; // https URL  ← always use this
  public_id: string; // e.g. "bloom-community/abc123"
  width: number;
  height: number;
  format: string; // "jpg", "png", etc.
  bytes: number;
}

export interface LocalImage {
  uri: string;
  name?: string;
  mimeType?: string;
}

// ── Upload an image picked via expo-image-picker ────────────────
export async function uploadImage(
  image: LocalImage,
): Promise<CloudinaryUploadResult> {
  if (!CLOUD || !PRESET) {
    throw new Error(
      "Cloudinary is not configured. Add EXPO_PUBLIC_CLOUDINARY_CLOUD and " +
        "EXPO_PUBLIC_CLOUDINARY_PRESET to your .env file.",
    );
  }

  const form = new FormData();
  form.append("file", {
    uri: image.uri,
    name: image.name ?? "upload.jpg",
    type: image.mimeType ?? "image/jpeg",
  } as unknown as Blob);
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

// ── Build a resized URL from an existing Cloudinary public_id ─
export function buildImageUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {},
): string {
  const { width = 800, height, quality = 80 } = options;
  const transforms = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `q_${quality}`,
    "f_auto",
    "c_fill",
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${transforms}/${publicId}`;
}
