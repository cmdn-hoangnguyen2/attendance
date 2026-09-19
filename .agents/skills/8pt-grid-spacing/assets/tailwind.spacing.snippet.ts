/**
 * 8-Point Grid Spacing Configuration Snippet for Tailwind CSS
 * 
 * Cách dùng với Tailwind CSS v3:
 * Thêm đoạn code này vào file `tailwind.config.ts` hoặc `tailwind.config.js`
 * trong khối `theme.extend.spacing`.
 */

export const spacingTokens = {
  // Base 8-point scale
  '0': '0px',
  '1': '4px',   // space-1: fine adjustments only (border, small icon gap)
  '2': '8px',   // space-2: internal minimum (icon-text, label-input)
  '3': '12px',  // space-fine: compact controls (optional)
  '4': '16px',  // space-3: component padding (button, input, chip)
  '5': '20px',  // space-fine: micro-adjustment
  '6': '24px',  // space-4: card padding, intra-group gap
  '8': '32px',  // space-5: group gap, section sub-spacing
  '10': '40px', // space-extended
  '12': '48px', // space-6: section padding
  '14': '56px', // space-extended
  '16': '64px', // space-7: hero block spacing
  '20': '80px', // space-8: large display gap
  '24': '96px', // space-9: extra-large hero container
};

export const tailwindConfigExtension = {
  theme: {
    extend: {
      spacing: spacingTokens,
      borderRadius: {
        // Border-radius cũng tuân thủ bội số của 8 (và 4 cho nút nhỏ)
        'none': '0px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        'full': '9999px',
      },
    },
  },
};

/**
 * Cách dùng với Tailwind CSS v4 (CSS-first config trong globals.css):
 * 
 * @theme {
 *   --spacing-1: 4px;
 *   --spacing-2: 8px;
 *   --spacing-3: 12px;
 *   --spacing-4: 16px;
 *   --spacing-6: 24px;
 *   --spacing-8: 32px;
 *   --spacing-12: 48px;
 *   --spacing-16: 64px;
 *   --spacing-20: 80px;
 *   --spacing-24: 96px;
 *   
 *   --radius-sm: 4px;
 *   --radius-md: 8px;
 *   --radius-lg: 16px;
 *   --radius-xl: 24px;
 * }
 */
