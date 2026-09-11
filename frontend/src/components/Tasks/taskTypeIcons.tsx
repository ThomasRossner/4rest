import {
  Camera,
  ClipboardList,
  FileText,
  HelpCircle,
  MapPin,
  QrCode,
  Video,
} from 'lucide-react';

type Props = {
  type?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/** Einheitliche Lucide-Icons pro Aufgabentyp (Wald-Atlas / Quest-Karten). */
export function TaskTypeIcon({ type, size = 20, className, strokeWidth = 2 }: Props) {
  const t = (type || '').toLowerCase();
  const common = { size, className, strokeWidth, 'aria-hidden': true as const };
  switch (t) {
    case 'video':
      return <Video {...common} />;
    case 'quiz':
      return <HelpCircle {...common} />;
    case 'article_quiz':
      return <FileText {...common} />;
    case 'survey':
      return <ClipboardList {...common} />;
    case 'qr':
      return <QrCode {...common} />;
    case 'photo':
      return <Camera {...common} />;
    case 'visit_location':
      return <MapPin {...common} />;
    default:
      return <ClipboardList {...common} />;
  }
}
