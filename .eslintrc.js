module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'airbnb-typescript/base', // uses the airbnb recommended rules
    'prettier/@typescript-eslint', // disables ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off', // this can be figured out implicitly, and that is better
    'sort-imports': 'off',
    'import/prefer-default-export': 'off', // default export = bad
    'import/no-default-export': 'error', // require named exports - they make it easier to refactor, enforce consistency, and increase constraints
    '@typescript-eslint/no-non-null-assertion': 'off', // we use these to help typescript out when we know something it doesnt, and cant easily express that
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.ts', '**/*.test.integration.ts', '**/*.test.acceptance.ts', 'acceptance/**/*.ts'],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off', // sometimes this is a valid definition
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'import/no-cycle': 'off',
    'lines-between-class-members': 'off',
  },
};
