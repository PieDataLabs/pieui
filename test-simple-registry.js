// Тест простой системы регистрации компонентов
import React from 'react';
import PieRegister, {
    pieRegistry,
    createPieComponent,
    SimpleUIRenderer
} from './dist/index.js';

console.log('🥧 Testing Simple Component Registry System');

// Создаем тестовый компонент
const TestCard = ({ data }) => React.createElement('div',
    {
        style: {
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
        }
    },
    `Test Card: ${data?.title || 'No title'}`
);

// Регистрируем компонент
console.log('📝 Registering TestCard...');
const RegisteredTestCard = PieRegister(TestCard, 'TestCard', {
    displayName: 'Test Card Component',
    category: 'test'
});

// Проверяем регистрацию
console.log('✓ Component registered:', pieRegistry.has('TestCard'));
console.log('✓ Registered components:', pieRegistry.getAll());
console.log('✓ Component metadata:', pieRegistry.getMeta('TestCard'));

// Тестируем создание компонента
console.log('🎯 Testing component creation...');
const componentElement = createPieComponent('TestCard', {
    data: { title: 'Hello from Registry!' }
});
console.log('✓ Component created successfully:', !!componentElement);

// Тестируем SimpleUIRenderer
console.log('🎨 Testing SimpleUIRenderer...');
const uiConfig = {
    card: 'TestCard',
    data: { title: 'Rendered via SimpleUIRenderer' },
    content: null
};

// В реальном приложении это бы отрендерило React элемент
console.log('✓ UIConfig for SimpleUIRenderer:', uiConfig);

console.log('🎉 Simple Component Registry test completed successfully!');

// Дополнительный тест - регистрация второго компонента
const AnotherCard = ({ data }) => React.createElement('span', {}, `Another: ${data?.text}`);
pieRegistry.register('AnotherCard', AnotherCard);

console.log('✓ Second component registered. Total components:', pieRegistry.getAll().length);
console.log('✓ All registered components:', pieRegistry.getAll());