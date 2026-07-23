import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/shared/ui/fortis/**/*.stories.@(ts|tsx)"],
};

export default config;
