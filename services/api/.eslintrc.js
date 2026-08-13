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
    // (zones/starter-kit/support/rental/document-verification ja foram
    // reescritos do zero e removidos daqui — so tsconfig.json tinha sido
    // atualizado antes, deixando o lint sem cobertura real nesses modulos)
    'src/modules/analytics',
    'src/modules/compliance',
    'src/modules/dispatch',
    'src/modules/face-check',
    'src/modules/services-catalog',
    'src/modules/tracking',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    'prettier/prettier': 'off',
  },
};
