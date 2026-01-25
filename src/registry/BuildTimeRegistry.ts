/**
 * Система автоматической регистрации компонентов на этапе сборки
 */

import { ComponentType } from './ComponentRegistry';

// Интерфейс для компонентов, которые могут быть зарегистрированы автоматически
export interface AutoRegisterableComponent {
    __pieCardName: string;
    __pieCardMetadata?: {
        displayName?: string;
        description?: string;
        category?: string;
        propsSchema?: any;
    };
}

// Декоратор для автоматической регистрации компонентов
export function AutoRegister(cardName: string, metadata?: {
    displayName?: string;
    description?: string;
    category?: string;
}) {
    return function<T extends ComponentType>(Component: T): T & AutoRegisterableComponent {
        const EnhancedComponent = Component as T & AutoRegisterableComponent;

        EnhancedComponent.__pieCardName = cardName;
        EnhancedComponent.__pieCardMetadata = metadata;

        return EnhancedComponent;
    };
}

// Тип для карты компонентов собранной на этапе сборки
export type BuildTimeComponentMap = Record<string, ComponentType>;

// Глобальная карта компонентов для runtime доступа
export let COMPONENT_MAP: BuildTimeComponentMap = {};

// Функция для установки карты компонентов (вызывается из сгенерированного файла)
export function setBuildTimeComponents(componentMap: BuildTimeComponentMap) {
    COMPONENT_MAP = { ...COMPONENT_MAP, ...componentMap };
}

// Функция для получения компонента по имени
export function getBuildTimeComponent(cardName: string): ComponentType | undefined {
    return COMPONENT_MAP[cardName];
}

// Функция для получения всех зарегистрированных компонентов
export function getAllBuildTimeComponents(): BuildTimeComponentMap {
    return COMPONENT_MAP;
}

// Функция для проверки существования компонента
export function hasBuildTimeComponent(cardName: string): boolean {
    return cardName in COMPONENT_MAP;
}

// Утилита для автоматического сканирования компонентов в папке
export function scanComponentsInDirectory(requireContext: any): BuildTimeComponentMap {
    const componentMap: BuildTimeComponentMap = {};

    // Проходим по всем файлам в контексте
    requireContext.keys().forEach((fileName: string) => {
        const componentModule = requireContext(fileName);

        // Ищем экспортированные компоненты
        Object.keys(componentModule).forEach(exportName => {
            const Component = componentModule[exportName];

            // Проверяем, является ли это React компонентом с нашими метаданными
            if (Component && typeof Component === 'function' && Component.__pieCardName) {
                const cardName = Component.__pieCardName;
                componentMap[cardName] = Component;

                console.log(`[BuildTimeRegistry] Auto-registered component: ${cardName}`);
            }
        });
    });

    return componentMap;
}