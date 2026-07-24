module.exports = {
  extends: 'next/core-web-vitals',
  ignorePatterns: [
    // Codigo-fonte corrompido/truncado herdado de uma restauracao anterior
    // do repositorio; movido para _corrupted-quarantine/ (fora da arvore
    // compilada pelo Next.js). Ver docs/FASE9_CORRUPTED_MODULES.md
    '_corrupted-quarantine/**',
  ],
};
