/**
 * Система автоматической регистрации компонентов на этапе сборки
 * Этот файл генерируется или обновляется автоматически
 */

import { setBuildTimeComponents, AutoRegister, scanComponentsInDirectory } from './BuildTimeRegistry';

// Примеры компонентов с автоматической регистрацией
import { ComponentType } from './ComponentRegistry';

// Обертка для существующих компонентов, чтобы они стали auto-registerable
export function wrapExistingComponent<T extends ComponentType>(
    Component: T,
    cardName: string,
    metadata?: {
        displayName?: string;
        description?: string;
        category?: string;
    }
): T {
    // Добавляем метаданные к компоненту
    (Component as any).__pieCardName = cardName;
    (Component as any).__pieCardMetadata = metadata;

    return Component;
}

// Функция для автоматической регистрации всех компонентов
export function initializeBuildTimeComponents() {
    const componentMap: Record<string, ComponentType> = {};

    // Вариант 1: Автоматическое сканирование (если поддерживается webpack)
    try {
        // Используется webpack require.context для автоматического поиска
        if (typeof require !== 'undefined' && (require as any).context) {
            // Сканируем папку cards на предмет компонентов
            const cardContext = (require as any).context('../components', true, /Card\/(index|ui)\.(tsx?)$/);
            const scannedComponents = scanComponentsInDirectory(cardContext);
            Object.assign(componentMap, scannedComponents);
        }
    } catch (error) {
        console.warn('[AutoRegisterComponents] Automatic scanning not available:', error);
    }

    // Вариант 2: Ручное перечисление для критически важных компонентов
    // Здесь можно добавить компоненты, которые должны быть доступны всегда

    // Вариант 3: Динамическая загрузка существующих компонентов
    // Можно импортировать и регистрировать существующие компоненты
    registerExistingComponents(componentMap);

    // Устанавливаем собранную карту компонентов
    setBuildTimeComponents(componentMap);

    console.log(`[AutoRegisterComponents] Registered ${Object.keys(componentMap).length} components`);

    return componentMap;
}

// Функция для регистрации существующих компонентов
function registerExistingComponents(componentMap: Record<string, ComponentType>) {
    // Здесь можно добавить logic для импорта и регистрации существующих компонентов
    // Пример:

    // Если у нас есть динамический импорт:
    /*
    const existingComponents = [
        { name: 'TextCard', import: () => import('../components/cards/TextCard') },
        { name: 'ButtonCard', import: () => import('../components/cards/ButtonCard') },
        // ... другие компоненты
    ];

    existingComponents.forEach(({ name, import: importFn }) => {
        try {
            const Component = importFn();
            componentMap[name] = wrapExistingComponent(Component.default || Component, name);
        } catch (error) {
            console.warn(`Failed to load component ${name}:`, error);
        }
    });
    */

    // Пример статической регистрации нескольких компонентов
    try {
        // Можно импортировать из существующих файлов
        // const TextCard = require('../components/cards/TextCard').default;
        // componentMap['TextCard'] = wrapExistingComponent(TextCard, 'TextCard', {
        //     displayName: 'Text Card',
        //     category: 'text'
        // });
    } catch (error) {
        // Компоненты могут не существовать в текущей среде
    }
}

// Инициализация при загрузке модуля
if (typeof window !== 'undefined') {
    // В браузере инициализируем сразу
    initializeBuildTimeComponents();
} else {
    // На сервере можем отложить инициализацию
    setTimeout(initializeBuildTimeComponents, 0);
}

export { initializeBuildTimeComponents };