import tsParser from "@typescript-eslint/parser";

// Deliberate correctness baseline shared by TS and JS, independent of typecheck.
// No style-only migration, automatic fixes, or inline suppression escape hatch.
export default [
  { ignores: ["**/node_modules/**", "packages/*/dist/**", "services/*/dist/**",
    "connectors/*/dist/**", "capabilities/*/dist/**"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: "module" },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    rules: {
      "constructor-super": "error", "for-direction": "error", "getter-return": "error",
      "no-async-promise-executor": "error", "no-case-declarations": "error",
      "no-class-assign": "error", "no-compare-neg-zero": "error", "no-cond-assign": ["error", "always"],
      "no-const-assign": "error", "no-constant-condition": ["error", { checkLoops: false }],
      "no-control-regex": "error", "no-debugger": "error", "no-dupe-args": "error",
      "no-dupe-else-if": "error", "no-dupe-keys": "error", "no-duplicate-case": "error",
      "no-empty-character-class": "error", "no-empty-pattern": "error", "no-eval": "error",
      "no-ex-assign": "error", "no-fallthrough": "error", "no-func-assign": "error",
      "no-import-assign": "error", "no-invalid-regexp": "error", "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error", "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error", "no-obj-calls": "error",
      "no-promise-executor-return": "error", "no-prototype-builtins": "error",
      "no-self-assign": "error", "no-setter-return": "error", "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error", "no-this-before-super": "error",
      "no-unexpected-multiline": "error", "no-unreachable": "error",
      "no-unsafe-finally": "error", "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error", "no-with": "error",
      "use-isnan": "error", "valid-typeof": "error",
    },
  },
];
