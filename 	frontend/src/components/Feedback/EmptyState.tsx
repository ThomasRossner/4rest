import React from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 12px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🪴</div>
      <h3 style={{ margin: '4px 0' }}>{title}</h3>
      {description && (
        <p style={{ color: '#666', margin: '6px 0 14px' }}>{description}</p>
      )}
      {action}
    </div>
  );
}


