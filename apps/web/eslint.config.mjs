import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      // Disable React 19 compiler rules (experimental - too strict for existing code)
      // These rules are for the new React Compiler and are very strict
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/rules-of-hooks": "error", // Keep the essential rule
      "react-hooks/refs": "off", // Disable refs rule (too strict)
      "react-hooks/set-state-in-effect": "off", // Disable setState in effect rule
      "react-hooks/preserve-manual-memoization": "off", // Disable manual memoization preservation
      "react-compiler/react-compiler": "off", // Disable compiler optimization rule
      // Downgrade unescaped entities to warning (common in text content)
      "react/no-unescaped-entities": "warn",
      // Keep exhaustive-deps as warning (common pattern issues)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
