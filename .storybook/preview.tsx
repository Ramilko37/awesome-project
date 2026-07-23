import type { Preview } from "@storybook/nextjs-vite";

import "../src/shared/ui/fortis/tokens.css";
import { FortisProvider } from "../src/shared/ui/fortis";

const preview = {
  decorators: [
    (Story) => (
      <FortisProvider className="fortis-storybook-canvas">
        <Story />
      </FortisProvider>
    ),
  ],
  parameters: {
    controls: { expanded: true },
    layout: "padded",
  },
} satisfies Preview;

export default preview;
