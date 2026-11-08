// ESLint flat config for the whole TypeScript monorepo.
// The Python service is linted separately with Ruff (`npm run lint:ai`).
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**', '**/node_modules/**', 'services/**']),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    rules: {
      // Allow intentionally unused arguments/variables when prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Type-only imports must use `import type` (matches `verbatimModuleSyntax`).
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  {
    files: ['apps/api/**/*.ts', '*.js'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite()],
  },

  // Must be last: turns off stylistic rules that would fight with Prettier.
  prettier,
]);
