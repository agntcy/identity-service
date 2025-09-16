/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import reactRefresh from "eslint-plugin-react-refresh";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([globalIgnores([
    "**/eslint.config.mjs",
    "**/jest.config.js",
    "**/build.js",
    "**/babel.config.js",
    "tests/**/*",
    "node_modules/**/*",
    "dist/**/*",
    "build/**/*",
    "tests-reports/**/*",
    "src/config/**/*",
    "**/postcss.config.js",
    "**/vite.config.ts",
    "**/tailwind.config.js",
    "utils/**/*",
    ".yarn/**/*",
    "dev-dist/**/*",
    "public/**/*",
    "coverage/**/*"
]), {
    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@tanstack/eslint-plugin-query/recommended",
        "plugin:vitest-globals/recommended"
    )),

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        "react-refresh": reactRefresh
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.eslint.json",
        },
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        "block-spacing": ["warn", "always"],
        "brace-style": ["warn", "1tbs"],
        curly: ["warn", "all"],

        indent: ["warn", 2, {
            SwitchCase: 1,
            ignoredNodes: ["JSXElement *", "JSXElement"],
        }],

        "no-mixed-spaces-and-tabs": "error",
        "no-multi-spaces": "warn",
        "no-trailing-spaces": "warn",
        "no-whitespace-before-property": "error",
        "react/jsx-boolean-value": "off",
        "react/jsx-indent-props": ["off"],
        "space-before-blocks": ["warn", "always"],

        "space-before-function-paren": ["warn", {
            named: "never",
            anonymous: "ignore",
            asyncArrow: "always",
        }],

        "space-in-parens": ["warn", "never"],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-misused-promises": "off",

        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
        }],

        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unsafe-call": "warn",
        "no-async-promise-executor": "warn",
        "react/prop-types": "off",
        "react/no-unknown-property": "warn",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "react/react-in-jsx-scope": "off",
        "max-len": "off",
    },
}, {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
}]);
