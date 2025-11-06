interface QRCodeIconProps {
  size?: number;
  className?: string;
}

export function QRCodeIcon({ size = 48, className }: QRCodeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* QR Code pattern - simplified representation */}
      {/* Top-left corner finder pattern */}
      <rect x="2" y="2" width="7" height="7" fill="currentColor" />
      <rect x="4" y="4" width="3" height="3" fill="white" />
      
      {/* Top-right corner finder pattern */}
      <rect x="15" y="2" width="7" height="7" fill="currentColor" />
      <rect x="17" y="4" width="3" height="3" fill="white" />
      
      {/* Bottom-left corner finder pattern */}
      <rect x="2" y="15" width="7" height="7" fill="currentColor" />
      <rect x="4" y="17" width="3" height="3" fill="white" />
      
      {/* Data pattern - scattered squares */}
      <rect x="11" y="2" width="2" height="2" fill="currentColor" />
      <rect x="11" y="5" width="2" height="2" fill="currentColor" />
      <rect x="11" y="8" width="2" height="2" fill="currentColor" />
      
      <rect x="2" y="11" width="2" height="2" fill="currentColor" />
      <rect x="5" y="11" width="2" height="2" fill="currentColor" />
      <rect x="8" y="11" width="2" height="2" fill="currentColor" />
      
      <rect x="11" y="11" width="2" height="2" fill="currentColor" />
      <rect x="14" y="11" width="2" height="2" fill="currentColor" />
      <rect x="17" y="11" width="2" height="2" fill="currentColor" />
      <rect x="20" y="11" width="2" height="2" fill="currentColor" />
      
      <rect x="11" y="14" width="2" height="2" fill="currentColor" />
      <rect x="14" y="14" width="2" height="2" fill="currentColor" />
      <rect x="17" y="14" width="2" height="2" fill="currentColor" />
      
      <rect x="2" y="14" width="2" height="2" fill="currentColor" />
      <rect x="5" y="14" width="2" height="2" fill="currentColor" />
      
      <rect x="11" y="17" width="2" height="2" fill="currentColor" />
      <rect x="14" y="17" width="2" height="2" fill="currentColor" />
      <rect x="17" y="17" width="2" height="2" fill="currentColor" />
      <rect x="20" y="17" width="2" height="2" fill="currentColor" />
      
      <rect x="2" y="17" width="2" height="2" fill="currentColor" />
      <rect x="5" y="17" width="2" height="2" fill="currentColor" />
      <rect x="8" y="17" width="2" height="2" fill="currentColor" />
      
      <rect x="11" y="20" width="2" height="2" fill="currentColor" />
      <rect x="14" y="20" width="2" height="2" fill="currentColor" />
      <rect x="17" y="20" width="2" height="2" fill="currentColor" />
      <rect x="20" y="20" width="2" height="2" fill="currentColor" />
      
      <rect x="2" y="20" width="2" height="2" fill="currentColor" />
      <rect x="5" y="20" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

