# Landing UI Simplification Test Spec

## Static/code checks
- `npm test`
- `npm run lint`
- `npx tsc --noEmit --pretty false`
- `npm run build`

## Manual/browser smoke checks
1. Open `/` and verify the hero communicates product purpose in Korean.
2. Confirm the first-screen hero has at most two primary CTAs.
3. Confirm the Obsidian-style graph visual appears and has node/edge styling.
4. Confirm navigation still exposes forecast, accuracy, and graph routes.
5. Check a mobile-width viewport for no horizontal overflow and readable CTA layout.

## Regression checks
- No changes to API route files are required.
- Existing forecast/accuracy pages should still render through current routes.
- No package dependency should be added.
