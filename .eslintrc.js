module.exports = {
  extends: ['@kmkzt/eslint-config/lib/javascript'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['@kmkzt/eslint-config/lib/typescript'],
    },
  ],
}
