import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import nextIntl from "./next-intl";

const preview: Preview = {
  initialGlobals: {
    locale: "en",
    locales: {
      en: "English",
      uk: "Українська",
    },
  },
  parameters: {
    nextIntl,
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
