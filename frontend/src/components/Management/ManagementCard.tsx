import { ReactNode } from 'react';

type ManagementCardProps = {
  cssPrefix?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  controls?: ReactNode;
  message?: {
    type: 'error' | 'success';
    text: string;
  } | null;
};

export function ManagementCard({
  cssPrefix = 'admin',
  title,
  subtitle,
  children,
  controls,
  message,
}: ManagementCardProps) {
  return (
    <div className={`${cssPrefix}-management-card`}>
      <div className={`${cssPrefix}-management-top`}>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {controls && <div className={`${cssPrefix}-management-controls`}>{controls}</div>}
      </div>
      {message && (
        <p
          className={
            message.type === 'error' ? `${cssPrefix}-error` : `${cssPrefix}-success`
          }
        >
          {message.text}
        </p>
      )}
      {children}
    </div>
  );
}
