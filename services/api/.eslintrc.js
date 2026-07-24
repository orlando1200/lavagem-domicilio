module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    // Modulos com codigo-fonte corrompido/truncado herdado de uma restauracao
    // anterior do repositorio. Ver docs/FASE9_CORRUPTED_MODULES.md
    'src/modules/analytics',
    'src/modules/compliance',
    'src/modules/dispatch',
    'src/modules/document-verification',
    'src/modules/face-check',
    'src/modules/loyalty',
    'src/modules/rental',
    'src/modules/services-catalog',
    'src/modules/starter-kit',
    'src/modules/support',
    'src/modules/tracking',
    'src/modules/zones',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
