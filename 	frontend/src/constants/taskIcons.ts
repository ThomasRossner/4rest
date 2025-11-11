import { createElement, type ReactNode } from 'react';
import { QRCodeIcon } from '../components/Icons/QRCodeIcon';

export const TASK_TYPE_ICONS: Record<string, ReactNode> = {
  video: '🎥',
  qr: createElement(QRCodeIcon, { size: 24 }),
  photo: '📷',
};
