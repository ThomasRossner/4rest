import React from 'react';

type InlineErrorProps = {
  message: string;
};

export function InlineError({ message }: InlineErrorProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: '#fdecea',
        color: '#611a15',
        border: '1px solid #f5c2c0',
        margin: '12px 0',
      }}
    >
      {message}
    </div>
  );
}


