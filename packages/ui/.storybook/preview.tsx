import type { Preview } from '@storybook/react-vite'

// Ramp DS Tailwind v4 entry point — loads Tailwind, the design tokens, and
// generates utilities for every component class. This is the same stylesheet
// consumers import, so stories render with the real styles.
import '../src/styles/theme.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;