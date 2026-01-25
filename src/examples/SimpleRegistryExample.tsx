import React from 'react';
import PieRegister, {
    pieRegistry,
    createPieComponent,
    SimpleUIRenderer
} from '../index';

// Пример 1: Простой компонент кнопки
const ButtonCard = ({ data }: { data: { label: string; onClick?: () => void } }) => (
    <button
        onClick={data.onClick}
        style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }}
    >
        {data.label}
    </button>
);

// Регистрируем компонент
const RegisteredButtonCard = PieRegister(ButtonCard, 'ButtonCard', {
    displayName: 'Button Card',
    category: 'inputs'
});

// Пример 2: Текстовый компонент
const TextCard = ({ data }: { data: { text: string; style?: React.CSSProperties } }) => (
    <div style={{
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        ...data.style
    }}>
        {data.text}
    </div>
);

const RegisteredTextCard = PieRegister(TextCard, 'TextCard', {
    displayName: 'Text Card',
    category: 'text'
});

// Демонстрационный компонент
const SimpleDemo = () => {
    const [enableDevMode, setEnableDevMode] = React.useState(true);

    // Конфигурации для тестирования
    const testConfigs = [
        {
            card: 'ButtonCard',
            data: { label: 'Click Me!', onClick: () => alert('Button clicked!') },
            content: null
        },
        {
            card: 'TextCard',
            data: { text: 'Hello from registered TextCard!' },
            content: null
        },
        {
            card: 'NonExistentCard',
            data: { some: 'data' },
            content: null
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Простой пример системы регистрации</h1>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={enableDevMode}
                        onChange={(e) => setEnableDevMode(e.target.checked)}
                    />
                    {' '}Включить режим отладки
                </label>
            </div>

            <section style={{ marginBottom: '32px' }}>
                <h2>Информация о зарегистрированных компонентах</h2>
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    <strong>Зарегистрированы:</strong> {pieRegistry.getAll().join(', ')}
                </div>
            </section>

            <section style={{ marginBottom: '32px' }}>
                <h2>Тестирование SimpleUIRenderer</h2>
                {testConfigs.map((config, index) => (
                    <div key={index} style={{ marginBottom: '16px' }}>
                        <h4>Конфигурация {index + 1}: {config.card}</h4>
                        <div style={{ border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }}>
                            <SimpleUIRenderer
                                uiConfig={config}
                                enableDevMode={enableDevMode}
                            />
                        </div>
                    </div>
                ))}
            </section>

            <section style={{ marginBottom: '32px' }}>
                <h2>Прямое создание компонентов</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {pieRegistry.getAll().map(name => {
                        const testProps = name === 'ButtonCard'
                            ? { data: { label: `${name} Direct` } }
                            : { data: { text: `${name} created directly` } };

                        return (
                            <div key={name} style={{ marginBottom: '8px' }}>
                                {createPieComponent(name, testProps)}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section>
                <h2>Runtime регистрация</h2>
                <button
                    onClick={() => {
                        // Создаем компонент на лету
                        const DynamicCard = ({ data }: { data: { message: string } }) => (
                            <div style={{
                                padding: '12px',
                                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                                color: 'white',
                                borderRadius: '8px'
                            }}>
                                🎉 {data.message}
                            </div>
                        );

                        // Регистрируем его
                        pieRegistry.register('DynamicCard', DynamicCard, {
                            createdAt: new Date().toISOString()
                        });

                        alert('DynamicCard зарегистрирован!');
                    }}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Зарегистрировать DynamicCard
                </button>

                <div style={{ marginTop: '16px' }}>
                    <SimpleUIRenderer
                        uiConfig={{
                            card: 'DynamicCard',
                            data: { message: 'Я был создан динамически!' },
                            content: null
                        }}
                        enableDevMode={enableDevMode}
                    />
                </div>
            </section>
        </div>
    );
};

export default SimpleDemo;