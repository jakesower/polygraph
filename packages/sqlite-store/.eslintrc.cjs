module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ["eslint:recommended", "airbnb-base", "prettier"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "array-callback-return": ["error"],
    "comma-dangle": ["error", "always-multiline"],
    curly: ["error", "multi-line"],
    eqeqeq: ["error", "always", { null: "ignore" }],
    "func-names": "off",
    "function-paren-newline": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        mjs: "always",
      },
    ],
    "import/no-default-export": "error",
    "import/no-unresolved": ["warn"],
    "import/prefer-default-export": "off",
    indent: [
      "error",
      2,
      {
        flatTernaryExpressions: true,
      },
    ],
    "max-classes-per-file": "off",
    "max-len": [
      "error",
      {
        code: 90,
        comments: 125,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    "no-nested-ternary": "off",
    "no-param-reassign": "error",
    "no-use-before-define": ["error", { functions: false }],
    "prefer-destructuring": ["warn", { array: false, object: true }],
    "object-curly-spacing": ["error", "always"],
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    // "sort-imports": ["error", {
    //   allowSeparatedGroups: true,
    //   ignoreCase: true,
    //   // memberSyntaxOrder: false,
    // }],
    "sort-vars": "error",
  },
  settings: {},
};
