import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'navy',
      values: [
        {
          name: 'navy',
          value: '#0A1628',
        },
        {
          name: 'navy-light',
          value: '#102A43',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
    layout: 'centered',
    a11y: {
      // Accessibility addon configuration
      element: '#storybook-root',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      options: {},
      manual: false,
    },
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      defaultValue: 'pt-BR',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'pt-BR', title: 'Português (BR)' },
          { value: 'en-US', title: 'English (US)' },
          { value: 'es', title: 'Español' },
          { value: 'fr', title: 'Français' },
          { value: 'de', title: 'Deutsch' },
        ],
        dynamicTitle: true,
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
