const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')

const tsRecommended = Array.isArray(tseslint.configs.recommended)
    ? tseslint.configs.recommended
    : [tseslint.configs.recommended]

module.exports = [
    {
        ignores: ['src/cli.ts'],
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        ...js.configs.recommended,
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: globals.node,
        },
    },
    ...tsRecommended.map((config) => ({
        ...config,
        files: ['**/*.{ts,tsx}'],
    })),
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]
