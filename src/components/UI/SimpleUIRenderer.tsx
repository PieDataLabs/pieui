import { useMemo } from 'react';
import { UIConfigType, PieEventEmitter, SetUiAjaxConfigurationType } from './types';
import { pieRegistry, createPieComponent } from '../../registry/SimpleComponentRegistry';

interface SimpleUIRendererProps {
    uiConfig: UIConfigType;
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType;
    eventEmitter?: PieEventEmitter;
    dataTransform?: (data: any) => any;
    enableDevMode?: boolean;
}

/**
 * Простой универсальный рендерер UI компонентов
 * Заменяет огромный switch-case на автоматический поиск компонентов
 */
export function SimpleUIRenderer({
    uiConfig,
    setUiAjaxConfiguration,
    eventEmitter,
    dataTransform,
    enableDevMode = false
}: SimpleUIRendererProps) {
    const cardData = useMemo(() => {
        if (dataTransform && uiConfig.data) {
            return dataTransform(uiConfig.data);
        }
        return uiConfig.data;
    }, [uiConfig.data, dataTransform]);

    const cardName = uiConfig.card;

    // Отладочная информация
    if (enableDevMode) {
        console.log(`[SimpleUIRenderer] Rendering: ${cardName}`);
        console.log(`[SimpleUIRenderer] Available components:`, pieRegistry.getAll());
    }

    // Проверяем, есть ли компонент в реестре
    if (pieRegistry.has(cardName)) {
        const componentProps = {
            data: cardData,
            ...(setUiAjaxConfiguration && { setUiAjaxConfiguration }),
            ...(eventEmitter && { eventEmitter }),
            ...(dataTransform && { dataTransform })
        };

        // Если есть content, добавляем его
        if (uiConfig.content !== undefined) {
            (componentProps as any).content = uiConfig.content;
        }

        try {
            return createPieComponent(cardName, componentProps);
        } catch (error) {
            console.error(`[SimpleUIRenderer] Error rendering ${cardName}:`, error);

            if (enableDevMode) {
                return (
                    <div style={{
                        padding: '16px',
                        border: '2px solid #ff6b6b',
                        borderRadius: '8px',
                        backgroundColor: '#fff5f5',
                        color: '#d63031'
                    }}>
                        <strong>Render Error: {cardName}</strong>
                        <pre style={{ fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                            {error instanceof Error ? error.message : String(error)}
                        </pre>
                    </div>
                );
            }

            // Fallback для production
            return null;
        }
    }

    // Если компонент не найден в реестре
    if (enableDevMode) {
        const availableComponents = pieRegistry.getAll();

        return (
            <div style={{
                padding: '16px',
                border: '2px dashed #orange',
                borderRadius: '8px',
                backgroundColor: '#fff8e1',
                color: '#f57f17'
            }}>
                <strong>Unknown Component: {cardName}</strong>
                <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer' }}>
                        Available components ({availableComponents.length})
                    </summary>
                    <ul style={{ fontSize: '12px', marginTop: '4px' }}>
                        {availableComponents.slice(0, 20).map(name => (
                            <li key={name}>{name}</li>
                        ))}
                        {availableComponents.length > 20 && (
                            <li>... and {availableComponents.length - 20} more</li>
                        )}
                    </ul>
                </details>
            </div>
        );
    }

    // Fallback для неизвестных компонентов в production
    return (
        <div style={{
            padding: '8px',
            color: '#666',
            fontStyle: 'italic',
            fontSize: '14px'
        }}>
            Component '{cardName}' not registered
        </div>
    );
}

export default SimpleUIRenderer;