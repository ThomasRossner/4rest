/** iOS Safari requires inline playback attributes on <video> (not only the React prop). */
export function applyIosInlineVideoAttributes(video: HTMLVideoElement): void {
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
}
