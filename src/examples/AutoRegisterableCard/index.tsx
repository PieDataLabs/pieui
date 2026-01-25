import React from 'react';

// Пример компонента с автоматической регистрацией
// @AutoRegister('ExampleAutoCard')
// @displayName('Auto Registerable Example Card')
// @category('examples')

export interface ExampleAutoCardProps {
    title: string;
    description?: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
}

const ExampleAutoCard: React.FC<{ data: ExampleAutoCardProps }> = ({ data }) => {
    const { title, description, variant = 'info' } = data;

    const variantStyles = {
        info: { backgroundColor: '#e3f2fd', borderColor: '#2196f3', color: '#0d47a1' },
        success: { backgroundColor: '#e8f5e8', borderColor: '#4caf50', color: '#1b5e20' },
        warning: { backgroundColor: '#fff3e0', borderColor: '#ff9800', color: '#e65100' },
        error: { backgroundColor: '#ffebee', borderColor: '#f44336', color: '#b71c1c' }
    };

    const style = {
        padding: '16px',
        border: '1px solid',
        borderRadius: '8px',
        margin: '8px 0',
        ...variantStyles[variant]
    };

    return (
        <div style={style}>
            <h3 style={{ margin: '0 0 8px 0' }}>{title}</h3>
            {description && (
                <p style={{ margin: 0, opacity: 0.8 }}>{description}</p>
            )}
            <small style={{ opacity: 0.6, fontSize: '12px', display: 'block', marginTop: '8px' }}>
                Auto-registered component - {variant} variant
            </small>
        </div>
    );
};

// Добавляем метаданные для автоматической регистрации
(ExampleAutoCard as any).__pieCardName = 'ExampleAutoCard';
(ExampleAutoCard as any).__pieCardMetadata = {
    displayName: 'Auto Registerable Example Card',
    description: 'Example of automatically registerable component',
    category: 'examples'
};

export default ExampleAutoCard;