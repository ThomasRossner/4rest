import { describe, expect, it } from 'vitest';
import { applyIosInlineVideoAttributes } from './iosVideoPlayback';

describe('applyIosInlineVideoAttributes', () => {
  it('sets playsinline and webkit-playsinline on the video element', () => {
    const video = document.createElement('video');
    applyIosInlineVideoAttributes(video);
    expect(video.getAttribute('playsinline')).toBe('true');
    expect(video.getAttribute('webkit-playsinline')).toBe('true');
  });
});
