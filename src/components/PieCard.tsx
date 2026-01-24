import React from 'react';

export interface PieCardProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PieCard: React.FC<PieCardProps> = ({
  title,
  children,
  className = '',
  style
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    border: '1px solid #e5e7eb',
    ...style
  };

  return (
    <div className={`pie-card ${className}`} style={baseStyles}>
      {title && (
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#374151'
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};