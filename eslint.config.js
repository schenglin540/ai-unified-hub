import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "server/**", "client/src/components/ui/**", "vite.config.ts", "vitest.config.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["client/src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"], rules: { "@typescript-eslint/no-explicit-any": "off", "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }] } },
);
