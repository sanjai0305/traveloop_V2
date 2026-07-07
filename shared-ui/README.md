# Traveloop Shared UI

A unified design system and component library for the Traveloop ecosystem. Provides consistent UI/UX across all portals (User, Agent, Admin, Driver) and platforms (Web, Mobile, PWA, Native Apps).

## Installation

This is a shared library meant to be consumed by Traveloop portals. No separate installation required - it's imported directly from the monorepo.

## Usage

### Tailwind Configuration

Each portal should import the shared Tailwind preset:

```javascript
// tailwind.config.js
import traveloopPreset from "../shared-ui/tailwind.preset.js";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [traveloopPreset],
  theme: {
    extend: {
      // Portal-specific extensions
    },
  },
};
```

### Importing Components

```tsx
import { Button, Card, Header, Grid } from "../../shared-ui/src/components";
import { useBreakpoint, useIsMobile } from "../../shared-ui/src/hooks/useBreakpoint";
```

### CSS Import

Import the design system CSS in your main CSS file:

```css
@import "../../shared-ui/src/styles/design-system.css";
```

## Design Tokens

### Breakpoints

- **xs**: 360px (Small Mobile)
- **sm**: 480px (Mobile)
- **md**: 768px (Tablet)
- **lg**: 1024px (Laptop)
- **xl**: 1280px (Large Laptop)
- **2xl**: 1440px (Desktop)

### Colors

- **Primary**: #14B8B5 (Teal)
- **Secondary**: #0F172A (Dark Slate)
- **Accent**: #F59E0B (Amber)
- **Surface**: #FFFFFF
- **Background**: #F8FAFC

### Typography

- **Display LG**: 48px (Desktop) / 40px (Tablet) / 32px (Mobile)
- **Heading MD**: 24px (Desktop) / 20px (Tablet) / 18px (Mobile)
- **Body**: 16px (All sizes)
- **Caption**: 12px (All sizes)

### Spacing

- **Content Padding**: 32px (Desktop) / 24px (Tablet) / 16px (Mobile)
- **Section Gap**: 32px (Desktop) / 16px (Mobile)
- **Card Radius**: 16px
- **Touch Target**: 44px

## Components

### Core Components

- **Button**: Primary, secondary, glass, danger, ghost variants
- **Card**: With glow and hover effects
- **Input**: Text, password, email inputs
- **Form**: Form wrapper with validation
- **Alert**: Success, error, warning, info alerts
- **Avatar**: User avatar with fallback
- **Badge**: Status and count badges
- **Dialog**: Modal dialogs
- **Modal**: Full-screen modals
- **Toast**: Notification toasts
- **Table**: Responsive data tables
- **Typography**: Text components with scaling
- **EmptyState**: Empty state illustrations
- **Skeleton**: Loading skeletons
- **Loader**: Loading spinners

### Layout Components

- **Header**: Responsive header with navigation
- **Footer**: Multi-column footer
- **Grid**: Responsive grid system
- **GridItem**: Grid item with span support

### Mobile/App Components

- **SafeArea**: Safe area insets for notched devices
- **SafeAreaTop**: Top safe area
- **SafeAreaBottom**: Bottom safe area
- **TouchTarget**: 44px minimum touch targets
- **TouchButton**: Touch-friendly button
- **LoadingSpinner**: Animated spinner
- **LoadingOverlay**: Overlay with spinner
- **LoadingPage**: Full-page loading state

### Navigation Components

- **Sidebar**: Collapsible sidebar (Desktop)
- **Navbar**: Top navigation bar
- **Drawer**: Slide-out drawer
- **BottomTabs**: Bottom navigation (Mobile)

## Hooks

- **useBreakpoint**: Get current breakpoint
- **useWindowWidth**: Get window width
- **useMediaQuery**: Custom media query
- **useIsMobile**: Check if mobile viewport
- **useIsTablet**: Check if tablet viewport
- **useIsDesktop**: Check if desktop viewport

## Responsive Design Guidelines

### Desktop (≥ 1440px)

- Left sidebar navigation
- 4-6 column grid
- 32px content padding
- 48px headings

### Laptop (1024px - 1280px)

- Left sidebar navigation
- 3-4 column grid
- 24px content padding
- 40px headings

### Tablet (768px - 1024px)

- Mini sidebar or drawer
- 2-3 column grid
- 24px content padding
- 32px headings

### Mobile (< 768px)

- Bottom navigation
- Hamburger menu
- 1 column grid
- 16px content padding
- 32px headings

## Accessibility

All components include:

- ARIA labels and roles
- Keyboard navigation support
- Focus states
- Screen reader support
- WCAG AA compliant contrast ratios
- 44px minimum touch targets

## Platform Support

- **Desktop Web**: Full feature set
- **Laptop Web**: Full feature set
- **Tablet**: Touch-optimized
- **Mobile Browser**: Touch-optimized
- **Android App**: Native-like experience
- **iOS App**: Native-like experience
- **PWA**: Offline-capable

## Animations

- **fade-in**: 300ms ease
- **fade-in-up**: 400ms spring
- **slide-up**: 350ms spring
- **slide-up-sheet**: 380ms snap
- **scale-in**: 300ms spring
- **toast**: 300ms spring

## Dark Mode

Supports dark mode via `data-theme="dark"` attribute or `.dark` class.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)
