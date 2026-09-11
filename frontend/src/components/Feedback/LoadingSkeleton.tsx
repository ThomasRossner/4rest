type LoadingSkeletonProps = {
  lines?: number;
};

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height: 12,
            background: 'linear-gradient(90deg, #eee, #f5f5f5, #eee)',
            borderRadius: 6,
            margin: '10px 0',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}


