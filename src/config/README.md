# Theme Configuration

## How to Change the Primary Color

To change the primary color across the entire application, simply update the `THEME` object in `theme.ts`:

```typescript
export const THEME = {
  primary: {
    hex: '#059669',  // 👈 Change this hex color
    tailwind: 'emerald', // 👈 Change this to match Tailwind color name
  },
  // ...
}
```

### Examples:

**Purple Theme:**
```typescript
hex: '#7c3aed',
tailwind: 'violet',
```

**Blue Theme:**
```typescript
hex: '#2563eb',
tailwind: 'blue',
```

**Orange Theme:**
```typescript
hex: '#ea580c',
tailwind: 'orange',
```

**Indigo Theme:**
```typescript
hex: '#4f46e5',
tailwind: 'indigo',
```

**Teal Theme:**
```typescript
hex: '#0891b2',
tailwind: 'cyan',
```

## What Gets Updated

Changing the theme color updates:
- ✅ All buttons and CTAs
- ✅ Navigation links
- ✅ Tab indicators
- ✅ Icons and accents
- ✅ Widget header and colors
- ✅ Logo color
- ✅ Footer branding
- ✅ All color variants (light, hover, etc.)

## Important Notes

1. **Tailwind Color Name**: Make sure the `tailwind` value matches an actual Tailwind color class (e.g., 'emerald', 'cyan', 'blue', 'violet', 'emerald', 'orange', etc.)

2. **Hex Color**: The `hex` value is used for inline styles and dynamic theming in the widget.

3. **Single Source of Truth**: All color references throughout the app use this configuration file, so changing it here updates the entire application.

4. **SVG Logo**: The logo SVG color is also updated to match the theme color.

5. **Current Theme**: The application currently uses **Emerald** (`#059669`) as the primary color.

6. **Widget Embed**: The widget color is also controlled by this theme. When users embed the widget on their websites, it will use the theme color specified here.


