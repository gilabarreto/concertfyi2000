import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["dist/**", ".history/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    // Só as duas regras clássicas. O preset do plugin v7 traz junto 15 regras do
    // React Compiler (immutability, set-state-in-effect, purity...) — outro projeto.
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["*.js", "*.mjs", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node, sourceType: "module" },
  },
  {
    files: ["postcss.config.js", "tailwind.config.js"],
    languageOptions: { sourceType: "commonjs" },
  },
];
