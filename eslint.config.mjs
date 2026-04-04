import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import prettier from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "lib-cov",
      "*.seed",
      "*.log",
      "*.csv",
      "*.dat",
      "*.out",
      "*.pid",
      "*.gz",
      "*.swp",
      "pids",
      "results",
      "tmp",
      "public/css/main.css",
      "coverage",
      ".env",
      "node_modules",
      "bower_components",
      ".idea",
      "*.iml",
      ".DS_Store",
      "Thumbs.db",
      "dist/**/*",
      ".vercel",
      "uploads",
      "src/generated/prisma",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: { ...globals.node, Express: "readonly" } },
  },

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,mts,cts}"],
    rules: {
      "no-undef": "off",
    },
  },

  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    extends: ["markdown/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  prettier,

  {
    rules: {
      semi: "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-console": "warn",
      "no-unused-expressions": "error",
      "no-unreachable": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
]);
