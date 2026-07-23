import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/shared/ui/fortis/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/nextjs-vite",
};

export default config;
