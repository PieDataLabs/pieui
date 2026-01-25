# Примеры использования новой системы регистрации компонентов

## 🎯 Основная цель

Заменить огромный switch-case в `src/components/UI/index.tsx` на автоматическую систему регистрации компонентов.

## 📦 Что получилось

### 1. Автоматическая регистрация на этапе сборки

```bash
# При сборке автоматически сканируются компоненты
bun run build
# ↓
# prebuild запускает generate:registry
# ↓
# создается src/registry/GeneratedComponentMap.ts
```

### 2. Универсальный рендерер

```typescript
// Вместо switch-case из ~900 строк
// теперь умный поиск компонентов:

import { UniversalUIRenderer } from 'pieui';

<UniversalUIRenderer
    uiConfig={{ card: 'MyCard', data: { title: 'Hello' } }}
    setUiAjaxConfiguration={setConfig}
    eventEmitter={emitter}
    enableDevMode={true}  // Отладка
    enableValidation={true} // Проверка типов
/>
```

## 🚀 Как использовать для ваших задач

### Способ 1: Импорт по умолчанию для новых компонентов

```typescript
import pieregister from 'pieui'; // PieRegister

// Ваш компонент
interface MyButtonProps {
    label: string;
    onClick: () => void;
}

const MyButton: React.FC<{ data: MyButtonProps }> = ({ data }) => (
    <button onClick={data.onClick}>{data.label}</button>
);

// Регистрируем компонент
const RegisteredMyButton = pieregister<{ data: MyButtonProps }>(MyButton, {
    name: 'MyButton',
    displayName: 'My Custom Button',
    category: 'buttons',
    // Автоматическое извлечение типов
    propsExample: {
        data: {
            label: 'Example',
            onClick: () => {}
        }
    }
});

// Теперь компонент доступен по имени 'MyButton'
// и автоматически появится в UI рендерере
```

### Способ 2: Добавление метаданных к существующим компонентам

```typescript
// В существующий компонент (например, TextCard/index.tsx)
const TextCard = ({ data }) => {
    return <div>{data.text}</div>;
};

// Добавить в конец файла:
(TextCard as any).__pieCardName = 'TextCard';
(TextCard as any).__pieCardMetadata = {
    displayName: 'Text Card',
    description: 'Displays text content',
    category: 'text'
};

export default TextCard;

// После этого запустить:
// bun run generate:registry
// Компонент автоматически найдется и зарегистрируется
```

### Способ 3: Для обратной совместимости

```typescript
// Старый UI компонент (с switch-case) можно заменить:

// БЫЛО:
function UI({ uiConfig, setUiAjaxConfiguration, eventEmitter, dataTransform }) {
    switch (uiConfig.card) {
        case 'TextCard':
            return <TextCard data={cardData} />;
        case 'ButtonCard':
            return <ButtonCard data={cardData} onClick={...} />;
        // ... 80+ других case
        default:
            return <UiConstructor ... />;
    }
}

// СТАЛО:
import { UniversalUIRenderer } from './UniversalUIRenderer';

function UI({ uiConfig, setUiAjaxConfiguration, eventEmitter, dataTransform }) {
    return (
        <UniversalUIRenderer
            uiConfig={uiConfig}
            setUiAjaxConfiguration={setUiAjaxConfiguration}
            eventEmitter={eventEmitter}
            dataTransform={dataTransform}
            fallbackToRegistry={true} // Ищет в обоих реестрах
            enableDevMode={true}       // Показывает отладку
        />
    );
}
```

## 🔧 Отладка и мониторинг

### Dev панель
```typescript
import { PieRoot } from 'pieui';

<PieRoot enableDevMode={true}>
    <YourApp />
</PieRoot>
// Показывает панель с зарегистрированными компонентами
```

### Получение информации о компонентах
```typescript
import {
    componentRegistry,
    getAllBuildTimeComponents,
    getComponentTypeInfo
} from 'pieui';

// Все runtime компоненты
console.log(componentRegistry.getRegisteredNames());

// Все build-time компоненты
console.log(Object.keys(getAllBuildTimeComponents()));

// Информация о типах конкретного компонента
const typeInfo = getComponentTypeInfo('MyButton');
console.log(typeInfo.generateInterface()); // TypeScript интерфейс
console.log(typeInfo.propsSchema);         // Схема для валидации
```

## ⚡ Производительность

### Build-time компоненты (быстрые)
- Регистрируются на этапе сборки
- Прямой доступ без поиска
- Оптимальная производительность

### Runtime компоненты (гибкие)
- Можно регистрировать динамически
- Поддерживают валидацию типов
- Идеально для плагинов и расширений

## 🎯 Итоговый workflow

```typescript
// 1. Создаете компонент
const MyCard = ({ data }) => <div>{data.content}</div>;

// 2. Регистрируете его
const RegisteredCard = pieregister(MyCard, {
    name: 'MyCard',
    propsExample: { data: { content: 'test' } }
});

// 3. Компонент автоматически появляется в UI рендерере
<UI uiConfig={{ card: 'MyCard', data: { content: 'Hello!' } }} />

// 4. При сборке все оптимизируется автоматически
bun run build // автоматически запускает generate:registry
```

Система готова к использованию! 🎉