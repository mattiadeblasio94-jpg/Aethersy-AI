// Minimal flat config for ESLint v9 + React (used only if ESLint is invoked manually).
// CRA's own lint runs through eslint-config-react-app and is unaffected.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        console: "readonly",
        localStorage: "readonly",
        FormData: "readonly",
        URLSearchParams: "readonly",
        URL: "readonly",
        Blob: "readonly",
        crypto: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        navigator: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: ["build/**", "node_modules/**", "public/**", "*.config.js"],
  },
];
