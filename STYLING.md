# Plainview — CSS & Styling Implementation

## Architecture

The dashboard uses a **layered CSS approach**:

1. **Tailwind CSS** (utility-first) — Main styling framework
2. **Custom CSS** (`index.css`) — Base utilities, animations, component styles
3. **Component-level Tailwind** — Inline utility classes in React components
4. **Design tokens** — Tailwind config with custom color palette

---

## Color Palette

### Primary Colors
```
--pv-black:    #0C0C0E  (Main background)
--pv-dark:     #18191B  (Card backgrounds)
--pv-darker:   #1F2022  (Borders, accents)
--pv-text:     #E4E4E4  (Primary text)
--pv-muted:    #A8A8A8  (Secondary text)
```

### Accent Colors
```
--pv-amber:    #F5A623  (Primary accent - buttons, highlights)
--pv-blue:     #2E9AFF  (Secondary accent - data streams)
--pv-green:    #5FFF96  (Success, online status)
--pv-red:      #FF4040  (Critical errors, alerts)
```

### Usage in Tailwind
```
bg-pv-black       → background: #0C0C0E
text-pv-amber     → color: #F5A623
border-pv-darker  → border-color: #1F2022
shadow-pv-amber   → box-shadow with amber
```

---

## Tailwind Configuration

**File**: `apps/dashboard/tailwind.config.js`

### Custom Colors
```javascript
colors: {
  'pv-black': '#0C0C0E',
  'pv-dark': '#18191B',
  'pv-darker': '#1F2022',
  'pv-text': '#E4E4E4',
  'pv-muted': '#A8A8A8',
  'pv-amber': '#F5A623',
  'pv-blue': '#2E9AFF',
  'pv-red': '#FF4040',
  'pv-green': '#5FFF96',
}
```

### Custom Typography
```javascript
letterSpacing: {
  'wide': '0.08em',
  'wider': '0.15em',
}
```

### Custom Animations
```javascript
keyframes: {
  pulse: { ... },
  glow: { ... },
}
```

---

## CSS Features Implemented

### 1. Global Styles (`index.css`)

**Reset & Base**
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { width: 100%; height: 100%; background: #0C0C0E; }
```

**Typography**
```css
body {
  font-family: Inter, Eurostile, system-ui, sans-serif;
  font-feature-settings: "kern" 1;
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}
```

**Custom Scrollbar**
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #F5A623; }
::-webkit-scrollbar-thumb:hover { background: #FFB74D; }
```

### 2. Range Input Styling

**Track**
```css
input[type="range"] {
  width: 100%;
  height: 6px;
  background: #1F2022;
  border-radius: 3px;
}
```

**Thumb (Webkit)**
```css
input[type="range"]::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  background: #F5A623;
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.4);
}

input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 0 16px rgba(245, 166, 35, 0.8);
  transform: scale(1.1);
}
```

**Thumb (Firefox)**
```css
input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #F5A623;
  border: none;
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.4);
}
```

### 3. Component Layer (@layer components)

**Navbar**
```css
.navbar {
  @apply bg-pv-black border-b border-pv-darker h-16 flex items-center px-6 sticky top-0 z-50;
}
```

**Card**
```css
.pv-card {
  @apply bg-pv-dark border border-pv-darker rounded-lg p-4;
}
```

**Typography**
```css
h1 { @apply text-2xl font-black tracking-wider text-pv-text; }
h2 { @apply text-xl font-black tracking-wider text-pv-text; }
h3 { @apply text-sm font-black tracking-wider text-pv-amber; }
```

**Flex Utilities**
```css
.flex-center { @apply flex items-center justify-center; }
.flex-between { @apply flex items-center justify-between; }
```

### 4. Animations

**Pulse Amber (Glow Effect)**
```css
@keyframes pulse-amber {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 166, 35, 0.3); }
  50% { box-shadow: 0 0 16px rgba(245, 166, 35, 0.6); }
}

.animate-pulse-amber {
  animation: pulse-amber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Data Flow (Upward Float)**
```css
@keyframes data-flow {
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0; }
}

.animate-data-flow {
  animation: data-flow 2s ease-in-out infinite;
}
```

### 5. Accessibility

**Focus States**
```css
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #F5A623;
  outline-offset: 2px;
}
```

**Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Styling Patterns

### Button Component
```tsx
// Uses Tailwind utility classes + Framer Motion
<motion.button
  className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {children}
</motion.button>
```

**Variant Styles**
- Primary: `bg-pv-amber text-pv-black`
- Secondary: `bg-pv-dark border border-pv-amber text-pv-amber`
- Danger: `bg-pv-red text-pv-black`
- Ghost: `text-pv-amber hover:bg-pv-darker`

### Card Component
```tsx
<motion.div
  className={`
    bg-pv-dark border border-pv-darker rounded-lg p-4
    ${highlighted ? 'border-pv-amber shadow-lg shadow-pv-amber/20' : ''}
  `}
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
/>
```

### Badge Component
```tsx
<span className={`
  inline-flex items-center px-2 py-1 rounded text-xs font-mono
  ${variantClasses[variant]}
`}>
  {children}
</span>
```

**Variants**
- default: `bg-pv-dark text-pv-text border border-pv-muted`
- success: `bg-pv-green/10 text-pv-green border border-pv-green/30`
- warning: `bg-pv-amber/10 text-pv-amber border border-pv-amber/30`
- danger: `bg-pv-red/10 text-pv-red border border-pv-red/30`
- info: `bg-pv-blue/10 text-pv-blue border border-pv-blue/30`

---

## Layout Patterns

### Full-Height Container
```tsx
<div className="h-full p-4">
  {/* Fills parent height, adds padding */}
</div>
```

### Grid Layout (Command Center)
```tsx
<div className="h-full grid grid-cols-12 gap-4 p-4">
  <div className="col-span-2">Left sidebar</div>
  <div className="col-span-7">Center</div>
  <div className="col-span-3">Right panel</div>
</div>
```

### Responsive Stack
```tsx
<div className="space-y-4">
  {/* Vertical stack with gap-4 between items */}
</div>
```

### Flex Alignment
```tsx
<div className="flex items-center justify-between gap-2">
  <span>Left</span>
  <span>Right</span>
</div>
```

---

## Styling Best Practices

### 1. Use Tailwind First
```tsx
// ✅ Good
<div className="bg-pv-dark border border-pv-darker rounded-lg p-4">

// ❌ Avoid inline styles
<div style={{ backgroundColor: '#18191B' }}>
```

### 2. Leverage Color Tokens
```tsx
// ✅ Good
<button className="bg-pv-amber text-pv-black hover:opacity-80">

// ❌ Avoid hardcoding hex
<button className="bg-[#F5A623]">
```

### 3. Consistent Spacing Scale
```
p-2   (8px)
p-3   (12px)
p-4   (16px)
gap-2 (8px)
gap-4 (16px)
```

### 4. Use @apply for Reusable Patterns
```css
@layer components {
  .card-interactive {
    @apply bg-pv-dark border border-pv-darker rounded-lg p-4 cursor-pointer hover:border-pv-amber transition-colors;
  }
}
```

### 5. Motion with Framer
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>
```

---

## Dark Mode

All styling is **dark-first**. No light mode classes needed.

The CSS uses:
- `color-scheme: dark` — Tells browser to use dark styles
- `@media (prefers-color-scheme: light)` — If needed for light variant

---

## Typography

### Font Stack
```
Inter (sans) — primary UI font
Eurostile (sans) — fallback for industrial feel
system-ui — system font fallback
```

### Tracking (Letter Spacing)
```
tracking-wide  (0.08em)  — Normal text with slight spacing
tracking-wider (0.15em)  — Headings, all-caps labels
```

### Font Weights
```
font-normal (400)  — Body text
font-semibold (600) — Secondary headings
font-black (900)   — Headings, labels
font-mono         — Monospace (metrics, timestamps)
```

---

## Performance Optimizations

1. **CSS is minified** in production via Vite
2. **Tailwind purges unused styles** (only ~3.74 kB gzipped)
3. **Animations use GPU** (transform, opacity)
4. **Custom scrollbar** only on webkit (fallback for Firefox)
5. **@layer** organizes styles by specificity

---

## Testing Styles

### Check Colors
```bash
# In browser DevTools:
computed styles → background: rgb(245, 166, 35) ✓
```

### Verify Animations
```bash
# Reduced motion:
@media (prefers-reduced-motion: reduce) { ... }

# Test: System Preferences → Accessibility → Reduce Motion
```

### Mobile Responsiveness
```tsx
// Responsive utilities
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Color tokens, spacing, animations |
| `index.css` | Global styles, base utilities, keyframes |
| `styles.css` | Legacy CSS (can deprecate) |
| `Component files` | Inline Tailwind classes + Framer Motion |

---

## Migration from Old Styles

The old `styles.css` is kept for reference but not actively used.

**To fully deprecate:**
1. Remove `styles.css` import from `main.tsx`
2. Delete `apps/dashboard/src/styles.css`
3. Ensure all styles are in Tailwind + `index.css`

---

## Extending Styles

### Add Custom Color
**`tailwind.config.js`**
```javascript
colors: {
  'custom-purple': '#9D4EDD',
}
```

### Add Custom Animation
**`index.css`**
```css
@keyframes custom {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-custom {
  animation: custom 1s linear infinite;
}
```

### Add Utility Class
**`index.css`**
```css
@layer utilities {
  .text-center-flex {
    @apply flex items-center justify-center;
  }
}
```

---

## Summary

✅ Comprehensive Tailwind setup with custom tokens
✅ Global animations (pulse, data-flow)
✅ Component layer with reusable patterns
✅ Accessibility (focus states, reduced motion)
✅ Performance optimized (3.74 kB CSS gzipped)
✅ Dark mode by default
✅ Mobile responsive ready
✅ TypeScript + strict type safety

All styling is production-ready and follows industry best practices.
