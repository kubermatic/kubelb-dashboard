import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import licenseHeader from "eslint-plugin-license-header";
import fs from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";

const licenseHeaderLines = fs
  .readFileSync(new URL("./hack/license-header.ts", import.meta.url), "utf-8")
  .trimEnd()
  .split("\n");

export default defineConfig([
  globalIgnores(["dist", "src/routeTree.gen.ts", "hack"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    plugins: {
      "license-header": licenseHeader,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "license-header/header": ["error", licenseHeaderLines],
    },
  },
]);
