# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

No test runner is configured in this project.

## Packages

- **tailwindcss** (v4) — CSS-first config, no `tailwind.config.ts`. Theme tokens (colors, type scale) are declared as CSS custom properties in `src/app/globals.css` under `@theme`.
- **tailwind-variants** (`tv`) — for components with style variants (e.g. `Button`).
- **tailwind-merge** + **clsx** — wrapped as `cn()` in `src/lib/utils.ts` for conditional/overridable class merging.
- **prettier** + **prettier-plugin-tailwindcss** — class strings are auto-sorted; don't hand-order Tailwind classes. Config is `.prettierrc`:
  ```json
  {
    "plugins": ["prettier-plugin-tailwindcss"],
    "singleQuote": true
  }
  ```
  Single quotes for strings; all other options are Prettier defaults (2-space indent, semicolons, trailing commas where valid, 80-char print width).

### Optional packages (install only when the requirement needs them)

Not installed by default — add via `npm install` when a feature actually requires it, and prefer these over alternatives so the stack stays consistent:

- **axios** — for HTTP requests to external/backend APIs when native `fetch` isn't enough (interceptors, instance-level config, upload progress). Use a shared `axios.create()` instance rather than importing bare `axios` per call site.
- **shadcn** — for accessible unstyled primitives (dialogs, popovers, dropdowns) to restyle with the existing Tailwind tokens, rather than building ARIA-correct interactive primitives from scratch.
- **react-hook-form** — for any non-trivial form (multiple fields, validation, submit state). Pair with **zod** via `@hookform/resolvers` for schema-based validation rather than hand-rolled field validation.
- **zod** — schema validation, primarily for form input and any data crossing a trust boundary (API responses, query params).

## Architecture

- React Compiler is enabled (`reactCompiler: true` in `next.config.ts` + `babel-plugin-react-compiler`) — it auto-memoizes, so don't reach for manual `useMemo`/`useCallback` unless profiling shows a need.
- `src/app/layout.tsx` is the root layout: it renders `Navbar` + `Footer` around every page's `children`. Page components under `src/app/**/page.tsx` should only render their own `<main>` content, not chrome.
- Route groups in parens, e.g. `(landing-page)`, organize routes without affecting the URL.
- Inside a route segment, `_components/` and `_data/` hold page-local subcomponents and static data (underscore prefix keeps them out of the router). Cross-route shared code goes in the top-level `src/components/`, `src/data/`, `src/constants/` instead.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).

## Folder structure & naming conventions

- `src/components/ui/` — generic, reusable UI primitives (buttons, carousel). One component per file.
- `src/components/layouts/` — structural components, grouped by area in subfolders (`navbar/`, `footer/`, `wrapper/`).
- `src/components/shared/` — components reused across routes but not generic primitives (`ContactSection`, `FAQSection`).
- `src/components/icons/` — one SVG per file, PascalCase with an `Icon` suffix (`BankIcon.tsx`), all registered in the `icon` map in `icons/icon.tsx` (not individually re-exported through `icons/index.ts`).
- `src/data/`, `src/constants/` — static values shared app-wide, each with a barrel `index.ts`.
- `src/lib/` — small utilities (`cn`).
- Components: PascalCase `.tsx` (`ProductCard.tsx`). Data/constants: kebab- or camelCase `.ts` (`external-link.ts`). Barrels are always `index.ts`.
- Imports are grouped in this order, each group separated by a blank line:
  1. Built-in framework packages — `react`, `next/*`. These ship with the framework itself, nothing to `npm install`.
  2. Externally installed packages — anything that was added via `npm install` (`tailwind-variants`, `clsx`, `tailwind-merge`, `axios`, `gsap`, `zod`, ...).
  3. Component imports — `@/components/*` alias imports together with local relative component imports (`./NavbarMenuItem`, `../_components/...`). These are not split into separate alias/relative groups; they sit together in import order.
  4. `@/lib/*` utilities (e.g. `cn`).
  5. Data/constants — `@/data`, `@/constants`, or page-local relative equivalents (`./_data`, `../_data`).

  Example (from `src/components/ui/buttons/Button.tsx`, groups 1 and 2):

  ```ts
  import type { ComponentPropsWithoutRef, ReactNode } from 'react';

  import { tv } from 'tailwind-variants';
  ```

  Example (from `src/components/shared/ContactSection.tsx`, groups 1, 3, 4, 5):

  ```ts
  import Link from 'next/link';

  import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';
  import { icon } from '@/components/icons';
  import Button from '@/components/ui/buttons/Button';

  import { cn } from '@/lib/utils';

  import { contactHelpTopics } from '@/data';
  ```

  Omit any group that has no imports; don't leave a stray blank line in its place.

  In a `page.tsx`, group 3 (component imports) is ordered to match the JSX render order in the returned tree, not alphabetically and not alias-before-relative — e.g. in `src/app/(personal-page)/page.tsx`, `MountainDivider` is imported between `ProductsSection` and `LoansSection` because that's where it renders, even though it's an `@/components/*` import sitting among page-local relative ones.

## Code style

- Prefer function declarations over arrow functions assigned to a `const` — for components, hooks, exported utilities, and named helper functions inside a component/hook body (e.g. `function handleSubmit() {}`, not `const handleSubmit = () => {}`).
- Exception: API layer code (`*.service.ts` in `src/api/services/`) keeps arrow functions for its methods, e.g. `{ retrieve: (slug: string) => {...} }` — don't convert these to method shorthand.
- This doesn't extend to inline callbacks passed directly as arguments — array methods (`.map`, `.filter`), JSX event handlers (`onClick={() => ...}`), `useEffect` bodies, `.then()`/`.finally()` — those stay as arrows.
- Arrow syntax in a type position (`buildContent: () => Partial<T>`, `onChange: (value: string) => void`) is unaffected — that's TypeScript's function-type notation, not a function definition.

## Building a button (or any variant-driven component)

Follow `src/components/ui/buttons/Button.tsx`:

1. Type the props as custom props intersected with the native element's props, so all native attributes pass through: `type ButtonProps = { variant?: ...; size?: ...; children: ReactNode } & ComponentPropsWithoutRef<'button'>`.
2. Define the variant styles with `tv()` from `tailwind-variants` — `base` classes, a `variants` map (`variant`, `size`, `shape`, ...), `compoundVariants` for combination-specific overrides, and `defaultVariants`. Export this alongside the component (e.g. `export const buttonClasses = tv({...})`) so it's reusable on its own.
3. In the component, destructure the variant props with defaults matching `defaultVariants`, spread the remaining `...otherProps` onto the native element, and compute the class string by calling the `tv` function with the variant props plus the incoming `className` last (so caller overrides win via tailwind-merge).
4. Default-export the component.

## GSAP setup

Plugin registration is centralized in `src/lib/gsap.ts`, not repeated per component:

````ts

## `globals.css` structure

Everything lives in `src/app/globals.css` — there is no `tailwind.config.ts`, so this file _is_ the design system:

1. `@import 'tailwindcss';` at the top.
2. A single `@theme { ... }` block defining design tokens as CSS custom properties, in two sections:
   - **Colors** — grouped by color family with a comment header (`/* Red */`, `/* Grey */`, ...), each shade as `--color-{family}-{step}` (e.g. `--color-red-500`, `--color-grey-300`). New colors: add the shade under its family's comment block, keep the numeric step scale consistent (50/100/200...).
   - **Typography** — `--font-heading` / `--font-body` (mapped to the `next/font` variables from `layout.tsx`) and `--font-weight-*`, followed by the type scale grouped by category (`Display`, `Heading`, `Title`, `Body`, `Caption`). Each size defines a set of four related properties: `--text-{category}-{n}-desktop[-md]`, `--text-...--line-height`, `--text-...--letter-spacing`, `--text-...--font-weight`. The `-md` suffix is the medium-weight variant of the same size — add both when introducing a new size. These become Tailwind utilities directly (e.g. `text-body-4-desktop-md`) — always use a token instead of an arbitrary `text-[14px]`.
3. `@layer utilities { ... }` for one-off custom utility classes not covered by Tailwind, e.g.:

   ```css
   @layer utilities {
     .scrollbar-hidden {
       -ms-overflow-style: none; /* For Internet Explorer 10+ */
       scrollbar-width: none; /* For Firefox */
     }

     .scrollbar-hidden::-webkit-scrollbar {
       display: none;
     }
   }
````

4. Plain CSS rules after the layers for base element styling (currently just `body { font-family: ... }`).

Don't add a `tailwind.config.ts` or duplicate tokens elsewhere — extend the `@theme` block instead.

## Width/height sizing

`w-*`, `h-*`, `max-w-*`, `min-w-*`, `max-h-*`, `min-h-*`, and `size-*` use explicit px, vw, vh arbitrary values (e.g. `w-[16px], w-[4rem], w-[80vh]`, `max-w-[1175px]`) instead of Tailwind's spacing-scale classes (`w-4`, `max-w-293.75`) — convert scale value → px by multiplying by 4 (Tailwind's default `1` unit = `0.25rem` = `4px`). This does not apply to padding or gap, which keep normal Tailwind spacing classes, or to non-numeric values (`w-full`, `min-w-0`, `h-screen`), which are left as-is.

## Building a layout wrapper

Follow `src/components/layouts/wrapper/LayoutWrapper.tsx`:

```tsx
import type { ReactNode } from 'react';

type LayoutWrapperProps = {
  children: ReactNode;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="max-w-[1400px] px-4 md:px-8 xl:mx-auto">{children}</div>
  );
}
```

- A layout wrapper is a thin, style-only container: `{ children: ReactNode }` prop, no variants, just a fixed `className` for max-width and responsive horizontal padding.
- It constrains horizontal width only — vertical spacing/background belongs to the section that contains it. Use it _inside_ a section's root element, not as the section itself:
  ```tsx
  <section className="w-full pt-22 pb-6">
    <LayoutWrapper>{/* section content */}</LayoutWrapper>
  </section>
  ```
- Root-level chrome (`Navbar`, `Footer` in `src/app/layout.tsx`) sits outside any `LayoutWrapper`; wrap page-section content with it per-section instead.

## Building an icon

Follow `src/components/icons/RouteIcon.tsx`:

```tsx
import type { SVGProps } from 'react';

export function RouteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="24"
      viewBox="0 0 30 24"
      fill="none"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="..." fill="currentColor" />
    </svg>
  );
}
```

1. One SVG per file in `src/components/icons/`, named export (not default), PascalCase with an `Icon` suffix matching the filename (`RouteIcon` in `RouteIcon.tsx`).
2. Type props as `SVGProps<SVGSVGElement>` and spread `{...props}` onto the `<svg>` so callers can pass `className`, `onClick`, etc.
3. Keep the source SVG's `viewBox`/`width`/`height`; drop hardcoded fill colors on paths in favor of `fill="currentColor"` (or `stroke="currentColor"` for stroked icons) so color follows the surrounding text/`text-*` class.
4. Register it in `icons/icon.tsx`: import the component and add a camelCase entry to the `icon` object (e.g. `routeIcon: RouteIcon` → key it without the `Icon` suffix, e.g. `route: RouteIcon`), keeping both the import list and the object keys alphabetical. Do **not** re-export the component itself from `icons/index.ts` — that file only does `export * from './icon';`. Consumers always `import { icon } from '@/components/icons'` and render `<icon.route />`, never import the individual icon file or component directly.

## Rendering a list of cards

A reusable card list is three files, in its own subfolder (e.g. `src/components/shared/news/`), one component per responsibility. Follow `src/components/shared/news/{NewsItem,NewsList,NewsSection}.tsx`:

1. **Item** (`NewsItem.tsx`) — renders a single record. Takes the data-shape type as a prop (e.g. `card: NewsCard`), not spread-out primitive fields. Any per-item display exception (e.g. hiding one card on mobile) is a boolean prop the parent computes and passes in (`hideOnMobile`) — the item doesn't know why, just whether.
2. **List** (`NewsList.tsx`) — takes `items: NewsCard[]`, maps them to `Item`, and owns the layout classes (grid/flex, responsive columns, gap). This is also where index-based per-item exceptions get computed (e.g. `hideOnMobile={index === 3}`).
3. **Section** (`NewsSection.tsx`) — the page-facing component. Owns `LayoutWrapper`, the section heading and any CTA button, and renders `List` with the data pulled from `@/data` (or page-local `_data` if not shared). This is the only one of the three that imports the data array directly.

Keep the three responsibilities separate even when the list is small — it's what makes `List`/`Item` reusable independent of which section renders them.
