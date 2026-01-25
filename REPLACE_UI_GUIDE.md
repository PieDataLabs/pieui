# Как заменить switch-case в UI компоненте

## 🎯 Задача
Заменить огромный switch-case в `src/components/UI/index.tsx` (~900 строк) на автоматическую систему регистрации.

## ✅ Готовое решение

### 1. Простой реестр компонентов
- `SimpleComponentRegistry` - класс для управления компонентами
- `PieRegister` - HOC для регистрации компонентов
- `SimpleUIRenderer` - универсальный рендерер

### 2. Как использовать

#### Вариант A: Импорт по умолчанию (как вы хотели)
```typescript
import pieregister from 'pieui'; // PieRegister

// Ваш компонент
const MyCard = ({ data }) => <div>{data.content}</div>;

// Оборачиваем и регистрируем
const RegisteredCard = pieregister(MyCard, 'MyCard', {
    displayName: 'My Custom Card',
    category: 'custom'
});

// Теперь компонент доступен по имени 'MyCard'
// и появится в UI рендерере автоматически
```

#### Вариант B: Прямая регистрация
```typescript
import { pieRegistry } from 'pieui';

const MyCard = ({ data }) => <div>{data.content}</div>;

// Регистрируем напрямую
pieRegistry.register('MyCard', MyCard, {
    displayName: 'My Custom Card'
});
```

## 🔄 Замена существующего UI компонента

### Шаг 1: Зарегистрировать существующие компоненты

В файле `src/components/UI/registerExistingComponents.ts`:

```typescript
import { pieRegistry } from '../../registry/SimpleComponentRegistry';

// Импортируем все существующие компоненты
import TextCard from '../cards/TextCard';
import ButtonCard from '../cards/ButtonCard';
// ... и так далее

// Регистрируем их
export function registerAllExistingComponents() {
    pieRegistry.register('TextCard', TextCard);
    pieRegistry.register('ButtonCard', ButtonCard);
    pieRegistry.register('AjaxButtonCard', AjaxButtonCard);
    // ... все остальные компоненты

    console.log(\`Registered \${pieRegistry.getAll().length} existing components\`);
}

// Автоматический вызов при импорте
registerAllExistingComponents();
```

### Шаг 2: Заменить UI компонент

В `src/components/UI/index.tsx` заменить на:

```typescript
import { SimpleUIRenderer } from './SimpleUIRenderer';
import './registerExistingComponents'; // Автоматически регистрирует все компоненты

function UI({
    uiConfig,
    setUiAjaxConfiguration,
    eventEmitter,
    dataTransform
}) {
    return (
        <SimpleUIRenderer
            uiConfig={uiConfig}
            setUiAjaxConfiguration={setUiAjaxConfiguration}
            eventEmitter={eventEmitter}
            dataTransform={dataTransform}
            enableDevMode={process.env.NODE_ENV === 'development'}
        />
    );
}

export default UI;
```

### Шаг 3: Опционально - Fallback для неизвестных компонентов

```typescript
import { SimpleUIRenderer } from './SimpleUIRenderer';
// @ts-ignore
import { UiConstructor } from '../Card/UIConstructor';
import './registerExistingComponents';

function UI(props) {
    const { uiConfig } = props;

    // Сначала пробуем универсальный рендерер
    if (pieRegistry.has(uiConfig.card)) {
        return <SimpleUIRenderer {...props} />;
    }

    // Fallback к старой системе для незарегистрированных компонентов
    return <UiConstructor uiConfig={uiConfig} {...props} />;
}
```

## 🎉 Результат

### ДО (900+ строк)
```typescript
function UI({ uiConfig, ... }) {
    switch (uiConfig.card) {
        case 'TextCard':
            return <TextCard data={cardData} />;
        case 'ButtonCard':
            return <ButtonCard data={cardData} />;
        case 'AjaxButtonCard':
            return <AjaxButtonCard data={cardData} setUiAjaxConfiguration={...} />;
        // ... 80+ других case
        default:
            return <UiConstructor ... />;
    }
}
```

### ПОСЛЕ (10 строк)
```typescript
import { SimpleUIRenderer } from './SimpleUIRenderer';
import './registerExistingComponents'; // Автоматически регистрирует все

function UI(props) {
    return <SimpleUIRenderer {...props} enableDevMode={true} />;
}
```

## 💡 Преимущества

1. **Автоматизация** - новые компоненты появляются сами
2. **Типизация** - полная поддержка TypeScript
3. **Отладка** - dev режим показывает что происходит
4. **Гибкость** - можно регистрировать компоненты на лету
5. **Совместимость** - работает с существующим API

## 📝 Готовые файлы

- ✅ `src/registry/SimpleComponentRegistry.ts` - основной реестр
- ✅ `src/components/UI/SimpleUIRenderer.tsx` - универсальный рендерер
- ✅ `src/examples/SimpleRegistryExample.tsx` - пример использования

**Система готова к использованию!** 🚀

Теперь нужно только:
1. Создать файл регистрации существующих компонентов
2. Заменить старый UI компонент на новый
3. Тестировать