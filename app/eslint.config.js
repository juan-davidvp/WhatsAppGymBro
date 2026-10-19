import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Dominio puro (constitución VII y X; .claude/rules/dominio.md): sin E/S, reloj ni azar.
    files: ['packages/domain/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'El dominio no hace E/S.' },
            {
              group: ['fs', 'path', 'http', 'https', 'net', 'child_process', 'os'],
              message: 'El dominio no hace E/S.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'process', message: 'El dominio no lee el entorno.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'El reloj se recibe como parámetro.' },
        {
          object: 'Math',
          property: 'random',
          message: 'La aleatoriedad se recibe como parámetro.',
        },
      ],
    },
  },
);
