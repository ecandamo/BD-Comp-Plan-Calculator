# Design System Prompt

Use this file together with [design-system.json] when building UI in this repo or porting the same visual system into another project.

## Purpose

This design system exists to make multiple apps feel like part of the same product family.

Do not copy full pages unless explicitly asked. Recreate the same system through:

- shared tokens
- shared primitives
- shared patterns
- consistent visual rules
- consistent brand and logo behavior

## Required workflow

1. Read `design-system.json` first.
2. Treat its tokens, primitives, patterns, and visual rules as constraints.
3. If the target repo does not yet have the design primitives, implement them first.
4. Build pages from those primitives and patterns instead of styling each screen ad hoc.
5. Preserve light and dark theme behavior.
6. Respect the brand, logo, accessibility, and layout rules in `design-system.json`.

## Implementation guidance

If the target project uses Tailwind:

- define the token contract with CSS variables
- keep semantic classes or wrapper components for repeated visual behavior
- avoid scattering raw one-off utility strings when the same pattern repeats

If the target project does not use Tailwind:

- preserve the same token names or close semantic equivalents
- preserve the component roles and pattern structure
- match the same spacing, radii, surface treatment, and visual hierarchy

## Visual direction

The system should feel:

- polished
- premium
- enterprise
- calm
- data-first
- slightly atmospheric

The system should not feel:

- flat
- generic startup SaaS
- overly playful
- overly colorful
- harsh or sharp-edged

## Branding and logo usage

Preserve the brand identity, not just the UI style.

- Brand name: `API Global Solutions`
- Reuse official logo assets when available.
- Prefer the full logo in major headers and hero sections.
- Use compact logo treatment only when space is limited.
- Use the correct logo variant for light and dark surfaces.
- Do not recolor, stretch, or restyle the logo casually.
- Keep generous whitespace around the logo.
- Place logos in deliberate, premium positions rather than as filler decoration.

## Non-negotiable style rules

- Prefer layered translucent surfaces over flat white cards.
- Use rounded geometry throughout the app.
- Use accent green as emphasis, not as the dominant page color.
- Keep explanatory copy muted and readable.
- Use strong but restrained typography.
- Use subtle gradients and background atmosphere instead of noisy decoration.
- Support dark mode as a first-class theme.
- Treat logo usage as part of the design system.

## Primitive expectations

Before building complex screens, prefer having equivalents of:

- `Surface`
- `Button`
- `InputField`
- `SelectField`
- `Badge`
- `SectionHeader`
- `InfoCard`

If they do not exist, create them first.

After those, add missing shared components before repeating custom markup for:

- textarea
- checkbox
- radio group
- modal
- toast
- tabs
- tooltip
- empty state
- spinner
- app header

## Pattern expectations

Common app composition should usually follow this structure:

1. Hero or primary header surface
2. Status, upload, or onboarding area
3. Controls or filter area
4. Metrics or summary area
5. Primary visualization or working area
6. Supporting data sections

This is guidance, not a rigid rule, but new pages should still feel related to this structure.

## Behavior safety

When applying this design system to an existing app:

- do not change business logic unless explicitly requested
- separate visual refactors from functional changes
- migrate one UI area at a time
- verify after each pass

## Governance

- Prefer updating tokens or shared components before patching individual screens.
- If a new visual pattern is used in more than one place, promote it into the design layer.
- Keep versioning in mind when changing token names or component behavior.

## Output expectation for Codex

When asked to build or restyle UI with this system:

- implement or reuse tokens first
- implement or reuse primitives second
- compose patterns third
- only then build page-specific UI

If there is any tension between speed and consistency, prefer consistency.
