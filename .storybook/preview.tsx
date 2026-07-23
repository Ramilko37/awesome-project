import type { Preview } from "@storybook/nextjs-vite";

import "./fortis-preview.css";
import { FortisProvider } from "../src/shared/ui/fortis";

const preview = {
  parameters: {
    controls: {
      expanded: true,
    },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <FortisProvider
        className="min-h-screen min-w-[20rem] bg-[var(--fortis-semantic-light-background-canvas)] p-8 text-[var(--fortis-semantic-light-text-primary)]"
        style={{ fontFamily: "var(--fortis-typography-body-family)" }}
      >
        <Story />
      </FortisProvider>
    ),
  ],
} satisfies Preview;

export default preview;
