// @ts-check

import eslint from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs['recommended-latest'],
    {
        ...reactPlugin.configs.flat.recommended,
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    reactPlugin.configs.flat['jsx-runtime'],
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['off'],
        },
    },
);
