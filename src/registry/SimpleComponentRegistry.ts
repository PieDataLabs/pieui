import React from 'react';

export type ComponentType = React.ComponentType<any>;

// Простой реестр компонентов
class SimpleComponentRegistry {
    private components = new Map<string, ComponentType>();
    private metadata = new Map<string, any>();

    // Регистрация компонента
    register(name: string, component: ComponentType, meta?: any) {
        this.components.set(name, component);
        if (meta) {
            this.metadata.set(name, meta);
        }
        console.log(`[PieRegistry] Registered component: ${name}`);
    }

    // Получение компонента
    get(name: string): ComponentType | undefined {
        return this.components.get(name);
    }

    // Проверка существования
    has(name: string): boolean {
        return this.components.has(name);
    }

    // Получение всех имен
    getAll(): string[] {
        return Array.from(this.components.keys());
    }

    // Получение метаданных
    getMeta(name: string): any {
        return this.metadata.get(name);
    }
}

// Глобальный реестр
export const pieRegistry = new SimpleComponentRegistry();

// Простой HOC для регистрации
export function PieRegister<T extends ComponentType>(
    Component: T,
    name: string,
    metadata?: any
): T {
    // Регистрируем компонент
    pieRegistry.register(name, Component, metadata);

    // Возвращаем оригинальный компонент
    return Component;
}

// Функция для создания компонента по имени
export function createPieComponent(name: string, props: any = {}) {
    const Component = pieRegistry.get(name);
    if (!Component) {
        console.warn(`Component '${name}' not found`);
        return React.createElement('div',
            { style: { padding: '8px', color: 'red', border: '1px solid red' } },
            `Component '${name}' not found`
        );
    }
    return React.createElement(Component, props);
}

export default PieRegister;