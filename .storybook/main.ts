import type { StorybookConfig } from "@storybook/nextjs";
import { fileURLToPath } from "url";
import path from "path";
import { createRequire } from "module";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { NormalModuleReplacementPlugin } = require("webpack");

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  addons: [],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  webpackFinal: async (config) => {
    config.plugins?.push(
      new NormalModuleReplacementPlugin(
        /^@clerk\/nextjs/,
        path.resolve(dirname, "./mocks/@clerk/nextjs.js"),
      ),
    );
    return config;
  },
  babel: async (options) => ({
    ...options,
    plugins: [
      ...(options.plugins || []),
      ["babel-plugin-react-compiler", {}],
    ],
  }),
};

export default config;
