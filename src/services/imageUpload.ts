/**
 * Image hosting via ImgBB.
 *
 * The key must be named VITE_IMAGE_BB_API_KEY: Vite only exposes variables with
 * that prefix to browser code, so a plain IMAGE_BB_API_KEY is invisible at runtime
 * and every upload would silently fall back to "not configured".
 */

const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  success: boolean;
  url?: string;
  /** Present on failure, already phrased for display. */
  error?: string;
}

function apiKey(): string {
  return (import.meta.env.VITE_IMAGE_BB_API_KEY ?? '').trim();
}

/** Whether uploads can be attempted at all, so the UI can hide the control. */
export function isImageUploadConfigured(): boolean {
  return apiKey().length > 0;
}

/** Strip the `data:image/png;base64,` prefix — ImgBB wants the payload alone. */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload one image and return its hosted URL.
 *
 * Never throws: callers treat a failed upload as "carry on without a picture"
 * rather than blocking a registration on an image host being down.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const key = apiKey();
  if (!key) {
    return { success: false, error: 'Image uploads are not configured on this site.' };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: 'Choose a JPG, PNG, WebP or GIF image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: 'That image is larger than 5 MB.' };
  }

  try {
    const body = new FormData();
    body.append('image', await toBase64(file));

    const res = await fetch(`${IMGBB_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      body,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      // ImgBB reports a bad or blocked key as code 103, which is worth naming
      // because it looks like a network problem otherwise.
      const code = json?.error?.code;
      return {
        success: false,
        error:
          code === 103
            ? 'The image host rejected the API key. Check VITE_IMAGE_BB_API_KEY.'
            : json?.error?.message || 'The image could not be uploaded.',
      };
    }

    const url: string | undefined = json.data?.display_url || json.data?.url;
    if (!url) return { success: false, error: 'The image host returned no URL.' };
    return { success: true, url };
  } catch {
    return { success: false, error: 'Could not reach the image host.' };
  }
}
