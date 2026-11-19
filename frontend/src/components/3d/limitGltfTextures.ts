import type { Material, Mesh, Object3D, Texture } from 'three';

/** iPhone/iPad: 4K-Texturen der Wald-GLBs dekodieren sonst mehrere hundert MB und beenden den Tab. */
export const APPLE_MOBILE_TEXTURE_MAX = 1024;

export function isAppleMobileWeb(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isTexture(value: unknown): value is Texture {
  return Boolean(value) && typeof value === 'object' && (value as Texture).isTexture === true;
}

function collectTextures(value: unknown, into: Set<Texture>): void {
  if (isTexture(value)) {
    into.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectTextures(entry, into);
  }
}

function imageSize(image: unknown): { width: number; height: number } | null {
  if (!image || typeof image !== 'object') return null;
  const width = (image as { width?: unknown }).width;
  const height = (image as { height?: unknown }).height;
  if (typeof width !== 'number' || typeof height !== 'number' || width < 1 || height < 1) return null;
  return { width, height };
}

function resizeTexture(texture: Texture, maxSize: number): void {
  const image = texture.image as CanvasImageSource | undefined;
  const size = imageSize(image);
  if (!image || !size) return;
  if (size.width <= maxSize && size.height <= maxSize) return;

  const scale = maxSize / Math.max(size.width, size.height);
  const width = Math.max(1, Math.round(size.width * scale));
  const height = Math.max(1, Math.round(size.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  try {
    context.drawImage(image, 0, 0, width, height);
  } catch {
    return;
  }

  texture.image = canvas;
  texture.needsUpdate = true;
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    image.close();
    return;
  }
  if (typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) {
    image.src = '';
  }
}

/** Verkleinert Texturen am bereits geladenen GLTF, bevor WebGL sie hochlädt. */
export function limitGltfTextureSize(gltf: unknown, maxSize: number): void {
  const scene = (gltf as { scene?: Object3D } | null)?.scene;
  if (!scene || maxSize < 1) return;

  const textures = new Set<Texture>();
  scene.traverse((object) => {
    const material = (object as Mesh).material as Material | Material[] | undefined;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    for (const entry of materials) {
      for (const value of Object.values(entry)) collectTextures(value, textures);
    }
  });

  for (const texture of textures) resizeTexture(texture, maxSize);
}
