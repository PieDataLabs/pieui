import { useMemo } from 'react';
import { UIConfigType, PieEventEmitter, SetUiAjaxConfigurationType } from './types';
import { UniversalUIRenderer } from './UniversalUIRenderer';

// Импортируем систему автоматической регистрации
import '../../registry/AutoRegisterComponents';

interface UIProps {
    uiConfig: UIConfigType;
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType;
    eventEmitter?: PieEventEmitter;
    dataTransform?: (data: any) => any;
    // Новые опции для универсального рендерера
    enableValidation?: boolean;
    enableDevMode?: boolean;
}

/**
 * Новая версия UI компонента с автоматической регистрацией
 * Вместо огромного switch-case использует универсальный рендерер
 */
function UI({
    uiConfig,
    setUiAjaxConfiguration,
    eventEmitter,
    dataTransform,
    enableValidation = false,
    enableDevMode = process.env.NODE_ENV === 'development'
}: UIProps) {
    return (
        <UniversalUIRenderer
            uiConfig={uiConfig}
            setUiAjaxConfiguration={setUiAjaxConfiguration}
            eventEmitter={eventEmitter}
            dataTransform={dataTransform}
            fallbackToRegistry={true}
            enableValidation={enableValidation}
            enableDevMode={enableDevMode}
        />
    );
}

export default UI;