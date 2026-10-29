# Design: FitnessApp

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: editorial
- Shape of the first page: Stage-hero landing (HomePage); the rest are app screens inside the shell
- Theme: Sport (deal 1/3, seed fitness-tracker-logging-workouts-732e·073fe46f·2026-10-28·r0)
- Axes: light/display-condensed/chromatic-volt · posture: restrained

## Tokens
`tokens.css` (frontend/src/styles/hallmark-tokens.css) is the source of truth. The roles:

```css
:root {
  --color-paper: oklch(98% 0.005 250);
  --color-paper-2: oklch(95% 0.006 250);
  --color-paper-3: oklch(91.5% 0.007 250);
  --color-ink: oklch(16% 0.080 260);
  --color-ink-2: oklch(22% 0.060 258);
  --color-muted: oklch(50% 0.020 250);
  --color-rule: oklch(78% 0.008 250);
  --color-accent: oklch(88% 0.200 120);
  --color-accent-ink: oklch(16% 0.080 260);
  --color-focus: oklch(58% 0.145 125);
  --font-display: "Saira Condensed", sans-serif;
  --font-body: "Albert Sans", ui-sans-serif, sans-serif;
  --font-outlier: "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 4px;
  --radius-pill: 4px;
  --rule-hair: 1px;
  --shadow-card: none;
}
```
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `hallmark-tokens.css`.

## Controls
- Primary: volt fill · 4px radius · 44px hit target · display capitals
- Secondary: ink outline · same radius and height

## Motion
- Character: still; nothing moves except state and live data; one reveal at most; under reduced motion everything ends at once.

## Exports
`hallmark-tokens.css` and `hallmark-base.css` in this project.
