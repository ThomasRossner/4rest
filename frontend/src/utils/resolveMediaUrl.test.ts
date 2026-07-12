import { afterEach, describe, expect, it } from 'vitest';
import { resolveMediaUrl } from './resolveMediaUrl';

describe('resolveMediaUrl', () => {
  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
  });

  it('returns undefined for empty values', () => {
    expect(resolveMediaUrl(null)).toBeUndefined();
    expect(resolveMediaUrl('')).toBeUndefined();
    expect(resolveMediaUrl('   ')).toBeUndefined();
  });

  it('keeps external https URLs unchanged', () => {
    expect(resolveMediaUrl('https://www.youtube.com/watch?v=abc')).toBe(
      'https://www.youtube.com/watch?v=abc'
    );
    expect(resolveMediaUrl('https://luise.bio/uploads/video.mp4')).toBe(
      'https://luise.bio/uploads/video.mp4'
    );
  });

  it('rewrites legacy upload hosts to the current origin in the browser', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://luise.bio' } },
    });

    expect(resolveMediaUrl('http://87.106.86.203:5000/uploads/task-video-1.mp4')).toBe(
      'https://luise.bio/uploads/task-video-1.mp4'
    );
    expect(resolveMediaUrl('http://localhost:5001/uploads/subtitle.de.vtt?v=1')).toBe(
      'https://luise.bio/uploads/subtitle.de.vtt?v=1'
    );
  });

  it('resolves relative upload paths against the current origin', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://luise.bio' } },
    });

    expect(resolveMediaUrl('/uploads/task-video-1.mp4')).toBe(
      'https://luise.bio/uploads/task-video-1.mp4'
    );
    expect(resolveMediaUrl('uploads/task-video-1.mp4')).toBe(
      'https://luise.bio/uploads/task-video-1.mp4'
    );
  });

  it('returns normalized relative paths without window', () => {
    expect(resolveMediaUrl('/uploads/task-video-1.mp4')).toBe('/uploads/task-video-1.mp4');
  });
});
