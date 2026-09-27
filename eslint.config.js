const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: ['node_modules/**', '.next/**', '.vercel/**', 'public/.vercel/**', 'next-env.d.ts']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off'
    }
  }
];
