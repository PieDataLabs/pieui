import { useMemo } from 'react';
import { UIConfigType, SetUiAjaxConfigurationType, PieEventEmitter } from './types';
import { getBuildTimeComponent, COMPONENT_MAP } from '../../registry/BuildTimeRegistry';
import { componentRegistry } from '../../registry/ComponentRegistry';
import { DynamicComponent } from '../../registry/ComponentFactory';

interface UniversalUIRendererProps {
    uiConfig: UIConfigType;
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType;
    eventEmitter?: PieEventEmitter;
    dataTransform?: (data: any) => any;
    // Новые опции для универсального рендерера
    fallbackToRegistry?: boolean; // Использовать registry как fallback
    enableValidation?: boolean;   // Включить валидацию пропсов
    enableDevMode?: boolean;      // Показать отладочную информацию
}

/**
 * Универсальный рендерер UI компонентов
 * Автоматически находит и рендерит компоненты из:
 * 1. Build-time registry (собранные на этапе сборки)
 * 2. Runtime registry (зарегистрированные динамически)
 * 3. Fallback к UiConstructor для неизвестных компонентов
 */
export function UniversalUIRenderer({
    uiConfig,
    setUiAjaxConfiguration,
    eventEmitter,
    dataTransform,
    fallbackToRegistry = true,
    enableValidation = false,
    enableDevMode = false
}: UniversalUIRendererProps) {
    const cardData = useMemo(() => {
        if (dataTransform && uiConfig.data) {
            return dataTransform(uiConfig.data);
        }
        return uiConfig.data;
    }, [uiConfig.data, dataTransform]);

    const { cardName, Component, source } = useMemo(() => {
        const cardName = uiConfig.card;

        // 1. Сначала ищем в build-time registry
        let Component = getBuildTimeComponent(cardName);
        let source = 'build-time';

        // 2. Если не найден, ищем в runtime registry
        if (!Component && fallbackToRegistry) {
            Component = componentRegistry.get(cardName);
            source = 'runtime-registry';
        }

        return { cardName, Component, source };
    }, [uiConfig.card, fallbackToRegistry]);

    // Отладочная информация
    if (enableDevMode && Component) {
        console.log(`[UniversalUIRenderer] Rendering ${cardName} from ${source}`);
    }

    // Если компонент найден, используем его
    if (Component) {
        // Определяем пропсы для компонента
        const componentProps = {
            data: cardData,
            ...(setUiAjaxConfiguration && { setUiAjaxConfiguration }),
            ...(eventEmitter && { eventEmitter }),
            ...(dataTransform && { dataTransform })
        };

        // Если есть content, добавляем его
        if (uiConfig.content) {
            (componentProps as any).content = uiConfig.content;
        }

        // Для runtime registry компонентов можем использовать валидацию
        if (source === 'runtime-registry' && enableValidation) {
            return (
                <DynamicComponent
                    componentName={cardName}
                    validateProps={true}
                    showValidationErrors={enableDevMode}
                    {...componentProps}
                />
            );
        }

        // Для build-time компонентов рендерим напрямую
        try {
            return <Component {...componentProps} />;
        } catch (error) {
            console.error(`[UniversalUIRenderer] Error rendering ${cardName}:`, error);

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
                        <pre style={{ fontSize: '12px', marginTop: '8px' }}>
                            {error instanceof Error ? error.message : String(error)}
                        </pre>
                    </div>
                );
            }

            return null;
        }
    }

    // Если компонент не найден
    const errorMessage = `Component '${cardName}' not found`;
    console.warn(`[UniversalUIRenderer] ${errorMessage}`);

    if (enableDevMode) {
        const availableComponents = [
            ...Object.keys(COMPONENT_MAP),
            ...componentRegistry.getRegisteredNames()
        ].filter((name, index, arr) => arr.indexOf(name) === index);

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
                    <summary>Available components ({availableComponents.length})</summary>
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

    // Fallback к пустому компоненту
    return (
        <div style={{
            padding: '8px',
            color: '#666',
            fontStyle: 'italic'
        }}>
            Component '{cardName}' not found
        </div>
    );
}

export default UniversalUIRenderer;