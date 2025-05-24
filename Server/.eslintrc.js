module.exports = {
  env: {
    es2021: true,
    node: true,
    browser: false
  },
  globals: {
    process: 'readonly'
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
}; 