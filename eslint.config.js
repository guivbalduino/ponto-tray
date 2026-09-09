const { defineConfig, globalIgnores } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores(['node_modules/**', 'dist/**', 'out/**', 'styles/styles.css']),
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
    },
  },
  {
    files: ['main.js', 'preload.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['renderer.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
]);
